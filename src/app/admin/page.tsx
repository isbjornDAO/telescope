import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { canModerate } from "@/lib/auth";
import { RelativeTime } from "@/components/relative-time";

export const metadata: Metadata = { title: "Moderation" };
export const dynamic = "force-dynamic";

/**
 * Moderation dashboard. The old admin page rendered four charts about project
 * voting, which is archived; what a moderator needs now is recent activity and
 * anything reported.
 */
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/admin");
  if (!canModerate(user.role)) redirect("/");

  const [topics, replies, members, solved, recent] = await Promise.all([
    prisma.topic.count({ where: { deleted: false } }),
    prisma.reply.count({ where: { deleted: false } }),
    prisma.user.count(),
    prisma.topic.count({ where: { deleted: false, solved: true } }),
    prisma.topic.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        replyCount: true,
        solved: true,
        author: { select: { name: true, handle: true } },
        category: { select: { title: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {user.name ?? user.handle} ({user.role}).
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Topics" value={topics} />
        <Stat label="Replies" value={replies} />
        <Stat label="Solved" value={solved} />
        <Stat label="Members" value={members} />
      </dl>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Latest topics</h2>
          <Link href="/admin/claims" className="text-sm underline underline-offset-4">
            Reward claims
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {recent.map((topic) => (
            <li key={topic.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <Link
                href={`/forum/t/${topic.slug}`}
                className="min-w-0 flex-1 truncate hover:underline underline-offset-4"
              >
                {topic.title}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                {topic.category.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {topic.author.name ?? topic.author.handle}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                <RelativeTime date={topic.createdAt} />
              </span>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No topics yet.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
