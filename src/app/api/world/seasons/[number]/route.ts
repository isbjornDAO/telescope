import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession } from "@/lib/world/session";
import { seasonView } from "@/lib/world/season-view";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { number: string } }) => {
  const number = Number(params.number);
  if (!Number.isInteger(number)) throw new WorldError("Season numbers are integers.", 422);
  const season = await prisma.season.findUnique({ where: { number } });
  if (!season) throw new WorldError("No such season.", 404);
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } }, select: { id: true } }) : null;
  return ok(await seasonView(season, me?.id ?? null), noStore);
});
