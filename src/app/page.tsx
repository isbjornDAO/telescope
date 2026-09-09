"use client";

import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { PageNavigation } from "@/components/page-navigation";
import { ProfileWindow } from "@/components/home/profile-window";
import { WorldWindow } from "@/components/home/world-window";
import { ThreadList } from "@/components/forum/thread-list";
import { BoardList } from "@/components/forum/board-list";
import { useForumData } from "@/components/forum/use-forum";
import { NewsFeed } from "@/components/news-feed";
import { MoreLink } from "@/components/world/primitives";
import { useActivityTracker } from "@/hooks/use-activity-tracker";

/** The forum is the front door. Everything else in the world sits beside it. */
export default function Home() {
  useActivityTracker();
  const { boards, threads, loading, stats, unlockProgress } = useForumData();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-2 pb-24">
      <PageNavigation />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-[auto_minmax(0,1fr)] gap-10 xl:gap-16">
        {/* Who you are. First thing on a phone, top of the rail on a desktop. */}
        <aside className="lg:col-start-2 lg:row-start-1 mb-4 lg:mb-0">
          <ProfileWindow />
        </aside>

        {/* The conversation */}
        <div className="min-w-0 space-y-20 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <section>
            <header className="mb-8">
              <h1 className="text-3xl md:text-[2.5rem] font-semibold tracking-tight">What the world is arguing about</h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground mt-3 max-w-xl text-pretty">
                Telescope is a world, not a social network. Argue here about what is worth building, then go build it.
              </p>
            </header>

            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <ThreadList threads={threads.slice(0, 6)} />
            )}
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl font-semibold tracking-tight">Rooms</h2>
              <MoreLink href="/forum">the whole forum</MoreLink>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <BoardList boards={boards} />
            )}
            <p className="text-xs text-muted-foreground mt-10 tabular-nums">
              {stats.totalBoards} rooms · {stats.totalThreads} live threads · {unlockProgress} threads all time
            </p>
          </section>

          {/* What the rest of the ecosystem is writing, under what the world is saying. */}
          <section>
            <div className="flex items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
                <Newspaper className="h-5 w-5 ink-accent" strokeWidth={1.75} />
                News
              </h2>
              <MoreLink href="/news">all articles</MoreLink>
            </div>
            <NewsFeed limit={6} />
          </section>
        </div>

        {/* Where you are */}
        <aside className="space-y-6 lg:col-start-2 lg:row-start-2 lg:sticky lg:top-20 lg:self-start">
          <WorldWindow />
          <div className="panel p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">What to do now</h2>
            <ul className="mt-4 divide-y divide-[var(--hairline)] text-sm">
              {[
                { href: "/scout", title: "Send a scout", body: "It searches while you sleep and only brings back matches worth a conversation." },
                { href: "/trust", title: "Get vouched in a room", body: "Trust is earned in rooms. Votes with no path to an Anchor weigh nothing." },
                { href: "/crews", title: "Form a crew", body: "Crews ship; factions last." },
              ].map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="group block py-3.5">
                    <span className="flex items-center gap-1.5 font-medium group-hover:text-[var(--accent-ink)] transition-colors">
                      {i.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" strokeWidth={1.75} />
                    </span>
                    <span className="block text-xs text-muted-foreground leading-relaxed mt-1">{i.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
