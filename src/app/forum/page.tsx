"use client";

import Link from "next/link";
import { MessageSquare, Lock, ChevronRight } from "lucide-react";
import { useForumBoards } from "@/hooks/use-forum";

/** Boards open from the start. The rest earn their way in as the forum fills. */
const UNLOCKS: Record<string, number> = {
  tech: 100,
  defi: 500,
  eco: 1000,
  gov: 2000,
};

export default function ForumPage() {
  const { data: boards = [], isLoading } = useForumBoards();

  const created = boards.reduce((sum, b) => sum + (b.totalThreadsCreated || 0), 0);
  const openBoards = boards.filter((b) => !UNLOCKS[b.name] || created >= UNLOCKS[b.name]);
  const lockedBoards = boards.filter((b) => UNLOCKS[b.name] && created < UNLOCKS[b.name]);

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Retro Topic Header Breadcrumb */}
      <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
          >
            Home
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Forum Boards
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
          {openBoards.length} {openBoards.length === 1 ? "Channel" : "Channels"} Active
        </span>
      </div>

      {/* Main Boards Box */}
      <section className="retro-box">
        <div className="retro-box-title">
          <div className="retro-box-icon slate">
            <MessageSquare className="h-5 w-5 drop-shadow-sm" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
            Discussion Boards
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden dark:divide-zinc-800">
            {openBoards.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/forum/${b.name}`}
                  className="group flex min-h-16 items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-sky-50/60 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className="w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm font-bold px-2 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-center border border-zinc-300/80 dark:border-zinc-700 group-hover:border-sky-400/80 transition-colors"
                    style={{ color: "var(--telescope-blue)" }}
                  >
                    /{b.name}/
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {b.title}
                    </span>
                    <span className="block truncate text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {b.description}
                    </span>
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="retro-comments-badge text-zinc-700 dark:text-zinc-300">
                      {b._count?.threads ?? 0} {b._count?.threads === 1 ? "thread" : "threads"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {lockedBoards.length > 0 && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Locked Boards
            </div>
            <ul className="space-y-1.5">
              {lockedBoards.map((b) => (
                <li
                  key={b.id}
                  className="flex min-h-10 items-center gap-2.5 px-3 py-1.5 rounded bg-white/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 text-xs text-muted-foreground"
                >
                  <Lock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    /{b.name}/
                  </span>
                  <span className="truncate">{b.title}</span>
                  <span className="ml-auto flex-shrink-0 tabular-nums font-medium text-[11px] bg-zinc-200/60 dark:bg-zinc-700/60 px-2 py-0.5 rounded">
                    {created} / {UNLOCKS[b.name]} threads
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
