"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * The header sits on the polar bear illustration supplied by `.bg` in the root
 * layout. The logo is anchored to the bottom of that band with no gap beneath
 * it, so the bear stands on the header's edge rather than floating above it.
 */
export function Navbar() {
  return (
    <header className="relative z-20 flex h-full w-full items-end">
      <div className="mx-auto flex w-full max-w-screen-lg items-end px-4 md:px-8">
        <Link href="/" aria-label="Telescope home" className="block shrink-0">
          <Image
            src="/logo.png"
            alt="Telescope"
            width={320}
            height={288}
            priority
            /* `block` removes the inline-image descender gap, so the artwork
               meets the bottom border exactly. */
            className="block w-40 sm:w-52 md:w-64"
            style={{ height: "auto" }}
          />
        </Link>
      </div>
    </header>
  );
}
