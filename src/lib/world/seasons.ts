import { prisma } from "@/lib/prisma";
import {
  EntryStatus,
  RoundStatus,
  SeasonStatus,
  StandingTarget,
  Tournament,
  type Entry,
  type Round,
  type Season,
} from "@prisma/client";
import { POOL_SPLIT, SEASON, STANDING_AWARDS, TRUST, VOTING, seasonDisplayName } from "@/lib/world/config";
import { decryptJson, sha256Hex } from "@/lib/world/crypto";
import { retentionRatio, vestedFraction, vestingDate } from "@/lib/world/retention";
import { round4 } from "@/lib/world/trust";
import { applySeasonStandingDecay } from "@/lib/world/trust-db";
import { tallyBlind, tallyPanel, tallyRound, type BallotPayload, type EntryMeta } from "@/lib/world/voting";

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/** The season the world is in: ACTIVE or VOTING first, else the next UPCOMING, else the latest. */
export async function getCurrentSeason(): Promise<Season | null> {
  const live = await prisma.season.findFirst({
    where: { status: { in: [SeasonStatus.ACTIVE, SeasonStatus.VOTING] } },
    orderBy: { number: "desc" },
  });
  if (live) return live;
  const upcoming = await prisma.season.findFirst({ where: { status: SeasonStatus.UPCOMING }, orderBy: { startsAt: "asc" } });
  if (upcoming) return upcoming;
  return prisma.season.findFirst({ orderBy: { number: "desc" } });
}

export function seasonWeek(season: Pick<Season, "startsAt" | "endsAt">, now = new Date()): number {
  if (now < season.startsAt) return -1;
  return Math.min(SEASON.weeks, Math.floor((now.getTime() - season.startsAt.getTime()) / WEEK));
}

export type SeasonPhase = "upcoming" | "building" | "voting" | "closed" | "vested";

export function seasonPhase(season: Pick<Season, "status" | "startsAt" | "submissionsClose" | "endsAt">, now = new Date()): SeasonPhase {
  if (season.status === SeasonStatus.VESTED) return "vested";
  if (season.status === SeasonStatus.CLOSED || now >= season.endsAt) return "closed";
  if (now < season.startsAt) return "upcoming";
  if (now < season.submissionsClose) return "building";
  return "voting";
}

export function submissionsOpen(season: Pick<Season, "status" | "startsAt" | "submissionsClose" | "endsAt">, now = new Date()) {
  return seasonPhase(season, now) === "building";
}

/** Standard six-week timeline from a start date. */
export function seasonDates(startsAt: Date) {
  const submissionsClose = new Date(startsAt.getTime() + (SEASON.submissionsCloseWeek - 1) * WEEK);
  const endsAt = new Date(startsAt.getTime() + SEASON.weeks * WEEK);
  return { startsAt, submissionsClose, endsAt, retentionCheckAt: vestingDate(endsAt) };
}

/** GTM rounds share weeks 5–6 evenly; LS and RP get a round and a final. */
export function roundSchedule(season: Pick<Season, "submissionsClose" | "endsAt">) {
  const span = season.endsAt.getTime() - season.submissionsClose.getTime();
  const gtm = VOTING.gtmRounds.map((r, i, arr) => ({
    tournament: Tournament.GTM,
    index: r.index,
    name: r.name,
    threshold: r.threshold,
    opensAt: new Date(season.submissionsClose.getTime() + (span * i) / arr.length),
    closesAt: new Date(season.submissionsClose.getTime() + (span * (i + 1)) / arr.length),
  }));
  const half = new Date(season.submissionsClose.getTime() + span / 2);
  const panel = (t: Tournament, threshold: number) => [
    { tournament: t, index: 0, name: "Review", threshold, opensAt: season.submissionsClose, closesAt: half },
    { tournament: t, index: 1, name: "Final", threshold, opensAt: half, closesAt: season.endsAt },
  ];
  return [
    ...gtm,
    ...panel(Tournament.LOCAL_SYSTEMS, VOTING.localSystems.approvalThreshold),
    ...panel(Tournament.RESEARCH_PAPERS, VOTING.researchPapers.advanceMean / 10),
  ];
}

