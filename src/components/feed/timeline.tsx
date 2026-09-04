"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { FeedCard } from "@/components/feed/feed-card";
import { Button } from "@/components/ui/button";
import { FEED_TABS, type FeedTab, type FeedItem } from "@/lib/feed";

const LABELS: Record<FeedTab, string> = {
  discover: "Discover",
  following: "Following",
  trending: "Trending",
  everything: "Everything",
};

const PAGE = 20;

/**
 * The timeline: four ranked feeds behind a sticky tab strip, with infinite
 * scroll.
 *
 * The active tab lives in the URL so a feed is linkable and survives a reload,
 * and each tab keeps its own loaded pages in memory so switching back and forth
 * does not refetch or lose your scroll position.
 */
export function Timeline({
  initialTab,
  initialItems,
}: {
  initialTab: FeedTab;
  initialItems: FeedItem[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const urlTab = (params.get("tab") ?? initialTab) as FeedTab;
  const tab: FeedTab = FEED_TABS.includes(urlTab) ? urlTab : "discover";

  const [cache, setCache] = useState<Partial<Record<FeedTab, FeedItem[]>>>({
    [initialTab]: initialItems,
  });
  const [hasMore, setHasMore] = useState<Partial<Record<FeedTab, boolean>>>({
    [initialTab]: initialItems.length === PAGE,
  });
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const items = cache[tab];
  const sentinel = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (target: FeedTab, skip: number) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/feed?tab=${target}&skip=${skip}&limit=${PAGE}`
        );
        if (!response.ok) throw new Error("feed request failed");

        const data = await response.json();
        setNeedsSignIn(!!data.needsSignIn);
        setCache((previous) => ({
          ...previous,
          [target]: skip === 0 ? data.items : [...(previous[target] ?? []), ...data.items],
        }));
        setHasMore((previous) => ({ ...previous, [target]: !!data.hasMore }));
      } catch {
        setHasMore((previous) => ({ ...previous, [target]: false }));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch a tab the first time it is opened.
  useEffect(() => {
    if (cache[tab] === undefined) load(tab, 0);
  }, [tab, cache, load]);

  // Infinite scroll: load the next page once the sentinel comes into view.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || loading || !hasMore[tab]) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) load(tab, cache[tab]?.length ?? 0);
      },
      { rootMargin: "600px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, cache, hasMore, loading, load]);

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-px border-b border-border bg-background/85 backdrop-blur">
        <nav
          className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Timeline"
        >
          {FEED_TABS.map((name) => {
            const active = name === tab;
            return (
              <button
                key={name}
                onClick={() => router.push(`/?tab=${name}`, { scroll: false })}
                aria-current={active ? "page" : undefined}
                className="relative min-w-0 flex-1 whitespace-nowrap px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span className={active ? "text-foreground" : "text-muted-foreground"}>
                  {LABELS[name]}
                </span>
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-12 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {items === undefined ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyFeed tab={tab} needsSignIn={needsSignIn} />
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <FeedCard key={`${tab}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      <div ref={sentinel} className="h-px" />

      {loading && items !== undefined ? (
        <p className="flex justify-center py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="sr-only">Loading more</span>
        </p>
      ) : null}

      {items && items.length > 0 && !hasMore[tab] ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You are all caught up.
        </p>
      ) : null}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 px-4 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed({ tab, needsSignIn }: { tab: FeedTab; needsSignIn: boolean }) {
  if (tab === "following" && needsSignIn) {
    return (
      <div className="px-8 py-16 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-4 font-medium">Sign in to build your feed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow the people whose work you want to keep up with.
        </p>
        <Button asChild className="mt-6">
          <Link href="/signin?callbackUrl=/?tab=following">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (tab === "following") {
    return (
      <div className="px-8 py-16 text-center">
        <p className="font-medium">You are not following anyone yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow a few people and their posts will show up here.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/?tab=trending">See what is trending</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-8 py-16 text-center">
      <p className="font-medium">Nothing here yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Be the first to post something.
      </p>
      <Button asChild className="mt-6">
        <Link href="/forum/ask">New post</Link>
      </Button>
    </div>
  );
}
