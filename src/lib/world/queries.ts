import { prisma } from "@/lib/prisma";
import { AllianceStatus, EntryStatus, NodeType, type Season, type User } from "@prisma/client";
import { WorldError } from "@/lib/world/errors";
import { getCurrentSeason, seasonPhase } from "@/lib/world/seasons";
import { loadTrustAggregates } from "@/lib/world/trust-db";
import { displayName, publicEntry } from "@/lib/world/privacy";
import { vouchBudget } from "@/lib/world/trust";
import { spentVouchBudget } from "@/lib/world/trust-db";

export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
export const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** Find a node by chosen handle or wallet address. */
export async function findNode(handleOrAddress: string): Promise<User | null> {
  const key = handleOrAddress.trim();
  if (ADDRESS_RE.test(key)) {
    return prisma.user.findFirst({ where: { address: { equals: key.toLowerCase(), mode: "insensitive" } } });
  }
  return prisma.user.findUnique({ where: { handle: key.toLowerCase() } });
}

export async function requireNode(handleOrAddress: string): Promise<User> {
  const u = await findNode(handleOrAddress);
  if (!u) throw new WorldError("No such node in the world.", 404);
  return u;
}

export async function currentSeasonNumber(): Promise<number | null> {
  const s = await getCurrentSeason();
  return s?.number ?? null;
}

/** Faction moves are allowed between seasons, not during. Joining a first faction is not a move. */
export async function assertCanMoveFaction(user: User, season: Season | null) {
  if (!user.factionId) return;
  if (!season) return;
  const phase = seasonPhase(season);
  if (phase === "building" || phase === "voting") {
    throw new WorldError("Moving between factions is allowed between seasons, not during one.", 409);
  }
}

export async function isCrewMember(userId: string, crewId: string) {
  const m = await prisma.crewMember.findFirst({ where: { userId, crewId, leftAt: null } });
  return !!m;
}

export async function isCrewLead(userId: string, crewId: string) {
  const m = await prisma.crewMember.findFirst({ where: { userId, crewId, leftAt: null, isLead: true } });
  return !!m;
}

export function isElder(user: Pick<User, "nodeType">) {
  return user.nodeType === NodeType.ELDER;
}

export function isAnchorOrElder(user: Pick<User, "nodeType">) {
  return user.nodeType === NodeType.ELDER || user.nodeType === NodeType.ANCHOR;
}

export function isRegionAdmin(user: Pick<User, "address">, region: { adminAddresses: string[] }) {
  return region.adminAddresses.map((a) => a.toLowerCase()).includes(user.address.toLowerCase());
}

/** Faction ids allied with the given faction for a season (ACTIVE alliances only). */
export async function alliedFactionIds(factionId: string | null, seasonNumber: number | null): Promise<string[]> {
  if (!factionId || seasonNumber === null) return [];
  const alliances = await prisma.alliance.findMany({
    where: { seasonNumber, status: AllianceStatus.ACTIVE, factionIds: { has: factionId } },
    select: { factionIds: true },
  });
  const out = new Set<string>();
  for (const a of alliances) for (const id of a.factionIds) if (id !== factionId) out.add(id);
  return Array.from(out);
}

/** The three-layer public profile. Aggregates and proofs, never names unless chosen. */
export async function publicProfile(user: User, opts: { owner?: boolean } = {}) {
  const [aggregates, proofs, crews, faction, region, intents, entries, standingEvents] = await Promise.all([
    loadTrustAggregates(user.id, user.trustScore),
    prisma.proof.findMany({
      where: { userId: user.id },
      orderBy: { shippedAt: "desc" },
      select: { id: true, kind: true, source: true, title: true, description: true, proofHash: true, verified: true, shippedAt: true, seasonNumber: true, crew: { select: { name: true, slug: true } } },
    }),
    prisma.crewMember.findMany({
      where: { userId: user.id, leftAt: null },
      select: { role: true, isLead: true, crew: { select: { name: true, slug: true, standing: true, faction: { select: { name: true, slug: true } } } } },
    }),
    user.factionId ? prisma.faction.findUnique({ where: { id: user.factionId }, select: { name: true, slug: true, vision: true, standing: true } }) : null,
    user.regionId ? prisma.region.findUnique({ where: { id: user.regionId }, select: { name: true, slug: true } }) : null,
    prisma.scoutIntent.findMany({
      where: { userId: user.id, active: true, expiresAt: { gt: new Date() } },
      select: { type: true, tags: true, expiresAt: true },
    }),
    prisma.entry.findMany({
      where: { OR: [{ authorId: user.id }, { crew: { members: { some: { userId: user.id, leftAt: null } } } }], status: { not: EntryStatus.DRAFT } },
      include: { season: { select: { number: true, name: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.standingEvent.findMany({ where: { targetType: "USER", targetId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return {
    handle: user.handle,
    name: displayName(user),
    bio: user.bio,
    nodeType: user.nodeType,
    band: aggregates.band,
    standing: user.standing,
    region,
    faction,
    crews: crews.map((c) => ({ ...c.crew, role: c.role, isLead: c.isLead })),
    shipped: proofs,
    trust: aggregates,
    lookingFor: intents,
    seasonHistory: entries.map((e) => {
      const closed = e.season.status === "CLOSED" || e.season.status === "VESTED";
      const p = publicEntry(e, closed);
      return { id: p.id, title: p.blind ? "Research paper (private)" : p.title, tournament: p.tournament, status: p.status, isVictor: p.isVictor, season: e.season };
    }),
    // A slashing penalty reveals who the node staked on. Only the owner sees the finding.
    standingHistory: standingEvents.map((e) =>
      !opts.owner && e.amount < 0 && e.reason.startsWith("Slashing") ? { ...e, reason: "Stake called on a vouch (see findings)" } : e
    ),
    since: user.createdAt,
  };
}

/** Everything the owner sees on top of the public profile. */
export async function privateProfile(user: User) {
  const seasonNumber = await currentSeasonNumber();
  const spent = await spentVouchBudget(user.id, seasonNumber);
  return {
    address: user.address,
    trustScore: user.trustScore,
    discordId: user.discordId,
    vouchBudget: { total: vouchBudget(user.trustScore), spent, remaining: Math.max(0, vouchBudget(user.trustScore) - spent), seasonNumber },
    factionJoinedSeasonNumber: user.factionJoinedSeasonNumber,
  };
}
