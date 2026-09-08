import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isCrewLead } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

/** Leave a crew, or a lead removes someone. Standing stays with the crew. */
export const DELETE = handle(async (req: NextRequest, { params }: { params: { slug: string; userId: string } }) => {
  const user = await requireWorldUser(req);
  const crew = await prisma.crew.findUnique({ where: { slug: params.slug } });
  if (!crew) throw new WorldError("No such crew.", 404);
  const self = params.userId === user.id || params.userId === "me";
  const targetId = self ? user.id : params.userId;
  if (!self && !(await isCrewLead(user.id, crew.id))) throw new WorldError("Crew leads only.", 403);
  const m = await prisma.crewMember.findUnique({ where: { crewId_userId: { crewId: crew.id, userId: targetId } } });
  if (!m || m.leftAt) throw new WorldError("Not in the crew.", 404);
  if (m.isLead) {
    const otherLeads = await prisma.crewMember.count({ where: { crewId: crew.id, leftAt: null, isLead: true, userId: { not: targetId } } });
    if (otherLeads === 0) throw new WorldError("Hand the lead to someone first.", 409);
  }
  await prisma.crewMember.update({ where: { id: m.id }, data: { leftAt: new Date() } });
  return ok({ ok: true });
});
