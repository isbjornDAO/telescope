"use client";

import { ForumOverview } from "@/components/forum-overview";
import { PageNavigation } from "@/components/page-navigation";

/** You land on the forum. No preamble, no onboarding. Start talking. */
export default function Home() {
  return (
    <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-16">
      <PageNavigation />
      <ForumOverview />
    </div>
  );
}
