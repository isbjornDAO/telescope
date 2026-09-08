import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { TRUST } from "@/lib/world/config";
import { applySlashing } from "@/lib/world/trust-db";

export const dynamic = "force-dynamic";

/** ≥3 Elders plus the region's anchors confirm. Then the stake is called. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const finding = await prisma.slashingFinding.findUnique({ where: { id: params.id } });
  if (!finding || finding.status !== "PROPOSED") throw new WorldError("No open finding by that id.", 404);
  if (finding.targetUserId === user.id) throw new WorldError("No.", 422);
  const elderApprovals = new Set(finding.elderApprovals);
  const anchorApprovals = new Set(finding.anchorApprovals);
  if (user.nodeType === "ELDER") elderApprovals.add(user.id);
  else if (user.nodeType === "ANCHOR" && finding.regionId && user.regionId === finding.regionId) anchorApprovals.add(user.id);
  else throw new WorldError("Elders, and Anchors of the affected region, confirm findings.", 403);

  const confirmed = elderApprovals.size >= TRUST.slashMinElders && (finding.regionId ? anchorApprovals.size >= 1 : true);
  await prisma.slashingFinding.update({
    where: { id: finding.id },
    data: { elderApprovals: Array.from(elderApprovals), anchorApprovals: Array.from(anchorApprovals), status: confirmed ? "CONFIRMED" : "PROPOSED", resolvedAt: confirmed ? new Date() : null },
  });
  let applied = null;
  if (confirmed) applied = await applySlashing(finding.id);
  return ok({ confirmed, elderApprovals: elderApprovals.size, anchorApprovals: anchorApprovals.size, applied });
});
