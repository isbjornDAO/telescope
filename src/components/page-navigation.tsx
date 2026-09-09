"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Trophy, Calendar, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/** The whole site: four tabs. */
export const TABS = [
  { href: "/", label: "Forum", icon: MessageSquare, match: (p: string) => p === "/" || p.startsWith("/forum") },
  { href: "/tournaments", label: "Tournaments", icon: Trophy, match: (p: string) => p.startsWith("/tournaments") || p.startsWith("/entries") || p.startsWith("/rounds") },
  { href: "/calendar", label: "Calendar", icon: Calendar, match: (p: string) => p.startsWith("/calendar") },
  { href: "/shop", label: "Shop", icon: Gift, match: (p: string) => p.startsWith("/shop") },
];

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex gap-1 sm:gap-3 mb-8 relative z-30">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link key={href} href={href}>
            <button
              className={cn(
                "px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-colors flex items-center gap-1.5 sm:gap-2",
                "bg-white dark:bg-zinc-800 border-white dark:border-zinc-700",
                active ? "shadow text-foreground" : "hover:bg-zinc-50 dark:hover:bg-zinc-700 text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="text-sm sm:text-base font-semibold">{label}</span>
            </button>
          </Link>
        );
      })}
    </div>
  );
}
