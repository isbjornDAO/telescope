import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/session";
import { respondToError } from "@/lib/api";
import { createReplySchema } from "@/lib/forum";

/** POST /api/forum/topics/[slug]/replies — answer or comment on a topic. */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await requireUser();
    const input = createReplySchema.parse(await request.json());

    const topic = await prisma.topic.findFirst({
      where: { slug: params.slug, deleted: false },
      select: { id: true, locked: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    if (topic.locked) {
      throw new HttpError(423, "This topic is locked");
    }

    const reply = await prisma.reply.create({
      data: {
        body: input.body,
        topicId: topic.id,
        authorId: user.id,
        parentId: input.parentId,
      },
      include: {
        author: {
          select: { id: true, name: true, handle: true, image: true, reputation: true },
        },
      },
    });

    await prisma.topic.update({
      where: { id: topic.id },
      data: { replyCount: { increment: 1 }, lastActivity: new Date() },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    return respondToError(error);
  }
}
