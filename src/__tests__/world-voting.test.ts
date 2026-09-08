import { describe, expect, it } from "@jest/globals";
import { isSelfVote, tallyBlind, tallyPanel, tallyRound, voterBaseWeight, type BallotPayload } from "@/lib/world/voting";
import { retentionRatio, vestedFraction } from "@/lib/world/retention";

const ballot = (over: Partial<BallotPayload>): BallotPayload => ({
  voterId: "v",
  nodeType: "NODE",
  factionId: null,
  allianceFactionIds: [],
  baseWeight: 1,
  allocations: [{ entryId: "e1", share: 1 }],
  ...over,
});

describe("voter weight (build decisions §3)", () => {
  it("score 0 cannot vote", () => {
    expect(voterBaseWeight(0, "NODE")).toBe(0);
    expect(voterBaseWeight(0, "ELDER")).toBe(0);
  });
  it("Elder ×3, Anchor ×1.5", () => {
    expect(voterBaseWeight(1, "ELDER")).toBe(3);
    expect(voterBaseWeight(1, "ANCHOR")).toBe(1.5);
    expect(voterBaseWeight(0.5, "NODE")).toBe(0.5);
  });
  it("self-vote covers faction and registered alliance", () => {
    const entry = { id: "e", factionId: "f1", allianceFactionIds: ["f2"] };
    expect(isSelfVote({ factionId: "f1", allianceFactionIds: [] }, entry)).toBe(true);
    expect(isSelfVote({ factionId: "f2", allianceFactionIds: [] }, entry)).toBe(true);
    expect(isSelfVote({ factionId: "f3", allianceFactionIds: ["f1"] }, entry)).toBe(true);
    expect(isSelfVote({ factionId: "f3", allianceFactionIds: [] }, entry)).toBe(false);
    expect(isSelfVote({ factionId: null, allianceFactionIds: [] }, entry)).toBe(false);
  });
});

describe("tally and knockouts", () => {
  const entries = [
    { id: "e1", factionId: "f1", allianceFactionIds: [] },
    { id: "e2", factionId: "f2", allianceFactionIds: [] },
    { id: "e3", factionId: null, allianceFactionIds: [] },
  ];

  it("threshold, not rank: everyone above the line advances", () => {
    const r = tallyRound(
      [
        ballot({ voterId: "a", allocations: [{ entryId: "e1", share: 1 }] }),
        ballot({ voterId: "b", allocations: [{ entryId: "e2", share: 1 }] }),
        ballot({ voterId: "c", allocations: [{ entryId: "e3", share: 1 }] }),
      ],
      entries,
      0.2
    );
    expect(r.advanced.sort()).toEqual(["e1", "e2", "e3"]);
    expect(r.fallbackUsed).toBe(false);
  });

  it("a voter spreads weight across up to 3 entries", () => {
    const r = tallyRound(
      [ballot({ allocations: [{ entryId: "e1", share: 2 }, { entryId: "e2", share: 1 }, { entryId: "e3", share: 1 }, { entryId: "e1", share: 5 }] })],
      entries,
      0.05
    );
    expect(r.totalWeight).toBe(1);
    expect(r.perEntry.e1).toBeCloseTo(7 / 9, 3);
  });

  it("faction self-vote counts ×0.5", () => {
    const r = tallyRound(
      [
        ballot({ voterId: "a", factionId: "f1", allocations: [{ entryId: "e1", share: 1 }] }),
        ballot({ voterId: "b", factionId: "f9", allocations: [{ entryId: "e2", share: 1 }] }),
      ],
      entries,
      0.05
    );
    expect(r.perEntry.e1).toBe(0.5);
    expect(r.perEntry.e2).toBe(1);
  });

  it("Elders + Anchors are capped at 40% of the round", () => {
    const r = tallyRound(
      [
        ballot({ voterId: "elder", nodeType: "ELDER", baseWeight: 3, allocations: [{ entryId: "e1", share: 1 }] }),
        ballot({ voterId: "n1", baseWeight: 0.5, allocations: [{ entryId: "e2", share: 1 }] }),
        ballot({ voterId: "n2", baseWeight: 0.5, allocations: [{ entryId: "e2", share: 1 }] }),
      ],
      entries,
      0.05
    );
    expect(r.elderAnchorShare).toBeCloseTo(0.4, 3);
    expect(r.perEntry.e2).toBe(1);
    expect(r.perEntry.e1).toBeCloseTo(2 / 3, 3);
  });

  it("fallback: if fewer than 2 clear a round, the top 2 by weight advance", () => {
    const r = tallyRound(
      [
        ballot({ voterId: "a", baseWeight: 10, allocations: [{ entryId: "e1", share: 1 }] }),
        ballot({ voterId: "b", baseWeight: 1, allocations: [{ entryId: "e2", share: 1 }] }),
        ballot({ voterId: "c", baseWeight: 0.5, allocations: [{ entryId: "e3", share: 1 }] }),
      ],
      entries,
      0.35
    );
    expect(r.advanced).toEqual(["e1", "e2"]);
    expect(r.fallbackUsed).toBe(true);
  });

  it("the final needs a majority and names one Victor", () => {
    const r = tallyRound(
      [
        ballot({ voterId: "a", baseWeight: 2, allocations: [{ entryId: "e1", share: 1 }] }),
        ballot({ voterId: "b", baseWeight: 1, allocations: [{ entryId: "e2", share: 1 }] }),
      ],
      entries.slice(0, 2),
      0.5,
      { isFinal: true }
    );
    expect(r.advanced).toEqual(["e1"]);
  });

  it("zero-weight ballots add nothing", () => {
    const r = tallyRound([ballot({ baseWeight: 0 })], entries, 0.05);
    expect(r.totalWeight).toBe(0);
  });
});

describe("panels and blind review", () => {
  it("Local Systems advances on ≥60% approval", () => {
    expect(tallyPanel([{ approve: true, score: null }, { approve: true, score: null }, { approve: false, score: null }]).advances).toBe(true);
    expect(tallyPanel([{ approve: true, score: null }, { approve: false, score: null }]).advances).toBe(false);
    expect(tallyPanel([{ approve: null, score: null }]).advances).toBe(false);
  });
  it("Research Papers advances on mean ≥7.0 across three criteria", () => {
    expect(tallyBlind([{ advances: 8, rigour: 7, buildable: 6 }, { advances: 7, rigour: 7, buildable: 7 }]).advances).toBe(true);
    expect(tallyBlind([{ advances: 6, rigour: 7, buildable: 7 }]).advances).toBe(false);
    expect(tallyBlind([{ advances: null, rigour: 7, buildable: 7 }]).mean).toBeNull();
  });
});

describe("90-day retention (build decisions §4)", () => {
  it("vests 100% at ≥30%, 0% below 5%, pro-rata between", () => {
    expect(vestedFraction(0.3)).toBe(1);
    expect(vestedFraction(0.5)).toBe(1);
    expect(vestedFraction(0.04)).toBe(0);
    expect(vestedFraction(0.175)).toBe(0.5);
  });
  it("ratio is day 90 ÷ day 0 and zero without a baseline", () => {
    expect(retentionRatio(100, 30)).toBe(0.3);
    expect(retentionRatio(0, 30)).toBe(0);
  });
});
