import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, Eye, MessageSquare } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { canModerate } from "@/lib/auth";
import { AUTHOR_FIELDS } from "@/lib/forum-queries";
import { RelativeTime } from "@/components/relative-time";
import { PostCard } from "@/components/forum/post-card";
import { ReplyComposer } from "@/components/forum/reply-composer";

async function getTopic(slug: string) {
  return prisma.topic.findFirst({
    where: { slug, deleted: false },
    include: {
      author: AUTHOR_FIELDS,
      category: { select: { slug: true, title: true } },
      replies: {
        where: { deleted: false },
        // Chronological, the way a forum thread reads. The accepted answer is
        // surfaced by a jump link at the top instead of being hoisted out of
        // sequence, so the conversation still makes sense read top to bottom.
        orderBy: { createdAt: "asc" },
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

  const canAccept =
    topic.kind === "question" &&
    !!viewer &&
    (viewer.id === topic.authorId || canModerate(viewer.role));

  const acceptedReply = topic.replies.find((reply) => reply.accepted);

  prisma.topic
    .update({ where: { id: topic.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
      <nav
        className="flex items-center gap-1 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground">
          Forum
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <Link href={`/forum/c/${topic.category.slug}`} className="truncate hover:text-foreground">
          {topic.category.title}
        </Link>
      </nav>

      <h1 className="mt-2 text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
        {topic.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {topic.replyCount} {topic.replyCount === 1 ? "reply" : "replies"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {topic.viewCount.toLocaleString()}
        </span>
        <span>
          started <RelativeTime date={topic.createdAt} />
        </span>
      </div>

      {acceptedReply ? (
        <a
          href={`#post-${acceptedReply.id}`}
          className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Solved by{" "}
            <span className="font-medium">
              {acceptedReply.author.name ?? acceptedReply.author.handle}
            </span>
          </span>
          <span className="shrink-0 text-xs underline underline-offset-4">
            Jump to answer
          </span>
        </a>
      ) : null}

      <div className="mt-4 space-y-3">
        <PostCard
          postId={topic.id}
          number={1}
          author={topic.author}
          body={topic.body}
          createdAt={topic.createdAt.toISOString()}
          score={topic.score}
          viewerVote={votes[topic.id] ?? 0}
          isOriginalPost
          tags={topic.tags}
          canLike={!!viewer && viewer.id !== topic.authorId}
          voteEndpoint={`/api/forum/topics/${topic.slug}/vote`}
        />

        {topic.replies.map((reply, index) => (
          <PostCard
            key={reply.id}
            postId={reply.id}
            number={index + 2}
            author={reply.author}
            body={reply.body}
            createdAt={reply.createdAt.toISOString()}
            score={reply.score}
            viewerVote={votes[reply.id] ?? 0}
            accepted={reply.accepted}
            isOriginalPost={reply.authorId === topic.authorId}
            canLike={!!viewer && viewer.id !== reply.authorId}
            canAccept={canAccept}
            voteEndpoint={`/api/forum/replies/${reply.id}/vote`}
            acceptEndpoint={`/api/forum/replies/${reply.id}/accept`}
          />
        ))}
      </div>

      <section className="mt-6">
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
