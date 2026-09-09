/**
 * Who can read this.
 *
 * Implements the access-control concept from Pötzsch & Borcea-Pfitzmann,
 * "Privacy-Respecting Access Control in Collaborative Workspaces" (IFIP
 * AICT 320, 2010), applied to the Telescope forum. Four points from that
 * paper drive every decision in this file:
 *
 *  1. The author sets the policy, not an administrator. An admin keeps the
 *     platform running; that does not make them a reader. See `evaluate`,
 *     which has no admin bypass.
 *  2. A policy names ATTRIBUTES A READER MUST PROVE, never a list of
 *     people. The author of a post is often looking for readers they have
 *     never met, so they cannot enumerate them — and readers have their own
 *     privacy to keep. Nothing in `Requirement` can hold an address or a
 *     handle, and that is the point of the type.
 *  3. Policies exist at every level of the hierarchy — board, thread,
 *     post — and are evaluated as an AND down the chain. A child can narrow
 *     what its parent allows; it can never widen it.
 *  4. Being refused should tell you WHAT TO PROVE, not who is inside.
 *     `evaluate` returns the unmet requirement so the reader learns the
 *     door exists and how to open it, and learns nothing about the room.
 *
 * Everything here is pure. The API layer is what actually withholds rows —
 * see `src/app/api/forum/**`. The client is never trusted with this.
 */

export type NodeType = "NODE" | "ANCHOR" | "ELDER";

/**
 * One thing a reader must prove. Deliberately a closed set: every variant
 * is an attribute the world already certifies, and none of them can name a
 * person. Adding a variant that carries an address or handle would break
 * the guarantee the whole file exists to make.
 */
export type Requirement =
  | { attr: "nodeType"; atLeast: NodeType }
  | { attr: "faction"; slug: string }
  | { attr: "region"; slug: string }
  | { attr: "crew"; slug: string };

/** A resource's policy. `everyone` is the default and the common case. */
export type Audience =
  | { kind: "everyone" }
  | { kind: "attributes"; require: Requirement[] };

export const EVERYONE: Audience = { kind: "everyone" };

/**
 * What a reader can prove, assembled server-side from their session. This
 * is the reader's side of the transaction: a bundle of attributes, with an
 * address used only to recognise ownership of their own writing.
 */
export interface Viewer {
  address?: string | null;
  nodeType?: NodeType | null;
  factionSlug?: string | null;
  regionSlug?: string | null;
  crewSlugs?: string[] | null;
}

const RANK: Record<NodeType, number> = { NODE: 0, ANCHOR: 1, ELDER: 2 };

/** Attribute names, in the order a reader is asked to satisfy them. */
const ATTR_ORDER: Requirement["attr"][] = ["nodeType", "faction", "region", "crew"];

/* ─────────────────────────── parsing ─────────────────────────── */

function isNodeType(v: unknown): v is NodeType {
  return v === "NODE" || v === "ANCHOR" || v === "ELDER";
}

function parseRequirement(raw: unknown): Requirement | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.attr === "nodeType" && isNodeType(r.atLeast)) return { attr: "nodeType", atLeast: r.atLeast };
  if ((r.attr === "faction" || r.attr === "region" || r.attr === "crew") && typeof r.slug === "string" && r.slug.length > 0) {
    return { attr: r.attr, slug: r.slug };
  }
  return null;
}

/**
 * Read a policy off a database row. Anything unrecognised — a null column
 * on a row written before policies existed, a malformed value, a shape
 * from a newer version — reads as `everyone`.
 *
 * Failing open is the right default HERE and only here: this is a public
 * forum whose baseline is public, so an unreadable policy must not silently
 * hide a conversation that was never meant to be private. It is not a
 * licence to fail open anywhere a policy is actually set: a policy that
 * parses to at least one requirement is enforced exactly as written, and a
 * requirement that does not parse is dropped from the list rather than
 * quietly satisfied.
 */
export function parseAudience(raw: unknown): Audience {
  if (!raw || typeof raw !== "object") return EVERYONE;
  const a = raw as Record<string, unknown>;
  if (a.kind !== "attributes" || !Array.isArray(a.require)) return EVERYONE;
  const require = a.require.map(parseRequirement).filter((r): r is Requirement => r !== null);
  if (require.length === 0) return EVERYONE;
  return { kind: "attributes", require: dedupe(require) };
}

