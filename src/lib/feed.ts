import { prisma } from "@/lib/prisma";
import { AUTHOR_FIELDS, type TopicListItem } from "@/lib/forum-queries";

export const FEED_TABS = ["discover", "following", "trending", "everything"] as const;
export type FeedTab = (typeof FEED_TABS)[number];

export type FeedItem = TopicListItem & {
  /** Why this appeared, shown above the card the way X labels a recommendation. */
  reason?: string;
};

/**
 * Ranking runs in the application, not the database.
 *
 * MongoDB cannot express the decay curve below in a query, so each tab pulls a
 * bounded candidate window ordered by something the database *can* index, then
 * scores it here. At this size that is both fast and far easier to tune than a
 * pipeline; if the candidate window ever stops being big enough to contain the
 * best results, that is the point to move scoring into a materialised column.
 */
const CANDIDATE_WINDOW = 300;

const SELECT = {
  id: true,
  slug: true,
  title: true,
  body: true,
  kind: true,
  tags: true,
  score: true,
  replyCount: true,
  viewCount: true,
  solved: true,
  pinned: true,
  locked: true,
  createdAt: true,
  lastActivity: true,
  author: AUTHOR_FIELDS,
  category: { select: { slug: true, title: true, icon: true } },
} as const;

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / 3_600_000;
}

/**
 * Engagement over time, with a gravity exponent that decides how fast a post
 * falls. Replies count for more than likes because a reply is a costlier
 * signal, and views count for very little because they are cheap and noisy.
 */
function hotness(topic: {
  score: number;
  replyCount: number;
  viewCount: number;
  createdAt: Date;
}): number {
  const engagement =
    topic.score * 3 + topic.replyCount * 5 + Math.min(topic.viewCount, 5000) / 50;
  return (engagement + 1) / Math.pow(hoursSince(topic.createdAt) + 2, 1.5);
}

/** Newest first. The unfiltered firehose. */
async function everything(take: number, skip: number): Promise<FeedItem[]> {
  return prisma.topic.findMany({
    where: { deleted: false },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: SELECT,
  });
}

/** Highest hotness right now, regardless of who wrote it. */
async function trending(take: number, skip: number): Promise<FeedItem[]> {
  const candidates = await prisma.topic.findMany({
    where: { deleted: false },
    orderBy: { lastActivity: "desc" },
    take: CANDIDATE_WINDOW,
    select: SELECT,
  });

  return candidates
    .map((topic) => ({ topic, score: hotness(topic) }))
    .sort((a, b) => b.score - a.score)
    .slice(skip, skip + take)
    .map(({ topic }) => ({
      ...topic,
      reason: `Trending in ${topic.category.title}`,
    }));
}

/**
 * Posts by the people you follow, plus threads they have replied to — the
 * latter is what keeps a following feed alive when you follow people who read
 * more than they post.
 */
async function following(
  viewerId: string,
  take: number,
  skip: number
): Promise<FeedItem[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });

  const ids = follows.map((follow) => follow.followingId);
  if (ids.length === 0) return [];

  const [authored, repliedTo] = await Promise.all([
    prisma.topic.findMany({
      where: { deleted: false, authorId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: CANDIDATE_WINDOW,
      select: SELECT,
    }),
    prisma.reply.findMany({
      where: {
        deleted: false,
        authorId: { in: ids },
        topic: { is: { deleted: false } },
      },
      orderBy: { createdAt: "desc" },
      take: CANDIDATE_WINDOW,
      select: {
        createdAt: true,
        author: { select: { name: true, handle: true } },
        topic: { select: SELECT },
      },
    }),
  ]);

  const seen = new Set<string>();
  const items: { item: FeedItem; at: Date }[] = [];

  for (const topic of authored) {
    seen.add(topic.id);
    items.push({ item: topic, at: topic.createdAt });
  }

  for (const reply of repliedTo) {
    if (!reply.topic || seen.has(reply.topic.id)) continue;
    seen.add(reply.topic.id);
    const who = reply.author.name ?? reply.author.handle ?? "Someone";
    items.push({
      item: { ...reply.topic, reason: `${who} replied` },
      at: reply.createdAt,
    });
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(skip, skip + take)
    .map(({ item }) => item);
}

/**
 * The default feed: what is good right now, leaning towards the subjects this
 * person actually engages with.
 *
 * Affinity comes from the categories they have posted or replied in. Their own
 * posts are excluded — a recommendation feed that shows you your own writing
 * feels broken — and followed authors get a boost so the feed stays warm
 * without being a pure following feed.
 */
async function discover(
  viewerId: string | null,
  take: number,
  skip: number
): Promise<FeedItem[]> {
  const candidates = await prisma.topic.findMany({
    where: { deleted: false, ...(viewerId ? { authorId: { not: viewerId } } : {}) },
    orderBy: { lastActivity: "desc" },
    take: CANDIDATE_WINDOW,
    select: SELECT,
  });

  let affinity = new Map<string, number>();
  let followed = new Set<string>();

  if (viewerId) {
    const [ownTopics, ownReplies, follows] = await Promise.all([
      prisma.topic.findMany({
        where: { authorId: viewerId },
        select: { category: { select: { slug: true } } },
        take: 100,
      }),
      prisma.reply.findMany({
        where: { authorId: viewerId },
        select: { topic: { select: { category: { select: { slug: true } } } } },
        take: 100,
      }),
      prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      }),
    ]);

    const counts = new Map<string, number>();
    for (const topic of ownTopics) {
      counts.set(topic.category.slug, (counts.get(topic.category.slug) ?? 0) + 1);
    }
    for (const reply of ownReplies) {
      const slug = reply.topic?.category.slug;
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }

    // Normalise so someone with 200 posts does not get a runaway multiplier.
    const max = Math.max(1, ...Array.from(counts.values()));
    affinity = new Map(
      Array.from(counts, ([slug, count]) => [slug, count / max])
    );
    followed = new Set(follows.map((follow) => follow.followingId));
  }

  return candidates
    .map((topic) => {
      const base = hotness(topic);
      const affinityBoost = 1 + 0.8 * (affinity.get(topic.category.slug) ?? 0);
      const followBoost = followed.has(topic.author.id) ? 1.5 : 1;
      // A solved question is a demonstrably useful post, so nudge it up.
      const solvedBoost = topic.solved ? 1.15 : 1;
      // Reputation as a light quality prior, capped so it cannot dominate.
      const authorBoost = 1 + Math.min(topic.author.reputation, 3000) / 15000;

      return {
        topic,
        rank: base * affinityBoost * followBoost * solvedBoost * authorBoost,
        reason: followed.has(topic.author.id)
          ? `Because you follow ${topic.author.name ?? topic.author.handle}`
          : affinity.has(topic.category.slug)
            ? `Because you read ${topic.category.title}`
            : undefined,
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(skip, skip + take)
    .map(({ topic, reason }) => ({ ...topic, reason }));
}

export async function buildFeed({
  tab,
  viewerId,
  take = 20,
  skip = 0,
}: {
  tab: FeedTab;
  viewerId: string | null;
  take?: number;
  skip?: number;
}): Promise<FeedItem[]> {
  switch (tab) {
    case "following":
      return viewerId ? following(viewerId, take, skip) : [];
    case "trending":
      return trending(take, skip);
    case "everything":
      return everything(take, skip);
    case "discover":
    default:
      return discover(viewerId, take, skip);
  }
}
