import { prisma } from "@/lib/prisma";
import { IntentType, MatchStatus, ScoutMessageType, type ScoutIntent, type ScoutMatch, type User } from "@prisma/client";
import { SCOUT } from "@/lib/world/config";
import { atLeastBucket, trustBand } from "@/lib/world/trust";
import { decryptJson, encryptJson, sha256Hex } from "@/lib/world/crypto";
import { WorldError } from "@/lib/world/errors";
import type { Prisma } from "@prisma/client";

/**
 * The hosted scout (build decisions §2). One scout per profile. It holds
 * the principal's private context, queries other scouts, raises OFFERs,
 * and only after mutual ACCEPT exchanges DISCLOSE packages.
 *
 * Message set: INTENT · CLAIM · QUERY (paid) · OFFER · ACCEPT/DECLINE
 * (human-gated) · DISCLOSE · ATTEST (see vouches routes).
 *
 * Privacy rules enforced here:
 *  - a scout never sends identifying data before mutual ACCEPT;
 *  - CLAIMs are aggregates and proofs only;
 *  - QUERY logs are kept 30 days for abuse detection, then deleted.
 */

export interface Claims {
  nodeType: "NODE" | "ANCHOR" | "ELDER";
  band: ReturnType<typeof trustBand>;
  vouchesAtLeast: number;
  inPersonAtLeast: number;
  regions: string[];
  shippedAtLeast: number;
  factionStandingBand: "none" | "thin" | "firm" | "thick";
  hasCrew: boolean;
}

export interface Disclosure {
  name: string;
  contact: string;
  history?: string;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** CLAIM: what a scout may say about its principal. Aggregates only. */
export async function buildClaims(userId: string): Promise<Claims> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      nodeType: true,
      trustScore: true,
      faction: { select: { standing: true } },
      crewMemberships: { where: { leftAt: null }, select: { id: true }, take: 1 },
      vouchesReceived: {
        where: { status: "ACTIVE" },
        select: { type: true, region: { select: { slug: true } } },
      },
      proofs: { where: { kind: "SHIPPED", verified: true }, select: { id: true } },
    },
  });
  if (!user) throw new WorldError("Unknown node.", 404);
  const inPerson = user.vouchesReceived.filter((v) => v.type === "IN_PERSON");
  const regions = Array.from(new Set(inPerson.map((v) => v.region?.slug).filter(Boolean) as string[]));
  return {
    nodeType: user.nodeType,
    band: trustBand(user.trustScore),
    vouchesAtLeast: atLeastBucket(user.vouchesReceived.length),
    inPersonAtLeast: atLeastBucket(inPerson.length),
    regions,
    shippedAtLeast: atLeastBucket(user.proofs.length),
    factionStandingBand: trustBand(user.faction?.standing ?? 0),
    hasCrew: user.crewMemberships.length > 0,
  };
}

export interface Budget {
  perSeason: number;
  used: number;
  extra: number;
  remaining: number;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
}

export function budgetFor(user: User, seasonNumber: number | null): Budget {
  const sameSeason = user.scoutQueriesSeasonNumber === (seasonNumber ?? 0);
  const used = sameSeason ? user.scoutQueriesUsed : 0;
  const dailyUsed = user.scoutDailyDate === todayKey() ? user.scoutDailyUsed : 0;
  const remaining = Math.max(0, SCOUT.defaultQueriesPerSeason + user.scoutExtraQueries - used);
  return {
    perSeason: SCOUT.defaultQueriesPerSeason,
    used,
    extra: user.scoutExtraQueries,
    remaining,
    dailyLimit: SCOUT.dailyQueryLimit,
    dailyUsed,
    dailyRemaining: Math.max(0, SCOUT.dailyQueryLimit - dailyUsed),
  };
}

/** Charge up to `wanted` QUERYs. Returns how many were actually granted. */
export async function chargeQueries(user: User, wanted: number, seasonNumber: number | null): Promise<number> {
  const b = budgetFor(user, seasonNumber);
  const granted = Math.max(0, Math.min(wanted, b.remaining, b.dailyRemaining));
  if (granted === 0) return 0;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      scoutQueriesUsed: b.used + granted,
      scoutQueriesSeasonNumber: seasonNumber ?? 0,
      scoutDailyUsed: b.dailyUsed + granted,
      scoutDailyDate: todayKey(),
    },
  });
  return granted;
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((w) => w.length > 3)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => {
    if (b.has(x)) inter++;
  });
  return inter / (a.size + b.size - inter);
}

export interface Candidate {
  intent: ScoutIntent & { user: { id: string; trustScore: number; regionId: string | null; region: { slug: string } | null } };
}

