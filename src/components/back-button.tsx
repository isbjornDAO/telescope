"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();

  // Only show on profile pages
  if (!pathname.startsWith("/profile") && !pathname.startsWith("/news")) {
    return null;
  }

  return (
    <Link href="/">
      <Button variant="outline" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back Home
      </Button>
    </Link>
  );
}
