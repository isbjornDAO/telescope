"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Thread } from "@/components/forum/use-forum";

/** One thread as a square card. Image on top when there is one, meta pinned to the floor. */
export function ThreadCard({ thread }: { thread: Thread }) {
  const preview = thread.posts[0]?.comment?.trim() || "No content";
  const image = thread.posts[0]?.imageHash;

  return (
    <Link
      href={`/forum/thread/${thread.id}`}
      className="group panel aspect-square flex flex-col overflow-hidden transition-colors hover:border-[var(--accent-ink)]/40"
    >
      {image && (
        <div className="h-2/5 shrink-0 overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex flex-1 flex-col min-h-0 p-4">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[var(--accent-ink)] transition-colors">
          {thread.subject || preview.slice(0, 70)}
        </h3>
        <p className={cn("text-xs text-muted-foreground leading-relaxed mt-2 flex-1 min-h-0", image ? "line-clamp-3" : "line-clamp-5")}>
          {preview}
        </p>
        <div className="flex items-center gap-2 pt-3 mt-auto text-[11px] text-muted-foreground border-t border-[var(--hairline)]">
          <span className="font-semibold ink-accent truncate">/{thread.boardName}/</span>
          <span className="inline-flex items-center gap-1 tabular-nums shrink-0">
            <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
            {thread.replyCount}
          </span>
          <span className="ml-auto shrink-0 truncate">{formatDistanceToNow(new Date(thread.bumpedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}

export function ThreadList({ threads, className }: { threads: Thread[]; className?: string }) {
  if (threads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--surface-border)] px-6 py-12 text-center text-sm text-muted-foreground">
        Nothing has been said yet. The first thread is the loudest.
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 xl:grid-cols-3 gap-4", className)}>
      {threads.map((t) => (
        <ThreadCard key={t.id} thread={t} />
      ))}
    </div>
  );
}
