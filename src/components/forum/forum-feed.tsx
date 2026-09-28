"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Clock,
  User,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { useForumFeed, FeedThread } from "@/hooks/use-forum";
import { AudienceTag } from "@/components/forum/audience-picker";
import { cn } from "@/lib/utils";
import { PostMedia } from "@/components/forum/post-media";

interface ForumFeedProps {
  initialBoard?: string | null;
}

/** Formats greentext (> quotes) and linebreaks in retro style */
function FormattedComment({ comment, maxLines = 4 }: { comment: string; maxLines?: number }) {
  const lines = comment.split("\n");
  const displayLines = lines.slice(0, maxLines);
  const isTruncated = lines.length > maxLines;

  return (
    <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans break-words space-y-0.5">
      {displayLines.map((line, idx) => {
        const isGreen = line.trim().startsWith(">");
        return (
          <p
            key={idx}
            className={cn(
              isGreen
                ? "text-[#789922] dark:text-[#a0c242] font-mono text-[11px] sm:text-xs font-semibold"
                : "text-zinc-800 dark:text-zinc-200"
            )}
          >
            {line || "\u00A0"}
          </p>
        );
      })}
      {isTruncated && (
        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium italic block pt-0.5">
          ...more in thread
        </span>
      )}
    </div>
  );
}

export function ForumFeed({ initialBoard = null }: ForumFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
  } = useForumFeed({
    page: currentPage,
    limit: 8,
    board: initialBoard,
  });

  const threads = data?.threads || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Helper for rendering pagination page numbers
  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-1.5">
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <button
              key={i}
              onClick={() => handlePageChange(p)}
              className={cn(
                "retro-btn h-8 min-w-8 px-2 text-xs",
                currentPage === p ? "retro-btn-blue" : "retro-btn-gray"
              )}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="h-8 min-w-6 flex items-center justify-center text-xs text-muted-foreground font-bold">
              {p}
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <section ref={feedContainerRef} className="space-y-3.5 scroll-mt-20">
      {/* Feed Items (each thread is its own card) */}
      <div className="space-y-3.5">
        {isLoading ? (
          <FeedSkeleton count={4} />
        ) : threads.length === 0 ? (
          <div className="retro-box p-8 text-center text-muted-foreground space-y-2">
            <p className="text-sm font-medium">No threads found in this feed yet.</p>
            <p className="text-xs">Be the first to start a conversation using the composer above!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <FeedItem key={thread.id} thread={thread} />
          ))
        )}
      </div>

      {/* Centered Pagination Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="pt-3 pb-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="retro-btn retro-btn-gray h-8 px-3 text-xs inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {renderPaginationButtons()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="retro-btn retro-btn-gray h-8 px-3 text-xs inline-flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Individual Thread Feed Card with OP info and reply preview */
function FeedItem({ thread }: { thread: FeedThread }) {
  const op = thread.opPost;
  const previewReplies = thread.previewReplies || [];
  const hasReplies = thread.replyCount > 0;

  const isAnon = op?.anonymous !== false;
  const authorName = isAnon
    ? "Anonymous"
    : op?.user?.handle ||
      op?.user?.username ||
      (op?.walletAddress
        ? `${op.walletAddress.slice(0, 6)}...${op.walletAddress.slice(-4)}`
        : "Anonymous");

  const hasCustomSubject = Boolean(
    thread.subject &&
    thread.subject.trim() !== "" &&
    thread.subject.trim().toLowerCase() !== "untitled thread" &&
    thread.subject.trim().toLowerCase() !== "no subject"
  );

  return (
    <div className="retro-box p-4 hover:shadow-md transition flex flex-col space-y-3">
      {/* Clean, Streamlined Header: Board, Author & Timestamp */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/forum/${thread.board.name}`}
            className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 shrink-0 hover:bg-zinc-200/70 transition-colors"
            style={{ color: "var(--telescope-blue)" }}
          >
            /{thread.board.name}/
          </Link>

          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {authorName}
          </span>

          <span className="text-muted-foreground text-[11px] shrink-0">
            • {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
          </span>

          {thread.restricted && thread.audienceLabel && (
            <AudienceTag label={thread.audienceLabel} />
          )}
        </div>

        {/* Retro Comments Badge */}
        <Link
          href={`/forum/thread/${thread.id}`}
          className="retro-comments-badge text-zinc-700 dark:text-zinc-200 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          title={`${thread.replyCount} replies`}
        >
          {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
        </Link>
      </div>

      {/* Thread Subject / Title (omitted if Untitled) */}
      {hasCustomSubject && (
        <Link href={`/forum/thread/${thread.id}`} className="block group">
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] transition-colors leading-snug">
            {thread.subject}
          </h3>
        </Link>
      )}

      {/* Post Comment Body */}
      {op?.comment && (
        <Link href={`/forum/thread/${thread.id}`} className="block group">
          <FormattedComment comment={op.comment} maxLines={4} />
        </Link>
      )}

      {/* Attached Image Preview */}
      {op?.imageHash && (
        <div className="pt-0.5">
          <Link href={`/forum/thread/${thread.id}`} className="inline-block group">
            <div className="relative max-w-xs sm:max-w-sm max-h-[200px] rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <PostMedia
                src={op.imageHash}
                alt={thread.subject || "Post attachment"}
                interactive={false}
                className="w-full h-full max-h-[200px] object-cover group-hover:opacity-95 transition-opacity"
              />
            </div>
          </Link>
        </div>
      )}

      {/* ── Retro Inset Footer: Replies Preview or 0-Replies Prompt ── */}
      {hasReplies && previewReplies.length > 0 ? (
        <div className="border-t border-zinc-200 dark:border-zinc-800 -mx-4 -mb-4 mt-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <CornerDownRight className="w-3.5 h-3.5 text-[#2689BF] dark:text-[#52aae0]" />
              <span>Recent Replies</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {previewReplies.length} of {thread.replyCount}
            </span>
          </div>

          <div className="space-y-1.5">
            {previewReplies.map((reply) => (
              <Link
                key={reply.id}
                href={`/forum/thread/${thread.id}`}
                className="block p-2 rounded bg-white/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {reply.authorName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {reply.comment}
                </p>
              </Link>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between">
            <Link
              href={`/forum/thread/${thread.id}`}
              className="font-bold text-xs hover:underline inline-flex items-center gap-1 group"
              style={{ color: "var(--telescope-blue)" }}
            >
              <span>View all {thread.replyCount} replies</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              href={`/forum/thread/${thread.id}`}
              className="retro-btn retro-btn-gray text-[10px] px-2.5 py-0.5 font-bold"
            >
              Reply
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-t border-zinc-200 dark:border-zinc-800 -mx-4 -mb-4 mt-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-muted-foreground">
          <span className="italic text-[11px]">No replies yet</span>
          <Link
            href={`/forum/thread/${thread.id}`}
            className="font-semibold text-xs hover:underline inline-flex items-center gap-1 group"
            style={{ color: "var(--telescope-blue)" }}
          >
            <span>Be the first to reply</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

/** Skeleton loader for feed items */
function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="w-48 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="w-16 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="w-14 h-3 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="w-3/4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>

          <div className="pt-2">
            <div className="w-full h-14 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-100 dark:border-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
