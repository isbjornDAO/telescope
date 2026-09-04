"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  Compass,
  Calendar,
  Gift,
  Telescope,
  User as UserIcon,
  LogOut,
  Shield,
  ExternalLink,
  Plus,
  LayoutGrid,
} from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/forum/avatar";
import { Button } from "@/components/ui/button";
import { externalLinks } from "@/lib/site";

/**
 * The forum is the site, so the header carries only the wordmark, a way to
 * start a topic, and a menu. Everything that is not the forum — Discover,
 * Events, Rewards, the profile and moderation — lives behind the menu button
 * rather than competing with the topic list for attention.
 */
const SECTIONS = [
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Events", icon: Calendar },
  { href: "/rewards", label: "Rewards", icon: Gift },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <Telescope className="h-5 w-5" aria-hidden />
          <span>Telescope</span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Icon only: the forum index already carries a labelled "New topic"
              button in its toolbar, and two of them side by side read as a
              mistake. This one exists for thread and section pages, which have
              no toolbar. */}
          <Button asChild size="icon" variant="ghost" className="h-9 w-9">
            <Link href="/forum/ask" aria-label="New topic" title="New topic">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
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
                          {user.reputation.toLocaleString()} reputation
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sign in with the same account you use on
                        build.avax.network.
                      </p>
                      <Button asChild className="mt-3 w-full" onClick={close}>
                        <Link href="/signin">Sign in</Link>
                      </Button>
                    </>
                  )}
                </div>

                <nav className="flex-1 p-2" aria-label="Sections">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const active = pathname?.startsWith(section.href);
                    return (
                      <Link
                        key={section.href}
                        href={section.href}
                        onClick={close}
                        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                          active
                            ? "bg-muted font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </Link>
                    );
                  })}

                  {user ? (
                    <>
                      <div className="my-2 border-t border-border" />
                      <Link
                        href={user.handle ? `/u/${user.handle}` : "/profile"}
                        onClick={close}
                        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </Link>
                      {(user.role === "admin" || user.role === "moderator") && (
                        <Link
                          href="/admin"
                          onClick={close}
                          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <Shield className="h-4 w-4" />
                          Moderation
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          close();
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Docs on Builders Hub
                    <ExternalLink className="h-3 w-3" />
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
