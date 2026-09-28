import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser, isWorldAdmin } from "@/lib/world/session";
import { ACP_SHELF } from "@/lib/world/acp-shelf";

export const dynamic = "force-dynamic";

/** List research events (live first, then queued, then closed archive). */
export const GET = handle(async (_req: NextRequest) => {
  const events = await prisma.researchEvent.findMany({
    orderBy: [{ number: "desc" }],
    include: {
      journey: { select: { slug: true, name: true } },
      _count: { select: { entries: true } },
    },
  });

  const live = events.find((e) => e.status === "LIVE") ?? null;
  const queued = events.filter((e) => e.status === "QUEUED");
  const closed = events.filter((e) => e.status === "CLOSED");

  return ok({
    live: live
      ? {
          id: live.id,
          number: live.number,
          question: live.question,
          terms: live.terms,
          minWordCount: live.minWordCount,
          deadline: live.deadline.toISOString(),
          bounty: live.bounty,
          category: live.category,
          status: live.status,
          journey: live.journey,
          entries: live._count.entries,
        }
      : null,
    queued: queued.map((e) => ({
      id: e.id,
      number: e.number,
      question: e.question,
      deadline: e.deadline.toISOString(),
      bounty: e.bounty,
      category: e.category,
      status: e.status,
    })),
    archive: closed.map((e) => ({
      id: e.id,
      number: e.number,
      question: e.question,
      terms: e.terms,
      deadline: e.deadline.toISOString(),
      bounty: e.bounty,
      category: e.category,
      status: e.status,
      closedAt: e.closedAt?.toISOString() ?? null,
      journey: e.journey,
      entries: e._count.entries,
    })),
    acps: ACP_SHELF,
  });
});

const createSchema = z.object({
  question: z.string().min(5).max(200),
  terms: z.string().min(10).max(4000),
  minWordCount: z.number().int().min(100).max(50000).optional(),
  deadline: z.string(),
  bounty: z.string().min(3).max(200),
  category: z.string().max(80).optional(),
  makeLive: z.boolean().optional(),
  number: z.number().int().positive().optional(),
});

/** Admin: create a research event. Becomes LIVE if none is live (or makeLive). */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  if (!isWorldAdmin(user)) throw new WorldError("Admins only.", 403);
  const body = await parseBody(req, createSchema);

  const journey = await prisma.conservationJourney.findFirst({ where: { active: true } });
  const max = await prisma.researchEvent.findFirst({ orderBy: { number: "desc" } });
  const number = body.number ?? (max ? max.number + 1 : 1);

  const existingLive = await prisma.researchEvent.findFirst({ where: { status: "LIVE" } });
  let status: "LIVE" | "QUEUED" = "QUEUED";
  if (body.makeLive === true) {
    if (existingLive) throw new WorldError("A live bounty already exists. Close it first.", 409);
    status = "LIVE";
  } else if (body.makeLive !== false && !existingLive) {
    status = "LIVE";
  }

  const event = await prisma.researchEvent.create({
    data: {
      number,
      question: body.question,
      terms: body.terms,
      minWordCount: body.minWordCount ?? 1500,
      deadline: new Date(body.deadline),
      bounty: body.bounty,
      category: body.category,
      status,
      journeyId: journey?.id,
    },
  });

  return ok(
    {
      id: event.id,
      number: event.number,
      question: event.question,
      status: event.status,
    },
    { status: 201 }
  );
});
