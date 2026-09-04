import Link from "next/link";
import { CheckCircle2, MessageSquare, Pin } from "lucide-react";

import { UserChip } from "@/components/forum/user-chip";
import { RelativeTime } from "@/components/relative-time";
import type { TopicListItem } from "@/lib/forum-queries";

/**
 * One row in the topic list. The score and the solved mark sit on the left so
 * the list can be scanned for "answered or not" without reading any titles.
 */
export function TopicRow({ topic }: { topic: TopicListItem }) {
  return (
    <article className="flex gap-4 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/40">
      <div className="flex w-14 shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className="text-lg font-semibold tabular-nums">{topic.score}</span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {topic.score === 1 ? "vote" : "votes"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {topic.pinned ? (
            <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Pinned" />
          ) : null}
          <h2 className="min-w-0 text-base font-medium leading-snug">
            <Link
              href={`/forum/t/${topic.slug}`}
              className="hover:text-primary hover:underline underline-offset-4"
            >
              {topic.title}
            </Link>
          </h2>
          {topic.solved ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Solved
            </span>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {topic.body}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <Link
            href={`/forum/c/${topic.category.slug}`}
            className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80 hover:bg-muted/70"
          >
            {topic.category.title}
          </Link>

          {topic.tags.map((tag) => (
            <Link
              key={tag}
              href={`/forum?tag=${encodeURIComponent(tag)}`}
              className="rounded-md border border-border px-2 py-0.5 hover:border-foreground/30"
            >
              {tag}
            </Link>
          ))}

          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {topic.replyCount}
          </span>

          <span className="ml-auto inline-flex items-center gap-1.5">
            <UserChip user={topic.author} />
            <RelativeTime date={topic.lastActivity} />
          </span>
        </div>
      </div>
    </article>
  );
}
