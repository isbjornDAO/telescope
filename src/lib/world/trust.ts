import type { NodeType, VouchType } from "@prisma/client";
import { TRUST } from "@/lib/world/config";

/**
 * Trust score engine (build decisions §1).
 *
 *   score(n) = min(1.0, Σ_v score(voucher) × weight(v) × 0.5) + standing(n)
 *
 * Anchors and Elders are the only sources (base 1.0). Run three iterations
 * over the graph. A node with no path to a source has score 0.
 */

export interface TrustNode {
  id: string;
  nodeType: NodeType;
  standing: number;
}

export interface TrustLink {
  fromId: string;
  toId: string;
  weight: number;
}

export interface TrustResult {
  pathScore: number;
  standing: number;
  score: number;
}

export function linkWeight(type: VouchType): number {
  return TRUST.linkWeight[type];
}

export function cappedStanding(standing: number): number {
  return Math.max(0, Math.min(TRUST.standingCap, standing || 0));
}

export function computeTrustScores(
  nodes: TrustNode[],
  links: TrustLink[],
  iterations: number = TRUST.iterations
): Map<string, TrustResult> {
  const base = new Map<string, number>();
  const standing = new Map<string, number>();
  for (const n of nodes) {
    base.set(n.id, TRUST.baseScore[n.nodeType]);
    standing.set(n.id, cappedStanding(n.standing));
  }

  const incoming = new Map<string, TrustLink[]>();
  for (const l of links) {
    if (!base.has(l.fromId) || !base.has(l.toId) || l.fromId === l.toId) continue;
    const arr = incoming.get(l.toId) ?? [];
    arr.push(l);
    incoming.set(l.toId, arr);
  }

  // score used while propagating = pathScore + standing
  let score = new Map<string, number>();
  for (const n of nodes) score.set(n.id, base.get(n.id)! + standing.get(n.id)!);

  let path = new Map<string, number>(base);

  for (let i = 0; i < iterations; i++) {
    const nextPath = new Map<string, number>();
    const nextScore = new Map<string, number>();
    for (const n of nodes) {
      let sum = 0;
      for (const l of incoming.get(n.id) ?? []) {
        sum += (score.get(l.fromId) ?? 0) * l.weight * TRUST.decayPerHop;
      }
      const p = Math.max(base.get(n.id)!, Math.min(TRUST.maxPathScore, sum));
      nextPath.set(n.id, p);
      nextScore.set(n.id, p + standing.get(n.id)!);
    }
    path = nextPath;
    score = nextScore;
  }

  const out = new Map<string, TrustResult>();
  for (const n of nodes) {
    out.set(n.id, {
      pathScore: round4(path.get(n.id)!),
      standing: round4(standing.get(n.id)!),
      score: round4(score.get(n.id)!),
    });
  }
  return out;
}

/** §1 Vouch budget per season = score × 5 */
export function vouchBudget(score: number): number {
  return round4(Math.max(0, score) * TRUST.vouchBudgetMultiplier);
}

export function vouchCost(type: VouchType): number {
  return TRUST.linkWeight[type];
}

export function canAffordVouch(score: number, spentThisSeason: number, type: VouchType): boolean {
  return vouchBudget(score) - spentThisSeason + 1e-9 >= vouchCost(type);
}

/** §1 Standing decays 25% per season if not renewed */
export function decayStanding(standing: number): number {
  return round4(standing * (1 - TRUST.standingDecayPerSeason));
}

/** §1 Slashing: each voucher loses standing equal to 20% of the weight they staked. */
export function slashPenalties(vouches: { fromId: string; weight: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const v of vouches) {
    out.set(v.fromId, round4((out.get(v.fromId) ?? 0) + v.weight * TRUST.slashVoucherPenalty));
  }
  return out;
}

/** Trust band shown publicly and claimed by scouts; never the raw score of another node. */
export function trustBand(score: number): "none" | "thin" | "firm" | "thick" {
  if (score <= 0) return "none";
  if (score < 0.4) return "thin";
  if (score < 1.0) return "firm";
  return "thick";
}

/** "At least N" buckets for aggregate claims. */
export function atLeastBucket(n: number): number {
  const buckets = [0, 1, 3, 6, 10, 20, 50];
  let best = 0;
  for (const b of buckets) if (n >= b) best = b;
  return best;
}

export function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}
