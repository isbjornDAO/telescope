"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Globe2, Snowflake, Radar, Link2, Users, Flag, MapPin, MessageSquare, User, Crown, BookOpen, Sparkles, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

import { FAQ } from "@/components/faq";
import { ConnectButton } from "@/components/connect-button";
import { BackButton } from "@/components/back-button";
import { DonateModal } from "@/components/donate-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWorldSession } from "@/hooks/use-world";

const LINKS = [
  { href: "/", label: "World", icon: Globe2 },
  { href: "/seasons", label: "Seasons", icon: Snowflake },
  { href: "/scout", label: "Scout", icon: Radar },
  { href: "/trust", label: "Trust", icon: Link2 },
  { href: "/crews", label: "Crews", icon: Users },
  { href: "/factions", label: "Factions", icon: Flag },
  { href: "/regions", label: "Regions", icon: MapPin },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/rules", label: "World rules", icon: BookOpen },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { me, isSignedIn } = useWorldSession();
  const pathname = usePathname();

  const item = (href: string, label: string, Icon: typeof Globe2) => {
    const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
    return (
      <Link key={href} href={href} className={`flex items-center gap-3 text-base p-2 rounded-lg ${active ? "bg-zinc-100 dark:bg-zinc-800 font-semibold" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`} onClick={() => setIsOpen(false)}>
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="w-full bg-transparent border-b-4 border-zinc-300 dark:border-zinc-700">
      <div className="w-full relative h-64 md:h-auto max-w-screen-lg mx-auto pt-4 md:pt-12 pb-4 px-4 md:px-8 flex items-start justify-end md:justify-between md:flex-row">
        <div className="flex items-center gap-4 absolute left-4 top-4 md:left-8 md:top-12 z-10">
          <BackButton />
        </div>
        <Link href="/" className="contents">
          <Image
            src="/logo.png"
            alt="Telescope"
            className="flex items-end absolute md:relative left-4 md:left-0 -bottom-4 md:-bottom-4 w-80 md:w-80"
            width={320}
            height={80}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <div className="flex items-center relative z-10 justify-center gap-1.5 md:gap-2 md:self-auto">
          {isSignedIn && me && (
            <Link href="/trust" title="Your weight: season-earned trust">
              <div className="flex items-center gap-1 md:gap-1.5 bg-white dark:bg-zinc-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2 h-8 md:h-9 shadow cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-sky-500" />
                <span className="font-bold text-xs md:text-sm text-sky-700 dark:text-sky-300 tabular-nums">{(me.standing ?? 0).toFixed(2)}</span>
              </div>
            </Link>
          )}
          <div className="hidden md:flex items-center gap-2 [&_.mobile-menu-text]:hidden">
            <DonateModal />
            <FAQ />
          </div>
          <ThemeToggle />
          <ConnectButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-1.5 md:p-2 rounded-lg bg-white dark:bg-zinc-800 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" aria-label="Menu">
                <Menu className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-2 mt-8">
                {isSignedIn && me && (
                  <>
                    {item(`/profile/${me.handle ?? me.address}`, me.name ?? "Profile", User)}
                    {(me.isElder || me.nodeType === "ANCHOR") && item("/elders", "Elders", Crown)}
                    {me.isAdmin && item("/world-admin", "World admin", Settings)}
                    <div className="border-t border-zinc-200 dark:border-zinc-700" />
                  </>
                )}
                {LINKS.map((l) => item(l.href, l.label, l.icon))}
                <div className="border-t border-zinc-200 dark:border-zinc-700" />
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm font-semibold">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-700" />
                <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-base [&_button]:h-auto [&_button]:py-3 [&_.mobile-menu-text]:inline">
                  <DonateModal />
                </div>
                <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-base [&_button]:h-auto [&_button]:py-3 [&_.mobile-menu-text]:inline">
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
