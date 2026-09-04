import type { Metadata } from "next";
import Link from "next/link";

import { PageNavigation } from "@/components/page-navigation";
import * as Icons from "lucide-react";

import { listCategoryGroups } from "@/lib/forum-queries";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Everything Telescope covers: go-to-market and on-chain growth, real-world and public-good uses of Avalanche, and building on it.",
};

export const revalidate = 60;

function CategoryIcon({ name }: { name: string | null }) {
  const Icon =
    (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) ||
    Icons.Hash;
  return <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />;
}

/**
 * The board index. Fifteen categories across four very different subjects do
 * not read as a flat list, so they are grouped and described here; the chip bar
 * on the topic list stays for quick filtering.
 */
export default async function CategoriesPage() {
  const groups = await listCategoryGroups();

  return (
    <div className="mx-auto w-full max-w-screen-lg px-3 py-4 sm:px-4 sm:py-6 md:px-8">
      <PageNavigation />

      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Categories
      </h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
        What Telescope is for: getting Avalanche in front of people, putting it
        to work in the real world, and building on it.
      </p>

      <div className="mt-8 space-y-8">
        {groups.map(({ group, categories }) => (
          <section key={group}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </h2>

            <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/forum/c/${category.slug}`}
                    className="flex gap-3 px-3 py-3.5 transition-colors hover:bg-muted/40 sm:px-4"
                  >
                    <span className="pt-0.5">
                      <CategoryIcon name={category.icon} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">
                        {category.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {category.description}
                      </span>
                    </span>

                    <span className="shrink-0 pt-0.5 text-right">
                      <span className="block text-sm font-medium tabular-nums">
                        {category._count.topics}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                        {category._count.topics === 1 ? "topic" : "topics"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
