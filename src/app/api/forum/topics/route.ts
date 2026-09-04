import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { respondToError, pageSize } from "@/lib/api";
import { createTopicSchema, normalizeTags, topicSlug, SORTS, type Sort } from "@/lib/forum";

const AUTHOR_FIELDS = {
  select: { id: true, name: true, handle: true, image: true, reputation: true },
} as const;

/** GET /api/forum/topics — the forum index, filtered and paginated. */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const take = pageSize(params.get("limit"));
    const skip = Math.max(0, Number.parseInt(params.get("skip") ?? "0", 10) || 0);
    const sort = (SORTS as readonly string[]).includes(params.get("sort") ?? "")
      ? (params.get("sort") as Sort)
      : "latest";

    const where: Prisma.TopicWhereInput = { deleted: false };

    const category = params.get("category");
    if (category) {
      const record = await prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      });
      // An unknown category must return nothing rather than everything.
      where.categoryId = record?.id ?? "000000000000000000000000";
    }

    const tag = params.get("tag");
    if (tag) where.tags = { has: tag.toLowerCase() };

    if (sort === "unanswered") {
      where.kind = "question";
      where.solved = false;
      where.replyCount = 0;
    }

    const query = params.get("q")?.trim();
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
      prisma.topic.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          kind: true,
          tags: true,
          score: true,
          replyCount: true,
          viewCount: true,
          solved: true,
          pinned: true,
          createdAt: true,
          lastActivity: true,
          author: AUTHOR_FIELDS,
          category: { select: { slug: true, title: true, icon: true } },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return NextResponse.json({ topics, total, hasMore: skip + topics.length < total });
  } catch (error) {
    return respondToError(error);
  }
}

/** POST /api/forum/topics — ask a question or start a discussion. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = createTopicSchema.parse(await request.json());

    const category = await prisma.category.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true, archived: true },
    });

    if (!category || category.archived) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }

    const tags = normalizeTags(input.tags);

    const topic = await prisma.topic.create({
      data: {
        slug: topicSlug(input.title),
        title: input.title,
        body: input.body,
        kind: input.kind,
        tags,
        categoryId: category.id,
        authorId: user.id,
        lastActivity: new Date(),
      },
      select: { id: true, slug: true, title: true },
    });

    // Tag counters are a display convenience; a failure here must not lose the
    // topic the user just wrote.
    await Promise.all(
      tags.map((slug) =>
        prisma.tag.upsert({
          where: { slug },
          create: { slug, topicCount: 1 },
          update: { topicCount: { increment: 1 } },
        })
      )
    ).catch((error) => console.error("Tag counter update failed:", error));

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    return respondToError(error);
  }
}
