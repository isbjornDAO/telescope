"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Globe2, Snowflake, Radar, Users, Flag, MapPin, Link2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldSession } from "@/hooks/use-world";

const TABS = [
  { href: "/", label: "Forum", icon: MessageSquare, match: (p: string) => p === "/" || p.startsWith("/forum") },
  { href: "/world", label: "World", icon: Globe2, match: (p: string) => p.startsWith("/world") && !p.startsWith("/world-admin") },
  { href: "/seasons", label: "Seasons", icon: Snowflake, match: (p: string) => p.startsWith("/seasons") || p.startsWith("/entries") || p.startsWith("/rounds") },
  { href: "/scout", label: "Scout", icon: Radar, match: (p: string) => p.startsWith("/scout") },
  { href: "/trust", label: "Trust", icon: Link2, match: (p: string) => p.startsWith("/trust") },
  { href: "/crews", label: "Crews", icon: Users, match: (p: string) => p.startsWith("/crews") },
  { href: "/factions", label: "Factions", icon: Flag, match: (p: string) => p.startsWith("/factions") },
  { href: "/regions", label: "Regions", icon: MapPin, match: (p: string) => p.startsWith("/regions") },
];

/** A single quiet rail of tabs. Underline marks the place; nothing floats. */
export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  const { me } = useWorldSession();
  const showElders = me?.isElder || me?.nodeType === "ANCHOR" || pathname.startsWith("/elders");

  const items = showElders
    ? [...TABS, { href: "/elders", label: "Elders", icon: Crown, match: (p: string) => p.startsWith("/elders") }]
    : TABS;

  const badgeFor = (href: string) => (href === "/scout" ? me?.pendingOffers : href === "/elders" ? me?.pendingReviews : undefined);

  return (
    <nav className="mb-10 -mx-5 sm:-mx-8 lg:-mx-10 px-5 sm:px-8 lg:px-10 border-b border-[var(--surface-border)] overflow-x-auto">
      <div className="flex items-center gap-1 sm:gap-2 min-w-max">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const badge = badgeFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2 px-3 py-3.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px",
                active ? "border-[var(--accent-ink)] text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{item.label}</span>
              {badge ? (
                <span className="ml-0.5 h-4 min-w-4 px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
