import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/session";
import { reputationDelta } from "@/lib/forum";

type TargetType = "topic" | "reply";

/**
 * Apply a vote and keep the three things it touches in step: the vote record,
 * the target's score, and the author's reputation.
 *
 * `value` of 0 retracts an existing vote. Re-sending the same value also
 * retracts, so the UI can treat the vote buttons as toggles.
 */
export async function castVote({
  userId,
  targetId,
  targetType,
  value,
}: {
  userId: string;
  targetId: string;
  targetType: TargetType;
  value: number;
}): Promise<{ score: number; value: number }> {
  const target =
    targetType === "topic"
      ? await prisma.topic.findFirst({
          where: { id: targetId, deleted: false },
          select: { id: true, authorId: true, score: true, locked: true },
        })
      : await prisma.reply.findFirst({
          where: { id: targetId, deleted: false },
          select: { id: true, authorId: true, score: true },
        });

  if (!target) throw new HttpError(404, "Not found");
  if ("locked" in target && target.locked) {
    throw new HttpError(423, "This topic is locked");
  }
  if (target.authorId === userId) {
    throw new HttpError(400, "You cannot vote on your own post");
  }

  const existing = await prisma.postVote.findUnique({
    where: { userId_targetId: { userId, targetId } },
    select: { id: true, value: true },
  });

  const previous = existing?.value ?? 0;
  // Clicking the same arrow again clears the vote.
  const next = value === 0 || value === previous ? 0 : value;

  if (next === previous) {
    return { score: target.score, value: previous };
  }

  if (next === 0) {
    await prisma.postVote.delete({ where: { userId_targetId: { userId, targetId } } });
  } else if (existing) {
    await prisma.postVote.update({
      where: { userId_targetId: { userId, targetId } },
      data: { value: next },
    });
  } else {
    await prisma.postVote.create({
      data: { userId, targetId, targetType, value: next },
    });
  }

  const scoreDelta = next - previous;
  const score = target.score + scoreDelta;

  if (targetType === "topic") {
    await prisma.topic.update({
      where: { id: targetId },
      data: { score: { increment: scoreDelta } },
    });
  } else {
    await prisma.reply.update({
      where: { id: targetId },
      data: { score: { increment: scoreDelta } },
    });
  }

  const repDelta = reputationDelta(targetType, previous, next);
  if (repDelta !== 0) {
    await prisma.user.update({
      where: { id: target.authorId },
      data: { reputation: { increment: repDelta } },
    });
  }

  return { score, value: next };
}
