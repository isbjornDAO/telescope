import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { requireWorldUser } from "@/lib/world/session";
import { blindEntry } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

/** Elders see their panel assignments; the blind pool sees papers with no authorship. */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const reviews = await prisma.review.findMany({
    where: { reviewerId: user.id },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "desc" }],
    include: {
      entry: {
        include: {
          season: { select: { number: true, name: true, status: true } },
          region: { select: { name: true, slug: true } },
          crew: { select: { name: true, slug: true } },
          faction: { select: { name: true, slug: true } },
        },
      },
    },
  });
  return ok(
    reviews.map((r) => {
      const { season, region, crew, faction, ...raw } = r.entry;
      const entry =
        r.tournament === "RESEARCH_PAPERS"
          ? { ...blindEntry(raw), season }
          : { ...raw, blind: false as const, season, region, crew, faction };
      return {
        id: r.id,
        tournament: r.tournament,
        stage: r.stage,
        submittedAt: r.submittedAt,
        approve: r.approve,
        score: r.score,
        advances: r.advances,
        rigour: r.rigour,
        buildable: r.buildable,
        comment: r.comment,
        entry,
      };
    }),
    noStore
  );
});
