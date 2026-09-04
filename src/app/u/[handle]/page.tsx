import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { RelativeTime } from "@/components/relative-time";

async function getProfile(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      image: true,
      bio: true,
      reputation: true,
      createdAt: true,
      address: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const user = await getProfile(params.handle);
  if (!user) return { title: "Profile not found" };

  return {
    title: user.name ?? `@${user.handle}`,
    description: user.bio ?? `${user.name ?? user.handle} on Telescope.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const user = await getProfile(params.handle);
  if (!user) notFound();

  const [topics, answers, accepted] = await Promise.all([
    prisma.topic.findMany({
      where: { authorId: user.id, deleted: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        title: true,
        score: true,
        replyCount: true,
        solved: true,
        createdAt: true,
      },
    }),
    prisma.reply.count({ where: { authorId: user.id, deleted: false } }),
    prisma.reply.count({ where: { authorId: user.id, deleted: false, accepted: true } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <header className="flex flex-wrap items-start gap-5">
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={72}
            height={72}
            className="h-18 w-18 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold uppercase">
            {(user.name ?? user.handle ?? "B").slice(0, 1)}
          </span>
        )}

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.name ?? `@${user.handle}`}
          </h1>
          {user.name ? (
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
          ) : null}
          {user.bio ? <p className="mt-2 max-w-prose text-sm">{user.bio}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Joined <RelativeTime date={user.createdAt} />
          </p>
        </div>
      </header>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-y border-border py-5 text-sm">
        <Stat label="Reputation" value={user.reputation.toLocaleString()} />
        <Stat label="Questions" value={topics.length.toLocaleString()} />
        <Stat label="Answers" value={answers.toLocaleString()} />
        <Stat label="Accepted" value={accepted.toLocaleString()} />
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Questions</h2>

        {topics.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing posted yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {topics.map((topic) => (
              <li key={topic.id} className="flex items-center gap-3 py-3">
                <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {topic.score}
                </span>
                <Link
                  href={`/forum/t/${topic.slug}`}
                  className="min-w-0 flex-1 truncate text-sm hover:underline underline-offset-4"
                >
                  {topic.title}
                </Link>
                {topic.solved ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-label="Solved"
                  />
                ) : null}
                <span className="shrink-0 text-xs text-muted-foreground">
                  <RelativeTime date={topic.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