export async function createSeason(input: {
  number?: number;
  name?: string;
  theme: string;
  researchQuestion: string;
  startsAt: Date;
  poolAmount?: number;
  sponsors?: string[];
  panelIds?: string[];
  reviewerPoolIds?: string[];
}) {
  const last = await prisma.season.findFirst({ orderBy: { number: "desc" } });
  const number = input.number ?? (last ? last.number + 1 : 1);
  const dates = seasonDates(input.startsAt);
  const season = await prisma.season.create({
    data: {
      number,
      name: seasonDisplayName(number, input.name),
      theme: input.theme,
      researchQuestion: input.researchQuestion,
      ...dates,
      poolAmount: input.poolAmount ?? 0,
      sponsors: input.sponsors ?? [],
      panelIds: input.panelIds ?? [],
      reviewerPoolIds: input.reviewerPoolIds ?? [],
      status: SeasonStatus.UPCOMING,
    },
  });
  await prisma.round.createMany({ data: roundSchedule(season).map((r) => ({ ...r, seasonId: season.id })) });
  return season;
}

/**
 * Season tick (cron): move seasons through UPCOMING → ACTIVE → VOTING →
 * CLOSED by date, apply standing decay once at season start, open rounds
 * whose window has begun, close rounds whose window has ended.
 */
export async function tickSeasons(now = new Date()) {
  const seasons = await prisma.season.findMany({ where: { status: { not: SeasonStatus.VESTED } } });
  const log: string[] = [];
  for (const s of seasons) {
    if (s.status === SeasonStatus.UPCOMING && now >= s.startsAt) {
      await prisma.season.update({ where: { id: s.id }, data: { status: SeasonStatus.ACTIVE } });
      const decay = await applySeasonStandingDecay(s.number);
      log.push(`season ${s.number} → ACTIVE (decay applied: ${decay.applied})`);
    }
    if ((s.status === SeasonStatus.ACTIVE || s.status === SeasonStatus.UPCOMING) && now >= s.submissionsClose && now < s.endsAt) {
      await prisma.season.update({ where: { id: s.id }, data: { status: SeasonStatus.VOTING } });
      await prisma.entry.updateMany({
        where: { seasonId: s.id, status: EntryStatus.SUBMITTED },
        data: { status: EntryStatus.ACTIVE },
      });
      log.push(`season ${s.number} → VOTING`);
    }
    if (s.status !== SeasonStatus.CLOSED && now >= s.endsAt) {
      await prisma.season.update({
        where: { id: s.id },
        data: { status: SeasonStatus.CLOSED, retentionCheckAt: s.retentionCheckAt ?? vestingDate(s.endsAt) },
      });
      await snapshotRetentionDay0(s.id);
      log.push(`season ${s.number} → CLOSED`);
    }
  }

  const due = await prisma.round.findMany({ where: { status: RoundStatus.PENDING, opensAt: { lte: now } } });
  for (const r of due) {
    await openRound(r);
    log.push(`round ${r.tournament}/${r.index} opened`);
  }
  const ended = await prisma.round.findMany({ where: { status: RoundStatus.OPEN, closesAt: { lte: now } } });
  for (const r of ended) {
    await closeRound(r.id);
    log.push(`round ${r.tournament}/${r.index} closed`);
  }
  return log;
}

async function openRound(round: Round) {
  // First round: everyone submitted is in. Later rounds: whoever the previous round advanced.
  if (round.index === 0) {
    await prisma.entry.updateMany({
      where: { seasonId: round.seasonId, tournament: round.tournament, status: { in: [EntryStatus.SUBMITTED] } },
      data: { status: EntryStatus.ACTIVE },
    });
  }
  await prisma.round.update({ where: { id: round.id }, data: { status: RoundStatus.OPEN } });
  if (round.tournament !== Tournament.GTM) await assignReviewers(round);
}

export async function activeEntriesForRound(round: Pick<Round, "seasonId" | "tournament">) {
  return prisma.entry.findMany({
    where: { seasonId: round.seasonId, tournament: round.tournament, status: { in: [EntryStatus.ACTIVE, EntryStatus.FINALIST] } },
    include: { alliance: { select: { factionIds: true, status: true } } },
  });
}

export function allianceIdsFor(entry: { factionId: string | null; alliance?: { factionIds: string[]; status: string } | null }): string[] {
  if (!entry.alliance || entry.alliance.status !== "ACTIVE") return [];
  return entry.alliance.factionIds.filter((id) => id !== entry.factionId);
}

