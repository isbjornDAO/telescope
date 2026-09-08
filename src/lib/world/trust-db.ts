import { prisma } from "@/lib/prisma";
import { FindingStatus, VouchStatus } from "@prisma/client";
import { computeTrustScores, decayStanding, round4, slashPenalties, type TrustLink, type TrustNode } from "@/lib/world/trust";
import { aggregateVouches, type TrustAggregates } from "@/lib/world/privacy";
import { TRUST } from "@/lib/world/config";

function isRegionAdmin(user: { address: string }, region: { adminAddresses: string[] }) {
  return region.adminAddresses.map((a) => a.toLowerCase()).includes(user.address.toLowerCase());
}

/**
 * Persistence side of the trust engine: load the graph, run the formula,
 * write back, and answer the aggregate questions profiles and scouts ask.
 */

export async function recomputeTrustScores(): Promise<{ nodes: number; links: number; updated: number }> {
  const users = await prisma.user.findMany({
    select: { id: true, nodeType: true, standing: true, trustScore: true },
  });
  const vouches = await prisma.vouch.findMany({
    where: { status: VouchStatus.ACTIVE },
    select: { fromUserId: true, toUserId: true, weight: true },
  });

  const nodes: TrustNode[] = users.map((u) => ({ id: u.id, nodeType: u.nodeType, standing: u.standing }));
  const links: TrustLink[] = vouches.map((v) => ({ fromId: v.fromUserId, toId: v.toUserId, weight: v.weight }));
  const result = computeTrustScores(nodes, links);

  let updated = 0;
  const writes = [];
  for (const u of users) {
    const r = result.get(u.id);
    if (!r) continue;
    if (Math.abs(r.score - u.trustScore) < 1e-6) continue;
    writes.push(prisma.user.update({ where: { id: u.id }, data: { trustScore: r.score } }));
    updated++;
  }
  for (let i = 0; i < writes.length; i += 100) {
    await prisma.$transaction(writes.slice(i, i + 100));
  }
  return { nodes: nodes.length, links: links.length, updated };
}

export async function loadTrustAggregates(userId: string, score: number): Promise<TrustAggregates> {
  const vouches = await prisma.vouch.findMany({
    where: { toUserId: userId },
    select: {
      type: true,
      status: true,
      fromVisible: true,
      toVisible: true,
      region: { select: { slug: true, name: true } },
      from: { select: { handle: true } },
    },
  });
  return aggregateVouches(vouches, score);
}

export async function spentVouchBudget(userId: string, seasonNumber: number | null): Promise<number> {
  const rows = await prisma.vouch.findMany({
    where: {
      fromUserId: userId,
      seasonNumber: seasonNumber ?? undefined,
      status: { in: [VouchStatus.ACTIVE, VouchStatus.PENDING] },
    },
    select: { budgetCost: true },
  });
  return round4(rows.reduce((s, r) => s + r.budgetCost, 0));
}

/**
 * §1 Slashing: slashed node's score goes to 0 (all incoming vouches marked
 * SLASHED so the formula yields 0), and every voucher loses standing equal
 * to 20% of the weight they staked. Findings are permanent records.
 */
export async function applySlashing(findingId: string) {
  const finding = await prisma.slashingFinding.findUnique({ where: { id: findingId } });
  if (!finding) throw new Error("Finding not found");
  if (finding.status !== FindingStatus.CONFIRMED && finding.status !== FindingStatus.UPHELD) {
    throw new Error("Finding is not confirmed");
  }
  const incoming = await prisma.vouch.findMany({
    where: { toUserId: finding.targetUserId, status: VouchStatus.ACTIVE },
    select: { id: true, fromUserId: true, weight: true },
  });
  const penalties = slashPenalties(incoming.map((v) => ({ fromId: v.fromUserId, weight: v.weight })));

  const ops = [];
  ops.push(
    prisma.vouch.updateMany({
      where: { toUserId: finding.targetUserId, status: VouchStatus.ACTIVE },
      data: { status: VouchStatus.SLASHED },
    })
  );
  ops.push(
    prisma.user.update({
      where: { id: finding.targetUserId },
      data: { trustScore: 0, standing: 0, nodeType: "NODE" },
    })
  );
  for (const [voucherId, penalty] of Array.from(penalties.entries())) {
    const voucher = await prisma.user.findUnique({ where: { id: voucherId }, select: { standing: true } });
    if (!voucher) continue;
    ops.push(
      prisma.user.update({
        where: { id: voucherId },
        data: { standing: round4(Math.max(0, voucher.standing - penalty)) },
      })
    );
    ops.push(
      prisma.standingEvent.create({
        data: {
          targetType: "USER",
          targetId: voucherId,
          amount: -penalty,
          reason: `Slashing: staked on a node found to have rugged (finding ${finding.id})`,
          vestedFraction: 1,
        },
      })
    );
  }
  await prisma.$transaction(ops);
  await recomputeTrustScores();
  return { vouchers: penalties.size };
}

/** §1 Standing decays 25% per season if not renewed by new results. Applied once at season start. */
export async function applySeasonStandingDecay(seasonNumber: number) {
  const season = await prisma.season.findUnique({ where: { number: seasonNumber } });
  if (!season || season.standingDecayApplied) return { applied: false };

  const users = await prisma.user.findMany({ where: { standing: { gt: 0 } }, select: { id: true, standing: true } });
  const crews = await prisma.crew.findMany({ where: { standing: { gt: 0 } }, select: { id: true, standing: true } });
  const factions = await prisma.faction.findMany({ where: { standing: { gt: 0 } }, select: { id: true, standing: true } });

  const ops = [
    ...users.map((u) => prisma.user.update({ where: { id: u.id }, data: { standing: decayStanding(u.standing) } })),
    ...crews.map((c) => prisma.crew.update({ where: { id: c.id }, data: { standing: decayStanding(c.standing) } })),
    ...factions.map((f) => prisma.faction.update({ where: { id: f.id }, data: { standing: decayStanding(f.standing) } })),
    prisma.season.update({ where: { id: season.id }, data: { standingDecayApplied: true } }),
  ];
  for (let i = 0; i < ops.length; i += 100) await prisma.$transaction(ops.slice(i, i + 100));
  return { applied: true, users: users.length, crews: crews.length, factions: factions.length, rate: TRUST.standingDecayPerSeason };
}

/** An attested in-person vouch from an Anchor, Elder or region admin makes the receiver an Anchor. */
export async function promoteAnchorIfAttested(vouchId: string) {
  const v = await prisma.vouch.findUnique({ where: { id: vouchId }, include: { from: true, to: true, region: true } });
  if (!v || v.type !== "IN_PERSON" || v.status !== VouchStatus.ACTIVE || !v.attestedBy) return;
  const fromIsSource = v.from.nodeType !== "NODE" || (v.region && isRegionAdmin(v.from, v.region));
  if (!fromIsSource) return;
  if (v.to.nodeType === "NODE") {
    await prisma.user.update({ where: { id: v.toUserId }, data: { nodeType: "ANCHOR", anchoredAt: new Date(), regionId: v.to.regionId ?? v.regionId } });
  }
}
