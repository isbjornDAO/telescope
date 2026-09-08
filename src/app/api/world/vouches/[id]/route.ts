import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { recomputeTrustScores } from "@/lib/world/trust-db";

export const dynamic = "force-dynamic";

/** Revoke a vouch you gave. The budget you spent this season is not refunded: a stake is a stake. */
export const DELETE = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const v = await prisma.vouch.findUnique({ where: { id: params.id } });
  if (!v || v.fromUserId !== user.id) throw new WorldError("Not your vouch.", 403);
  if (v.status === "SLASHED") throw new WorldError("Slashed vouches are permanent records.", 409);
  await prisma.vouch.update({ where: { id: v.id }, data: { status: "REVOKED" } });
  await recomputeTrustScores();
  return ok({ ok: true });
});
