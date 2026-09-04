"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessagesSquare, Compass, Calendar, Gift, Telescope } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountMenu } from "@/components/auth/account-menu";

/**
 * Five destinations, one row. The old navigation split nine surfaces across two
 * rows with hover-to-expand labels, which hid where things were.
 */
const LINKS = [
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Events", icon: Calendar },
  { href: "/rewards", label: "Rewards", icon: Gift },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <Telescope className="h-5 w-5" aria-hidden />
          <span>Telescope</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:block">
            <AccountMenu />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded-lg p-2 hover:bg-muted md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile">
                {LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        isActive(link.href)
                          ? "bg-muted font-medium"
                          : "text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t border-border pt-4">
                  <AccountMenu />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