/** Close a round: decrypt ballots, tally, publish with a hash commitment, advance or name the Victor. */
export async function closeRound(roundId: string) {
  const round = await prisma.round.findUnique({ where: { id: roundId }, include: { season: true } });
  if (!round) throw new Error("Round not found");
  if (round.status === RoundStatus.CLOSED) return round;

  const entries = await activeEntriesForRound(round);
  const isFinal = round.index === lastRoundIndex(round.tournament);

  let advanced: string[] = [];
  let tally: Record<string, number> = {};
  let totalWeight = 0;
  let ballotCount = 0;

  if (round.tournament === Tournament.GTM) {
    const rows = await prisma.ballot.findMany({ where: { roundId: round.id } });
    const ballots: BallotPayload[] = [];
    for (const row of rows) {
      try {
        ballots.push(decryptJson<BallotPayload>(row.ciphertext));
      } catch {
        // an undecryptable ballot is dropped, never guessed
      }
    }
    const meta: EntryMeta[] = entries.map((e) => ({ id: e.id, factionId: e.factionId, allianceFactionIds: allianceIdsFor(e) }));
    const result = tallyRound(ballots, meta, round.threshold, { isFinal });
    advanced = result.advanced;
    tally = result.perEntry;
    totalWeight = result.totalWeight;
    ballotCount = result.ballotCount;
  } else if (round.tournament === Tournament.LOCAL_SYSTEMS) {
    const scored: { id: string; key: number }[] = [];
    for (const e of entries) {
      const reviews = await prisma.review.findMany({ where: { entryId: e.id, stage: isFinal ? "final" : "round", submittedAt: { not: null } } });
      const t = tallyPanel(reviews.map((r) => ({ approve: r.approve, score: r.score })));
      tally[e.id] = isFinal ? t.meanScore ?? 0 : t.approvalRate;
      ballotCount += t.submitted;
      if (isFinal) scored.push({ id: e.id, key: t.meanScore ?? 0 });
      else if (t.advances) advanced.push(e.id);
    }
    if (isFinal) advanced = scored.sort((a, b) => b.key - a.key).slice(0, 1).map((s) => s.id);
    totalWeight = ballotCount;
  } else {
    const scored: { id: string; key: number }[] = [];
    for (const e of entries) {
      const reviews = await prisma.review.findMany({ where: { entryId: e.id, stage: isFinal ? "final" : "round", submittedAt: { not: null } } });
      const t = tallyBlind(reviews);
      tally[e.id] = t.mean ?? 0;
      ballotCount += t.reviews;
      if (isFinal) scored.push({ id: e.id, key: t.mean ?? 0 });
      else if (t.advances) advanced.push(e.id);
    }
    if (isFinal) advanced = scored.sort((a, b) => b.key - a.key).slice(0, 1).map((s) => s.id);
    totalWeight = ballotCount;
  }

  const tallyHash = sha256Hex(JSON.stringify({ roundId: round.id, tally, totalWeight }));
  await prisma.round.update({
    where: { id: round.id },
    data: { status: RoundStatus.CLOSED, tally, tallyHash, totalWeight, ballotCount, advancedIds: advanced, closedAt: new Date() },
  });

  const eliminated = entries.filter((e) => !advanced.includes(e.id)).map((e) => e.id);
  if (eliminated.length) {
    await prisma.entry.updateMany({
      where: { id: { in: eliminated } },
      data: { status: EntryStatus.ELIMINATED, eliminatedRound: round.index },
    });
  }

  if (isFinal) {
    await settleTournament(round, entries, advanced, tally);
  } else if (round.index === lastRoundIndex(round.tournament) - 1) {
    await prisma.entry.updateMany({ where: { id: { in: advanced } }, data: { status: EntryStatus.FINALIST } });
  }
  return prisma.round.findUnique({ where: { id: round.id } });
}

export function winnerStanding(t: Tournament): number {
  if (t === Tournament.GTM) return STANDING_AWARDS.GTM.victor;
  if (t === Tournament.LOCAL_SYSTEMS) return STANDING_AWARDS.LOCAL_SYSTEMS.winner;
  return STANDING_AWARDS.RESEARCH_PAPERS.winner;
}

export function winnerPoolShare(t: Tournament): number {
  if (t === Tournament.GTM) return POOL_SPLIT.GTM.victor;
  if (t === Tournament.LOCAL_SYSTEMS) return POOL_SPLIT.LOCAL_SYSTEMS.winner;
  return POOL_SPLIT.RESEARCH_PAPERS.winner;
}

