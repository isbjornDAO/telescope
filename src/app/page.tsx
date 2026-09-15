"use client";

import { ForumOverview } from "@/components/forum-overview";
import { BearWalk } from "@/components/bear-walk";

/** You land on the forum. No preamble, no onboarding. Start talking. */
export default function Home() {
  return (
    <div className="w-full relative z-10 mb-8 space-y-6">
      <ForumOverview />
      <BearWalk />
    </div>
  );
}

