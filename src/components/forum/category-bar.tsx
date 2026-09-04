"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";

type Category = {
  slug: string;
  title: string;
  group: string;
  _count: { topics: number };
};

/**
 * Horizontally scrollable category chips above the topic list.
 *
 * With fifteen categories across four sections a flat chip row scrolls a long
 * way, so the active category is pulled to the front and the row ends with a
 * link to the grouped index at /categories, which is where the full taxonomy
 * with descriptions lives.
 */
export function CategoryBar({
  categories,
  basePath = "/",
}: {
  categories: Category[];
  /** Where the "All" chip returns to — the site root, or the current zone. */
  basePath?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeSlug = pathname?.startsWith("/forum/c/")
    ? pathname.split("/")[3]
    : null;
  const sort = params.get("sort");

  // Keep the active category visible without scrolling to find it.
  const ordered = activeSlug
    ? [
        ...categories.filter((category) => category.slug === activeSlug),
        ...categories.filter((category) => category.slug !== activeSlug),
      ]
    : categories;

  return (
    <nav
      aria-label="Categories"
      className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-1.5">
        <li>
          <Link
            href={sort ? `${basePath}?sort=${sort}` : basePath}
            aria-current={!activeSlug ? "page" : undefined}
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
              !activeSlug
                ? "bg-foreground text-background"
                : "bg-white text-muted-foreground shadow-sm hover:text-foreground dark:bg-zinc-800"
            }`}
          >
            All
          </Link>
        </li>

        {ordered.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <li key={category.slug}>
              <Link
                href={`/forum/c/${category.slug}`}
                aria-current={active ? "page" : undefined}
                title={category.group}
                className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-white text-muted-foreground shadow-sm hover:text-foreground dark:bg-zinc-800"
                }`}
              >
                {category.title}
                <span className="ml-1.5 text-xs opacity-60 tabular-nums">
                  {category._count.topics}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All categories
          </Link>
        </li>
      </ul>
    </nav>
  );
}
