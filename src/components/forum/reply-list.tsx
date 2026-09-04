"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { UserChip, type ChipUser } from "@/components/forum/user-chip";
import { RelativeTime } from "@/components/relative-time";
import { VoteControl } from "@/components/forum/vote-control";
import { useToast } from "@/hooks/use-toast";

export type ReplyItem = {
  id: string;
  body: string;
  accepted: boolean;
  score: number;
  createdAt: string;
  author: ChipUser;
  viewerVote: number;
};

export function ReplyList({
  replies,
  viewerId,
  canAccept,
}: {
  replies: ReplyItem[];
  viewerId: string | null;
  canAccept: boolean;
}) {
  if (replies.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No replies yet. If you know the answer, this is a good place to be first.
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-border">
      {replies.map((reply) => (
        <li key={reply.id}>
          <ReplyCard reply={reply} viewerId={viewerId} canAccept={canAccept} />
        </li>
      ))}
    </ul>
  );
}

function ReplyCard({
  reply,
  viewerId,
  canAccept,
}: {
  reply: ReplyItem;
  viewerId: string | null;
  canAccept: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(reply.accepted);
  const [pending, setPending] = useState(false);

  async function toggleAccept() {
    setPending(true);
    try {
      const response = await fetch(`/api/forum/replies/${reply.id}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not update the accepted answer");
      }

      const result = await response.json();
      setAccepted(result.accepted);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not accept that answer",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`flex gap-4 py-6 ${
        accepted ? "rounded-lg bg-emerald-50/60 px-4 dark:bg-emerald-950/20" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <VoteControl
          targetId={reply.id}
          kind="reply"
          score={reply.score}
          initialValue={reply.viewerVote}
          canVote={!!viewerId && viewerId !== reply.author.id}
        />

        {canAccept ? (
          <button
            type="button"
            onClick={toggleAccept}
            disabled={pending}
            aria-pressed={accepted}
            title={accepted ? "Unaccept this answer" : "Accept this answer"}
            className={`rounded-md p-1 transition-colors disabled:opacity-50 ${
              accepted
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:text-emerald-600"
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
          </button>
        ) : accepted ? (
          <CheckCircle2
            className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
            aria-label="Accepted answer"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        {accepted ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Accepted answer
          </p>
        ) : null}

        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {reply.body}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <UserChip user={reply.author} />
          <RelativeTime date={reply.createdAt} />
        </div>
      </div>
    </div>
  );
}
