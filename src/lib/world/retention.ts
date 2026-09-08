import { RETENTION } from "@/lib/world/config";
import { round4 } from "@/lib/world/trust";

/**
 * The 90-day retention metric (build decisions §4).
 *
 * Retention = active users at day 90 ÷ active users at day 0.
 * Standing vests 100% at ≥30%, pro-rata between 5% and 30%, 0% below 5%.
 * Only trust-graph wallets (score > 0) count as active users.
 */

export function retentionRatio(day0: number, day90: number): number {
  if (!day0 || day0 <= 0) return 0;
  return round4(Math.max(0, day90) / day0);
}

export function vestedFraction(ratio: number): number {
  if (ratio >= RETENTION.fullVestAt) return 1;
  if (ratio < RETENTION.zeroVestBelow) return 0;
  return round4((ratio - RETENTION.zeroVestBelow) / (RETENTION.fullVestAt - RETENTION.zeroVestBelow));
}

export function vestingDate(seasonEndsAt: Date): Date {
  return new Date(seasonEndsAt.getTime() + RETENTION.windowDays * 24 * 60 * 60 * 1000);
}

/** Wallets reported by the entry, filtered to those on the trust graph, deduplicated. */
export function countActiveWallets(
  reported: string[],
  trustScoreByAddress: Map<string, number>
): number {
  const seen = new Set<string>();
  for (const raw of reported) {
    const a = raw.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(a)) continue;
    if ((trustScoreByAddress.get(a) ?? 0) > 0) seen.add(a);
  }
  return seen.size;
}
