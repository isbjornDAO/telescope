import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin } from "@/lib/world/session";
import { closeRound } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** Close a round now: tally, publish with hash, advance. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireWorldAdmin(req);
  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) throw new WorldError("No such round.", 404);
  if (round.status !== "OPEN") throw new WorldError("Round is not open.", 409);
  const closed = await closeRound(round.id);
  return ok(closed);
});
