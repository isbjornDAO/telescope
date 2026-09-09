"use client";

import { Anchor, Crown, Snowflake, Flame, Sparkles, Package, Link2, MessageSquare, Calendar, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RARITY_TONE, type Badge } from "@/lib/badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GLYPHS = { anchor: Anchor, crown: Crown, snowflake: Snowflake, flame: Flame, sparkles: Sparkles, package: Package, link: Link2, message: MessageSquare, calendar: Calendar };

function Face({ badge }: { badge: Badge }) {
  if (badge.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={badge.imageUrl}
        alt=""
        className={cn("h-11 w-11 rounded-lg object-cover", !badge.earned && "grayscale")}
        loading="lazy"
      />
    );
  }
  const Glyph = GLYPHS[badge.glyph ?? "sparkles"];
  return <Glyph className="h-6 w-6" strokeWidth={1.5} />;
}

/** One badge. Earned badges carry their rarity in colour; locked ones say how to get them. */
export function BadgeTile({ badge }: { badge: Badge }) {
  const pct = Math.round((badge.progress ?? 0) * 100);

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-xl border px-3 py-5 text-center transition-colors",
              badge.earned ? RARITY_TONE[badge.rarity] : "border-dashed border-[var(--surface-border)] text-muted-foreground/70"
            )}
          >
            <span className="relative flex h-11 w-11 items-center justify-center">
              <Face badge={badge} />
              {!badge.earned && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                  <Lock className="h-3 w-3" strokeWidth={2} />
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium leading-tight text-foreground/90 truncate">{badge.name}</span>
              <span className="block text-[10px] uppercase tracking-[0.12em] mt-1 opacity-70">{badge.rarity}</span>
            </span>
            {!badge.earned && badge.progress !== undefined && badge.progress > 0 && (
              <span className="absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-[var(--surface-border)]" aria-hidden>
                <span className="block h-full rounded-full bg-[var(--accent-ink)]" style={{ width: `${pct}%` }} />
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs mt-1 opacity-90">{badge.earned ? badge.description : badge.how}</p>
          {!badge.earned && badge.progress !== undefined && badge.progress > 0 && (
            <p className="text-xs mt-1 opacity-70 tabular-nums">{pct}% of the way there</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BadgeGrid({ badges, className }: { badges: Badge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3", className)}>
      {badges.map((b) => (
        <BadgeTile key={b.id} badge={b} />
      ))}
    </div>
  );
}

/** A tight row of earned badges, for a profile header. */
export function BadgeRow({ badges, max = 8 }: { badges: Badge[]; max?: number }) {
  const shown = badges.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((b) => {
          const Glyph = GLYPHS[b.glyph ?? "sparkles"];
          return (
            <Tooltip key={b.id}>
              <TooltipTrigger asChild>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", RARITY_TONE[b.rarity])}>
                  {b.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={b.imageUrl} alt="" className="h-5 w-5 rounded object-cover" loading="lazy" />
                  ) : (
                    <Glyph className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-56">
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs mt-1 opacity-90">{b.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {badges.length > max && <span className="text-xs text-muted-foreground ml-1">+{badges.length - max}</span>}
      </div>
    </TooltipProvider>
  );
}
