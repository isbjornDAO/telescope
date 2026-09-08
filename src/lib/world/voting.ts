import type { NodeType } from "@prisma/client";
import { VOTING } from "@/lib/world/config";
import { round4 } from "@/lib/world/trust";

/**
 * Voting and knockouts (build decisions §3).
 *
 * Weight per voter = trust score × multiplier (Elder ×3, Anchor ×1.5).
 * Elders + Anchors combined are capped at 40% of a round's total weight.
 * Faction self-votes count ×0.5. Score 0 → weight 0.
 * Thresholds are shares of total weighted votes cast in the round.
 */

export interface BallotPayload {
  voterId: string;
  nodeType: NodeType;
  factionId: string | null;
  /** factions allied with the voter's faction for this season */
  allianceFactionIds: string[];
  /** trust score × node multiplier, snapshotted at cast time */
  baseWeight: number;
  allocations: { entryId: string; share: number }[];
}

export interface EntryMeta {
  id: string;
  factionId: string | null;
  allianceFactionIds: string[];
}

export interface TallyResult {
  perEntry: Record<string, number>;
  totalWeight: number;
  elderAnchorShare: number;
  elderAnchorScale: number;
  advanced: string[];
  fallbackUsed: boolean;
  ballotCount: number;
}

export function nodeMultiplier(nodeType: NodeType): number {
  if (nodeType === "ELDER") return VOTING.elderMultiplier;
  if (nodeType === "ANCHOR") return VOTING.anchorMultiplier;
  return 1;
}

/** Trust score × multiplier. Score 0 cannot vote. */
export function voterBaseWeight(trustScore: number, nodeType: NodeType): number {
  if (!trustScore || trustScore <= 0) return 0;
  return round4(trustScore * nodeMultiplier(nodeType));
}

export function isSelfVote(ballot: Pick<BallotPayload, "factionId" | "allianceFactionIds">, entry: EntryMeta): boolean {
  if (!entry.factionId) return false;
  if (ballot.factionId && ballot.factionId === entry.factionId) return true;
  if (ballot.allianceFactionIds.includes(entry.factionId)) return true;
  if (ballot.factionId && entry.allianceFactionIds.includes(ballot.factionId)) return true;
  return false;
}

export function normalizeAllocations(allocs: { entryId: string; share: number }[]) {
  const seen = new Map<string, number>();
  for (const a of allocs) {
    if (!(a.share > 0)) continue;
    seen.set(a.entryId, (seen.get(a.entryId) ?? 0) + a.share);
  }
  const trimmed = Array.from(seen.entries()).slice(0, VOTING.maxAllocationsPerBallot);
  const total = trimmed.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) return [] as { entryId: string; share: number }[];
  return trimmed.map(([entryId, v]) => ({ entryId, share: v / total }));
}

