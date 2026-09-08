import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { assertCanMoveFaction, currentSeasonNumber, isCrewLead } from "@/lib/world/queries";
import { getCurrentSeason } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** A crew lead brings their crew into the faction. Members with no faction join it. */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const { crewSlug } = await parseBody(req, z.object({ crewSlug: z.string() }));
  const faction = await prisma.faction.findUnique({ where: { slug: params.slug } });
  if (!faction) throw new WorldError("No such faction.", 404);
  const crew = await prisma.crew.findUnique({ where: { slug: crewSlug }, include: { members: { where: { leftAt: null }, include: { user: true } } } });
  if (!crew) throw new WorldError("No such crew.", 404);
  if (!(await isCrewLead(user.id, crew.id))) throw new WorldError("Crew leads only.", 403);
  if (crew.factionId && crew.factionId !== faction.id) {
    await assertCanMoveFaction({ ...user, factionId: crew.factionId }, await getCurrentSeason());
  }
  const conflict = crew.members.find((m) => m.user.factionId && m.user.factionId !== faction.id);
  if (conflict) throw new WorldError("A member belongs to another faction. They must move first, between seasons.", 409);
  const seasonNumber = await currentSeasonNumber();
  await prisma.crew.update({ where: { id: crew.id }, data: { factionId: faction.id } });
  await prisma.user.updateMany({ where: { id: { in: crew.members.map((m) => m.userId) }, factionId: null }, data: { factionId: faction.id, factionJoinedSeasonNumber: seasonNumber } });
  return ok({ ok: true });
});
