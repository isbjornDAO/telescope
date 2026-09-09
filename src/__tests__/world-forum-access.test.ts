import {
  audienceFromBody,
  canReadThread,
  distinctPosterCount,
  ownerOf,
  readablePosts,
  readableThreads,
  type WithheldPost,
} from "@/lib/world/forum-access";
import { EVERYONE, serializeAudience, type Audience, type Viewer } from "@/lib/world/audience";

const anchorsOnly = serializeAudience({ kind: "attributes", require: [{ attr: "nodeType", atLeast: "ANCHOR" }] } as Audience);
const nordOnly = serializeAudience({ kind: "attributes", require: [{ attr: "faction", slug: "nord" }] } as Audience);

const anon: Viewer = {};
const node: Viewer = { address: "0xAAA", nodeType: "NODE", factionSlug: "sund" };
const anchor: Viewer = { address: "0xBBB", nodeType: "ANCHOR", factionSlug: "nord" };

function thread(over: Partial<Parameters<typeof canReadThread>[0]> = {}) {
  return { id: "t1", audience: null, ownerAddress: null, ...over };
}

describe("readableThreads", () => {
  const rows = [
    { id: "open", audience: null, ownerAddress: "0xAAA", subject: "hello" },
    { id: "shut", audience: anchorsOnly, ownerAddress: "0xCCC", subject: "secret" },
  ];

  it("drops threads the reader cannot open, rather than listing them locked", () => {
    const seen = readableThreads(rows, null, node).map((t) => t.id);
    expect(seen).toEqual(["open"]);
  });

  it("keeps them for a reader who holds the attribute", () => {
    expect(readableThreads(rows, null, anchor).map((t) => t.id)).toEqual(["open", "shut"]);
  });

  it("never sends ownerAddress to the client", () => {
    for (const t of readableThreads(rows, null, anchor)) {
      expect(t).not.toHaveProperty("ownerAddress");
    }
  });

  it("tells the reader which of the threads are theirs, and only theirs", () => {
    const forAuthor = readableThreads(rows, null, node);
    expect(forAuthor.find((t) => t.id === "open")?.mine).toBe(true);
    const forOther = readableThreads(rows, null, anchor);
    expect(forOther.find((t) => t.id === "open")?.mine).toBe(false);
  });

  it("shows the author their own thread even when they no longer qualify", () => {
    const own = [{ id: "mine", audience: anchorsOnly, ownerAddress: "0xAAA" }];
    expect(readableThreads(own, null, node).map((t) => t.id)).toEqual(["mine"]);
  });

  it("lets a board policy hide every thread beneath it", () => {
    expect(readableThreads(rows, anchorsOnly, anon)).toHaveLength(0);
  });

  it("labels the open case as Anyone and does not mark it", () => {
    const t = readableThreads(rows, null, anchor).find((x) => x.id === "open")!;
    expect(t.audienceLabel).toBe("Anyone");
    expect(t.restricted).toBe(false);
  });
});

