"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine } from "lucide-react";

/**
 * Floating compose button, the way every social app puts posting one thumb
 * away. Mobile only — on desktop the toolbar's "New topic" already does this.
 */
export function ComposeButton() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/forum/ask") || pathname.startsWith("/signin")) {
    return null;
  }

  return (
    <Link
      href="/forum/ask"
      aria-label="New post"
      className="bottom-safe fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
    >
      <PenLine className="h-6 w-6" />
    </Link>
  );
}
