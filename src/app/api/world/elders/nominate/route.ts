import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isAnchorOrElder, requireNode } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

/** Elders are admitted by existing Elders and by region anchors. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  if (!isAnchorOrElder(user)) throw new WorldError("Anchors and Elders nominate.", 403);
  const { handle: h, statement } = await parseBody(req, z.object({ handle: z.string().min(3), statement: z.string().min(20).max(1200) }));
  const candidate = await requireNode(h);
  if (candidate.nodeType === "ELDER") throw new WorldError("Already an Elder.", 409);
  const open = await prisma.elderAdmission.findFirst({ where: { candidateId: candidate.id, status: "PROPOSED" } });
  if (open) throw new WorldError("A nomination is already open.", 409);
  const admission = await prisma.elderAdmission.create({ data: { candidateId: candidate.id, nominatedById: user.id, statement, approvals: [user.id] } });
  return ok({ id: admission.id }, { status: 201 });
});
