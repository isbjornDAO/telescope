"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Trophy, Calendar, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The whole site: four tabs.
 *
 * Set as words, not icons. An icon asks the reader to guess; a word answers.
 * The icons stay in the object because the mobile drawer uses them, where a
 * glyph beside a label helps the eye scan a vertical list.
 */
export const TABS = [
  { href: "/", label: "Forum", icon: MessageSquare, match: (p: string) => p === "/" || p.startsWith("/forum") },
  { href: "/tournaments", label: "Tournaments", icon: Trophy, match: (p: string) => p.startsWith("/tournaments") || p.startsWith("/entries") || p.startsWith("/rounds") },
  { href: "/calendar", label: "Calendar", icon: Calendar, match: (p: string) => p.startsWith("/calendar") },
  { href: "/shop", label: "Shop", icon: Gift, match: (p: string) => p.startsWith("/shop") },
];

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="flex items-center gap-5 sm:gap-7 mb-6 relative z-30 border-b border-zinc-300/70 dark:border-zinc-700">
      {TABS.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px flex min-h-11 items-end pb-2.5 text-[15px] sm:text-base transition-colors sm:min-h-0 sm:pt-1",
              active
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {/* The current tab is marked by a rule under the word itself, so the
                label carries the state instead of a box drawn around it. */}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--telescope-blue)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