/** Does candidate B fit intent A? Pure, so it is testable. */
export function fitScore(
  a: { type: IntentType; tags: string[]; text: string; constraints: unknown; regionSlug: string | null },
  b: { type: IntentType; tags: string[]; text: string; trustScore: number; regionSlug: string | null }
): number {
  if (a.type !== b.type) return 0;
  const c = (a.constraints ?? {}) as { minTrust?: number; regionSlug?: string };
  if (typeof c.minTrust === "number" && b.trustScore < c.minTrust) return 0;
  if (c.regionSlug && b.regionSlug !== c.regionSlug) return 0;

  const tagScore = jaccard(new Set(a.tags.map((t) => t.toLowerCase())), new Set(b.tags.map((t) => t.toLowerCase())));
  const textScore = jaccard(tokens(a.text), tokens(b.text));
  const trustScore = Math.min(1, Math.max(0, b.trustScore));
  let typeBonus = 0;
  if (a.type === "REGION_ADOPT") typeBonus = a.regionSlug && b.regionSlug && a.regionSlug !== b.regionSlug ? 1 : 0.2;
  else if (a.type === "RESEARCH_QUESTION") typeBonus = 0.8;
  else typeBonus = 0.5;

  return Math.round((0.55 * tagScore + 0.2 * textScore + 0.15 * trustScore + 0.1 * typeBonus) * 1000) / 1000;
}

async function logMessage(type: ScoutMessageType, fromUserId: string, toUserId: string | null, payload: unknown, paid = false) {
  await prisma.scoutLog.create({
    data: { type, fromUserId, toUserId, payloadHash: sha256Hex(JSON.stringify(payload)), paid },
  });
}

/**
 * Run the principal's scout once: for each active intent, QUERY the best
 * candidates (one budget unit each) and raise OFFERs where the fit clears
 * the threshold. Never touches identity.
 */
