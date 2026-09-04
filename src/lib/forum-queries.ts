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
  group,
  tag,
  query,
  sort = "latest",
  take = 20,
  skip = 0,
}: {
  categorySlug?: string;
  /** Restrict to one zone, i.e. every category in that Category.group. */
  group?: string;
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
  } else if (group) {
    const categories = await prisma.category.findMany({
      where: { group, archived: false },
      select: { id: true },
    });
    where.categoryId = { in: categories.map((category) => category.id) };
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

/** All categories, or only those in one zone when `group` is given. */
export async function listCategories(group?: string) {
  return orFallback(
    prisma.category.findMany({
    where: { archived: false, ...(group ? { group } : {}) },
    orderBy: { position: "asc" },
    select: {
      slug: true,
      title: true,
      description: true,
      icon: true,
      group: true,
      _count: { select: { topics: true } },
      },
    }),
    [],
    "listCategories"
  );
}

export type CategoryListItem = Awaited<ReturnType<typeof listCategories>>[number];

/**
 * Categories grouped into their sections, in `position` order. Sections are
 * ordered by the lowest position they contain, so adding a category cannot
 * reshuffle the sections around it.
 */
export async function listCategoryGroups(): Promise<
  { group: string; categories: CategoryListItem[] }[]
> {
  const categories = await listCategories();
  const groups = new Map<string, CategoryListItem[]>();

  for (const category of categories) {
    const existing = groups.get(category.group);
    if (existing) existing.push(category);
    else groups.set(category.group, [category]);
  }

  return Array.from(groups, ([group, items]) => ({ group, categories: items }));
}

/** Topic count per zone, keyed by Category.group. */
export async function topicCountsByGroup(): Promise<Record<string, number>> {
  const categories = await orFallback(
    prisma.category.findMany({
      where: { archived: false },
      select: { group: true, _count: { select: { topics: true } } },
    }),
    [],
    "topicCountsByGroup"
  );

  const counts: Record<string, number> = {};
  for (const category of categories) {
    counts[category.group] = (counts[category.group] ?? 0) + category._count.topics;
  }
  return counts;
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
