"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Menu,
  LogOut,
  Shield,
  User as UserIcon,
  LayoutGrid,
  Gift,
  Calendar,
  MessagesSquare,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/forum/avatar";
import { Button } from "@/components/ui/button";
import { externalLinks } from "@/lib/site";

const ITEM =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

/**
 * Everything that is not one of the three main tabs lives behind this button,
 * including the theme switch — the header only has room for one control beside
 * the tabs, and a theme toggle is not worth a permanent slot.
 */
/** `compact` drops the raised card styling for the mobile app bar. */
export function SiteMenu({ compact = false }: { compact?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={`flex items-center justify-center rounded-xl transition-colors ${compact ? "h-9 w-9 hover:bg-muted" : "h-[42px] w-[42px] border-2 border-white bg-white shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 sm:h-[46px] sm:w-[46px]"}`}
          aria-label="Menu"
        >
          {user ? (
            <Avatar name={user.name ?? null} image={user.image} size={28} />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[290px] p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>

        <div className="flex h-full flex-col overflow-y-auto">
          <div className="border-b border-border p-4">
            {status === "loading" ? (
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
            ) : user ? (
              <Link
                href={user.handle ? `/u/${user.handle}` : "/profile"}
                onClick={close}
                className="flex items-center gap-3"
              >
                <Avatar name={user.name ?? null} image={user.image} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.name ?? user.handle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.reputation.toLocaleString()} points
                  </p>
                </div>
              </Link>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Join in — sign in with the same account you use on
                  build.avax.network.
                </p>
                <Button asChild className="mt-3 w-full" onClick={close}>
                  <Link href="/signin">Sign in</Link>
                </Button>
              </>
            )}
          </div>

          <nav className="flex-1 p-2" aria-label="Menu">
            <Link href="/z/community" onClick={close} className={ITEM}>
              <MessagesSquare className="h-4 w-4" />
              Community
            </Link>
            <Link href="/categories" onClick={close} className={ITEM}>
              <LayoutGrid className="h-4 w-4" />
              All categories
            </Link>
            <Link href="/calendar" onClick={close} className={ITEM}>
              <Calendar className="h-4 w-4" />
              Events
            </Link>
            <Link href="/rewards" onClick={close} className={ITEM}>
              <Gift className="h-4 w-4" />
              Rewards
            </Link>

            {user ? (
              <>
                <div className="my-2 border-t border-border" />
                <Link
                  href={user.handle ? `/u/${user.handle}` : "/profile"}
                  onClick={close}
                  className={ITEM}
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
                {(user.role === "admin" || user.role === "moderator") && (
                  <Link href="/admin" onClick={close} className={ITEM}>
                    <Shield className="h-4 w-4" />
                    Moderation
                  </Link>
                )}
                <button
                  onClick={() => {
                    close();
                    signOut({ callbackUrl: "/" });
                  }}
                  className={`w-full ${ITEM}`}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : null}

            <div className="my-2 border-t border-border" />
            <ThemeChoice />
          </nav>

          <div className="border-t border-border p-4">
            <a
              href={externalLinks.buildersHub}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Docs on Builders Hub ↗
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Light / dark / system, as a segmented control inside the menu. */
function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];

  return (
    <div className="px-3 py-2">
      <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Theme
      </p>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {options.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              aria-pressed={active}
              className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
                active
                  ? "bg-white shadow-sm dark:bg-zinc-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