export async function runScout(user: User, seasonNumber: number | null) {
  const intents = await prisma.scoutIntent.findMany({
    where: { userId: user.id, active: true, expiresAt: { gt: new Date() } },
  });
  if (intents.length === 0) return { queried: 0, offers: 0, reason: "No active intent. Tell your scout what you are looking for." };

  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { region: { select: { slug: true } } } });
  const myClaims = await buildClaims(user.id);

  let queried = 0;
  let offers = 0;

  for (const intent of intents) {
    const existing = await prisma.scoutMatch.findMany({
      where: { OR: [{ intentAId: intent.id }, { intentBId: intent.id }] },
      select: { intentAId: true, intentBId: true },
    });
    const excluded = new Set<string>();
    for (const m of existing) {
      excluded.add(m.intentAId);
      excluded.add(m.intentBId);
    }

    const candidates = await prisma.scoutIntent.findMany({
      where: {
        type: intent.type,
        active: true,
        expiresAt: { gt: new Date() },
        userId: { not: user.id },
        id: { notIn: Array.from(excluded) },
      },
      include: { user: { select: { id: true, trustScore: true, regionId: true, region: { select: { slug: true } } } } },
      take: 200,
    });

    const scored = candidates
      .map((c) => ({
        c,
        score: fitScore(
          { type: intent.type, tags: intent.tags, text: intent.text, constraints: intent.constraints, regionSlug: me?.region?.slug ?? null },
          { type: c.type, tags: c.tags, text: c.text, trustScore: c.user.trustScore, regionSlug: c.user.region?.slug ?? null }
        ),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SCOUT.candidatesPerRun);

    if (scored.length === 0) continue;

    const granted = await chargeQueries(user, scored.length, seasonNumber);
    if (granted === 0) break;
    // refresh local budget counters for the next intent
    user = (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;

    for (const s of scored.slice(0, granted)) {
      queried++;
      const queryPayload = { intentType: intent.type, tags: intent.tags, claims: myClaims };
      await logMessage("QUERY", user.id, s.c.userId, queryPayload, true);

      if (s.score < SCOUT.offerThreshold) continue;
      const theirClaims = await buildClaims(s.c.userId);
      const offer = {
        reason: offerReason(intent, s.c, s.score),
        claimsA: myClaims,
        claimsB: theirClaims,
        wouldDiscloseA: ["chosen name", "contact channel"],
        wouldDiscloseB: ["chosen name", "contact channel"],
      };
      await prisma.scoutMatch.create({
        data: {
          intentAId: intent.id,
          intentBId: s.c.id,
          userAId: user.id,
          userBId: s.c.userId,
          score: s.score,
          offer: offer as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + SCOUT.matchExpiryDays * 24 * 60 * 60 * 1000),
        },
      });
      await logMessage("OFFER", user.id, s.c.userId, offer);
      offers++;
    }
  }

  return { queried, offers, reason: null as string | null };
}

function offerReason(a: ScoutIntent, b: ScoutIntent, score: number): string {
  const shared = a.tags.filter((t) => b.tags.map((x) => x.toLowerCase()).includes(t.toLowerCase()));
  const what =
    a.type === "ROLE"
      ? "a role fit"
      : a.type === "PARTNER_PROJECT"
      ? "a partner project"
      : a.type === "REGION_ADOPT"
      ? "a region-to-region adoption"
      : "the same research question";
  return `Your scouts agree on ${what}${shared.length ? ` around ${shared.slice(0, 3).join(", ")}` : ""}. Fit ${Math.round(score * 100)}%.`;
}

export async function respondToMatch(match: ScoutMatch, user: User, action: "accept" | "decline", disclosure?: Disclosure) {
  const isA = match.userAId === user.id;
  const isB = match.userBId === user.id;
  if (!isA && !isB) throw new WorldError("Not your match.", 403);
  if (match.status === "MATCHED" || match.status === "DECLINED" || match.status === "EXPIRED") {
    throw new WorldError("This match is already settled.", 409);
  }
  if (match.expiresAt < new Date()) {
    await prisma.scoutMatch.update({ where: { id: match.id }, data: { status: "EXPIRED" } });
    throw new WorldError("This offer expired.", 409);
  }

  if (action === "decline") {
    await logMessage("DECLINE", user.id, isA ? match.userBId : match.userAId, { matchId: match.id });
    return prisma.scoutMatch.update({ where: { id: match.id }, data: { status: "DECLINED" } });
  }

  if (!disclosure || !disclosure.name || !disclosure.contact) {
    throw new WorldError("Choose what to disclose: a name and a contact channel.", 422);
  }
  const packaged = encryptJson({ ...disclosure, at: new Date().toISOString() });
  const otherAccepted = isA ? match.status === "ACCEPTED_B" : match.status === "ACCEPTED_A";
  const next: MatchStatus = otherAccepted ? "MATCHED" : isA ? "ACCEPTED_A" : "ACCEPTED_B";

  await logMessage("ACCEPT", user.id, isA ? match.userBId : match.userAId, { matchId: match.id });
  const updated = await prisma.scoutMatch.update({
    where: { id: match.id },
    data: { status: next, ...(isA ? { disclosureA: packaged } : { disclosureB: packaged }) },
  });
  if (next === "MATCHED") {
    await logMessage("DISCLOSE", match.userAId, match.userBId, { matchId: match.id });
    await logMessage("DISCLOSE", match.userBId, match.userAId, { matchId: match.id });
  }
  return updated;
}

/** What a principal may see of a match. Identity only after MATCHED. */
export function viewMatch(
  match: ScoutMatch & { intentA?: { type: IntentType; tags: string[] } | null; intentB?: { type: IntentType; tags: string[] } | null },
  viewerId: string
) {
  const isA = match.userAId === viewerId;
  const offer = match.offer as unknown as {
    reason: string;
    claimsA: Claims;
    claimsB: Claims;
    wouldDiscloseA: string[];
    wouldDiscloseB: string[];
  };
  const myAccepted = isA
    ? match.status === "ACCEPTED_A" || match.status === "MATCHED"
    : match.status === "ACCEPTED_B" || match.status === "MATCHED";
  const theirAccepted = isA
    ? match.status === "ACCEPTED_B" || match.status === "MATCHED"
    : match.status === "ACCEPTED_A" || match.status === "MATCHED";
  let disclosure: Disclosure | null = null;
  if (match.status === "MATCHED") {
    const pkg = isA ? match.disclosureB : match.disclosureA;
    if (pkg) {
      try {
        disclosure = decryptJson<Disclosure>(pkg);
      } catch {
        disclosure = null;
      }
    }
  }
  return {
    id: match.id,
    status: match.status,
    score: match.score,
    reason: offer.reason,
    myIntent: isA ? match.intentA : match.intentB,
    theirIntent: isA ? match.intentB : match.intentA,
    theirClaims: isA ? offer.claimsB : offer.claimsA,
    theyWouldDisclose: isA ? offer.wouldDiscloseB : offer.wouldDiscloseA,
    myAccepted,
    theirAccepted,
    disclosure,
    expiresAt: match.expiresAt,
    createdAt: match.createdAt,
  };
}

/** §2 QUERY logs retained 30 days, then deleted. Also expires stale offers. */
export async function cleanupScout() {
  const cutoff = new Date(Date.now() - SCOUT.logRetentionDays * 24 * 60 * 60 * 1000);
  const logs = await prisma.scoutLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const expired = await prisma.scoutMatch.updateMany({
    where: { status: { in: ["OFFERED", "ACCEPTED_A", "ACCEPTED_B"] }, expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return { logsDeleted: logs.count, offersExpired: expired.count };
}
