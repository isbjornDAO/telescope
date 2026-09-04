"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Heart, Link2 } from "lucide-react";

import { Avatar } from "@/components/forum/avatar";
import { RelativeTime } from "@/components/relative-time";
import { useToast } from "@/hooks/use-toast";

export type PostAuthor = {
  id: string;
  name: string | null;
  handle: string | null;
  image: string | null;
  reputation: number;
};

/**
 * One post in a thread, laid out the way a conventional forum does it: the
 * author identifies the post from the top-left, the body reads full width
 * beneath, and the actions sit quietly in a footer.
 *
 * This replaces a Stack Overflow arrangement — a score column with up/down
 * arrows on the left and the author's name in small grey text underneath the
 * body — which read as a Q&A site rather than a forum, and spent scarce mobile
 * width on a vote widget.
 */
export function PostCard({
  postId,
  number,
  author,
  body,
  createdAt,
  score,
  viewerVote,
  accepted,
  isOriginalPost = false,
  canLike,
  canAccept,
  tags,
  voteEndpoint,
  acceptEndpoint,
}: {
  postId: string;
  number: number;
  author: PostAuthor;
  body: string;
  createdAt: string;
  score: number;
  viewerVote: number;
  accepted?: boolean;
  isOriginalPost?: boolean;
  canLike: boolean;
  canAccept?: boolean;
  tags?: string[];
  voteEndpoint: string;
  acceptEndpoint?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [likes, setLikes] = useState({ score, mine: viewerVote === 1 });
  const [isAccepted, setIsAccepted] = useState(!!accepted);
  const [pending, setPending] = useState(false);

  const name = author.name ?? author.handle ?? "Builder";

  async function toggleLike() {
    if (!canLike) {
      router.push("/signin");
      return;
    }
    if (pending) return;

    const previous = likes;
    setLikes({ score: likes.score + (likes.mine ? -1 : 1), mine: !likes.mine });
    setPending(true);

    try {
      const response = await fetch(voteEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: 1 }),
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not save that");
      }
      const result = await response.json();
      setLikes({ score: result.score, mine: result.value === 1 });
    } catch (error) {
      setLikes(previous);
      toast({
        title: "Could not save your like",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  async function toggleAccept() {
    if (!acceptEndpoint || pending) return;
    setPending(true);
    try {
      const response = await fetch(acceptEndpoint, { method: "POST" });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not update the answer");
      }
      const result = await response.json();
      setIsAccepted(result.accepted);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not mark that answer",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      id={`post-${postId}`}
      className={`scroll-mt-20 rounded-xl border bg-card ${
        isAccepted
          ? "border-emerald-300 dark:border-emerald-800"
          : "border-border"
      }`}
    >
      {isAccepted ? (
        <p className="flex items-center gap-1.5 rounded-t-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:px-4">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accepted answer
        </p>
      ) : null}

      <div className="p-3 sm:p-4">
        <header className="flex items-center gap-2.5">
          <Link href={author.handle ? `/u/${author.handle}` : "#"} className="shrink-0">
            <Avatar name={name} image={author.image} size={36} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link
                href={author.handle ? `/u/${author.handle}` : "#"}
                className="truncate text-sm font-semibold hover:underline underline-offset-4"
              >
                {name}
              </Link>
              {isOriginalPost ? (
                <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Author
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground" title="Reputation">
                {author.reputation.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <RelativeTime date={createdAt} />
            </p>
          </div>

          <a
            href={`#post-${postId}`}
            className="shrink-0 text-xs tabular-nums text-muted-foreground hover:text-foreground"
            title="Link to this post"
          >
            #{number}
          </a>
        </header>

        <div className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {body}
        </div>

        {tags && tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/forum?tag=${encodeURIComponent(tag)}`}
                  className="inline-block rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground/30"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <footer className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
          <button
            type="button"
            onClick={toggleLike}
            disabled={pending}
            aria-pressed={likes.mine}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors disabled:opacity-50 ${
              likes.mine
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${likes.mine ? "fill-current" : ""}`} />
            {likes.score > 0 ? (
              <span className="tabular-nums">{likes.score}</span>
            ) : (
              <span className="sr-only">Like</span>
            )}
          </button>

          <a
            href={`#post-${postId}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Link2 className="h-4 w-4" />
            <span className="sr-only">Copy link to post</span>
          </a>

          {canAccept && acceptEndpoint ? (
            <button
              type="button"
              onClick={toggleAccept}
              disabled={pending}
              aria-pressed={isAccepted}
              className={`ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                isAccepted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-emerald-600"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isAccepted ? "Accepted" : "Accept"}
            </button>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
