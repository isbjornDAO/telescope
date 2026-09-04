import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/session";
import { respondToError } from "@/lib/api";
import { voteSchema } from "@/lib/forum";
import { castVote } from "@/lib/vote";

/** POST /api/forum/replies/[replyId]/vote */
export async function POST(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const user = await requireUser();
    const { value } = voteSchema.pick({ value: true }).parse(await request.json());

    const result = await castVote({
      userId: user.id,
      targetId: params.replyId,
      targetType: "reply",
      value,
    });

    return NextResponse.json(result);
  } catch (error) {
    return respondToError(error);
  }
}
