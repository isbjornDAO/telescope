"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Wrench, Code2, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

/**
 * The mobile tab bar. Present only below `md`, where the site is meant to feel
 * like an app; desktop keeps the card tabs under the header.
 *
 * It clears the iOS home indicator via `env(safe-area-inset-bottom)`, supplied
 * by the `pb-safe` utility — without it the bar sits under the gesture bar in
 * standalone mode.
 */
const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/z/discover",
    label: "Discover",
    icon: Compass,
    match: (p: string) => p.startsWith("/z/discover"),
  },
  {
    href: "/z/code",
    label: "Code",
    icon: Code2,
    match: (p: string) => p.startsWith("/z/code"),
  },
  {
    href: "/z/tools",
    label: "Tools",
    icon: Wrench,
    match: (p: string) => p.startsWith("/z/tools"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const user = session?.user;

  // Hide while composing so the keyboard and the form get the whole screen.
  if (pathname.startsWith("/forum/ask")) return null;

  const profileHref = user?.handle ? `/u/${user.handle}` : "/signin";
  const profileActive = pathname.startsWith("/u/") || pathname === "/profile";

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname) && !profileActive;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}

        <li className="flex-1">
          <Link
            href={profileHref}
            aria-current={profileActive ? "page" : undefined}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              profileActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <UserIcon
              className="h-[22px] w-[22px]"
              strokeWidth={profileActive ? 2.4 : 1.8}
              aria-hidden
            />
            {user ? "You" : "Sign in"}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
