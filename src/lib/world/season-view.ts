import { prisma } from "@/lib/prisma";
import type { Season } from "@prisma/client";
import { seasonPhase, seasonWeek } from "@/lib/world/seasons";
import { displayName, publicEntry } from "@/lib/world/privacy";
import { SEASON } from "@/lib/world/config";

/** The full public view of a season: rounds with published tallies, entries per tournament, panel, alliances. */
export async function seasonView(season: Season, viewerId: string | null) {
  const closed = season.status === "CLOSED" || season.status === "VESTED";
  const [rounds, entries, panel, alliances] = await Promise.all([
    prisma.round.findMany({ where: { seasonId: season.id }, orderBy: [{ tournament: "asc" }, { index: "asc" }] }),
    prisma.entry.findMany({
      where: { seasonId: season.id, status: { notIn: ["DRAFT"] } },
      include: {
        crew: { select: { name: true, slug: true, region: { select: { name: true, slug: true } } } },
        faction: { select: { name: true, slug: true } },
        region: { select: { name: true, slug: true } },
        author: { select: { handle: true, address: true } },
        _count: { select: { feedback: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({ where: { id: { in: season.panelIds } }, select: { handle: true, address: true, region: { select: { name: true, slug: true } } } }),
    prisma.alliance.findMany({ where: { seasonNumber: season.number, status: "ACTIVE" } }),
  ]);
  const allianceFactions = await prisma.faction.findMany({ where: { id: { in: alliances.flatMap((a) => a.factionIds) } }, select: { id: true, name: true, slug: true } });
  const byId = new Map(allianceFactions.map((f) => [f.id, f]));

  const shaped = entries.map((e) => {
    const { crew, faction, region, author, _count, ...raw } = e;
    const p = publicEntry(raw, closed);
    const mine = viewerId === e.authorId;
    if (p.blind && !mine) {
      return { id: p.id, tournament: p.tournament, status: p.status, title: "Research paper (private until the season closes)", summary: null, blind: true, feedback: _count.feedback, createdAt: p.createdAt };
    }
    return {
      ...p,
      body: undefined,
      crew,
      faction,
      region,
      author: displayName(author),
      feedback: _count.feedback,
      mine,
    };
  });

  return {
    number: season.number,
    name: season.name,
    theme: season.theme,
    researchQuestion: season.researchQuestion,
    startsAt: season.startsAt,
    submissionsClose: season.submissionsClose,
    endsAt: season.endsAt,
    retentionCheckAt: season.retentionCheckAt,
    status: season.status,
    phase: seasonPhase(season),
    week: seasonWeek(season),
    weeks: SEASON.weeks,
    poolAmount: season.poolAmount,
    sponsors: season.sponsors,
    panel: panel.map((p) => ({ name: displayName(p), handle: p.handle, region: p.region })),
    reviewerPoolSize: season.reviewerPoolIds.length,
    rounds: rounds.map((r) => ({
      id: r.id,
      tournament: r.tournament,
      index: r.index,
      name: r.name,
      threshold: r.threshold,
      opensAt: r.opensAt,
      closesAt: r.closesAt,
      status: r.status,
      ballotCount: r.ballotCount,
      totalWeight: r.status === "CLOSED" ? r.totalWeight : null,
      tally: r.status === "CLOSED" ? r.tally : null,
      tallyHash: r.tallyHash,
      advancedIds: r.advancedIds,
    })),
    entries: shaped,
    alliances: alliances.map((a) => ({ id: a.id, name: a.name, factions: a.factionIds.map((id) => byId.get(id) ?? { id, name: "?", slug: "" }) })),
    victor: shaped.find((e) => e.tournament === "GTM" && "isVictor" in e && e.isVictor) ?? null,
  };
}
