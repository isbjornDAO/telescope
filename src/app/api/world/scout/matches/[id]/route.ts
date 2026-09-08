import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { respondToMatch, viewMatch } from "@/lib/world/scout";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["accept", "decline"]),
  disclosure: z.object({ name: z.string().min(1).max(60), contact: z.string().min(3).max(200), history: z.string().max(600).optional() }).optional(),
});

/** ACCEPT / DECLINE are human-gated. A scout never accepts on its own. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const match = await prisma.scoutMatch.findUnique({ where: { id: params.id } });
  if (!match) throw new WorldError("No such match.", 404);
  const body = await parseBody(req, schema);
  const updated = await respondToMatch(match, user, body.action, body.disclosure);
  const [a, b] = await Promise.all([
    prisma.scoutIntent.findUnique({ where: { id: updated.intentAId }, select: { type: true, tags: true } }),
    prisma.scoutIntent.findUnique({ where: { id: updated.intentBId }, select: { type: true, tags: true } }),
  ]);
  return ok(viewMatch({ ...updated, intentA: a, intentB: b }, user.id));
});
