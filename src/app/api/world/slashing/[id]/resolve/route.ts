import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isElder } from "@/lib/world/queries";
import { recomputeTrustScores } from "@/lib/world/trust-db";

export const dynamic = "force-dynamic";

/**
 * An Elder who did not sign the finding resolves the appeal. Overturning
 * restores the vouches and the vouchers' standing; the finding record stays.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  if (!isElder(user)) throw new WorldError("Elders resolve appeals.", 403);
  const finding = await prisma.slashingFinding.findUnique({ where: { id: params.id } });
  if (!finding || finding.status !== "APPEALED") throw new WorldError("No appeal to resolve.", 409);
  if (finding.elderApprovals.includes(user.id)) throw new WorldError("An Elder who signed the finding cannot hear the appeal.", 403);
  const { uphold } = await parseBody(req, z.object({ uphold: z.boolean() }));
  if (uphold) {
    await prisma.slashingFinding.update({ where: { id: finding.id }, data: { status: "UPHELD", resolvedAt: new Date() } });
    return ok({ status: "UPHELD" });
  }
  await prisma.vouch.updateMany({ where: { toUserId: finding.targetUserId, status: "SLASHED" }, data: { status: "ACTIVE" } });
  const penalties = await prisma.standingEvent.findMany({ where: { reason: { contains: finding.id }, amount: { lt: 0 } } });
  for (const p of penalties) {
    const voucher = await prisma.user.findUnique({ where: { id: p.targetId }, select: { standing: true } });
    if (voucher) await prisma.user.update({ where: { id: p.targetId }, data: { standing: voucher.standing - p.amount } });
    await prisma.standingEvent.create({ data: { targetType: "USER", targetId: p.targetId, amount: -p.amount, reason: `Appeal overturned finding ${finding.id}`, vestedFraction: 1 } });
  }
  await prisma.slashingFinding.update({ where: { id: finding.id }, data: { status: "OVERTURNED", resolvedAt: new Date() } });
  await recomputeTrustScores();
  return ok({ status: "OVERTURNED", restored: penalties.length });
});
