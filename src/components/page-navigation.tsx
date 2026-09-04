"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home as HomeIcon,
  TrendingUp,
  Globe2,
  Code2,
  MessagesSquare,
  Calendar,
  Gift,
  Compass,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

import { ZONES } from "@/lib/zones";

const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  Globe2,
  Code2,
  MessagesSquare,
};

/**
 * The raised card tabs from the original design, now carrying the three areas
 * of the forum rather than nine unrelated sections.
 *
 * Primary tabs always show their label — the whole point is that someone can
 * see at a glance that Growth, Real World and Build are separate rooms. The
 * secondary row stays icon-only and expands its label on hover, as before.
 */
const TAB =
  "flex items-center gap-1.5 rounded-xl border-2 border-white bg-white font-semibold shadow-sm transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-800";

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  const activeZone = pathname.startsWith("/z/") ? pathname.split("/")[2] : null;

  return (
    <nav
      aria-label="Sections"
      className="relative z-10 mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="-mx-3 flex flex-nowrap gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tab
          href="/"
          icon={HomeIcon}
          label="Home"
          active={pathname === "/" && !activeZone}
        />
        {ZONES.map((zone) => (
          <Tab
            key={zone.slug}
            href={`/z/${zone.slug}`}
            icon={ICONS[zone.icon] ?? MessagesSquare}
            label={zone.label}
            active={activeZone === zone.slug}
          />
        ))}
      </div>

      <div className="flex gap-1.5 sm:ml-auto sm:gap-2">
        <IconTab href="/categories" icon={LayoutGrid} label="Categories" active={pathname.startsWith("/categories")} />
        <IconTab href="/calendar" icon={Calendar} label="Events" active={pathname.startsWith("/calendar")} />
        <IconTab href="/rewards" icon={Gift} label="Rewards" active={pathname.startsWith("/rewards")} />
        <IconTab href="/discover" icon={Compass} label="Discover" active={pathname.startsWith("/discover")} />
      </div>
    </nav>
  );
}

function Tab({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${TAB} shrink-0 px-3 py-2.5 sm:px-4 ${
        active
          ? "text-foreground shadow-md"
          : "text-muted-foreground hover:bg-zinc-50 hover:text-foreground dark:hover:bg-zinc-700"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]" />
      <span className="whitespace-nowrap text-sm sm:text-base">{label}</span>
    </Link>
  );
}

/** Icon-only until hovered, keeping the secondary row compact. */
function IconTab({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`${TAB} group overflow-hidden py-2.5 ${
        active
          ? "px-3 text-foreground shadow-md sm:px-4"
          : "px-3 text-muted-foreground hover:bg-zinc-50 hover:text-foreground dark:hover:bg-zinc-700 sm:group-hover:px-4"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]" />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm transition-all duration-300 sm:text-base ${
          active
            ? "ml-0.5 max-w-[120px] opacity-100"
            : "max-w-0 opacity-0 sm:group-hover:ml-0.5 sm:group-hover:max-w-[120px] sm:group-hover:opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
