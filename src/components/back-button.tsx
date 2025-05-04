"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function BackButton() {
  const pathname = usePathname();

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Only show on profile, news, and mint pages
  if (
    !pathname.startsWith("/profile") &&
    !pathname.startsWith("/news") &&
    !pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <Link href="/">
      <Button
        variant="outline"
        className="gap-2"
        size={isMobile ? "icon" : "default"}
      >
        <Home className="h-4 w-4" />
        {isMobile ? "" : "Back Home"}
      </Button>
    </Link>
  );
}
