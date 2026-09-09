import {
  describeAudience,
  describeMissing,
  evaluate,
  isOwner,
  isRestricted,
  parseAudience,
  type Audience,
  type Viewer,
} from "@/lib/world/audience";

/**
 * Applying `audience.ts` to forum rows.
 *
 * Two different treatments, on purpose:
 *
 *  - A thread the reader cannot open is REMOVED from a listing. A board
 *    index is a discovery surface; publishing "there are eleven threads
 *    here you may not read" hands out metadata about private conversations
 *    and buys the reader nothing they can act on.
 *
 *  - A post the reader cannot open, inside a thread they CAN, is kept as a
 *    marker carrying only the attribute that would open it. This is the
 *    paper's point that a refused reader should learn which credential is
 *    required — here the gap in the conversation is already evident, so the
 *    honest thing is to say what the door needs rather than pretend the
 *    room is empty. The marker carries no author, no time, no length.
 */

/** Only ever built server-side. What a client is allowed to know about a withheld post. */
export interface WithheldPost {
  id: string;
  withheld: true;
  /** "Open to Anchors and above." Names an attribute, never a person. */
  requirement: string;
}

export interface AudienceInfo {
  /** "Anyone", "Anchors and above" — safe to show to anyone who can see the row at all. */
  audienceLabel: string;
  /** Whether to mark it in the UI at all. Most rows are open and get no badge. */
  restricted: boolean;
}

interface ThreadRow {
  id: string;
  audience?: unknown;
  ownerAddress?: string | null;
  /**
   * The opening post, when the caller happened to select it. Typed loosely
   * because some callers (trending) deliberately do not select wallets at
   * all. Only used to attribute threads written before `ownerAddress`
   * existed — all of which are open, so nothing turns on it.
   */
  posts?: readonly unknown[];
}

interface PostRow {
  id: string;
  audience?: unknown;
  walletAddress: string;
  anonymous?: boolean;
}

/**
 * The thread's author. New threads carry `ownerAddress`; ones written
 * before policies existed are attributed to whoever wrote the opening post,
 * which is the same person.
 */
function threadOwner(thread: ThreadRow): string | null {
  if (thread.ownerAddress) return thread.ownerAddress;
  const op = thread.posts?.[0];
  if (op && typeof op === "object" && typeof (op as { walletAddress?: unknown }).walletAddress === "string") {
    return (op as { walletAddress: string }).walletAddress;
  }
  return null;
}

/** The same fallback, for callers holding a thread row of their own. */
export function ownerOf(thread: ThreadRow): string | null {
  return threadOwner(thread);
}

/**
 * Keep only the threads this reader may open, and label each one.
 * `boardAudience` is the parent link of the chain and narrows all of them.
 *
 * `ownerAddress` is dropped on the way out. The forum is pseudonymous —
 * posts carry a per-board `posterId`, not a wallet — and a column added to
 * enforce ownership must not become the thing that undoes that. It is used
 * for the decision and then left behind.
 */
export function readableThreads<T extends ThreadRow>(
  threads: T[],
  boardAudience: unknown,
  viewer: Viewer
): (Omit<T, "ownerAddress"> & AudienceInfo & { mine: boolean })[] {
  const board = parseAudience(boardAudience);
  const out: (Omit<T, "ownerAddress"> & AudienceInfo & { mine: boolean })[] = [];
  for (const thread of threads) {
    const audience = parseAudience(thread.audience);
    const owned = isOwner(viewer, threadOwner(thread));
    if (!evaluate([board, audience], viewer, owned).allowed) continue;
    const { ownerAddress: _dropped, ...rest } = thread;
    void _dropped;
    out.push({
      ...(rest as Omit<T, "ownerAddress">),
      audienceLabel: describeAudience(audience),
      restricted: isRestricted(audience),
      // The reader's own threads, so they can be offered the controls for
      // them. True only for the reader being served, so it discloses nothing.
      mine: owned,
    });
  }
  return out;
}

/** Can this reader open this one thread? Used before rendering it, and before writing into it. */
export function canReadThread(thread: ThreadRow, boardAudience: unknown, viewer: Viewer) {
  return evaluate(
    [parseAudience(boardAudience), parseAudience(thread.audience)],
    viewer,
    isOwner(viewer, threadOwner(thread))
  );
}

/**
 * Walk a thread's posts, replacing the ones this reader may not open with a
 * marker. The chain is board AND thread AND post, exactly the order the
 * paper evaluates its example policy in.
 */
export function readablePosts<T extends PostRow>(
  posts: T[],
  boardAudience: unknown,
  threadAudience: unknown,
  viewer: Viewer
): ((Omit<T, "walletAddress"> & AudienceInfo & { walletAddress: string | null; mine: boolean }) | WithheldPost)[] {
  const board = parseAudience(boardAudience);
  const thread = parseAudience(threadAudience);
  return posts.map((post) => {
    const audience = parseAudience(post.audience);
    const owned = isOwner(viewer, post.walletAddress);
    const verdict = evaluate([board, thread, audience], viewer, owned);
    if (!verdict.allowed) {
      return { id: post.id, withheld: true as const, requirement: describeMissing(verdict.missing) };
    }
    const { walletAddress, ...rest } = post;
    return {
      ...(rest as Omit<T, "walletAddress">),
      // A post marked anonymous keeps its wallet on the server. This used
      // to be a client-side decision, which meant "anonymous" was a label
      // over a payload that still carried the address. The author's choice
      // is honoured here or it is not honoured at all.
      walletAddress: post.anonymous === false || owned ? walletAddress : null,
      audienceLabel: describeAudience(audience),
      restricted: isRestricted(audience),
      mine: owned,
    };
  });
}

/**
 * How many distinct people are in a thread, counted server-side.
 *
 * The thread page used to derive this from the wallet addresses it was
 * sent, which only worked because it was sent all of them. Counting here
 * keeps the number and drops the addresses.
 */
export function distinctPosterCount(posts: { walletAddress: string }[]): number {
  return new Set(posts.map((p) => p.walletAddress.toLowerCase())).size;
}

/**
 * Read a policy off a request body.
 *
 * The body is untrusted, so this goes through the same parser as the
 * database: an unknown attribute is dropped rather than honoured, and
 * anything shaped like an identity cannot survive it. An author may set any
 * policy they like — they cannot widen their parents, because evaluation
 * ANDs the chain regardless of what they wrote here.
 */
export function audienceFromBody(body: unknown): Audience {
  if (!body || typeof body !== "object") return { kind: "everyone" };
  return parseAudience((body as { audience?: unknown }).audience);
}
