import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";

export const dynamic = "force-dynamic";

/** Public list of active conservation journeys. Empty until an admin creates one. */
export const GET = handle(async (_req: NextRequest) => {
  const journeys = await prisma.conservationJourney.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return ok(
    journeys.map((j) => ({
      id: j.id,
      slug: j.slug,
      name: j.name,
      story: j.story,
      howItMaps: j.howItMaps,
    }))
  );
});
