import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { getWorldSession } from "@/lib/world/session";
import { getCurrentSeason } from "@/lib/world/seasons";
import { seasonView } from "@/lib/world/season-view";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const season = await getCurrentSeason();
  if (!season) return ok(null, noStore);
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } }, select: { id: true } }) : null;
  return ok(await seasonView(season, me?.id ?? null), noStore);
});
