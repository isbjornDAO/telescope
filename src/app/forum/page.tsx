import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { listTopics, listCategories, forumStats } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { TopicRow } from "@/components/forum/topic-row";
import { ForumSidebar } from "@/components/forum/sidebar";
import { ForumSearch } from "@/components/forum/search";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "Ask questions and get answers about building on Avalanche. Support forum for build.avax.network.",
};

// Questions change often; a short revalidate keeps the list fresh without
// giving up static rendering entirely.
export const revalidate = 30;

const TABS: { sort: Sort; label: string }[] = [
  { sort: "latest", label: "Latest" },
  { sort: "top", label: "Top" },
  { sort: "unanswered", label: "Unanswered" },
];

export default async function ForumPage({
  searchParams,
}: {
  searchParams: { sort?: string; tag?: string; q?: string };
}) {
  const sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sort)
    : "latest";

  const [{ topics, total }, categories, stats] = await Promise.all([
    listTopics({ sort, tag: searchParams.tag, query: searchParams.q, take: 25 }),
    listCategories(),
    forumStats(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forum</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask anything about building on Avalanche. Answers get accepted, and
            the people who write them get credit.
          </p>
        </div>
        <Button asChild>
          <Link href="/forum/ask" className="gap-2">
            <Plus className="h-4 w-4" />
            Ask a question
          </Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
        <main className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex gap-1" aria-label="Sort topics">
              {TABS.map((tab) => {
                const active = tab.sort === sort;
                const params = new URLSearchParams();
                params.set("sort", tab.sort);
                if (searchParams.tag) params.set("tag", searchParams.tag);
                if (searchParams.q) params.set("q", searchParams.q);

                return (
                  <Link
                    key={tab.sort}
                    href={`/forum?${params.toString()}`}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            <ForumSearch defaultValue={searchParams.q ?? ""} />
          </div>

          {searchParams.tag ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Tagged <span className="font-medium text-foreground">{searchParams.tag}</span>{" "}
              · <Link href="/forum" className="underline underline-offset-4">clear</Link>
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-border bg-card">
            {topics.length === 0 ? (
              <EmptyState query={searchParams.q} />
            ) : (
              topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
            )}
          </div>

          {total > topics.length ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Showing {topics.length} of {total} topics
            </p>
          ) : null}
        </main>

        <ForumSidebar categories={categories} stats={stats} />
      </div>
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium">
        {query ? `No topics match “${query}”.` : "No questions yet."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {query
          ? "Try a different search, or ask it yourself."
          : "Be the first to ask one."}
      </p>
      <Button asChild className="mt-6">
        <Link href="/forum/ask">Ask a question</Link>
      </Button>
    </div>
  );
}
