"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Thread } from "@/components/forum/use-forum";

/** One line of conversation. Flat row, hairline between, room to breathe. */
export function ThreadRow({ thread }: { thread: Thread }) {
  const preview = thread.posts[0]?.comment?.trim() || "No content";
  const image = thread.posts[0]?.imageHash;

  return (
    <Link
      href={`/forum/thread/${thread.id}`}
      className="group flex gap-5 py-5 first:pt-0 transition-colors"
    >
      {image && (
        <div className="hidden sm:block w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="font-semibold text-[15px] leading-snug truncate group-hover:text-[var(--accent-ink)] transition-colors">
            {thread.subject || preview.slice(0, 70)}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1.5">{preview}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="font-medium ink-accent">/{thread.boardName}/</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
            {thread.replyCount}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDistanceToNow(new Date(thread.bumpedAt), { addSuffix: true })}</span>
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
    <div className={cn("divide-y divide-[var(--hairline)]", className)}>
      {threads.map((t) => (
        <ThreadRow key={t.id} thread={t} />
      ))}
    </div>
  );
}
