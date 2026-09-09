"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BOARD_GROUPS, UNLOCK_THRESHOLDS, type Board } from "@/components/forum/use-forum";

function BoardRow({ board, locked }: { board: Board; locked: boolean }) {
  return (
    <Link href={`/forum/${board.name}`} className="block transition-colors hover:bg-accent/40">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="w-[4.5rem] shrink-0 text-sm font-bold ink-accent">/{board.name}/</span>
          <span className="min-w-0 flex flex-col gap-0.5">
            <span className="text-sm font-semibold truncate">{board.title}</span>
            <span className="text-xs text-muted-foreground truncate">{board.description}</span>
          </span>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {locked ? <Lock className="h-3 w-3" strokeWidth={2} /> : board._count.threads}
        </Badge>
      </div>
    </Link>
  );
}

/** Boards live on white cards, one card per category, in the order the world opens them. */
export function BoardList({ boards, className }: { boards: Board[]; className?: string }) {
  return (
    <div className={cn("space-y-10", className)}>
      {BOARD_GROUPS.map((group) => {
        const threshold = UNLOCK_THRESHOLDS[group.label];
        const locked = group.locked;
        // Keep the order the group declares: it is the order rooms were meant to open in.
        const rows = group.names.map((name) => boards.find((b) => b.name === name)).filter((b): b is Board => !!b);
        if (rows.length === 0) return null;

        return (
          <section key={group.label}>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              {group.label}
              {locked && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium normal-case tracking-normal">
                  <Lock className="h-3 w-3" strokeWidth={2} />
                  {threshold.toLocaleString()} threads to unlock
                </span>
              )}
            </h3>
            <div
              className={cn(
                "panel overflow-hidden divide-y divide-[var(--hairline)]",
                locked && "opacity-40 pointer-events-none select-none"
              )}
            >
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
