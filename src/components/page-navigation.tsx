"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MessageSquare, Calendar, Gift, ChevronDown, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { useAdminStatus } from "@/hooks/use-admin-status";

export interface SubmenuItem {
  href: string;
  label: string;
}

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeColor: string;
  textColor: string;
  match: (p: string) => boolean;
  submenu?: SubmenuItem[];
}

/**
 * Retro subnav navigation bar:
 * - 44px height, continuous container attached to the top of the main card
 * - 3px top cyan accent bar (#12BDE7) on hover and active states
 * - Vertical border dividers between items
 * - Clean icons with opacity transition
 * - Dropdown submenus on hover
 * - Integrated search bar on the right
 */
export const TABS: TabItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    badgeColor: "bg-[#40586F]",
    textColor: "text-[#40586F] dark:text-[#8cb7df]",
    match: (p: string) => p === "/",
  },
  {
    href: "/forum",
    label: "Forum",
    icon: MessageSquare,
    badgeColor: "bg-[#40586F]",
    textColor: "text-[#40586F] dark:text-[#8cb7df]",
    match: (p: string) => p.startsWith("/forum"),
    submenu: [
      { href: "/forum", label: "All Topics" },
      { href: "/forum/gen", label: "General" },
      { href: "/forum/tech", label: "Tech" },
      { href: "/forum/defi", label: "DeFi" },
      { href: "/forum/eco", label: "Ecosystem" },
      { href: "/forum/gov", label: "Governance" },
    ],
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    badgeColor: "bg-[#833F96]",
    textColor: "text-[#833F96] dark:text-[#ce85e4]",
    match: (p: string) => p.startsWith("/calendar"),
  },
  {
    href: "/shop",
    label: "Shop",
    icon: Gift,
    badgeColor: "bg-[#54C301]",
    textColor: "text-[#47a601] dark:text-[#8ae446]",
    match: (p: string) => p.startsWith("/shop"),
  },
];

export const ADMIN_TAB: TabItem = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
  badgeColor: "bg-[#D9383A]",
  textColor: "text-[#D9383A] dark:text-[#ff6b6d]",
  match: (p: string) => p.startsWith("/admin"),
  submenu: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/projects", label: "Projects" },
    { href: "/admin/claims", label: "Claims" },
  ],
};

export function PageNavigation() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { address, isConnected } = useAccount();
  const { data: adminData } = useAdminStatus(address as Address, isConnected);

  const tabs = adminData?.isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="retro-subnav relative z-30 flex items-center justify-between w-full">
      <ul className="retro-subnav-list flex items-center h-full overflow-x-auto sm:overflow-visible scrollbar-none flex-1">
        {tabs.map(({ href, label, icon: Icon, match, submenu }, index) => {
          const active = match(pathname);
          const hasSubmenu = Boolean(submenu && submenu.length > 0);
          const isLast = index === tabs.length - 1;

          return (
            <li
              key={href}
              className="retro-subnav-wrapper relative h-full flex items-center"
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "retro-subnav-item group h-full",
                  active && "active"
                )}
              >
                <Icon className="retro-subnav-icon h-4 w-4" />
                <span>{label}</span>
                {hasSubmenu && (
                  <ChevronDown className="retro-subnav-chevron h-3 w-3" />
                )}
              </Link>

              {hasSubmenu && submenu && (
                <div
                  className={cn(
                    "retro-submenu",
                    isLast ? "right-0 left-auto" : "left-0"
                  )}
                >
                  <ul className="flex flex-col py-1">
                    {submenu.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className="retro-submenu-item"
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Integrated Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex items-center px-2.5 sm:px-4 shrink-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Telescope..."
            className="w-28 sm:w-44 md:w-52 h-7 pl-2.5 pr-7 text-[11px] sm:text-[12px] rounded bg-white dark:bg-[#1c212a] border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-[#4f8aae] focus:ring-1 focus:ring-[#4f8aae]/40 transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-1 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </nav>
  );
}
