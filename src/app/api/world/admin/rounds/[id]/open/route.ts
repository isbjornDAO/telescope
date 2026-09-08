import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin } from "@/lib/world/session";
import { tickSeasons } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** Force a round open now (shifts its window to start now). Threshold stays as published. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireWorldAdmin(req);
  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) throw new WorldError("No such round.", 404);
  if (round.status !== "PENDING") throw new WorldError("Round is not pending.", 409);
  await prisma.round.update({ where: { id: round.id }, data: { opensAt: new Date() } });
  const log = await tickSeasons();
  return ok({ log });
});
