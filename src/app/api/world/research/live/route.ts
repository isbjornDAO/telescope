import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";

export const dynamic = "force-dynamic";

/** Current LIVE research bounty, or null. */
export const GET = handle(async (_req: NextRequest) => {
  const live = await prisma.researchEvent.findFirst({
    where: { status: "LIVE" },
    include: {
      journey: { select: { slug: true, name: true, story: true, howItMaps: true } },
      _count: { select: { entries: true } },
    },
  });
  if (!live) return ok(null);
  return ok({
    id: live.id,
    number: live.number,
    question: live.question,
    terms: live.terms,
    minWordCount: live.minWordCount,
    deadline: live.deadline.toISOString(),
    bounty: live.bounty,
    category: live.category,
    status: live.status,
    journey: live.journey,
    entries: live._count.entries,
  });
});
