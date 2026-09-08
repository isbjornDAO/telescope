import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin } from "@/lib/world/session";
import { seasonPhase } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

const schema = z.object({
  theme: z.string().min(3).max(200).optional(),
  researchQuestion: z.string().min(10).max(600).optional(),
  poolAmount: z.number().min(0).optional(),
  sponsors: z.array(z.string().max(60)).optional(),
  panelHandles: z.array(z.string()).optional(),
  reviewerHandles: z.array(z.string()).optional(),
});

/** Panel composition, review pools and thresholds cannot change once the season is running. */
export const PATCH = handle(async (req: NextRequest, { params }: { params: { number: string } }) => {
  await requireWorldAdmin(req);
  const season = await prisma.season.findUnique({ where: { number: Number(params.number) } });
  if (!season) throw new WorldError("No such season.", 404);
  const body = await parseBody(req, schema);
  const running = seasonPhase(season) === "building" || seasonPhase(season) === "voting";
  if (running && (body.panelHandles || body.reviewerHandles)) throw new WorldError("Panels and review pools are locked during a season.", 409);
  const panel = body.panelHandles ? await prisma.user.findMany({ where: { handle: { in: body.panelHandles }, nodeType: "ELDER" }, select: { id: true } }) : undefined;
  const reviewers = body.reviewerHandles ? await prisma.user.findMany({ where: { handle: { in: body.reviewerHandles } }, select: { id: true } }) : undefined;
  const updated = await prisma.season.update({
    where: { id: season.id },
    data: {
      theme: body.theme,
      researchQuestion: body.researchQuestion,
      poolAmount: body.poolAmount,
      sponsors: body.sponsors,
      panelIds: panel?.map((p) => p.id),
      reviewerPoolIds: reviewers?.map((r) => r.id),
    },
  });
  return ok(updated);
});
