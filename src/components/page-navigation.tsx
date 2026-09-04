"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home as HomeIcon,
  Code2,
  Compass,
  Wrench,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

import { MAIN_ZONES } from "@/lib/zones";
import { SiteMenu } from "@/components/site-menu";

const ICONS: Record<string, LucideIcon> = {
  Code2,
  Compass,
  Wrench,
  MessagesSquare,
};

/**
 * Home, the three areas, and the menu button — one row at every width.
 *
 * The menu is part of this row rather than the header so the whole navigation
 * reads as a single unit, and so the header band is left to the logo.
 * Labels shrink before the row wraps; below 400px the tabs scroll horizontally
 * while the menu button stays pinned on the right.
 */
const TAB =
  "flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-white bg-white font-semibold shadow-sm transition-all dark:border-zinc-700 dark:bg-zinc-800";

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  const activeZone = pathname.startsWith("/z/") ? pathname.split("/")[2] : null;

  return (
    <nav
      aria-label="Sections"
      className="relative z-10 mb-4 flex items-center gap-1 sm:mb-6 sm:gap-2"
    >
      <div className="flex min-w-0 flex-1 gap-1 sm:flex-none sm:gap-1.5">
        <Tab
          href="/"
          icon={HomeIcon}
          label="Home"
          /* Icon only on the narrowest phones. Dropping this one label is what
             lets all four tabs and the menu button share a single row at
             390px; the house icon carries the meaning on its own, and the
             three named areas keep their labels, which is the part that
             matters. */
          hideLabelOnMobile
          active={pathname === "/" && !activeZone}
        />
        {MAIN_ZONES.map((zone) => (
          <Tab
            key={zone.slug}
            href={`/z/${zone.slug}`}
            icon={ICONS[zone.icon] ?? MessagesSquare}
            label={zone.label}
            active={activeZone === zone.slug}
          />
        ))}
      </div>

      <div className="ml-auto shrink-0">
        <SiteMenu />
      </div>
    </nav>
  );
}

function Tab({
  href,
  icon: Icon,
  label,
  active,
  hideLabelOnMobile = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  hideLabelOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`${TAB} justify-center px-2.5 py-2.5 sm:px-4 ${
        active
          ? "text-foreground shadow-md"
          : "text-muted-foreground hover:bg-zinc-50 hover:text-foreground dark:hover:bg-zinc-700"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" />
      <span
        className={`whitespace-nowrap text-[13px] sm:text-base ${
          hideLabelOnMobile ? "hidden sm:inline" : ""
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
