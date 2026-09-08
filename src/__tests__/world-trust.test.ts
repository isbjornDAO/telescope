import { describe, expect, it } from "@jest/globals";
import {
  canAffordVouch,
  computeTrustScores,
  decayStanding,
  slashPenalties,
  trustBand,
  vouchBudget,
} from "@/lib/world/trust";

describe("trust score (build decisions §1)", () => {
  it("anchors and elders are the only sources", () => {
    const r = computeTrustScores(
      [
        { id: "a", nodeType: "ANCHOR", standing: 0 },
        { id: "e", nodeType: "ELDER", standing: 0 },
        { id: "n", nodeType: "NODE", standing: 0 },
      ],
      []
    );
    expect(r.get("a")!.score).toBe(1);
    expect(r.get("e")!.score).toBe(1);
    expect(r.get("n")!.score).toBe(0);
  });

  it("an in-person vouch from an anchor gives 0.5 (weight 1.0 × decay 0.5)", () => {
    const r = computeTrustScores(
      [
        { id: "a", nodeType: "ANCHOR", standing: 0 },
        { id: "n", nodeType: "NODE", standing: 0 },
      ],
      [{ fromId: "a", toId: "n", weight: 1.0 }]
    );
    expect(r.get("n")!.score).toBe(0.5);
  });

  it("decays per hop: anchor → n1 → n2 gives 0.25 at two hops", () => {
    const r = computeTrustScores(
      [
        { id: "a", nodeType: "ANCHOR", standing: 0 },
        { id: "n1", nodeType: "NODE", standing: 0 },
        { id: "n2", nodeType: "NODE", standing: 0 },
      ],
      [
        { fromId: "a", toId: "n1", weight: 1.0 },
        { fromId: "n1", toId: "n2", weight: 1.0 },
      ]
    );
    expect(r.get("n1")!.score).toBe(0.5);
    expect(r.get("n2")!.score).toBe(0.25);
  });

  it("a sybil ring with no path to a source stays at zero", () => {
    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `s${i}`, nodeType: "NODE" as const, standing: 0 }));
    const links = nodes.map((n, i) => ({ fromId: n.id, toId: `s${(i + 1) % 50}`, weight: 1.0 }));
    const r = computeTrustScores(nodes, links);
    for (const n of nodes) expect(r.get(n.id)!.score).toBe(0);
  });

  it("path score caps at 1.0 and standing adds up to +0.5", () => {
    const anchors = Array.from({ length: 5 }, (_, i) => ({ id: `a${i}`, nodeType: "ANCHOR" as const, standing: 0 }));
    const r = computeTrustScores(
      [...anchors, { id: "n", nodeType: "NODE", standing: 0.9 }],
      anchors.map((a) => ({ fromId: a.id, toId: "n", weight: 1.0 }))
    );
    expect(r.get("n")!.pathScore).toBe(1);
    expect(r.get("n")!.score).toBe(1.5);
  });

  it("shared-vision links are lighter than in-person", () => {
    const r = computeTrustScores(
      [
        { id: "a", nodeType: "ANCHOR", standing: 0 },
        { id: "n", nodeType: "NODE", standing: 0 },
      ],
      [{ fromId: "a", toId: "n", weight: 0.3 }]
    );
    expect(r.get("n")!.score).toBe(0.15);
  });
});

describe("vouch budget and stake", () => {
  it("budget is score × 5", () => {
    expect(vouchBudget(1)).toBe(5);
    expect(vouchBudget(0.5)).toBe(2.5);
    expect(vouchBudget(0)).toBe(0);
  });

  it("cannot vouch beyond the budget", () => {
    expect(canAffordVouch(0.2, 0, "IN_PERSON")).toBe(true); // budget 1.0
    expect(canAffordVouch(0.2, 0.5, "IN_PERSON")).toBe(false);
    expect(canAffordVouch(0.2, 0.5, "SHARED_VISION")).toBe(true);
    expect(canAffordVouch(0, 0, "SHARED_VISION")).toBe(false);
  });

  it("standing decays 25% per season", () => {
    expect(decayStanding(0.4)).toBe(0.3);
  });

  it("slashing costs vouchers 20% of what they staked", () => {
    const p = slashPenalties([
      { fromId: "x", weight: 1.0 },
      { fromId: "x", weight: 0.3 },
      { fromId: "y", weight: 0.8 },
    ]);
    expect(p.get("x")).toBe(0.26);
    expect(p.get("y")).toBe(0.16);
  });

  it("bands never leak the raw score", () => {
    expect(trustBand(0)).toBe("none");
    expect(trustBand(0.2)).toBe("thin");
    expect(trustBand(0.7)).toBe("firm");
    expect(trustBand(1.2)).toBe("thick");
  });
});
