import type { Entry, NodeType, User } from "@prisma/client";
import { atLeastBucket, trustBand } from "@/lib/world/trust";

/**
 * Shapes that leave the server. Anything identifying is stripped here so a
 * route cannot leak it by accident. Aggregates and proofs only.
 */

export interface TrustAggregates {
  vouchesAtLeast: number;
  inPersonAtLeast: number;
  shippedTogetherAtLeast: number;
  sharedVisionAtLeast: number;
  /** regions with at least one in-person vouch, as "at least N" buckets */
  regions: { slug: string; name: string; atLeast: number }[];
  band: ReturnType<typeof trustBand>;
  /** vouchers who chose to be visible, and whose receiver chose the same */
  visibleVouchers: { handle: string; type: string }[];
}

export function aggregateVouches(
  vouches: {
    type: string;
    status: string;
    region?: { slug: string; name: string } | null;
    fromVisible: boolean;
    toVisible: boolean;
    from?: { handle: string | null } | null;
  }[],
  score: number
): TrustAggregates {
  const active = vouches.filter((v) => v.status === "ACTIVE");
  const byRegion = new Map<string, { slug: string; name: string; count: number }>();
  for (const v of active) {
    if (v.type === "IN_PERSON" && v.region) {
      const r = byRegion.get(v.region.slug) ?? { ...v.region, count: 0 };
      r.count += 1;
      byRegion.set(v.region.slug, r);
    }
  }
  return {
    vouchesAtLeast: atLeastBucket(active.length),
    inPersonAtLeast: atLeastBucket(active.filter((v) => v.type === "IN_PERSON").length),
    shippedTogetherAtLeast: atLeastBucket(active.filter((v) => v.type === "SHIPPED_TOGETHER").length),
    sharedVisionAtLeast: atLeastBucket(active.filter((v) => v.type === "SHARED_VISION").length),
    regions: Array.from(byRegion.values()).map((r) => ({ slug: r.slug, name: r.name, atLeast: atLeastBucket(r.count) })),
    band: trustBand(score),
    visibleVouchers: active
      .filter((v) => v.fromVisible && v.toVisible && v.from?.handle)
      .map((v) => ({ handle: v.from!.handle!, type: v.type })),
  };
}

export function displayName(user: Pick<User, "handle" | "address">): string {
  return user.handle || `${user.address.slice(0, 6)}…${user.address.slice(-4)}`;
}

export function nodeLabel(nodeType: NodeType): string {
  return nodeType === "ELDER" ? "Elder" : nodeType === "ANCHOR" ? "Anchor" : "Node";
}

/** Research Papers: reviewers see the paper, not the author, crew, faction or region. */
const IDENTIFYING_KEYS = ["authorId", "crewId", "factionId", "allianceId", "regionId"] as const;

export function blindEntry<T extends Partial<Entry>>(entry: T) {
  const rest: Record<string, unknown> = { ...entry };
  for (const k of IDENTIFYING_KEYS) delete rest[k];
  return { ...(rest as Omit<T, (typeof IDENTIFYING_KEYS)[number]>), blind: true as const };
}

/** Public shape of an entry. RP entries stay private until the season closes. */
export function publicEntry<T extends Partial<Entry>>(entry: T, seasonClosed: boolean) {
  if (entry.tournament === "RESEARCH_PAPERS") {
    if (!seasonClosed) return blindEntry(entry);
    if (entry.revealAuthorship === false) return blindEntry(entry);
  }
  return { ...entry, blind: false as const };
}
