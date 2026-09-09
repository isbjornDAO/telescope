"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

import { ConnectButton } from "@/components/connect-button";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TABS } from "@/components/page-navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const { address, isConnected } = useAccount();

  return (
    <header className="w-full bg-transparent border-b-4 border-zinc-300 dark:border-zinc-700">
      <div className="w-full relative h-32 md:h-auto max-w-screen-lg mx-auto pt-3 md:pt-8 pb-3 md:pb-4 px-4 md:px-8 flex items-start justify-end md:justify-between md:flex-row">
        <div className="flex items-center gap-4 absolute left-4 top-4 md:left-8 md:top-12 z-10">
          <BackButton />
        </div>
        <Link href="/" className="contents">
          <Image
            src="/logo.png"
            alt="Telescope"
            className="flex items-end absolute md:relative left-4 md:left-0 -bottom-3 md:-bottom-4 w-52 md:w-72"
            width={288}
            height={72}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <div className="flex items-center relative z-10 justify-center gap-1.5 md:gap-2 md:self-auto">
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
                {TABS.map(({ href, label, icon: Icon, match }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 text-base p-2 rounded-lg ${
                      match(pathname) ? "bg-zinc-100 dark:bg-zinc-800 font-semibold" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                {isConnected && (
                  <>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 pt-2" />
                    <Link
                      href={`/profile/${address}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-base p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
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
