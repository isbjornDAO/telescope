"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Lock, MessageSquare } from "lucide-react";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useWorldQuery } from "@/hooks/use-world";
import { useForumBoards, useTrendingThreads } from "@/hooks/use-forum";
import { Composer } from "@/components/forum/composer";
import { AudienceTag } from "@/components/forum/audience-picker";
import { SidebarWidgets } from "@/components/forum/sidebar-widgets";

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

export function ForumOverview() {
  useActivityTracker();
  const router = useRouter();
  const { data: boards = [] } = useForumBoards();
  const { data: threads = [], isLoading: loading } = useTrendingThreads();
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
          boards={openBoards.map((b) => ({ name: b.name, title: b.title }))}
          onBoardChange={setPostingTo}
          onPosted={(id) => router.push(`/forum/thread/${id}`)}
          audienceOptions={{
            factionSlug: me?.faction?.slug,
            factionName: me?.faction?.name,
            regionSlug: me?.region?.slug,
            regionName: me?.region?.name,
          }}
        />

        <section className="retro-box">
          <div className="retro-box-title">
            <div className="retro-box-icon blue">
              <MessageSquare className="h-5 w-5 drop-shadow-sm" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
              Happening now
            </span>
          </div>
          <div className="p-3 sm:p-4">

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-muted-foreground dark:border-zinc-700">
                Nothing yet. Yours would be the first.
              </p>
            ) : (
              <ul className="space-y-2">
                {threads.slice(0, 6).map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/forum/thread/${t.id}`}
                      className="flex gap-3 rounded-md border border-zinc-200/90 p-3 transition-all hover:border-sky-400 hover:bg-zinc-50/80 dark:border-zinc-700/80 dark:hover:bg-zinc-800/60 bg-white/80 dark:bg-zinc-900/50 shadow-sm"
                    >
                      {t.posts[0]?.imageHash && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.posts[0].imageHash}
                          alt=""
                          className="h-16 w-16 flex-shrink-0 rounded bg-zinc-100 object-cover dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 text-[15px] font-bold leading-snug text-zinc-800 dark:text-zinc-100">
                            {t.subject || t.posts[0]?.comment || "Untitled"}
                          </span>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(t.bumpedAt), { addSuffix: true })}
                          </span>
                        </div>
                        {t.subject && t.posts[0]?.comment && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{t.posts[0].comment}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                            /{t.boardName}/
                          </span>
                          <span className="retro-comments-badge text-zinc-700 dark:text-zinc-200">
                            {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                          </span>
                          {t.restricted && t.audienceLabel && <AudienceTag label={t.audienceLabel} />}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="retro-box">
          <div className="retro-box-title">
            <div className="retro-box-icon slate">
              <MessageSquare className="h-5 w-5 drop-shadow-sm" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
              Boards
            </span>
          </div>
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
      </div>

      {/* Right Column: Sidebar Widgets (~30% / 4 columns) */}
      <div className="lg:col-span-4">
        <SidebarWidgets />
      </div>
    </div>
  );
}
