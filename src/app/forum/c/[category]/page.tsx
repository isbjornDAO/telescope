import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { listTopics, listCategories } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { ForumView } from "@/components/forum/forum-view";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.category },
    select: { title: true, description: true },
  });

  if (!category) return { title: "Category not found" };
  return { title: category.title, description: category.description };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { sort?: string; q?: string };
}) {
  const category = await prisma.category.findFirst({
    where: { slug: params.category, archived: false },
    select: { slug: true, title: true, description: true },
  });

  if (!category) notFound();

  const sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sort)
    : "latest";

  const [{ topics, total }, categories] = await Promise.all([
    listTopics({ categorySlug: category.slug, sort, query: searchParams.q, take: 25 }),
    listCategories(),
  ]);

  return (
    <ForumView
      topics={topics}
      total={total}
      categories={categories}
      sort={sort}
      basePath={`/forum/c/${category.slug}`}
      query={searchParams.q}
      heading={category.title}
      description={category.description}
    />
  );
}
