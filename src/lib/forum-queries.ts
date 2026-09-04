import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Sort } from "@/lib/forum";

/**
 * Read-only forum queries degrade rather than throw. The forum index and home
 * page are prerendered, so an unreachable database would otherwise fail the
 * build; in production the same guard turns a database blip into an empty
 * state instead of a 500 on the busiest pages. Writes are never wrapped —
 * losing someone's post silently would be far worse than an error.
 */
async function orFallback<T>(query: Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error(`Forum query failed (${context}):`, error);
    return fallback;
  }
}

export const AUTHOR_FIELDS = {
  select: { id: true, name: true, handle: true, image: true, reputation: true },
} as const;

export type TopicListItem = Prisma.TopicGetPayload<{
  select: {
    id: true;
    slug: true;
    title: true;
    body: true;
    kind: true;
    tags: true;
    score: true;
    replyCount: true;
    viewCount: true;
    solved: true;
    pinned: true;
    locked: true;
    createdAt: true;
    lastActivity: true;
    author: typeof AUTHOR_FIELDS;
    category: { select: { slug: true; title: true; icon: true } };
  };
}>;

/**
 * Shared by the forum index and the category pages. Reading through Prisma
 * directly rather than through fetch keeps these pages server-rendered, which
 * is what makes questions indexable.
 */
export async function listTopics({
  categorySlug,
  tag,
  query,
  sort = "latest",
  take = 20,
  skip = 0,
}: {
  categorySlug?: string;
  tag?: string;
  query?: string;
  sort?: Sort;
  take?: number;
  skip?: number;
}): Promise<{ topics: TopicListItem[]; total: number }> {
  const where: Prisma.TopicWhereInput = { deleted: false };

  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    where.categoryId = category?.id ?? "000000000000000000000000";
  }

  if (tag) where.tags = { has: tag.toLowerCase() };

  if (sort === "unanswered") {
    where.kind = "question";
    where.solved = false;
    where.replyCount = 0;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { body: { contains: query, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.TopicOrderByWithRelationInput[] =
    sort === "top"
      ? [{ score: "desc" }, { lastActivity: "desc" }]
      : [{ pinned: "desc" }, { lastActivity: "desc" }];

  const [topics, total] = await Promise.all([
    orFallback(
      prisma.topic.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
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
      },
      }),
      [] as TopicListItem[],
      "listTopics"
    ),
    orFallback(prisma.topic.count({ where }), 0, "countTopics"),
  ]);

  return { topics, total };
}

export async function listCategories() {
  return orFallback(
    prisma.category.findMany({
    where: { archived: false },
    orderBy: { position: "asc" },
    select: {
      slug: true,
      title: true,
      description: true,
      icon: true,
      _count: { select: { topics: true } },
      },
    }),
    [],
    "listCategories"
  );
}

/** Headline numbers for the forum sidebar and the home page. */
export async function forumStats() {
  const [questions, solved, members] = await Promise.all([
    orFallback(
      prisma.topic.count({ where: { deleted: false, kind: "question" } }),
      0,
      "countQuestions"
    ),
    orFallback(
      prisma.topic.count({ where: { deleted: false, solved: true } }),
      0,
      "countSolved"
    ),
    orFallback(prisma.user.count(), 0, "countMembers"),
  ]);

  return {
    questions,
    solved,
    members,
    solvedRate: questions === 0 ? 0 : Math.round((solved / questions) * 100),
  };
}
