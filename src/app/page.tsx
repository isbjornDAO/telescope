import type { Metadata } from "next";

import { listTopics, listCategories } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { ForumView } from "@/components/forum/forum-view";

export const metadata: Metadata = {
  description:
    "The Avalanche community forum. Go-to-market and on-chain growth, real-world and public-good uses of Avalanche, and the technical help to build them.",
};

export const revalidate = 30;

/** The forum is the site, so it lives at the root rather than behind /forum. */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { sort?: string; tag?: string; q?: string };
}) {
  const sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sort)
    : "latest";

  const [{ topics, total }, categories] = await Promise.all([
    listTopics({ sort, tag: searchParams.tag, query: searchParams.q, take: 25 }),
    listCategories(),
  ]);

  return (
    <ForumView
      topics={topics}
      total={total}
      categories={categories}
      sort={sort}
      basePath="/"
      tag={searchParams.tag}
      query={searchParams.q}
    />
  );
}
