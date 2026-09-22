"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AudienceTag } from "@/components/forum/audience-picker";
import { Composer } from "@/components/forum/composer";
import { ThreadCardGridSkeleton } from "@/components/ui/retro-skeletons";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

interface Thread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  posts: Post[];
  audienceLabel?: string;
  restricted?: boolean;
}

interface Post {
  id: string;
  comment: string;
  posterId: string;
  createdAt: string;
  // Null when the author posted anonymously — withheld by the API, not hidden here.
  walletAddress: string | null;
  imageHash: string | null;
  anonymous: boolean;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const boardName = params.boardName as string;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardName]);

  const fetchThreads = async () => {
    try {
      const response = await fetch(`/api/forum/boards/${boardName}/threads`);
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full pb-16">
        {/* Retro Board Header Bar */}
        <div className="retro-topic-header mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
            >
              Home
            </Link>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              /{boardName}/
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                onClick={() => setShowNewThread(!showNewThread)}
                className={`retro-btn px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                  showNewThread ? "retro-btn-gray" : "retro-btn-green"
                }`}
              >
                {showNewThread ? "Cancel" : "New Thread"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                Connect wallet to post
              </span>
            )}
          </div>
        </div>

      {showNewThread && (
        <div className="mb-8">
          <Composer
            boardName={boardName}
            enableFloatingBar={false}
            onPosted={(threadId) => {
              setShowNewThread(false);
              queryClient.invalidateQueries({ queryKey: ["userStats", address] });
              router.push(`/forum/thread/${threadId}`);
            }}
          />
        </div>
      )}

      {loading ? (
        <ThreadCardGridSkeleton count={10} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
            <div className="retro-box p-3 hover:shadow-md transition h-full flex flex-col">
              {/* Thread Image */}
              {thread.posts[0]?.imageHash && (
                <div className="w-full aspect-square overflow-hidden rounded bg-zinc-100 mb-2 border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={thread.posts[0].imageHash}
                    alt={thread.subject || 'Thread image'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Thread Info */}
              <div className="space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs line-clamp-2 min-h-[2rem] text-zinc-800 dark:text-zinc-100">
                    {thread.subject || 'No Subject'}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {thread.posts[0]?.comment}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-2">
                  <span className="retro-comments-badge text-zinc-700 dark:text-zinc-200">
                    {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                  </span>
                  {thread.restricted && thread.audienceLabel && <AudienceTag label={thread.audienceLabel} />}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      {!loading && threads.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No threads yet. Be the first to post!</p>
          {!address && (
            <p className="text-sm text-muted-foreground">
              Connect your wallet to create a thread.
            </p>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}
