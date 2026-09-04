import Link from "next/link";
import { Plus } from "lucide-react";

import { TopicRow } from "@/components/forum/topic-row";
import { CategoryBar } from "@/components/forum/category-bar";
import { ForumSearch } from "@/components/forum/search";
import { Button } from "@/components/ui/button";
import type { TopicListItem } from "@/lib/forum-queries";
import { type Sort } from "@/lib/forum";

const TABS: { sort: Sort; label: string }[] = [
  { sort: "latest", label: "Latest" },
  { sort: "top", label: "Top" },
  { sort: "unanswered", label: "Unanswered" },
];

type Category = {
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  group: string;
  _count: { topics: number };
};

/**
 * The forum index, shared by the home page and category pages so both read
 * identically. `basePath` keeps the sort tabs pointing at whichever route is
 * rendering it.
 */
export function ForumView({
  topics,
  total,
  categories,
  sort,
  basePath = "/",
  tag,
  query,
  heading,
  description,
  showTabs = true,
}: {
  topics: TopicListItem[];
  total: number;
  categories: Category[];
  sort: Sort;
  basePath?: string;
  tag?: string;
  query?: string;
  heading?: string;
  description?: string;
  showTabs?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-6">
      {heading ? (
        <header className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {heading}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}

      <CategoryBar categories={categories} />

      <div className="mt-3 flex items-center gap-2">
        {showTabs ? (
          <nav className="flex gap-0.5" aria-label="Sort topics">
            {TABS.map((tab) => {
              const active = tab.sort === sort;
              const params = new URLSearchParams();
              if (tab.sort !== "latest") params.set("sort", tab.sort);
              if (tag) params.set("tag", tag);
              if (query) params.set("q", query);
              const qs = params.toString();

              return (
                <Link
                  key={tab.sort}
                  href={qs ? `${basePath}?${qs}` : basePath}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <ForumSearch defaultValue={query ?? ""} />
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link href="/forum/ask">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New topic</span>
              <span className="sr-only sm:hidden">New topic</span>
            </Link>
          </Button>
        </div>
      </div>

      {tag ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Tagged <span className="font-medium text-foreground">{tag}</span> ·{" "}
          <Link href={basePath} className="underline underline-offset-4">
            clear
          </Link>
        </p>
      ) : null}

      <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {topics.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
        )}
      </div>

      {total > topics.length ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing {topics.length} of {total} topics
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium">
        {query ? `No topics match “${query}”.` : "No topics yet."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? "Try a different search, or ask it yourself." : "Start the first one."}
      </p>
      <Button asChild className="mt-6">
        <Link href="/forum/ask">New topic</Link>
      </Button>
    </div>
  );
}
