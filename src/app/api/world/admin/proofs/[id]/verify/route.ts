import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** Until Builder's Hub import is live, a world admin verifies manual proofs against the source. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const admin = await requireWorldAdmin(req);
  const { verified } = await parseBody(req, z.object({ verified: z.boolean() }));
  const proof = await prisma.proof.findUnique({ where: { id: params.id } });
  if (!proof) throw new WorldError("No such proof.", 404);
  const updated = await prisma.proof.update({ where: { id: proof.id }, data: { verified, verifiedBy: verified ? admin.address : null } });
  return ok({ id: updated.id, verified: updated.verified });
});
