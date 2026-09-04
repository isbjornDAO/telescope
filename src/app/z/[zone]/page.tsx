import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listTopics, listCategories } from "@/lib/forum-queries";
import { SORTS, type Sort } from "@/lib/forum";
import { zoneBySlug, ZONES } from "@/lib/zones";
import { ForumView } from "@/components/forum/forum-view";

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
 * One area of the forum. Only that area's categories appear in the chip bar, so
 * someone reading about a payments pilot is not shown validator troubleshooting
 * alongside it.
 */
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
    />
  );
}
