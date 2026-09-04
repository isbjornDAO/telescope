import type { Metadata } from "next";

import { listTopics, listCategories, topicCountsByGroup } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { ForumView } from "@/components/forum/forum-view";
import { ZoneCards } from "@/components/forum/zone-cards";

export const metadata: Metadata = {
  description:
    "The Avalanche community forum. Growth and go-to-market, real-world uses of Avalanche, and help building on it.",
};

export const revalidate = 30;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sort?: string; tag?: string; q?: string };
}) {
  const sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sort)
    : "latest";

  const [{ topics, total }, categories, counts] = await Promise.all([
    listTopics({ sort, tag: searchParams.tag, query: searchParams.q, take: 25 }),
    listCategories(),
    topicCountsByGroup(),
  ]);

  // Zone cards belong on the unfiltered front page only; once someone is
  // searching or filtering they are in the way.
  const browsing = !searchParams.q && !searchParams.tag;

  return (
    <ForumView
      topics={topics}
      total={total}
      categories={categories}
      sort={sort}
      basePath="/"
      tag={searchParams.tag}
      query={searchParams.q}
      intro={browsing ? <ZoneCards counts={counts} /> : undefined}
    />
  );
}
