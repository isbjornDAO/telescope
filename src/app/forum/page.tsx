"use client";

import { ForumOverview } from "@/components/forum-overview";

/** You land on the forum and start talking. Composer first, no preamble. */
export default function ForumPage() {
  return (
    <div className="w-full relative z-10 mb-8 space-y-6">
      <ForumOverview />
    </div>
  );
}
