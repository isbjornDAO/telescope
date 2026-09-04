import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { respondToError } from "@/lib/api";
import { voteSchema } from "@/lib/forum";
import { castVote } from "@/lib/vote";

/** POST /api/forum/topics/[slug]/vote */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await requireUser();
    const { value } = voteSchema.pick({ value: true }).parse(await request.json());

    const topic = await prisma.topic.findFirst({
      where: { slug: params.slug, deleted: false },
      select: { id: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const result = await castVote({
      userId: user.id,
      targetId: topic.id,
      targetType: "topic",
      value,
    });

    return NextResponse.json(result);
  } catch (error) {
    return respondToError(error);
  }
}
