"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, Shield, User as UserIcon, CircleDollarSign } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/forum/avatar";
import { Button } from "@/components/ui/button";
import { ZONES } from "@/lib/zones";
import { externalLinks } from "@/lib/site";

/**
 * The site header, sitting on the polar bear illustration supplied by the `.bg`
 * wrapper in the root layout. The logo carries the identity, so the header
 * itself stays light: account, theme, and a menu.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;
  const close = () => setOpen(false);

  return (
    <header className="relative z-20 w-full">
      <div className="mx-auto flex w-full max-w-screen-lg items-start justify-between gap-3 px-4 pb-4 pt-4 md:px-8 md:pt-10">
        <Link href="/" aria-label="Telescope home" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Telescope"
            width={320}
            height={80}
            priority
            className="w-44 sm:w-56 md:w-72"
            style={{ height: "auto" }}
          />
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {user ? (
            <Link
              href="/rewards"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 shadow transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 md:px-3"
              title="Your coins"
            >
              <CircleDollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-600">
                {user.reputation ?? 0}
              </span>
            </Link>
          ) : null}

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                aria-label="Open menu"
              >
                {user ? (
                  <Avatar name={user.name ?? null} image={user.image} size={28} />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[280px] p-0">
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
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Areas
                  </p>
                  {ZONES.map((zone) => (
                    <Link
                      key={zone.slug}
                      href={`/z/${zone.slug}`}
                      onClick={close}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      {zone.label}
                    </Link>
                  ))}

                  <div className="my-2 border-t border-border" />
                  <Link href="/categories" onClick={close} className={MENU_ITEM}>
                    All categories
                  </Link>
                  <Link href="/calendar" onClick={close} className={MENU_ITEM}>
                    Events
                  </Link>
                  <Link href="/rewards" onClick={close} className={MENU_ITEM}>
                    Rewards
                  </Link>
                  <Link href="/discover" onClick={close} className={MENU_ITEM}>
                    Discover
                  </Link>

                  {user ? (
                    <>
                      <div className="my-2 border-t border-border" />
                      <Link
                        href={user.handle ? `/u/${user.handle}` : "/profile"}
                        onClick={close}
                        className={MENU_ITEM}
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </Link>
                      {(user.role === "admin" || user.role === "moderator") && (
                        <Link href="/admin" onClick={close} className={MENU_ITEM}>
                          <Shield className="h-4 w-4" />
                          Moderation
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          close();
                          signOut({ callbackUrl: "/" });
                        }}
                        className={`w-full ${MENU_ITEM}`}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : null}
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
        </div>
      </div>
    </header>
  );
}

const MENU_ITEM =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";
