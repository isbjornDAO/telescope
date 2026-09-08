import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isCrewMember } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const entry = await prisma.entry.findUnique({ where: { id: params.id }, include: { season: true } });
  if (!entry) throw new WorldError("No such entry.", 404);
  const mine = user.id === entry.authorId || (entry.crewId ? await isCrewMember(user.id, entry.crewId) : false);
  if (!mine) throw new WorldError("Not your entry.", 403);
  if (["WINNER", "FINALIST", "ELIMINATED"].includes(entry.status)) throw new WorldError("The record is permanent once a round has decided.", 409);
  await prisma.entry.update({ where: { id: entry.id }, data: { status: "WITHDRAWN" } });
  return ok({ ok: true });
});
