import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listTopics, listCategories } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { zoneBySlug, ZONES } from "@/lib/zones";
import { ForumView } from "@/components/forum/forum-view";
import { NewsStrip } from "@/components/zones/news-strip";
import { EventsStrip } from "@/components/zones/events-strip";
import { FeaturedProjects } from "@/components/zones/featured-projects";
import { ToolDirectory } from "@/components/zones/tool-directory";

export const revalidate = 30;

export function generateStaticParams() {
  return ZONES.map((zone) => ({ zone: zone.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { zone: string };
}): Promise<Metadata> {
  const zone = zoneBySlug(params.zone);
  if (!zone) return { title: "Not found" };
  return { title: zone.label, description: zone.tagline };
}

/**
 * An area of the forum: its own discussion board, plus whatever belongs beside
 * that conversation. Discover carries projects, writing and events; Tools
 * carries the software directory; Code is the board on its own, because the
 * references a builder needs already live on Builders Hub.
 */
function asideFor(slug: string) {
  if (slug === "discover") {
    return (
      <>
        <FeaturedProjects />
        <EventsStrip />
        <NewsStrip />
      </>
    );
  }
  if (slug === "tools") return <ToolDirectory />;
  return null;
}

export default async function ZonePage({
  params,
  searchParams,
}: {
  params: { zone: string };
  searchParams: { sort?: string; q?: string; tag?: string };
}) {
  const zone = zoneBySlug(params.zone);
  if (!zone) notFound();

  const sort = (SORTS as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sort)
    : "latest";

  const [{ topics, total }, categories] = await Promise.all([
    listTopics({
      group: zone.group,
      sort,
      query: searchParams.q,
      tag: searchParams.tag,
      take: 25,
    }),
    listCategories(zone.group),
  ]);

  return (
    <ForumView
      topics={topics}
      total={total}
      categories={categories}
      sort={sort}
      basePath={`/z/${zone.slug}`}
      query={searchParams.q}
      tag={searchParams.tag}
      heading={zone.label}
      description={zone.tagline}
      aside={asideFor(zone.slug)}
    />
  );
}
