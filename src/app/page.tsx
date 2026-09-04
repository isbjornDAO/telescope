import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageSquare } from "lucide-react";

import { listTopics, listCategories, forumStats } from "@/lib/forum-queries";
import { externalLinks } from "@/lib/site";
import { TopicRow } from "@/components/forum/topic-row";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  description:
    "The community forum for builders on Avalanche. Ask questions, get answers, and find hackathons and bounties.",
};

export const revalidate = 60;

export default async function HomePage() {
  const [{ topics }, categories, stats] = await Promise.all([
    listTopics({ take: 8 }),
    listCategories(),
    forumStats(),
  ]);

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Where builders on Avalanche get unstuck.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Telescope is the community forum behind{" "}
            <a
              href={externalLinks.buildersHub}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              build.avax.network
            </a>
            . Ask a question, get an answer you can accept, and find the
            hackathons and bounties worth your time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/forum/ask" className="gap-2">
                Ask a question
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/forum">Browse the forum</Link>
            </Button>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <Stat value={stats.questions.toLocaleString()} label="questions asked" />
            <Stat value={`${stats.solvedRate}%`} label="answered and accepted" />
            <Stat value={stats.members.toLocaleString()} label="builders" />
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent activity</h2>
            <Link
              href="/forum"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              All topics
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card">
            {topics.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">The forum is empty.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask the first question and set the tone.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/forum/ask">Ask a question</Link>
                </Button>
              </div>
            ) : (
              topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium">Where to ask</h2>
            <ul className="mt-3 space-y-1">
              {categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/forum/c/${category.slug}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{category.title}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {category._count.topics}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium">Hackathons & bounties</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Team1 programmes run here. While the submission tooling is being
              built, briefs and questions live in the hackathons category.
            </p>
            <Link
              href="/forum/c/hackathons"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
            >
              Open the category
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium">Discover what is building</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              500+ Avalanche projects, mapped in Cascade.
            </p>
            <a
              href={externalLinks.cascade}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
            >
              cascade.team1.network
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>{" "}
        <span className="text-muted-foreground">{label}</span>
      </dd>
    </div>
  );
}
