import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { canModerate } from "@/lib/auth";
import { AUTHOR_FIELDS } from "@/lib/forum-queries";
import { UserChip } from "@/components/forum/user-chip";
import { RelativeTime } from "@/components/relative-time";
import { VoteControl } from "@/components/forum/vote-control";
import { ReplyList } from "@/components/forum/reply-list";
import { ReplyComposer } from "@/components/forum/reply-composer";

async function getTopic(slug: string) {
  return prisma.topic.findFirst({
    where: { slug, deleted: false },
    include: {
      author: AUTHOR_FIELDS,
      category: { select: { slug: true, title: true } },
      replies: {
        where: { deleted: false },
        orderBy: [{ accepted: "desc" }, { score: "desc" }, { createdAt: "asc" }],
        include: { author: AUTHOR_FIELDS },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const topic = await getTopic(params.slug);
  if (!topic) return { title: "Topic not found" };

  return {
    title: topic.title,
    description: topic.body.slice(0, 155),
    openGraph: { title: topic.title, description: topic.body.slice(0, 155) },
  };
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = await getTopic(params.slug);
  if (!topic) notFound();

  const viewer = await currentUser();

  // One query for every vote this viewer has on the page, rather than one per post.
  const votes = viewer
    ? Object.fromEntries(
        (
          await prisma.postVote.findMany({
            where: {
              userId: viewer.id,
              targetId: { in: [topic.id, ...topic.replies.map((r) => r.id)] },
            },
            select: { targetId: true, value: true },
          })
        ).map((vote) => [vote.targetId, vote.value])
      )
    : {};

  // Only the asker or a moderator sees the accept control.
  const canAccept =
    topic.kind === "question" &&
    !!viewer &&
    (viewer.id === topic.authorId || canModerate(viewer.role));

  prisma.topic
    .update({ where: { id: topic.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:py-12">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/forum" className="hover:underline underline-offset-4">
          Forum
        </Link>
        <span className="px-1.5">/</span>
        <Link
          href={`/forum/c/${topic.category.slug}`}
          className="hover:underline underline-offset-4"
        >
          {topic.category.title}
        </Link>
      </nav>

      <article className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            {topic.title}
          </h1>
          {topic.solved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved
            </span>
          ) : null}
          {topic.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <UserChip user={topic.author} />
          <span>asked <RelativeTime date={topic.createdAt} /></span>
          <span>{topic.viewCount.toLocaleString()} views</span>
        </div>

        <div className="mt-6 flex gap-4">
          <VoteControl
            targetId={topic.slug}
            kind="topic"
            score={topic.score}
            initialValue={votes[topic.id] ?? 0}
            canVote={!!viewer && viewer.id !== topic.authorId}
          />

          <div className="min-w-0 flex-1">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words dark:prose-invert">
              {topic.body}
            </div>

            {topic.tags.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/forum?tag=${encodeURIComponent(tag)}`}
                      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground/30"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </article>

      <section className="mt-10" aria-label="Replies">
        <h2 className="text-lg font-medium">
          {topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}
        </h2>

        <ReplyList
          replies={topic.replies.map((reply) => ({
            id: reply.id,
            body: reply.body,
            accepted: reply.accepted,
            score: reply.score,
            createdAt: reply.createdAt.toISOString(),
            author: reply.author,
            viewerVote: votes[reply.id] ?? 0,
          }))}
          viewerId={viewer?.id ?? null}
          canAccept={canAccept}
        />
      </section>

      <section className="mt-10">
        {topic.locked ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            This topic is locked. No new replies can be posted.
          </p>
        ) : viewer ? (
          <ReplyComposer slug={topic.slug} />
        ) : (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <Link
              href={`/signin?callbackUrl=/forum/t/${topic.slug}`}
              className="font-medium underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            to reply. Use the same account you use on build.avax.network.
          </p>
        )}
      </section>
    </div>
  );
}
