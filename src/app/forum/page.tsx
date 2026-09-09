"use client";

import { ForumOverview } from "@/components/forum-overview";
import { WorldPage } from "@/components/world/primitives";

export default function ForumPage() {
  return (
    <WorldPage
      title="The forum"
      subtitle="Every room in the world, and what is moving in them right now."
    >
      <ForumOverview />
    </WorldPage>
  );
}
