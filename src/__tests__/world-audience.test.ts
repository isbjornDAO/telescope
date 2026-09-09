import {
  EVERYONE,
  describeAudience,
  describeMissing,
  evaluate,
  holds,
  isOwner,
  isRestricted,
  parseAudience,
  serializeAudience,
  type Audience,
  type Viewer,
} from "@/lib/world/audience";

const anon: Viewer = {};
const node: Viewer = { address: "0xAAA", nodeType: "NODE", factionSlug: "nord", regionSlug: "oslo", crewSlugs: ["floe"] };
const anchor: Viewer = { address: "0xBBB", nodeType: "ANCHOR", factionSlug: "sund", regionSlug: "bergen", crewSlugs: [] };
const elder: Viewer = { address: "0xCCC", nodeType: "ELDER", factionSlug: "nord", regionSlug: "oslo", crewSlugs: ["floe", "drift"] };

const anchorsOnly: Audience = { kind: "attributes", require: [{ attr: "nodeType", atLeast: "ANCHOR" }] };
const nordOnly: Audience = { kind: "attributes", require: [{ attr: "faction", slug: "nord" }] };

describe("holds", () => {
  it("treats node type as a floor, not an equality", () => {
    expect(holds(elder, { attr: "nodeType", atLeast: "ANCHOR" })).toBe(true);
    expect(holds(anchor, { attr: "nodeType", atLeast: "ANCHOR" })).toBe(true);
    expect(holds(node, { attr: "nodeType", atLeast: "ANCHOR" })).toBe(false);
  });

  it("refuses a reader who cannot prove anything", () => {
    expect(holds(anon, { attr: "nodeType", atLeast: "NODE" })).toBe(false);
    expect(holds(anon, { attr: "faction", slug: "nord" })).toBe(false);
  });

  it("matches faction, region and crew exactly", () => {
    expect(holds(node, { attr: "faction", slug: "nord" })).toBe(true);
    expect(holds(node, { attr: "faction", slug: "sund" })).toBe(false);
    expect(holds(node, { attr: "region", slug: "oslo" })).toBe(true);
    expect(holds(elder, { attr: "crew", slug: "drift" })).toBe(true);
    expect(holds(anchor, { attr: "crew", slug: "drift" })).toBe(false);
  });
});

describe("evaluate", () => {
  it("lets everyone through an open chain", () => {
    expect(evaluate([EVERYONE, EVERYONE, EVERYONE], anon).allowed).toBe(true);
    expect(evaluate([null, undefined, null], anon).allowed).toBe(true);
  });

  it("ANDs down the hierarchy, so a parent narrows every child", () => {
    // Board is Anchors-only; the thread and post are open. A Node is still out.
    expect(evaluate([anchorsOnly, EVERYONE, EVERYONE], node).allowed).toBe(false);
    expect(evaluate([anchorsOnly, EVERYONE, EVERYONE], anchor).allowed).toBe(true);
  });

  it("cannot be widened by a child", () => {
    // An open post inside an Anchors-only thread stays shut to a Node.
    const v = evaluate([EVERYONE, anchorsOnly, EVERYONE], node);
    expect(v.allowed).toBe(false);
    expect(v.missing).toEqual({ attr: "nodeType", atLeast: "ANCHOR" });
  });

  it("requires every attribute in a policy", () => {
    const both: Audience = { kind: "attributes", require: [{ attr: "nodeType", atLeast: "ANCHOR" }, { attr: "faction", slug: "nord" }] };
    expect(evaluate([both], elder).allowed).toBe(true); // ELDER + nord
    expect(evaluate([both], anchor).allowed).toBe(false); // ANCHOR but sund
    expect(evaluate([both], node).allowed).toBe(false); // nord but only NODE
  });

  it("reports the first unmet requirement so the reader learns what to prove", () => {
    const v = evaluate([nordOnly], anchor);
    expect(v.allowed).toBe(false);
    expect(v.missing).toEqual({ attr: "faction", slug: "nord" });
    expect(describeMissing(v.missing)).toBe("Open to the nord faction.");
  });

  it("always lets the owner read their own writing, however narrow the policy", () => {
    // The author moved factions after posting; they can still read it.
    expect(evaluate([nordOnly, anchorsOnly], anchor, true).allowed).toBe(true);
  });

  it("gives an administrator no way in", () => {
    // There is no admin flag on Viewer by design. An admin is evaluated as
    // whatever they can prove, exactly like everyone else.
    const admin: Viewer = { address: "0xADMIN", nodeType: "NODE" };
    expect(evaluate([anchorsOnly], admin).allowed).toBe(false);
  });
});

describe("isOwner", () => {
  it("compares addresses case-insensitively", () => {
    expect(isOwner({ address: "0xaaa" }, "0xAAA")).toBe(true);
    expect(isOwner({ address: "0xaaa" }, "0xbbb")).toBe(false);
  });

  it("is false when either side is missing", () => {
    expect(isOwner({}, "0xAAA")).toBe(false);
    expect(isOwner({ address: "0xAAA" }, null)).toBe(false);
  });
});

describe("parseAudience", () => {
  it("reads a null or unrecognised column as open", () => {
    expect(parseAudience(null)).toEqual(EVERYONE);
    expect(parseAudience(undefined)).toEqual(EVERYONE);
    expect(parseAudience("nonsense")).toEqual(EVERYONE);
    expect(parseAudience({ kind: "attributes" })).toEqual(EVERYONE);
    expect(parseAudience({ kind: "attributes", require: [] })).toEqual(EVERYONE);
  });

  it("drops a malformed requirement instead of satisfying it", () => {
    const a = parseAudience({ kind: "attributes", require: [{ attr: "nodeType", atLeast: "WIZARD" }, { attr: "faction", slug: "nord" }] });
    expect(a).toEqual({ kind: "attributes", require: [{ attr: "faction", slug: "nord" }] });
  });

  it("never lets an address or handle become a requirement", () => {
    const a = parseAudience({ kind: "attributes", require: [{ attr: "address", value: "0xAAA" }, { attr: "handle", value: "bear" }] });
    expect(a).toEqual(EVERYONE);
  });

  it("keeps the strictest of two node-type requirements", () => {
    const a = parseAudience({
      kind: "attributes",
      require: [{ attr: "nodeType", atLeast: "ANCHOR" }, { attr: "nodeType", atLeast: "ELDER" }],
    });
    expect(a).toEqual({ kind: "attributes", require: [{ attr: "nodeType", atLeast: "ELDER" }] });
  });

  it("survives a round trip through the database shape", () => {
    const a: Audience = { kind: "attributes", require: [{ attr: "nodeType", atLeast: "ANCHOR" }, { attr: "crew", slug: "floe" }] };
    expect(parseAudience(serializeAudience(a))).toEqual(a);
    expect(serializeAudience(EVERYONE)).toBeNull();
  });
});

describe("wording", () => {
  it("names the attribute and never a person", () => {
    expect(describeAudience(EVERYONE)).toBe("Anyone");
    expect(describeAudience(anchorsOnly)).toBe("Anchors and above");
    expect(describeAudience(nordOnly)).toBe("the nord faction");
    expect(describeMissing(null)).toBe("This is not open to you.");
  });

  it("reads a signed-in floor plainly", () => {
    expect(describeAudience({ kind: "attributes", require: [{ attr: "nodeType", atLeast: "NODE" }] })).toBe("anyone signed in");
  });

  it("marks only narrowed policies", () => {
    expect(isRestricted(EVERYONE)).toBe(false);
    expect(isRestricted(anchorsOnly)).toBe(true);
  });
});
