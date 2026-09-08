"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Snowflake, Radar, Users, Flag, MapPin, Link2, MessageSquare, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldSession } from "@/hooks/use-world";

const PRIMARY = [
  { href: "/", label: "World", icon: Globe2, match: (p: string) => p === "/" },
  { href: "/seasons", label: "Seasons", icon: Snowflake, match: (p: string) => p.startsWith("/seasons") || p.startsWith("/entries") || p.startsWith("/rounds") },
  { href: "/scout", label: "Scout", icon: Radar, match: (p: string) => p.startsWith("/scout") },
  { href: "/trust", label: "Trust", icon: Link2, match: (p: string) => p.startsWith("/trust") },
];

const SECONDARY = [
  { href: "/crews", label: "Crews", icon: Users, match: (p: string) => p.startsWith("/crews") },
  { href: "/factions", label: "Factions", icon: Flag, match: (p: string) => p.startsWith("/factions") },
  { href: "/regions", label: "Regions", icon: MapPin, match: (p: string) => p.startsWith("/regions") },
  { href: "/forum", label: "Forum", icon: MessageSquare, match: (p: string) => p.startsWith("/forum") },
];

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  const { me } = useWorldSession();
  const showElders = me?.isElder || me?.nodeType === "ANCHOR" || pathname.startsWith("/elders");

  const tab = (item: (typeof PRIMARY)[number], compact: boolean, badge?: number) => {
    const active = item.match(pathname);
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href}>
        <button
          className={cn(
            "group relative py-2.5 sm:py-3 font-bold border-2 rounded-xl transition-all duration-300 ease-in-out flex items-center overflow-hidden",
            "bg-white dark:bg-zinc-800 border-white dark:border-zinc-700",
            active ? "shadow text-foreground" : "hover:bg-zinc-50 dark:hover:bg-zinc-700 text-muted-foreground",
            compact ? (active ? "px-2 sm:px-3 gap-1 sm:gap-2" : "px-2 sm:px-3 gap-0 sm:hover:gap-2") : "px-2 sm:px-4 gap-1 sm:gap-2"
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className={cn("text-sm sm:text-base font-semibold whitespace-nowrap", compact && !active ? "hidden sm:inline sm:max-w-0 sm:group-hover:max-w-xs overflow-hidden transition-all duration-300" : "")}>{item.label}</span>
          {badge ? <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">{badge}</span> : null}
        </button>
      </Link>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-8 relative z-30">
      <div className="gap-1 sm:gap-3 flex flex-nowrap">
        {PRIMARY.map((i) => tab(i, false, i.href === "/scout" ? me?.pendingOffers : undefined))}
      </div>
      <div className="gap-1 sm:gap-3 flex flex-wrap">
        {SECONDARY.map((i) => tab(i, true))}
        {showElders && tab({ href: "/elders", label: "Elders", icon: Crown, match: (p) => p.startsWith("/elders") }, true, me?.pendingReviews)}
      </div>
    </div>
  );
}
