"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, MessageSquare } from "lucide-react";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useWorldQuery } from "@/hooks/use-world";
import { useForumBoards } from "@/hooks/use-forum";
import { Composer } from "@/components/forum/composer";
import { ForumFeed } from "@/components/forum/forum-feed";
import { SidebarWidgets } from "@/components/forum/sidebar-widgets";
import { BoardListSkeleton } from "@/components/ui/retro-skeletons";
import { useQueryClient } from "@tanstack/react-query";

/**
 * The forum, which is also the landing page.
 *
 * Built in this order on purpose: the box you type in, then what people are
 * saying, then the boards. You arrive and you can talk, without scrolling
 * and without a decision. Everything below the composer is browsing, and
 * browsing is the second job.
 *
 * Threads carry an audience tag only when their author narrowed them.
 * A thread you may not read is not shown at all — the API never sends it —
 * so there is no lock icon here standing for a conversation you cannot
 * reach. That is deliberate: see lib/world/forum-access.ts.
 *
 * Mobile first, single column at every width up to md. Every tap target is
 * at least 44px tall and nothing is smaller than 12px.
 */

/** Boards open from the start. The rest earn their way in as the forum fills. */
const UNLOCKS: Record<string, number> = {
  tech: 100,
  defi: 500,
  eco: 1000,
  gov: 2000,
};

interface ForumOverviewProps {
  showBoards?: boolean;
}

export function ForumOverview({ showBoards = false }: ForumOverviewProps = {}) {
  useActivityTracker();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: boards = [], isLoading: boardsLoading } = useForumBoards();
  const [postingTo, setPostingTo] = useState("gen");

  // The world profile, only so the composer can offer the author their own
  // faction and region as audiences. Absent for a signed-out reader, which
  // is fine — they get the node-type choices and nothing breaks.
  const { data: me } = useWorldQuery<{
    signedIn: boolean;
    faction?: { name: string; slug: string } | null;
    region?: { name: string; slug: string } | null;
  }>(["me"], "/api/world/auth/me");

  const created = boards.reduce((sum, b) => sum + (b.totalThreadsCreated || 0), 0);
  const openBoards = boards.filter((b) => !UNLOCKS[b.name] || created >= UNLOCKS[b.name]);
  const lockedBoards = boards.filter((b) => UNLOCKS[b.name] && created < UNLOCKS[b.name]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        <Composer
          boardName={postingTo}
          boards={
            openBoards.length > 0
              ? openBoards.map((b) => ({ name: b.name, title: b.title }))
              : [{ name: "gen", title: "General" }]
          }
          onBoardChange={setPostingTo}
          onPosted={(id) => {
            queryClient.invalidateQueries({ queryKey: ["forum", "feed"] });
            router.push(`/forum/thread/${id}`);
          }}
          audienceOptions={{
            factionSlug: me?.faction?.slug,
            factionName: me?.faction?.name,
            regionSlug: me?.region?.slug,
            regionName: me?.region?.name,
          }}
        />

        {/* Chronological paginated feed of board discussions */}
        <ForumFeed />

        {showBoards && (
          <section className="retro-box">
            <div className="retro-box-title px-3.5 sm:px-4 gap-2">
              <MessageSquare className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
              <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                Boards
              </span>
            </div>
            {boardsLoading ? (
              <BoardListSkeleton count={5} />
            ) : (
              <ul className="divide-y divide-zinc-200 overflow-hidden dark:divide-zinc-800">
                {openBoards.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/forum/${b.name}`}
                      className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-sky-50/50 dark:hover:bg-zinc-800/60"
                    >
                      <span
                        className="w-16 flex-shrink-0 text-xs sm:text-sm font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-center border border-zinc-300/80 dark:border-zinc-700"
                        style={{ color: "var(--telescope-blue)" }}
                      >
                        /{b.name}/
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{b.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{b.description}</span>
                      </span>
                      <span className="retro-comments-badge text-zinc-700 dark:text-zinc-300">
                        {b._count?.threads ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {lockedBoards.length > 0 && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-900/50">
                <ul className="space-y-1">
                  {lockedBoards.map((b) => (
                    <li
                      key={b.id}
                      className="flex min-h-10 items-center gap-2 px-3 text-xs text-muted-foreground"
                    >
                      <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-semibold">/{b.name}/</span>
                      <span className="truncate">{b.title}</span>
                      <span className="ml-auto flex-shrink-0 tabular-nums font-medium">
                        {created} / {UNLOCKS[b.name]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Right Column: Sidebar Widgets (~30% / 4 columns) */}
      <div className="lg:col-span-4">
        <SidebarWidgets />
      </div>
    </div>
  );
}
