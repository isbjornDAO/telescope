import type { Metadata } from "next";
import { Suspense } from "react";

import { currentUser } from "@/lib/session";
import { buildFeed, FEED_TABS, type FeedTab } from "@/lib/feed";
import { listCategories, topicCountsByGroup } from "@/lib/forum-queries";
import { Timeline } from "@/components/feed/timeline";
import { PageNavigation } from "@/components/page-navigation";
import { ZoneCards } from "@/components/forum/zone-cards";

export const metadata: Metadata = {
  description:
    "The Avalanche community timeline. Follow builders, discover what is working, and join the conversation.",
};

export const dynamic = "force-dynamic";

/**
 * The timeline is the front door. The first page is rendered on the server so
 * there is content in the HTML for crawlers and on first paint; every page
 * after it is fetched by the client as you scroll.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const raw = searchParams.tab ?? "discover";
  const tab: FeedTab = (FEED_TABS as readonly string[]).includes(raw)
    ? (raw as FeedTab)
    : "discover";

  const viewer = await currentUser();
  const [items, categories, counts] = await Promise.all([
    buildFeed({ tab, viewerId: viewer?.id ?? null, take: 20 }),
    listCategories(),
    topicCountsByGroup(),
  ]);

  return (
    <div className="mx-auto w-full max-w-screen-lg px-0 md:px-8 md:py-6">
      {/* Desktop keeps the card tabs and the area cards; on mobile the bottom
          bar and the timeline's own tab strip do that work. */}
      <div className="hidden md:block">
        <PageNavigation />
        <div className="mb-5">
          <ZoneCards counts={counts} />
        </div>
      </div>

      <div className="md:grid md:gap-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0 md:overflow-hidden md:rounded-xl md:bg-white md:shadow-md md:dark:bg-zinc-800">
          <Suspense fallback={null}>
            <Timeline initialTab={tab} initialItems={items} />
          </Suspense>
        </div>

        <aside className="hidden md:block">
          <section className="sticky top-6 rounded-xl bg-white p-4 shadow-md dark:bg-zinc-800">
            <h2 className="text-sm font-semibold">Categories</h2>
            <ul className="mt-2 space-y-0.5">
              {categories.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <a
                    href={`/forum/c/${category.slug}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{category.title}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {category._count.topics}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="/categories"
              className="mt-3 inline-block text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All categories →
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