/**
 * One requirement per attribute, keeping the strictest. Two node-type
 * requirements on one policy are not an error, they are a narrower policy,
 * so `ANCHOR` and `ELDER` collapse to `ELDER`. Two different factions,
 * though, are unsatisfiable by anyone — a reader has one faction — so the
 * later one replaces the earlier rather than making the post unreadable.
 */
function dedupe(require: Requirement[]): Requirement[] {
  const byAttr = new Map<Requirement["attr"], Requirement>();
  for (const r of require) {
    const existing = byAttr.get(r.attr);
    if (existing && existing.attr === "nodeType" && r.attr === "nodeType") {
      byAttr.set(r.attr, RANK[r.atLeast] > RANK[existing.atLeast] ? r : existing);
    } else {
      byAttr.set(r.attr, r);
    }
  }
  return ATTR_ORDER.filter((a) => byAttr.has(a)).map((a) => byAttr.get(a)!);
}

/** What goes into the database. `everyone` stores as null, so the common case costs nothing. */
export function serializeAudience(a: Audience): unknown {
  return a.kind === "everyone" ? null : { kind: "attributes", require: a.require };
}

/* ────────────────────────── evaluation ────────────────────────── */

/** Does this reader hold this one attribute? */
export function holds(viewer: Viewer, req: Requirement): boolean {
  switch (req.attr) {
    case "nodeType": {
      const have = viewer.nodeType;
      if (!have) return false;
      return RANK[have] >= RANK[req.atLeast];
    }
    case "faction":
      return viewer.factionSlug === req.slug;
    case "region":
      return viewer.regionSlug === req.slug;
    case "crew":
      return (viewer.crewSlugs ?? []).includes(req.slug);
  }
}

export interface Verdict {
  allowed: boolean;
  /** The first requirement the reader does not meet, for telling them what to prove. */
  missing: Requirement | null;
}

const ALLOWED: Verdict = { allowed: true, missing: null };

/**
 * Evaluate a whole chain — board, then thread, then post — as an AND, the
 * way the paper walks its Table 1 from forum down to post.
 *
 * `owned` short-circuits the chain: the owner of a resource always has
 * access to it. That is the paper's rule and it is also the only humane
 * one — you must be able to read your own writing even if you later
 * narrowed the audience past yourself, or moved factions.
 *
 * There is no administrator bypass. An admin who needs to read a withheld
 * post has to hold the attribute like anyone else.
 */
export function evaluate(chain: (Audience | null | undefined)[], viewer: Viewer, owned = false): Verdict {
  if (owned) return ALLOWED;
  for (const link of chain) {
    const audience = link ?? EVERYONE;
    if (audience.kind === "everyone") continue;
    for (const req of audience.require) {
      if (!holds(viewer, req)) return { allowed: false, missing: req };
    }
  }
  return ALLOWED;
}

/** True when this address wrote the thing. Case-insensitive: addresses arrive in mixed case. */
export function isOwner(viewer: Viewer, ownerAddress?: string | null): boolean {
  if (!viewer.address || !ownerAddress) return false;
  return viewer.address.toLowerCase() === ownerAddress.toLowerCase();
}

/* ─────────────────────────── wording ─────────────────────────── */

const NODE_WORD: Record<NodeType, string> = { NODE: "Nodes", ANCHOR: "Anchors", ELDER: "Elders" };

/** How one requirement reads to a person. Slugs are shown as written; they name groups, not people. */
export function describeRequirement(req: Requirement): string {
  switch (req.attr) {
    case "nodeType":
      return req.atLeast === "NODE" ? "anyone signed in" : `${NODE_WORD[req.atLeast]} and above`;
    case "faction":
      return `the ${req.slug} faction`;
    case "region":
      return `the ${req.slug} region`;
    case "crew":
      return `the ${req.slug} crew`;
  }
}

/** A short label for the audience, for the line under a thread. */
export function describeAudience(a: Audience): string {
  if (a.kind === "everyone") return "Anyone";
  return a.require.map(describeRequirement).join(" · ");
}

/**
 * What to show someone who was refused. It names the attribute and nothing
 * else — not the author, not the other readers, not how many there are.
 */
export function describeMissing(missing: Requirement | null): string {
  if (!missing) return "This is not open to you.";
  return `Open to ${describeRequirement(missing)}.`;
}

/** Is this policy narrower than the wide-open default? Drives whether the UI marks a thread at all. */
export function isRestricted(a: Audience): boolean {
  return a.kind === "attributes" && a.require.length > 0;
}
