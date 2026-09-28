import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser, isWorldAdmin } from "@/lib/world/session";
import { getCurrentSeason } from "@/lib/world/seasons";
import { meetsMinWordCount, wordCount } from "@/lib/world/research";
import { nextLiveAfterClose } from "@/lib/world/research";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(10).max(600),
  body: z.string().min(50).max(60000),
  revealAuthorship: z.boolean().optional(),
});

/**
 * Submit a paper to the LIVE research event.
 * Blind to reviewers; min word count enforced from the event terms.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, submitSchema);

  const event = await prisma.researchEvent.findFirst({ where: { status: "LIVE" } });
  if (!event) throw new WorldError("No live research bounty right now.", 409);
  if (new Date() > event.deadline) {
    throw new WorldError("The deadline for this bounty has passed.", 409);
  }
  if (!meetsMinWordCount(body.body, event.minWordCount)) {
    throw new WorldError(
      `Papers need at least ${event.minWordCount} words (yours has ${wordCount(body.body)}).`,
      422
    );
  }

  let seasonId = event.seasonId;
  if (!seasonId) {
    const season = await getCurrentSeason();
    if (!season) throw new WorldError("No season is available to attach this paper to.", 409);
    seasonId = season.id;
  }

  const entry = await prisma.entry.create({
    data: {
      seasonId,
      tournament: "RESEARCH_PAPERS",
      title: body.title,
      summary: body.summary,
      body: body.body,
      authorId: user.id,
      researchEventId: event.id,
      revealAuthorship: body.revealAuthorship ?? true,
      status: "SUBMITTED",
      metrics: [],
    },
  });

  return ok(
    {
      id: entry.id,
      title: entry.title,
      researchEventId: event.id,
      wordCount: wordCount(body.body),
      status: entry.status,
    },
    { status: 201 }
  );
});

const closeSchema = z.object({
  eventId: z.string().min(1),
});

/**
 * Admin: close a LIVE event and promote the next QUEUED (by nextEventId or deadline).
 */
export const PATCH = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  if (!isWorldAdmin(user)) throw new WorldError("Admins only.", 403);
  const body = await parseBody(req, closeSchema);

  const events = await prisma.researchEvent.findMany();
  const closing = events.find((e) => e.id === body.eventId);
  if (!closing) throw new WorldError("No such research event.", 404);
  if (closing.status !== "LIVE") throw new WorldError("Only a LIVE event can be closed.", 409);

  const nextId = nextLiveAfterClose(
    events.map((e) => ({
      id: e.id,
      status: e.status as "QUEUED" | "LIVE" | "CLOSED",
      nextEventId: e.nextEventId,
      deadline: e.deadline,
    })),
    closing.id
  );

  await prisma.$transaction(async (tx) => {
    await tx.researchEvent.update({
      where: { id: closing.id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    if (nextId) {
      await tx.researchEvent.update({
        where: { id: nextId },
        data: { status: "LIVE" },
      });
    }
  });

  return ok({ closedId: closing.id, liveId: nextId });
});
