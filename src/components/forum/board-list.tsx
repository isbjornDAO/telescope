"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOARD_GROUPS, UNLOCK_THRESHOLDS, type Board } from "@/components/forum/use-forum";

function BoardRow({ board, locked }: { board: Board; locked: boolean }) {
  return (
    <Link
      href={`/forum/${board.name}`}
      className="group flex items-center gap-5 py-4 transition-colors hover:bg-accent/40 -mx-3 px-3 rounded-lg"
    >
      <span className="w-[4.5rem] shrink-0 text-sm font-semibold ink-accent">/{board.name}/</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate group-hover:text-[var(--accent-ink)] transition-colors">{board.title}</span>
        <span className="block text-xs text-muted-foreground truncate mt-0.5">{board.description}</span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {locked || board._count.threads === 0 ? <Lock className="h-3.5 w-3.5" strokeWidth={1.75} /> : board._count.threads}
      </span>
    </Link>
  );
}

export function BoardList({ boards, unlockProgress, className }: { boards: Board[]; unlockProgress: number; className?: string }) {
  return (
    <div className={cn("space-y-12", className)}>
      {BOARD_GROUPS.map((group) => {
        const threshold = UNLOCK_THRESHOLDS[group.label];
        const locked = threshold !== undefined && unlockProgress < threshold;
        const rows = group.names
          .map((name) => boards.find((b) => b.name === name))
          .filter((b): b is Board => !!b);
        if (rows.length === 0) return null;

        return (
          <section key={group.label}>
            <div className="flex items-baseline justify-between gap-4 mb-3 pb-3 border-b border-[var(--hairline)]">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</h3>
              {locked && (
                <span className="shrink-0 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3" strokeWidth={1.75} />
                  {threshold.toLocaleString()} threads to unlock
                </span>
              )}
            </div>
            <div className={cn("divide-y divide-[var(--hairline)]", locked && "opacity-40 pointer-events-none select-none")}>
              {rows.map((board) => (
                <BoardRow key={board.id} board={board} locked={locked} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
