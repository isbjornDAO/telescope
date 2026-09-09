"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Globe2, Snowflake, Radar, Link2, Users, Flag, MapPin, MessageSquare, User, Crown, BookOpen, Sparkles, Settings, Home } from "lucide-react";
import { usePathname } from "next/navigation";

import { FAQ } from "@/components/faq";
import { ConnectButton } from "@/components/connect-button";
import { DonateModal } from "@/components/donate-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWorldSession } from "@/hooks/use-world";
import { CrystalAvatar } from "@/components/world/snow-crystal";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Forum", icon: MessageSquare },
  { href: "/world", label: "World", icon: Globe2 },
  { href: "/seasons", label: "Seasons", icon: Snowflake },
  { href: "/scout", label: "Scout", icon: Radar },
  { href: "/trust", label: "Trust", icon: Link2 },
  { href: "/crews", label: "Crews", icon: Users },
  { href: "/factions", label: "Factions", icon: Flag },
  { href: "/regions", label: "Regions", icon: MapPin },
  { href: "/rules", label: "World rules", icon: BookOpen },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { me, isSignedIn } = useWorldSession();
  const pathname = usePathname() ?? "/";

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/forum") : pathname.startsWith(href));

  const item = (href: string, label: string, Icon: typeof Globe2) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "flex items-center gap-3 text-[15px] px-3 py-2.5 rounded-lg transition-colors",
        isActive(href) ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
      onClick={() => setIsOpen(false)}
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="w-full border-b border-[var(--surface-border)] bg-background/85 backdrop-blur-[2px] sticky top-0 z-50">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 h-16 flex items-center gap-6">
        <Link href="/" className="shrink-0 flex items-center" aria-label="Telescope">
          <Image src="/logo.png" alt="Telescope" width={320} height={80} className="h-7 w-auto" priority style={{ width: "auto" }} />
        </Link>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {isSignedIn && me && (
            <>
              {/* Your crystal, grown from your address. Nothing to upload. */}
              <Link
                href={`/profile/${me.handle ?? me.address}`}
                title={`${me.name ?? "Your profile"} — your profile`}
                className="flex items-center rounded-full transition-opacity hover:opacity-80"
              >
                <CrystalAvatar seed={me.handle ?? me.address ?? ""} size="sm" nodeType={me.nodeType} title={me.name ?? "Your profile"} />
                <span className="sr-only">Your profile</span>
              </Link>
              <Link
                href="/den"
                title="Your snow den — badges and everything you have earned"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--surface-border)] hover:bg-accent/60 transition-colors"
              >
                <Home className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                <span className="sr-only">Your snow den</span>
              </Link>
              <Link href="/trust" title="Your weight: season-earned trust" className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--surface-border)] hover:bg-accent/60 transition-colors">
                <Sparkles className="h-3.5 w-3.5 ink-accent" strokeWidth={1.75} />
                <span className="text-sm font-semibold tabular-nums">{(me.standing ?? 0).toFixed(2)}</span>
              </Link>
            </>
          )}
          <div className="hidden md:flex items-center gap-2 [&_.mobile-menu-text]:hidden">
            <DonateModal />
            <FAQ />
          </div>
          <ThemeToggle />
          <ConnectButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--surface-border)] hover:bg-accent/60 transition-colors" aria-label="Menu">
                <Menu className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[19rem]">
              <nav className="flex flex-col gap-1 mt-10">
                {isSignedIn && me && (
                  <>
                    {item(`/profile/${me.handle ?? me.address}`, me.name ?? "Profile", User)}
                    {item("/den", "Your snow den", Home)}
                    {(me.isElder || me.nodeType === "ANCHOR") && item("/elders", "Elders", Crown)}
                    {me.isAdmin && item("/world-admin", "World admin", Settings)}
                    <div className="h-px bg-[var(--surface-border)] my-3" />
                  </>
                )}
                {LINKS.map((l) => item(l.href, l.label, l.icon))}
                <div className="h-px bg-[var(--surface-border)] my-3" />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-[15px] [&_button]:h-auto [&_button]:py-2.5 [&_.mobile-menu-text]:inline">
                  <DonateModal />
                </div>
                <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-[15px] [&_button]:h-auto [&_button]:py-2.5 [&_.mobile-menu-text]:inline">
                  <FAQ />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
