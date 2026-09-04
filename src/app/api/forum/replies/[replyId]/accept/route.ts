import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/session";
import { canModerate } from "@/lib/auth";
import { respondToError } from "@/lib/api";
import { REPUTATION } from "@/lib/forum";

/**
 * POST /api/forum/replies/[replyId]/accept — mark a reply as the answer.
 *
 * Only the person who asked (or a moderator) can accept, and only one reply per
 * topic holds the mark. Posting again on the accepted reply clears it, so a
 * mistake is reversible.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const user = await requireUser();

    const reply = await prisma.reply.findFirst({
      where: { id: params.replyId, deleted: false },
      select: {
        id: true,
        authorId: true,
        accepted: true,
        topic: {
          select: { id: true, authorId: true, kind: true, acceptedReplyId: true },
        },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const { topic } = reply;

    if (topic.authorId !== user.id && !canModerate(user.role)) {
      throw new HttpError(403, "Only the author can accept an answer");
    }
    if (topic.kind !== "question") {
      throw new HttpError(400, "Only questions can have an accepted answer");
    }

    const clearing = reply.accepted;

    // Retire whichever reply currently holds the mark, including this one.
    if (topic.acceptedReplyId) {
      const previous = await prisma.reply.findUnique({
        where: { id: topic.acceptedReplyId },
        select: { id: true, authorId: true },
      });

      if (previous) {
        await prisma.reply.update({
          where: { id: previous.id },
          data: { accepted: false },
        });
        await prisma.user.update({
          where: { id: previous.authorId },
          data: { reputation: { decrement: REPUTATION.answerAccepted } },
        });
      }
    }

    if (clearing) {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { acceptedReplyId: null, solved: false },
      });

      // The question is unsolved again, so the asker's closing bonus goes with
      // it. Switching between answers keeps it — they did still accept one.
      if (topic.authorId !== reply.authorId) {
        await prisma.user.update({
          where: { id: topic.authorId },
          data: { reputation: { decrement: REPUTATION.acceptedAnswer } },
        });
      }

      return NextResponse.json({ accepted: false });
    }

    await prisma.reply.update({
      where: { id: reply.id },
      data: { accepted: true },
    });
    await prisma.topic.update({
      where: { id: topic.id },
      data: { acceptedReplyId: reply.id, solved: true, lastActivity: new Date() },
    });

    // The answerer earns the bulk of it; the asker earns a little for closing
    // the loop, which is what keeps the forum's solved rate honest.
    await prisma.user.update({
      where: { id: reply.authorId },
      data: { reputation: { increment: REPUTATION.answerAccepted } },
    });
    if (topic.authorId !== reply.authorId) {
      await prisma.user.update({
        where: { id: topic.authorId },
        data: { reputation: { increment: REPUTATION.acceptedAnswer } },
      });
    }

    return NextResponse.json({ accepted: true });
  } catch (error) {
    return respondToError(error);
  }
}
