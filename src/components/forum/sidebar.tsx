import Link from "next/link";
import * as Icons from "lucide-react";

type Category = {
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  _count: { topics: number };
};

type Stats = {
  questions: number;
  solved: number;
  members: number;
  solvedRate: number;
};

/** Look up a lucide icon by name, falling back to a neutral one. */
function CategoryIcon({ name }: { name: string | null }) {
  const Icon =
    (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) ||
    Icons.Hash;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function ForumSidebar({
  categories,
  stats,
}: {
  categories: Category[];
  stats: Stats;
}) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </h2>
        <ul className="mt-3 space-y-0.5">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/forum/c/${category.slug}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <CategoryIcon name={category.icon} />
                <span className="min-w-0 flex-1 truncate">{category.title}</span>
                <span className="tabular-nums text-xs text-muted-foreground">
                  {category._count.topics}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This forum
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Stat label="Questions" value={stats.questions.toLocaleString()} />
          <Stat label="Solved" value={`${stats.solvedRate}%`} />
          <Stat label="Builders" value={stats.members.toLocaleString()} />
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium">New to Avalanche?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The docs, courses and the developer console live on Builders Hub.
        </p>
        <a
          href="https://build.avax.network"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
        >
          build.avax.network
          <Icons.ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
