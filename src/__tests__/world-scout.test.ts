import { describe, expect, it } from "@jest/globals";
import { budgetFor, fitScore, todayKey } from "@/lib/world/scout";
import { SCOUT } from "@/lib/world/config";
import { decryptJson, encryptJson, voterKey } from "@/lib/world/crypto";

const baseUser = {
  id: "u",
  address: "0x0",
  scoutQueriesUsed: 0,
  scoutQueriesSeasonNumber: 1,
  scoutDailyUsed: 0,
  scoutDailyDate: null as string | null,
  scoutExtraQueries: 0,
};

describe("scout budget (build decisions §2)", () => {
  it("defaults to 200 per season and 50 per day", () => {
    const b = budgetFor(baseUser as never, 1);
    expect(b.perSeason).toBe(SCOUT.defaultQueriesPerSeason);
    expect(b.remaining).toBe(200);
    expect(b.dailyRemaining).toBe(50);
  });
  it("resets when the season changes and counts purchased capacity", () => {
    const b = budgetFor({ ...baseUser, scoutQueriesUsed: 150, scoutQueriesSeasonNumber: 0, scoutExtraQueries: 40 } as never, 1);
    expect(b.used).toBe(0);
    expect(b.remaining).toBe(240);
  });
  it("daily limit applies only to today", () => {
    const today = budgetFor({ ...baseUser, scoutDailyUsed: 50, scoutDailyDate: todayKey() } as never, 1);
    expect(today.dailyRemaining).toBe(0);
    const stale = budgetFor({ ...baseUser, scoutDailyUsed: 50, scoutDailyDate: "2000-01-01" } as never, 1);
    expect(stale.dailyRemaining).toBe(50);
  });
});

describe("scout fit", () => {
  const a = { type: "ROLE" as const, tags: ["solidity", "zk"], text: "Need a Solidity dev who knows zero knowledge circuits", constraints: null, regionSlug: "lagos" };
  it("only matches the same intent type", () => {
    expect(fitScore(a, { type: "PARTNER_PROJECT", tags: ["solidity"], text: "", trustScore: 1, regionSlug: null })).toBe(0);
  });
  it("rewards shared tags and trust", () => {
    const strong = fitScore(a, { type: "ROLE", tags: ["solidity", "zk"], text: "Solidity and zero knowledge", trustScore: 1, regionSlug: "nairobi" });
    const weak = fitScore(a, { type: "ROLE", tags: ["design"], text: "Figma", trustScore: 0, regionSlug: null });
    expect(strong).toBeGreaterThan(SCOUT.offerThreshold);
    expect(weak).toBeLessThan(SCOUT.offerThreshold);
  });
  it("honours minTrust and region constraints", () => {
    const c = { ...a, constraints: { minTrust: 0.5 } };
    expect(fitScore(c, { type: "ROLE", tags: ["solidity"], text: "", trustScore: 0.2, regionSlug: null })).toBe(0);
    const r = { ...a, constraints: { regionSlug: "lagos" } };
    expect(fitScore(r, { type: "ROLE", tags: ["solidity"], text: "", trustScore: 1, regionSlug: "nairobi" })).toBe(0);
  });
  it("region adoption prefers a different region", () => {
    const adopt = { type: "REGION_ADOPT" as const, tags: ["records"], text: "land records on chain", constraints: null, regionSlug: "lagos" };
    const other = fitScore(adopt, { type: "REGION_ADOPT", tags: ["records"], text: "land records on chain", trustScore: 1, regionSlug: "nairobi" });
    const same = fitScore(adopt, { type: "REGION_ADOPT", tags: ["records"], text: "land records on chain", trustScore: 1, regionSlug: "lagos" });
    expect(other).toBeGreaterThan(same);
  });
});

describe("crypto at rest", () => {
  it("round-trips a ballot and never stores the voter in the clear", () => {
    const payload = { voterId: "secret", allocations: [{ entryId: "e1", share: 1 }] };
    const ct = encryptJson(payload);
    expect(ct).not.toContain("secret");
    expect(decryptJson(ct)).toEqual(payload);
  });
  it("voter keys are stable per round and differ across rounds", () => {
    expect(voterKey("r1", "v1")).toBe(voterKey("r1", "v1"));
    expect(voterKey("r1", "v1")).not.toBe(voterKey("r2", "v1"));
  });
});
