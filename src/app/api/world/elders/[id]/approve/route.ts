import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isAnchorOrElder } from "@/lib/world/queries";
import { TRUST } from "@/lib/world/config";
import { recomputeTrustScores } from "@/lib/world/trust-db";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  if (!isAnchorOrElder(user)) throw new WorldError("Anchors and Elders approve.", 403);
  const admission = await prisma.elderAdmission.findUnique({ where: { id: params.id } });
  if (!admission || admission.status !== "PROPOSED") throw new WorldError("No open nomination by that id.", 404);
  if (admission.candidateId === user.id) throw new WorldError("You cannot approve yourself.", 422);
  const approvals = Array.from(new Set([...admission.approvals, user.id]));
  const admitted = approvals.length >= TRUST.elderAdmissionApprovals;
  await prisma.elderAdmission.update({ where: { id: admission.id }, data: { approvals, status: admitted ? "ADMITTED" : "PROPOSED", resolvedAt: admitted ? new Date() : null } });
  if (admitted) {
    await prisma.user.update({ where: { id: admission.candidateId }, data: { nodeType: "ELDER", elderSince: new Date() } });
    await recomputeTrustScores();
  }
  return ok({ approvals: approvals.length, admitted });
});