export function lastRoundIndex(t: Tournament): number {
  return t === Tournament.GTM ? VOTING.gtmRounds.length - 1 : 1;
}

/** Name the winner (Victor for GTM), award standing and treasury. */
async function settleTournament(
  round: Round & { season: Season },
  entries: (Entry & { alliance: { factionIds: string[]; status: string } | null })[],
  winners: string[],
  tally: Record<string, number>
) {
  const winnerId = winners[0];
  const finalists = entries.filter((e) => e.id !== winnerId);
  const season = round.season;
  const isGtm = round.tournament === Tournament.GTM;
  const vestsAt = isGtm ? (season.retentionCheckAt ?? vestingDate(season.endsAt)) : null;

  if (winnerId) {
    const winner = entries.find((e) => e.id === winnerId)!;
    await prisma.entry.update({
      where: { id: winnerId },
      data: { status: EntryStatus.WINNER, isVictor: isGtm, finalScore: tally[winnerId] ?? null },
    });
    const award = winnerStanding(round.tournament);
    const share = winnerPoolShare(round.tournament);
    await awardEntry(winner, season, award, share, isGtm ? "Victor" : "Winner", vestsAt);
  }
  for (const f of finalists) {
    await prisma.entry.update({ where: { id: f.id }, data: { status: EntryStatus.FINALIST, finalScore: tally[f.id] ?? null } });
    const award = STANDING_AWARDS[round.tournament].finalist;
    const share = POOL_SPLIT[round.tournament].finalist;
    await awardEntry(f, season, award, share, "Finalist", vestsAt);
  }
}

/** Standing belongs to the crew or faction that earned it. Alliances split by their registered terms. */
async function awardEntry(entry: Entry & { alliance: { factionIds: string[] } | null }, season: Season, standing: number, poolShare: number, title: string, vestsAt: Date | null) {
  const reason = `${season.name} ${entry.tournament}: ${title}`;
  const immediate = vestsAt === null;
  const targets: { type: StandingTarget; id: string; fraction: number }[] = [];

  if (entry.allianceId && entry.alliance) {
    const alliance = await prisma.alliance.findUnique({ where: { id: entry.allianceId } });
    const split = (alliance?.shareSplit ?? {}) as Record<string, number>;
    for (const fid of entry.alliance.factionIds) {
      targets.push({ type: StandingTarget.FACTION, id: fid, fraction: split[fid] ?? 1 / entry.alliance.factionIds.length });
    }
  } else if (entry.factionId) {
    targets.push({ type: StandingTarget.FACTION, id: entry.factionId, fraction: 1 });
  }
  if (entry.crewId) targets.push({ type: StandingTarget.CREW, id: entry.crewId, fraction: 1 });
  if (targets.length === 0) targets.push({ type: StandingTarget.USER, id: entry.authorId, fraction: 1 });

  for (const t of targets) {
    const amount = round4(standing * t.fraction);
    await prisma.standingEvent.create({
      data: {
        targetType: t.type,
        targetId: t.id,
        amount,
        reason,
        seasonNumber: season.number,
        entryId: entry.id,
        vestsAt,
        vestedFraction: immediate ? 1 : null,
      },
    });
    if (immediate) await addStanding(t.type, t.id, amount);
    if (t.type === StandingTarget.FACTION && season.poolAmount > 0 && poolShare > 0) {
      const treasury = round4(season.poolAmount * poolShare * t.fraction);
      await prisma.treasuryEntry.create({ data: { factionId: t.id, amount: treasury, reason, seasonNumber: season.number } });
      await prisma.faction.update({ where: { id: t.id }, data: { treasury: { increment: treasury } } });
    }
  }
}

export async function addStanding(type: StandingTarget, id: string, amount: number) {
  if (amount === 0) return;
  const cap = TRUST.standingCap;
  if (type === StandingTarget.USER) {
    const u = await prisma.user.findUnique({ where: { id }, select: { standing: true } });
    if (u) await prisma.user.update({ where: { id }, data: { standing: round4(Math.min(cap, u.standing + amount)) } });
  } else if (type === StandingTarget.CREW) {
    const c = await prisma.crew.findUnique({ where: { id }, select: { standing: true } });
    if (c) await prisma.crew.update({ where: { id }, data: { standing: round4(c.standing + amount) } });
  } else if (type === StandingTarget.FACTION) {
    const f = await prisma.faction.findUnique({ where: { id }, select: { standing: true } });
    if (f) await prisma.faction.update({ where: { id }, data: { standing: round4(f.standing + amount) } });
  } else {
    const r = await prisma.region.findUnique({ where: { id }, select: { standing: true } });
    if (r) await prisma.region.update({ where: { id }, data: { standing: round4(r.standing + amount) } });
  }
}

