import Link from "next/link";
import { Code2, Compass, Wrench, MessagesSquare, ArrowRight, type LucideIcon } from "lucide-react";

import { MAIN_ZONES } from "@/lib/zones";

const ICONS: Record<string, LucideIcon> = {
  Code2,
  Compass,
  Wrench,
  MessagesSquare,
};

/**
 * Three cards on the home page saying, in plain words, what each area is for.
 *
 * Without this the front page is one undifferentiated list where a merchant
 * pilot sits next to a validator stack trace, and a non-developer reasonably
 * concludes the forum is not for them.
 */
export function ZoneCards({ counts }: { counts: Record<string, number> }) {
  return (
    <section aria-label="Areas of the forum" className="grid gap-3 sm:grid-cols-3">
      {MAIN_ZONES.map((zone) => {
        const Icon = ICONS[zone.icon] ?? MessagesSquare;
        const count = counts[zone.group] ?? 0;

        return (
          <Link
            key={zone.slug}
            href={`/z/${zone.slug}`}
            className="group flex flex-col rounded-xl bg-white p-3.5 shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-800 sm:p-4"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="font-semibold">{zone.label}</span>
            </span>

            <span className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
              {zone.tagline}
            </span>

            <span className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {count} {count === 1 ? "topic" : "topics"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}
