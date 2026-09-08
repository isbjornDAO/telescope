import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** The community uses the products and files feedback. Trust-graph nodes only, so it means something. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  if (user.trustScore <= 0) throw new WorldError("Feedback comes from nodes on the trust graph. Get vouched first.", 403);
  const { body } = await parseBody(req, z.object({ body: z.string().min(3).max(1200) }));
  const entry = await prisma.entry.findUnique({ where: { id: params.id }, select: { id: true, tournament: true, status: true } });
  if (!entry || entry.status === "DRAFT") throw new WorldError("No such entry.", 404);
  if (entry.tournament === "RESEARCH_PAPERS") throw new WorldError("Research papers are private; feedback goes through blind review.", 409);
  const f = await prisma.feedback.create({ data: { entryId: entry.id, userId: user.id, body } });
  return ok({ id: f.id, at: f.createdAt }, { status: 201 });
});