describe("readablePosts", () => {
  const posts = [
    { id: "p1", audience: null, walletAddress: "0xAAA", anonymous: true, comment: "hi" },
    { id: "p2", audience: nordOnly, walletAddress: "0xCCC", anonymous: true, comment: "for nord" },
    { id: "p3", audience: null, walletAddress: "0xDDD", anonymous: false, comment: "named" },
  ];

  it("replaces a withheld post with what to prove, and nothing else", () => {
    const out = readablePosts(posts, null, null, node);
    const p2 = out[1] as WithheldPost;
    expect(p2.withheld).toBe(true);
    expect(p2.requirement).toBe("Open to the nord faction.");
    expect(Object.keys(p2).sort()).toEqual(["id", "requirement", "withheld"]);
  });

  it("keeps a post the reader can open", () => {
    const out = readablePosts(posts, null, null, anchor);
    expect(out.every((p) => !("withheld" in p))).toBe(true);
  });

  it("strips the wallet of an anonymous author", () => {
    const out = readablePosts(posts, null, null, anchor) as { id: string; walletAddress: string | null }[];
    expect(out.find((p) => p.id === "p1")!.walletAddress).toBeNull();
  });

  it("keeps the wallet when the author chose to be named", () => {
    const out = readablePosts(posts, null, null, anchor) as { id: string; walletAddress: string | null }[];
    expect(out.find((p) => p.id === "p3")!.walletAddress).toBe("0xDDD");
  });

  it("gives an author back their own wallet on their own anonymous post", () => {
    const out = readablePosts(posts, null, null, node) as { id: string; walletAddress: string | null; mine?: boolean }[];
    const own = out.find((p) => p.id === "p1")!;
    expect(own.walletAddress).toBe("0xAAA");
    expect(own.mine).toBe(true);
  });

  it("withholds everything under a shut thread except the reader's own writing", () => {
    // p1 is this reader's post, so ownership carries it through a thread
    // policy they no longer meet. Everything else goes dark.
    const out = readablePosts(posts, null, anchorsOnly, node);
    expect(out.filter((p) => "withheld" in p).map((p) => p.id)).toEqual(["p2", "p3"]);
    expect(out.find((p) => p.id === "p1")).not.toHaveProperty("withheld");
  });

  it("withholds every post for a reader who owns none of them", () => {
    expect(readablePosts(posts, null, anchorsOnly, anon).every((p) => "withheld" in p)).toBe(true);
  });
});

describe("canReadThread", () => {
  it("ANDs the board policy with the thread policy", () => {
    expect(canReadThread(thread(), anchorsOnly, node).allowed).toBe(false);
    expect(canReadThread(thread({ audience: anchorsOnly }), null, anchor).allowed).toBe(true);
  });

  it("names the missing attribute for the caller to relay", () => {
    expect(canReadThread(thread({ audience: nordOnly }), null, node).missing).toEqual({ attr: "faction", slug: "nord" });
  });
});

describe("ownerOf", () => {
  it("prefers the stored owner", () => {
    expect(ownerOf({ id: "t", ownerAddress: "0xAAA", posts: [{ walletAddress: "0xZZZ" }] })).toBe("0xAAA");
  });

  it("falls back to the opening post for threads written before the column existed", () => {
    expect(ownerOf({ id: "t", posts: [{ walletAddress: "0xZZZ" }] })).toBe("0xZZZ");
  });

  it("copes with a caller that selected no wallet at all", () => {
    expect(ownerOf({ id: "t", posts: [{ comment: "hi" }] })).toBeNull();
    expect(ownerOf({ id: "t" })).toBeNull();
  });
});

describe("distinctPosterCount", () => {
  it("counts people, not posts, and ignores address casing", () => {
    expect(distinctPosterCount([{ walletAddress: "0xAAA" }, { walletAddress: "0xaaa" }, { walletAddress: "0xBBB" }])).toBe(2);
  });
});

describe("audienceFromBody", () => {
  it("defaults to open, so posting with no choice stays one step", () => {
    expect(audienceFromBody({})).toEqual(EVERYONE);
    expect(audienceFromBody(null)).toEqual(EVERYONE);
    expect(audienceFromBody({ audience: { kind: "everyone" } })).toEqual(EVERYONE);
  });

  it("refuses to turn a body into an identity-based rule", () => {
    expect(audienceFromBody({ audience: { kind: "attributes", require: [{ attr: "address", value: "0xAAA" }] } })).toEqual(EVERYONE);
  });

  it("accepts a well-formed attribute rule", () => {
    expect(audienceFromBody({ audience: { kind: "attributes", require: [{ attr: "nodeType", atLeast: "ELDER" }] } })).toEqual({
      kind: "attributes",
      require: [{ attr: "nodeType", atLeast: "ELDER" }],
    });
  });
});
