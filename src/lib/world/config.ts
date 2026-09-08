/**
 * Telescope world tunables.
 *
 * Every number from docs/build-decisions.md lives here and nowhere else.
 * Numbers marked "starting value" are revisited after Season One (§6).
 * Anything marked (proposal) in the world rules ships behind a flag in
 * `proposals` below.
 */

export const WORLD_VERSION = "0.1";

export const TRUST = {
  /** §1 Node types and base score */
  baseScore: { NODE: 0, ANCHOR: 1.0, ELDER: 1.0 } as const,
  /** §1 Link weights */
  linkWeight: { IN_PERSON: 1.0, SHIPPED_TOGETHER: 0.8, SHARED_VISION: 0.3 } as const,
  /** §1 Decay per hop */
  decayPerHop: 0.5,
  /** §1 Iterations over the graph per recompute */
  iterations: 3,
  /** §1 Path score is capped at 1.0 before standing is added */
  maxPathScore: 1.0,
  /** §1 Standing adds up to +0.5 (max score 1.5) */
  standingCap: 0.5,
  /** §1 Standing decays 25% per season if not renewed */
  standingDecayPerSeason: 0.25,
  /** §1 Vouch budget per season = score × 5 */
  vouchBudgetMultiplier: 5,
  /** §1 Vouchers lose standing equal to 20% of the weight they staked */
  slashVoucherPenalty: 0.2,
  /** §1 Slashing needs a finding by ≥3 Elders + the region's anchors */
  slashMinElders: 3,
  /** Elder admission: approvals needed from existing Elders / region anchors */
  elderAdmissionApprovals: 3,
} as const;

export const SCOUT = {
  /** §2 Default scout budget: 200 QUERYs per season, free */
  defaultQueriesPerSeason: 200,
  /** §2 Rate limit: 50 QUERYs/day */
  dailyQueryLimit: 50,
  /** §2 QUERY logs retained 30 days for abuse detection */
  logRetentionDays: 30,
  /** An OFFER a human has not answered expires after this many days */
  matchExpiryDays: 14,
  /** Minimum fit score for the hosted scout to raise an OFFER */
  offerThreshold: 0.35,
  /** Candidates queried per intent per run (each costs one QUERY) */
  candidatesPerRun: 10,
  /** MVP pricing above the default budget: USDC on C-Chain per QUERY */
  usdcPerQuery: 0.05,
  /** Avalanche C-Chain USDC */
  usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
} as const;

export const VOTING = {
  /** §3 Elder ×3, Anchor ×1.5 */
  elderMultiplier: 3,
  anchorMultiplier: 1.5,
  /** §3 Elders + Anchors combined capped at 40% of any round's total weight */
  elderAnchorCap: 0.4,
  /** §3 Faction self-vote ×0.5 (same faction or registered alliance) */
  selfVoteMultiplier: 0.5,
  /** §3 A voter spreads weight across up to 3 entries per round */
  maxAllocationsPerBallot: 3,
  /** §3 GTM bracket: threshold as a share of total weighted votes cast */
  gtmRounds: [
    { index: 0, name: "Open", threshold: 0.05, target: 16 },
    { index: 1, name: "Round of 16", threshold: 0.12, target: 8 },
    { index: 2, name: "Quarters", threshold: 0.2, target: 4 },
    { index: 3, name: "Semis", threshold: 0.35, target: 2 },
    { index: 4, name: "Final", threshold: 0.5, target: 1 },
  ] as const,
  /** §3 Fallback: if fewer than 2 clear a round, the top 2 by weight advance */
  fallbackAdvance: 2,
  /** §3 Local Systems panel */
  localSystems: { panelMin: 9, panelMax: 15, approvalThreshold: 0.6 },
  /** §3 Research Papers blind review */
  researchPapers: { reviewersPerPaper: 3, finalReviewers: 5, advanceMean: 7.0 },
} as const;

export const RETENTION = {
  /** §4 Day 90 = vesting check */
  windowDays: 90,
  /** §4 Active user: ≥1 meaningful tx in the trailing 30 days */
  trailingDays: 30,
  /** §4 Standing vests 100% at retention ≥30%, pro-rata below, 0% below 5% */
  fullVestAt: 0.3,
  zeroVestBelow: 0.05,
} as const;

export const SEASON = {
  /** Two seasons a year, six weeks each */
  perYear: 2,
  weeks: 6,
  /** Submissions close at the end of week 4 (start of week 5) */
  submissionsCloseWeek: 5,
  /** Voting rounds and panel review run through weeks 5–6 */
  votingWeeks: 2,
} as const;

/**
 * Standing awards per result. Not fixed in build decisions v0.1; these are
 * starting values chosen so a Victor gets the largest allocation and the
 * three-season arc compounds. Standing is capped by TRUST.standingCap.
 */
export const STANDING_AWARDS = {
  GTM: { victor: 0.5, finalist: 0.25, semifinalist: 0.1 },
  LOCAL_SYSTEMS: { winner: 0.3, finalist: 0.15 },
  RESEARCH_PAPERS: { winner: 0.3, finalist: 0.15 },
} as const;

/** Share of the season pool per result. Starting values. */
export const POOL_SPLIT = {
  GTM: { victor: 0.4, finalist: 0.2 },
  LOCAL_SYSTEMS: { winner: 0.15, finalist: 0.05 },
  RESEARCH_PAPERS: { winner: 0.15, finalist: 0.05 },
} as const;

/** Everything marked (proposal) in the world rules, behind a flag. */
export const PROPOSALS = {
  /** Alliances cannot pool for GTM */
  alliancesCannotPoolGtm: true,
  /** Regions run Iggy L1 nodes */
  regionsRunNodes: false,
  /** Isbjorn seeds the first Elders with Team1 */
  isbjornSeedsElders: true,
  /** The Victor is nominated for Avalanche Foundation programmes */
  victorNominated: true,
  /** Isbjorn ships a default scout */
  defaultScout: true,
  /** Alliances may span more than two factions */
  alliancesBeyondTwo: true,
} as const;

/** Naming and theme layer. All proposals. */
export const THEME = {
  seasonPrefix: "Winter",
  clusterWord: "floe",
  standingWord: "weight",
  bear: "Iggy",
} as const;

export function seasonDisplayName(number: number, name?: string | null) {
  if (name) return name;
  return `${THEME.seasonPrefix} ${toRoman(number)}`;
}

export function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = Math.max(1, Math.floor(n));
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
}