export function tallyRound(
  ballots: BallotPayload[],
  entries: EntryMeta[],
  threshold: number,
  opts: { isFinal?: boolean } = {}
): TallyResult {
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const eaPerEntry = new Map<string, number>();
  const otherPerEntry = new Map<string, number>();
  let eaTotal = 0;
  let otherTotal = 0;

  for (const b of ballots) {
    if (!(b.baseWeight > 0)) continue;
    const isEA = b.nodeType === "ELDER" || b.nodeType === "ANCHOR";
    for (const a of normalizeAllocations(b.allocations)) {
      const entry = entryById.get(a.entryId);
      if (!entry) continue;
      let w = b.baseWeight * a.share;
      if (isSelfVote(b, entry)) w *= VOTING.selfVoteMultiplier;
      const bucket = isEA ? eaPerEntry : otherPerEntry;
      bucket.set(a.entryId, (bucket.get(a.entryId) ?? 0) + w);
      if (isEA) eaTotal += w;
      else otherTotal += w;
    }
  }

  // §3 E+A cap: scale down proportionally if their share exceeds 40%.
  let eaScale = 1;
  const gross = eaTotal + otherTotal;
  if (gross > 0 && eaTotal / gross > VOTING.elderAnchorCap) {
    if (otherTotal > 0) {
      eaScale = (VOTING.elderAnchorCap * otherTotal) / ((1 - VOTING.elderAnchorCap) * eaTotal);
    } else {
      // Only Elders/Anchors voted: nothing to scale against, cap is moot.
      eaScale = 1;
    }
  }

  const perEntry: Record<string, number> = {};
  for (const e of entries) {
    const w = (eaPerEntry.get(e.id) ?? 0) * eaScale + (otherPerEntry.get(e.id) ?? 0);
    perEntry[e.id] = round4(w);
  }
  const totalWeight = round4(Object.values(perEntry).reduce((s, v) => s + v, 0));
  const elderAnchorShare = totalWeight > 0 ? round4((eaTotal * eaScale) / totalWeight) : 0;

  const ranked = entries
    .map((e) => ({ id: e.id, w: perEntry[e.id] }))
    .sort((a, b) => b.w - a.w);

  let advanced: string[];
  let fallbackUsed = false;
  if (opts.isFinal) {
    advanced = ranked.filter((r) => totalWeight > 0 && r.w / totalWeight > 0.5).map((r) => r.id);
    if (advanced.length === 0 && ranked.length > 0 && ranked[0].w > 0) {
      advanced = [ranked[0].id];
      fallbackUsed = true;
    }
  } else {
    advanced = ranked
      .filter((r) => totalWeight > 0 && r.w / totalWeight + 1e-12 >= threshold)
      .map((r) => r.id);
    if (advanced.length < VOTING.fallbackAdvance && ranked.length > 0) {
      advanced = ranked
        .filter((r) => r.w > 0)
        .slice(0, VOTING.fallbackAdvance)
        .map((r) => r.id);
      if (advanced.length < Math.min(VOTING.fallbackAdvance, ranked.length)) {
        // nobody voted: keep the top N by order so the bracket does not die
        advanced = ranked.slice(0, VOTING.fallbackAdvance).map((r) => r.id);
      }
      fallbackUsed = true;
    }
  }

  return {
    perEntry,
    totalWeight,
    elderAnchorShare,
    elderAnchorScale: round4(eaScale),
    advanced,
    fallbackUsed,
    ballotCount: ballots.length,
  };
}

/** §3 Local Systems: advance on ≥60% panel approval; final ranked by panel score. */
export function tallyPanel(reviews: { approve: boolean | null; score: number | null }[]) {
  const submitted = reviews.filter((r) => r.approve !== null);
  const approvals = submitted.filter((r) => r.approve).length;
  const approvalRate = submitted.length ? approvals / submitted.length : 0;
  const scored = reviews.filter((r) => typeof r.score === "number") as { score: number }[];
  const meanScore = scored.length ? scored.reduce((s, r) => s + r.score, 0) / scored.length : null;
  return {
    submitted: submitted.length,
    approvals,
    approvalRate: round4(approvalRate),
    advances: submitted.length > 0 && approvalRate + 1e-12 >= VOTING.localSystems.approvalThreshold,
    meanScore: meanScore === null ? null : round4(meanScore),
  };
}

/** §3 Research Papers: 1–10 on advances / rigour / buildable; advance on mean ≥7.0. */
export function tallyBlind(
  reviews: { advances: number | null; rigour: number | null; buildable: number | null }[]
) {
  const complete = reviews.filter(
    (r) => typeof r.advances === "number" && typeof r.rigour === "number" && typeof r.buildable === "number"
  ) as { advances: number; rigour: number; buildable: number }[];
  const means = complete.map((r) => (r.advances + r.rigour + r.buildable) / 3);
  const mean = means.length ? means.reduce((s, v) => s + v, 0) / means.length : null;
  return {
    reviews: complete.length,
    mean: mean === null ? null : round4(mean),
    advances: mean !== null && mean + 1e-12 >= VOTING.researchPapers.advanceMean,
  };
}
