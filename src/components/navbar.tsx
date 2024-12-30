"use client";

import { useState } from "react";
import Link from "next/link";
import { Newspaper, Menu, Home } from "lucide-react";

import { FAQ } from "@/components/faq";
import { ConnectButton } from "@/components/connect-button";
import { BackButton } from "@/components/back-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-zinc-900 bg border-b-4 border-zinc-100 dark:border-zinc-700">
      <div className="w-full relative h-64 md:h-auto max-w-screen-lg mx-auto pt-24 px-8 flex items-start justify-end md:justify-between md:flex-row">
        <div className="flex items-center gap-4 absolute left-8 z-10">
          <BackButton />
        </div>
        <img
          src="/logo.png"
          alt="Telescope"
          className="w-56 md:w-80 flex items-end absolute md:relative left-0 bottom-0"
        />
        <div className="flex items-center relative z-10 justify-center gap-4 md:self-auto">
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/news"
              className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 h-9 shadow hover:bg-zinc-50 transition-colors"
            >
              <Newspaper className="h-4 w-4" />
              News
            </Link>
          </div>
          <FAQ />
          <ConnectButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-lg bg-white shadow hover:bg-zinc-50 transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  href="/news"
                  className="flex items-center gap-2 "
                  onClick={() => setIsOpen(false)}
                >
                  <Newspaper className="h-4 w-4" />
                  News
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
