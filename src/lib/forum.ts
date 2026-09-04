import { z } from "zod";

/**
 * Reputation awards. Kept in one place so the numbers can be tuned without
 * hunting through route handlers.
 */
export const REPUTATION = {
  topicUpvote: 5,
  topicDownvote: -2,
  replyUpvote: 10,
  replyDownvote: -2,
  answerAccepted: 15,
  /** Awarded to the asker for marking an answer, to encourage closing loops. */
  acceptedAnswer: 2,
} as const;

export const TOPIC_KINDS = ["question", "discussion"] as const;
export type TopicKind = (typeof TOPIC_KINDS)[number];

export const SORTS = ["latest", "top", "unanswered"] as const;
export type Sort = (typeof SORTS)[number];

export const createTopicSchema = z.object({
  title: z.string().trim().min(10, "Give your question a clearer title").max(160),
  body: z.string().trim().min(20, "Add some detail so people can help").max(20_000),
  categorySlug: z.string().trim().min(1, "Pick a category"),
  kind: z.enum(TOPIC_KINDS).default("question"),
  tags: z.array(z.string().trim().toLowerCase()).max(5).default([]),
});

export const createReplySchema = z.object({
  body: z.string().trim().min(2, "Write a reply").max(20_000),
  parentId: z.string().optional(),
});

export const voteSchema = z.object({
  targetType: z.enum(["topic", "reply"]),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

/** URL-safe slug with a short random suffix, so titles can collide freely. */
export function topicSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "topic"}-${suffix}`;
}

export function normalizeTags(tags: string[]): string[] {
  const cleaned = tags
    .map((tag) =>
      tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9+#.-]/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24)
    )
    .filter((tag) => tag.length >= 2);

  return Array.from(new Set(cleaned)).slice(0, 5);
}

/**
 * Reputation delta for a vote transition. `previous` is 0 when the user had not
 * voted; switching an upvote to a downvote therefore reverses both halves.
 */
export function reputationDelta(
  targetType: "topic" | "reply",
  previous: number,
  next: number
): number {
  const up = targetType === "topic" ? REPUTATION.topicUpvote : REPUTATION.replyUpvote;
  const down = targetType === "topic" ? REPUTATION.topicDownvote : REPUTATION.replyDownvote;
  const weigh = (value: number) => (value === 1 ? up : value === -1 ? down : 0);
  return weigh(next) - weigh(previous);
}
