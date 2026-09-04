"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Category = { slug: string; title: string; _count: { topics: number } };

/**
 * Horizontally scrollable category chips, pinned above the topic list.
 *
 * Categories previously lived in a right sidebar, which on mobile stacked below
 * the whole topic list — you had to scroll past every topic to discover the
 * forum even had sections. Here they are the first thing under the tabs at
 * every width.
 */
export function CategoryBar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeSlug = pathname?.startsWith("/forum/c/")
    ? pathname.split("/")[3]
    : null;
  const sort = params.get("sort");

  return (
    <nav
      aria-label="Categories"
      className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1.5">
        <li>
          <Link
            href={sort ? `/?sort=${sort}` : "/"}
            aria-current={!activeSlug ? "page" : undefined}
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
              !activeSlug
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
        </li>
        {categories.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <li key={category.slug}>
              <Link
                href={`/forum/c/${category.slug}`}
                aria-current={active ? "page" : undefined}
                className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
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
      </ul>
    </nav>
  );
}
