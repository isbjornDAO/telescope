import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** The person slashed and their vouchers can appeal once. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const finding = await prisma.slashingFinding.findUnique({ where: { id: params.id } });
  if (!finding || finding.status !== "CONFIRMED") throw new WorldError("Only a confirmed finding can be appealed, once.", 409);
  const isVoucher = !!(await prisma.vouch.findFirst({ where: { fromUserId: user.id, toUserId: finding.targetUserId } }));
  if (user.id !== finding.targetUserId && !isVoucher) throw new WorldError("The person slashed and their vouchers can appeal.", 403);
  const { text } = await parseBody(req, z.object({ text: z.string().min(40).max(4000) }));
  await prisma.slashingFinding.update({ where: { id: finding.id }, data: { status: "APPEALED", appealText: text, appealedAt: new Date() } });
  return ok({ ok: true });
});
