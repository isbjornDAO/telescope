import { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/world/api";
import { requireWorldAdmin } from "@/lib/world/session";
import { createSeason } from "@/lib/world/seasons";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().max(40).optional(),
  theme: z.string().min(3).max(200),
  researchQuestion: z.string().min(10).max(600),
  startsAt: z.string().datetime(),
  poolAmount: z.number().min(0).optional(),
  sponsors: z.array(z.string().max(60)).optional(),
  panelHandles: z.array(z.string()).optional(),
  reviewerHandles: z.array(z.string()).optional(),
});

/** Create a season. Panel, review pool and thresholds are fixed before it starts and published. */
export const POST = handle(async (req: NextRequest) => {
  await requireWorldAdmin(req);
  const body = await parseBody(req, schema);
  const panel = body.panelHandles?.length ? await prisma.user.findMany({ where: { handle: { in: body.panelHandles }, nodeType: "ELDER" }, select: { id: true } }) : [];
  const reviewers = body.reviewerHandles?.length ? await prisma.user.findMany({ where: { handle: { in: body.reviewerHandles } }, select: { id: true } }) : [];
  const overlapping = await prisma.season.findFirst({ where: { status: { in: ["UPCOMING", "ACTIVE", "VOTING"] } } });
  if (overlapping) throw new WorldError(`Season ${overlapping.number} is still ${overlapping.status}. One season at a time.`, 409);
  const season = await createSeason({
    name: body.name,
    theme: body.theme,
    researchQuestion: body.researchQuestion,
    startsAt: new Date(body.startsAt),
    poolAmount: body.poolAmount,
    sponsors: body.sponsors,
    panelIds: panel.map((p) => p.id),
    reviewerPoolIds: reviewers.map((r) => r.id),
  });
  return ok(season, { status: 201 });
});
