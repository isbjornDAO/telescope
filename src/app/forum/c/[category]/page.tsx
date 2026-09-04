import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { listTopics, listCategories, forumStats } from "@/lib/forum-queries";
import { TopicRow } from "@/components/forum/topic-row";
import { ForumSidebar } from "@/components/forum/sidebar";
import { Button } from "@/components/ui/button";

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
}: {
  params: { category: string };
}) {
  const category = await prisma.category.findFirst({
    where: { slug: params.category, archived: false },
    select: { slug: true, title: true, description: true },
  });

  if (!category) notFound();

  const [{ topics, total }, categories, stats] = await Promise.all([
    listTopics({ categorySlug: category.slug, take: 25 }),
    listCategories(),
    forumStats(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-12">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/forum" className="hover:underline underline-offset-4">
          Forum
        </Link>
      </nav>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{category.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        </div>
        <Button asChild>
          <Link href="/forum/ask" className="gap-2">
            <Plus className="h-4 w-4" />
            Ask a question
          </Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <main className="min-w-0 rounded-xl border border-border bg-card">
          {topics.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium">Nothing here yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask the first question in {category.title}.
              </p>
              <Button asChild className="mt-6">
                <Link href="/forum/ask">Ask a question</Link>
              </Button>
            </div>
          ) : (
            topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
          )}
        </main>

        <ForumSidebar categories={categories} stats={stats} />
      </div>

      {total > topics.length ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing {topics.length} of {total}
        </p>
      ) : null}
    </div>
  );
}
