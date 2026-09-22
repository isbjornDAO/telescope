"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

import { ConnectButton } from "@/components/connect-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TABS, ADMIN_TAB } from "@/components/page-navigation";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Address } from "viem";

import { TopTicker } from "@/components/top-ticker";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const { address, isConnected } = useAccount();
  const { data: adminData } = useAdminStatus(address as Address, isConnected);
  const tabs = adminData?.isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <header className="w-full bg-transparent flex flex-col justify-between flex-1 h-full">
      <TopTicker />
      <div className="w-full relative flex-1 min-h-[160px] sm:min-h-[200px] md:min-h-[240px] max-w-screen-lg mx-auto pt-3 md:pt-5 pb-3 md:pb-4 px-4 md:px-8 flex items-start justify-end">
        <Link href="/" className="contents">
          <Image
            src="/logo.png"
            alt="Telescope"
            className="flex items-end absolute left-4 md:left-8 bottom-3 sm:bottom-7 md:bottom-7 w-36 sm:w-44 md:w-56 h-auto drop-shadow-md transition-transform hover:scale-[1.02]"
            width={384}
            height={346}
            priority
          />
        </Link>
        <div className="flex items-center relative z-10 justify-end gap-1.5 md:gap-2 ml-auto">
          <ThemeToggle />
          <ConnectButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden retro-btn retro-btn-gray w-10 h-10 rounded-md"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="retro-shell border-l">
              <nav className="flex flex-col gap-2 mt-8">
                {tabs.map(({ href, label, icon: Icon, badgeColor, match }) => {
                  const active = match(pathname);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={`retro-tab flex h-11 items-center rounded-md overflow-hidden ${
                        active ? "active ring-2 ring-sky-500/50" : ""
                      }`}
                    >
                      <div
                        className={`h-full w-11 flex items-center justify-center text-white ${badgeColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="ml-3 text-sm font-bold">{label}</span>
                    </Link>
                  );
                })}
                {isConnected && (
                  <>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 pt-2" />
                    <Link
                      href={`/profile/${address}`}
                      onClick={() => setIsOpen(false)}
                      className="retro-tab flex h-11 items-center rounded-md overflow-hidden px-3"
                    >
                      <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300 mr-3" />
                      <span className="text-sm font-bold">Profile</span>
                    </Link>
                  </>
                )}
                <div className="flex items-center justify-between p-2 mt-2">
                  <span className="text-sm font-semibold">Theme</span>
                  <ThemeToggle />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
