import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { seasonPhase, seasonWeek } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const seasons = await prisma.season.findMany({
    orderBy: { number: "desc" },
    include: { _count: { select: { entries: { where: { status: { notIn: ["DRAFT", "WITHDRAWN"] } } } } } },
  });
  const victors = await prisma.entry.findMany({ where: { isVictor: true }, select: { seasonId: true, title: true, id: true, crew: { select: { name: true, slug: true } } } });
  const victorBySeason = new Map(victors.map((v) => [v.seasonId, v]));
  return ok(
    seasons.map((s) => ({
      number: s.number,
      name: s.name,
      theme: s.theme,
      researchQuestion: s.researchQuestion,
      startsAt: s.startsAt,
      submissionsClose: s.submissionsClose,
      endsAt: s.endsAt,
      status: s.status,
      phase: seasonPhase(s),
      week: seasonWeek(s),
      entries: s._count.entries,
      poolAmount: s.poolAmount,
      sponsors: s.sponsors,
      victor: victorBySeason.get(s.id) ?? null,
    }))
  );
});
