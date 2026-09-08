import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { getCurrentSeason, seasonPhase, seasonWeek } from "@/lib/world/seasons";
import { SEASON, THEME, WORLD_VERSION } from "@/lib/world/config";

export const dynamic = "force-dynamic";

/** The world at a glance: the map, the season, who carries weight, who is roaming. */
export const GET = handle(async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [season, nodes, anchors, elders, crews, factions, regions, activeIntents, recentMatches, vouches, topFactions, victor] = await Promise.all([
    getCurrentSeason(),
    prisma.user.count({ where: { trustScore: { gt: 0 } } }),
    prisma.user.count({ where: { nodeType: "ANCHOR" } }),
    prisma.user.count({ where: { nodeType: "ELDER" } }),
    prisma.crew.count(),
    prisma.faction.count(),
    prisma.region.findMany({ select: { id: true, name: true, slug: true, lat: true, lng: true, standing: true, _count: { select: { users: true, crews: true } } } }),
    prisma.scoutIntent.count({ where: { active: true, expiresAt: { gt: new Date() } } }),
    prisma.scoutMatch.count({ where: { createdAt: { gt: weekAgo } } }),
    prisma.vouch.count({ where: { status: "ACTIVE" } }),
    prisma.faction.findMany({ orderBy: { standing: "desc" }, take: 5, select: { name: true, slug: true, vision: true, standing: true, _count: { select: { crews: true, members: true } } } }),
    prisma.entry.findFirst({ where: { isVictor: true }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, url: true, crew: { select: { name: true, slug: true } }, season: { select: { name: true, number: true } } } }),
  ]);
  const anchorsByRegion = await prisma.user.groupBy({ by: ["regionId"], where: { nodeType: { in: ["ANCHOR", "ELDER"] }, regionId: { not: null } }, _count: { _all: true } });
  const anchorMap = new Map(anchorsByRegion.map((a) => [a.regionId, a._count._all]));
  let entriesByTournament: Record<string, number> = {};
  if (season) {
    const rows = await prisma.entry.groupBy({ by: ["tournament"], where: { seasonId: season.id, status: { notIn: ["DRAFT", "WITHDRAWN"] } }, _count: { _all: true } });
    entriesByTournament = Object.fromEntries(rows.map((r) => [r.tournament, r._count._all]));
  }
  return ok(
    {
      version: WORLD_VERSION,
      theme: THEME,
      season: season
        ? { number: season.number, name: season.name, theme: season.theme, researchQuestion: season.researchQuestion, phase: seasonPhase(season), week: seasonWeek(season), weeks: SEASON.weeks, startsAt: season.startsAt, submissionsClose: season.submissionsClose, endsAt: season.endsAt, entries: entriesByTournament }
        : null,
      counts: { nodes, anchors, elders, crews, factions, regions: regions.length, vouches, activeIntents, matchesThisWeek: recentMatches },
      regions: regions.map((r) => ({ name: r.name, slug: r.slug, lat: r.lat, lng: r.lng, standing: r.standing, nodes: r._count.users, crews: r._count.crews, anchors: anchorMap.get(r.id) ?? 0 })),
      topFactions: topFactions.map((f) => ({ name: f.name, slug: f.slug, vision: f.vision, standing: f.standing, crews: f._count.crews, members: f._count.members })),
      victor,
    },
    noStore
  );
});
