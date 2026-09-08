import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { assertCanMoveFaction } from "@/lib/world/queries";
import { getCurrentSeason } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** Standing does not travel with people who leave. */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const faction = await prisma.faction.findUnique({ where: { slug: params.slug } });
  if (!faction || user.factionId !== faction.id) throw new WorldError("You are not in that faction.", 409);
  await assertCanMoveFaction(user, await getCurrentSeason());
  await prisma.crewMember.updateMany({ where: { userId: user.id, leftAt: null, crew: { factionId: faction.id } }, data: { leftAt: new Date() } });
  await prisma.user.update({ where: { id: user.id }, data: { factionId: null, factionJoinedSeasonNumber: null } });
  return ok({ ok: true });
});
