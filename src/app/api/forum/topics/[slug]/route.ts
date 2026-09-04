import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { currentUser, requireUser, HttpError } from "@/lib/session";
import { canModerate } from "@/lib/auth";
import { respondToError } from "@/lib/api";

const AUTHOR_FIELDS = {
  select: { id: true, name: true, handle: true, image: true, reputation: true },
} as const;

/** GET /api/forum/topics/[slug] — a topic with its replies and the viewer's votes. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const topic = await prisma.topic.findFirst({
      where: { slug: params.slug, deleted: false },
      include: {
        author: AUTHOR_FIELDS,
        category: { select: { slug: true, title: true, icon: true } },
        replies: {
          where: { deleted: false },
          orderBy: [{ accepted: "desc" }, { score: "desc" }, { createdAt: "asc" }],
          include: { author: AUTHOR_FIELDS },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Fire-and-forget: a view counter is never worth failing a page read over.
    prisma.topic
      .update({ where: { id: topic.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    const viewer = await currentUser();
    let votes: Record<string, number> = {};

    if (viewer) {
      const ids = [topic.id, ...topic.replies.map((reply) => reply.id)];
      const cast = await prisma.postVote.findMany({
        where: { userId: viewer.id, targetId: { in: ids } },
        select: { targetId: true, value: true },
      });
      votes = Object.fromEntries(cast.map((vote) => [vote.targetId, vote.value]));
    }

    return NextResponse.json({ topic, votes });
  } catch (error) {
    return respondToError(error);
  }
}

/**
 * DELETE /api/forum/topics/[slug] — soft delete, by the author or a moderator.
 * Content is retained so replies keep their context and moderation is auditable.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await requireUser();
    const topic = await prisma.topic.findUnique({
      where: { slug: params.slug },
      select: { id: true, authorId: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.authorId !== user.id && !canModerate(user.role)) {
      throw new HttpError(403, "You cannot delete this topic");
    }

    await prisma.topic.update({
      where: { id: topic.id },
      data: { deleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return respondToError(error);
  }
}
