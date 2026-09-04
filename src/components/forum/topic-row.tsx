import Link from "next/link";
import { CheckCircle2, MessageSquare, Eye, Pin, Lock } from "lucide-react";

import { Avatar } from "@/components/forum/avatar";
import { RelativeTime } from "@/components/relative-time";
import type { TopicListItem } from "@/lib/forum-queries";

/**
 * A conventional forum row: avatar, title, who and where, then reply and view
 * counts on the right.
 *
 * On mobile the counts move under the title as inline metadata rather than
 * being squeezed into columns — a two-column count block at 390px leaves the
 * title about 15 characters, which is unreadable.
 */
export function TopicRow({ topic }: { topic: TopicListItem }) {
  const author = topic.author.name ?? topic.author.handle ?? "Builder";

  return (
    <article className="flex gap-3 px-3 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/40 sm:gap-4 sm:px-4">
      <Link
        href={topic.author.handle ? `/u/${topic.author.handle}` : `/forum/t/${topic.slug}`}
        className="shrink-0 pt-0.5"
        aria-label={author}
      >
        <Avatar name={author} image={topic.author.image} size={36} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] font-medium leading-snug">
            <Link href={`/forum/t/${topic.slug}`} className="hover:text-primary">
              {topic.pinned ? (
                <Pin className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-amber-500" aria-label="Pinned" />
              ) : null}
              {topic.locked ? (
                <Lock className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-muted-foreground" aria-label="Locked" />
              ) : null}
              {topic.title}
            </Link>
          </h3>

          {topic.solved ? (
            <span
              className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 sm:px-2"
              title="Solved"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">Solved</span>
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link
            href={`/forum/c/${topic.category.slug}`}
            className="font-medium text-foreground/70 hover:text-foreground"
          >
            {topic.category.title}
          </Link>
          <span className="hidden xs:inline" aria-hidden>·</span>
          <span className="hidden truncate xs:inline">{author}</span>
          <span aria-hidden>·</span>
          <RelativeTime date={topic.lastActivity} />

          {topic.tags.length > 0 ? (
            <span className="hidden gap-1.5 sm:inline-flex">
              {topic.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/forum?tag=${encodeURIComponent(tag)}`}
                  className="rounded border border-border px-1.5 py-px hover:border-foreground/30"
                >
                  {tag}
                </Link>
              ))}
            </span>
          ) : null}

        </div>
      </div>

      {/* Counts keep a fixed right-hand column at every width. Inlining them in
          the metadata line pushed it past 390px and wrapped the reply count
          onto a line of its own. Views are desktop-only — replies are the
          number people actually scan for. */}
      <div className="flex shrink-0 items-center gap-4 pl-1 text-right sm:gap-6 sm:pl-2">
        <Count value={topic.replyCount} label="replies" icon={MessageSquare} />
        <div className="hidden sm:block">
          <Count value={topic.viewCount} label="views" icon={Eye} />
        </div>
      </div>
    </article>
  );
}

function Count({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  /** Plural form; the singular is derived by dropping the trailing "s". */
  label: string;
  icon: typeof MessageSquare;
}) {
  const word = value === 1 ? label.replace(/s$/, "") : label;

  return (
    <div className="w-9 sm:w-12" title={`${value.toLocaleString()} ${word}`}>
      <div className="flex items-center justify-end gap-1 text-sm font-medium tabular-nums">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        {compact(value)}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {word}
      </div>
    </div>
  );
}

function compact(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
}
