import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** Who vouched for whom is visible only to the two parties, unless both choose otherwise. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const { visible } = await parseBody(req, z.object({ visible: z.boolean() }));
  const v = await prisma.vouch.findUnique({ where: { id: params.id } });
  if (!v) throw new WorldError("No such vouch.", 404);
  if (v.fromUserId === user.id) {
    await prisma.vouch.update({ where: { id: v.id }, data: { fromVisible: visible } });
  } else if (v.toUserId === user.id) {
    await prisma.vouch.update({ where: { id: v.id }, data: { toVisible: visible } });
  } else {
    throw new WorldError("Not your vouch.", 403);
  }
  return ok({ ok: true });
});
