import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { requireWorldUser } from "@/lib/world/session";
import { budgetFor, buildClaims, viewMatch } from "@/lib/world/scout";
import { currentSeasonNumber } from "@/lib/world/queries";
import { SCOUT } from "@/lib/world/config";

export const dynamic = "force-dynamic";

/** My scout: what it knows, what it has spent, what it brought back. */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const seasonNumber = await currentSeasonNumber();
  const [intents, matches, claims] = await Promise.all([
    prisma.scoutIntent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.scoutMatch.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    buildClaims(user.id),
  ]);
  const intentIds = Array.from(new Set(matches.flatMap((m) => [m.intentAId, m.intentBId])));
  const intentRows = await prisma.scoutIntent.findMany({ where: { id: { in: intentIds } }, select: { id: true, type: true, tags: true } });
  const byId = new Map(intentRows.map((i) => [i.id, i]));
  return ok(
    {
      budget: budgetFor(user, seasonNumber),
      pricing: { usdcPerQuery: SCOUT.usdcPerQuery, treasury: process.env.SCOUT_TREASURY_ADDRESS ?? null },
      claims,
      intents,
      matches: matches.map((m) => viewMatch({ ...m, intentA: byId.get(m.intentAId) ?? null, intentB: byId.get(m.intentBId) ?? null }, user.id)),
    },
    noStore
  );
});