/** Day 0 = season close: freeze the latest reported active-user count for every GTM entry. */
async function snapshotRetentionDay0(seasonId: string) {
  const entries = await prisma.entry.findMany({ where: { seasonId, tournament: Tournament.GTM, retentionDay0: null } });
  for (const e of entries) {
    const latest = await prisma.retentionReport.findFirst({ where: { entryId: e.id }, orderBy: { reportedAt: "desc" } });
    await prisma.entry.update({ where: { id: e.id }, data: { retentionDay0: latest?.activeCount ?? 0 } });
  }
}

/** Day 90: vest GTM standing by retention. Runs from cron. */
export async function runRetentionChecks(now = new Date()) {
  const due = await prisma.standingEvent.findMany({
    where: { vestedFraction: null, vestsAt: { lte: now }, entryId: { not: null } },
  });
  const done: string[] = [];
  for (const ev of due) {
    const entry = await prisma.entry.findUnique({ where: { id: ev.entryId! } });
    if (!entry) continue;
    let ratio = entry.retentionRatio;
    if (ratio === null) {
      const latest = await prisma.retentionReport.findFirst({ where: { entryId: entry.id }, orderBy: { reportedAt: "desc" } });
      const day90 = latest?.activeCount ?? 0;
      ratio = retentionRatio(entry.retentionDay0 ?? 0, day90);
      await prisma.entry.update({
        where: { id: entry.id },
        data: { retentionDay90: day90, retentionRatio: ratio, vestedFraction: vestedFraction(ratio) },
      });
    }
    const fraction = vestedFraction(ratio);
    await prisma.standingEvent.update({ where: { id: ev.id }, data: { vestedFraction: fraction } });
    await addStanding(ev.targetType, ev.targetId, round4(ev.amount * fraction));
    done.push(ev.id);
  }
  const seasons = await prisma.season.findMany({ where: { status: SeasonStatus.CLOSED, retentionCheckAt: { lte: now } } });
  for (const s of seasons) {
    const pending = await prisma.standingEvent.count({ where: { seasonNumber: s.number, vestedFraction: null } });
    if (pending === 0) await prisma.season.update({ where: { id: s.id }, data: { status: SeasonStatus.VESTED } });
  }
  return { vested: done.length };
}

/**
 * Assign reviewers for LS (the published panel) and RP (blind pool).
 * Panelists recuse from their own region/faction; RP reviewers from their
 * own faction. The system checks it; reviewers never see the faction.
 */
async function assignReviewers(round: Round) {
  const season = await prisma.season.findUnique({ where: { id: round.seasonId } });
  if (!season) return;
  const isFinal = round.index === 1;
  const stage = isFinal ? "final" : "round";
  const entries = await activeEntriesForRound(round);
  const isLs = round.tournament === Tournament.LOCAL_SYSTEMS;
  const poolIds = isLs ? season.panelIds : season.reviewerPoolIds;
  if (poolIds.length === 0) return;
  const pool = await prisma.user.findMany({ where: { id: { in: poolIds } }, select: { id: true, factionId: true, regionId: true } });
  const perPaper = isLs ? pool.length : isFinal ? VOTING.researchPapers.finalReviewers : VOTING.researchPapers.reviewersPerPaper;

  const load = new Map<string, number>(pool.map((p) => [p.id, 0]));
  for (const e of entries) {
    const eligible = pool.filter((p) => {
      if (p.id === e.authorId) return false;
      if (e.factionId && p.factionId === e.factionId) return false;
      if (isLs && e.regionId && p.regionId === e.regionId) return false;
      return true;
    });
    eligible.sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
    for (const p of eligible.slice(0, perPaper)) {
      await prisma.review.upsert({
        where: { entryId_reviewerId_stage: { entryId: e.id, reviewerId: p.id, stage } },
        create: { entryId: e.id, reviewerId: p.id, tournament: round.tournament, stage },
        update: {},
      });
      load.set(p.id, (load.get(p.id) ?? 0) + 1);
    }
  }
}
