"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Lock, MessageSquare } from "lucide-react";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useWorldQuery } from "@/hooks/use-world";
import { Composer } from "@/components/forum/composer";
import { AudienceTag } from "@/components/forum/audience-picker";

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

interface Board {
  id: string;
  name: string;
  title: string;
  description: string;
  totalThreadsCreated: number;
  _count: { threads: number };
}

interface TrendingThread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  boardName: string;
  posts: { id: string; comment: string; imageHash: string | null }[];
  audienceLabel?: string;
  restricted?: boolean;
}

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
  const [boards, setBoards] = useState<Board[]>([]);
  const [threads, setThreads] = useState<TrendingThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [postingTo, setPostingTo] = useState("gen");

  // The world profile, only so the composer can offer the author their own
  // faction and region as audiences. Absent for a signed-out reader, which
  // is fine — they get the node-type choices and nothing breaks.
  const { data: me } = useWorldQuery<{
    signedIn: boolean;
    faction?: { name: string; slug: string } | null;
    region?: { name: string; slug: string } | null;
  }>(["me"], "/api/world/auth/me");

  const load = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([
        fetch("/api/forum/boards").then((r) => r.json()),
        fetch("/api/forum/trending").then((r) => r.json()),
      ]);
      if (Array.isArray(b)) setBoards(b);
      if (Array.isArray(t)) setThreads(t);
    } catch {
      // A forum that cannot reach its API still renders the composer and the
      // shell. Nothing here is worth an error screen.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const created = boards.reduce((sum, b) => sum + (b.totalThreadsCreated || 0), 0);
  const openBoards = boards.filter((b) => !UNLOCKS[b.name] || created >= UNLOCKS[b.name]);
  const lockedBoards = boards.filter((b) => UNLOCKS[b.name] && created < UNLOCKS[b.name]);

  return (
    <div className="space-y-8">
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

      <section>
        <h2 className="mb-3 text-base font-bold">Happening now</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-muted-foreground dark:border-zinc-700">
            Nothing yet. Yours would be the first.
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/forum/thread/${t.id}`}
                  className="flex gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                >
                  {t.posts[0]?.imageHash && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.posts[0].imageHash}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-lg bg-zinc-100 object-cover dark:bg-zinc-800"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-[15px] font-semibold leading-snug">
                        {t.subject || t.posts[0]?.comment || "Untitled"}
                      </span>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.bumpedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {t.subject && t.posts[0]?.comment && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{t.posts[0].comment}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium" style={{ color: "var(--telescope-blue)" }}>
                        /{t.boardName}/
                      </span>
                      <span>{t.replyCount} replies</span>
                      {t.restricted && t.audienceLabel && <AudienceTag label={t.audienceLabel} />}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
          <MessageSquare className="h-4 w-4" />
          Boards
        </h2>
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {openBoards.map((b) => (
            <li key={b.id}>
              <Link
                href={`/forum/${b.name}`}
                className="flex min-h-14 items-center gap-3 px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span
                  className="w-16 flex-shrink-0 text-sm font-bold"
                  style={{ color: "var(--telescope-blue)" }}
                >
                  /{b.name}/
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{b.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.description}</span>
                </span>
                <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">{b._count?.threads ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>

        {lockedBoards.length > 0 && (
          <ul className="mt-2 space-y-1">
            {lockedBoards.map((b) => (
              <li
                key={b.id}
                className="flex min-h-11 items-center gap-2 px-3 text-xs text-muted-foreground"
              >
                <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">/{b.name}/</span>
                <span className="truncate">{b.title}</span>
                <span className="ml-auto flex-shrink-0 tabular-nums">
                  {created} / {UNLOCKS[b.name]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
