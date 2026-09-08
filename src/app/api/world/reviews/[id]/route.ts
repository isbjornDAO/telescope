import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

const ten = z.number().int().min(1).max(10);
const schema = z.object({
  approve: z.boolean().optional(),
  score: ten.optional(),
  advances: ten.optional(),
  rigour: ten.optional(),
  buildable: ten.optional(),
  comment: z.string().max(4000).optional(),
});

/** Submit a review. LS round: approve. LS final: score. RP: three 1–10 scores. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const review = await prisma.review.findUnique({ where: { id: params.id }, include: { entry: { select: { status: true } } } });
  if (!review || review.reviewerId !== user.id) throw new WorldError("Not your review.", 403);
  if (review.submittedAt) throw new WorldError("Already submitted.", 409);
  const body = await parseBody(req, schema);

  if (review.tournament === "LOCAL_SYSTEMS") {
    if (review.stage === "round" && typeof body.approve !== "boolean") throw new WorldError("Approve or not.", 422);
    if (review.stage === "final" && typeof body.score !== "number") throw new WorldError("Score the finalist 1–10.", 422);
  } else if (review.tournament === "RESEARCH_PAPERS") {
    if ([body.advances, body.rigour, body.buildable].some((v) => typeof v !== "number")) {
      throw new WorldError("Score advances / rigour / buildable, each 1–10.", 422);
    }
  }
  const updated = await prisma.review.update({ where: { id: review.id }, data: { ...body, submittedAt: new Date() } });
  return ok({ id: updated.id, submittedAt: updated.submittedAt });
});
