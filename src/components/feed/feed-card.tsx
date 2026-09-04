import Link from "next/link";
import {
  MessageCircle,
  Heart,
  Eye,
  CheckCircle2,
  Sparkles,
  Repeat2,
} from "lucide-react";

import { Avatar } from "@/components/forum/avatar";
import { RelativeTime } from "@/components/relative-time";
import type { FeedItem } from "@/lib/feed";

/**
 * A timeline post. The whole card is the tap target — opening it lands on the
 * full forum thread, so the social surface and the discussion are the same
 * content seen two ways.
 */
export function FeedCard({ item }: { item: FeedItem }) {
  const author = item.author.name ?? item.author.handle ?? "Builder";

  return (
    <article className="relative px-4 py-3 transition-colors active:bg-muted/50 sm:hover:bg-muted/30">
      {item.reason ? (
        <p className="mb-1.5 flex items-center gap-1.5 pl-[52px] text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" aria-hidden />
          {item.reason}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Link
          href={item.author.handle ? `/u/${item.author.handle}` : `/forum/t/${item.slug}`}
          className="relative z-10 shrink-0"
          aria-label={author}
        >
          <Avatar name={author} image={item.author.image} size={40} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
            <span className="truncate font-semibold">{author}</span>
            {item.author.handle ? (
              <span className="truncate text-muted-foreground">
                @{item.author.handle}
              </span>
            ) : null}
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="text-muted-foreground">
              <RelativeTime date={item.createdAt} />
            </span>
          </div>

          <h2 className="mt-0.5 text-[15px] font-medium leading-snug">
            {/* Stretched link: the entire card is clickable, while the avatar
                and footer links above it stay independently tappable. */}
            <Link href={`/forum/t/${item.slug}`} className="before:absolute before:inset-0">
              {item.title}
            </Link>
          </h2>

          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {item.category.title}
            </span>
            {item.solved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Solved
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex max-w-sm items-center justify-between text-muted-foreground">
            <Stat icon={MessageCircle} value={item.replyCount} label="replies" />
            <Stat icon={Heart} value={item.score} label="likes" />
            <Stat icon={Eye} value={item.viewCount} label="views" />
            <Repeat2 className="h-4 w-4 opacity-0" aria-hidden />
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Heart;
  value: number;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs tabular-nums"
      title={`${value.toLocaleString()} ${label}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {value > 0 ? compact(value) : ""}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function compact(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
}
