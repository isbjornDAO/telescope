"use client";

import Link from "next/link";
import Image from "next/image";

import { SiteMenu } from "@/components/site-menu";

/**
 * The mobile top bar.
 *
 * The full polar bear illustration is a desktop flourish — at 390px it would
 * cost a third of the screen before a single post. This keeps the bear as a
 * compact mark on a normal app-height bar, so the identity survives while the
 * timeline gets the room.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur md:hidden">
      <div className="flex h-12 items-center justify-between px-3">
        <Link href="/" aria-label="Telescope home" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={58}
            priority
            className="h-8 w-8 object-contain"
          />
          <span className="text-base font-semibold tracking-tight">Telescope</span>
        </Link>

        <SiteMenu compact />
      </div>
    </header>
  );
}
