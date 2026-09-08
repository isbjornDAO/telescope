import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { assertCanMoveFaction, currentSeasonNumber } from "@/lib/world/queries";
import { getCurrentSeason } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** One faction at a time. Moving is allowed between seasons, not during. */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const faction = await prisma.faction.findUnique({ where: { slug: params.slug } });
  if (!faction) throw new WorldError("No such faction.", 404);
  if (user.factionId === faction.id) return ok({ ok: true, already: true });
  await assertCanMoveFaction(user, await getCurrentSeason());
  // leaving crews that belong to the old faction
  if (user.factionId) {
    await prisma.crewMember.updateMany({ where: { userId: user.id, leftAt: null, crew: { factionId: user.factionId } }, data: { leftAt: new Date() } });
  }
  await prisma.user.update({ where: { id: user.id }, data: { factionId: faction.id, factionJoinedSeasonNumber: await currentSeasonNumber() } });
  return ok({ ok: true });
});
