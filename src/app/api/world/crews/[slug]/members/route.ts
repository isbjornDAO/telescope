import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { assertCanMoveFaction, currentSeasonNumber, isCrewLead, requireNode } from "@/lib/world/queries";
import { getCurrentSeason } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

const schema = z.object({ handle: z.string().min(3), role: z.string().max(40).optional() });

/**
 * A lead invites a node by name. One faction per person: joining a crew
 * that belongs to a faction means joining that faction, which is only
 * allowed between seasons if you already have one.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const crew = await prisma.crew.findUnique({ where: { slug: params.slug } });
  if (!crew) throw new WorldError("No such crew.", 404);
  if (!(await isCrewLead(user.id, crew.id))) throw new WorldError("Crew leads only.", 403);
  const body = await parseBody(req, schema);
  const node = await requireNode(body.handle);

  if (crew.factionId && node.factionId && node.factionId !== crew.factionId) {
    throw new WorldError("That node belongs to another faction. A person belongs to one faction at a time.", 409);
  }
  const season = await getCurrentSeason();
  if (crew.factionId && node.factionId !== crew.factionId) await assertCanMoveFaction(node, season);

  const existing = await prisma.crewMember.findUnique({ where: { crewId_userId: { crewId: crew.id, userId: node.id } } });
  if (existing && !existing.leftAt) throw new WorldError("Already in the crew.", 409);
  await prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: crew.id, userId: node.id } },
    create: { crewId: crew.id, userId: node.id, role: body.role },
    update: { leftAt: null, role: body.role, joinedAt: new Date() },
  });
  if (crew.factionId && !node.factionId) {
    await prisma.user.update({ where: { id: node.id }, data: { factionId: crew.factionId, factionJoinedSeasonNumber: await currentSeasonNumber() } });
  }
  return ok({ ok: true }, { status: 201 });
});
