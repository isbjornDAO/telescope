"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Loader2, Send } from "lucide-react";
import { AudiencePicker, type AudienceOptions } from "@/components/forum/audience-picker";
import { EVERYONE, serializeAudience, type Audience } from "@/lib/world/audience";
import { cn } from "@/lib/utils";

/**
 * The box you type in.
 *
 * It is the first thing on the forum, above trending and above the board
 * list, because the point of the page is to talk rather than to browse.
 * Everything optional is out of the way: a subject line appears only when
 * there is something to title, and the audience line already says "Anyone".
 *
 * Sized for a thumb — a 44px send button, 16px text in the textarea so iOS
 * does not zoom the page on focus, and nothing that needs two hands.
 */
export function Composer({
  boardName,
  boards,
  onBoardChange,
  onPosted,
  placeholder = "Say something",
  audienceOptions,
  compact,
  className,
}: {
  boardName: string;
  /** When present, the composer offers a board to post into. Omitted inside a board. */
  boards?: { name: string; title: string }[];
  onBoardChange?: (name: string) => void;
  onPosted?: (threadId: string) => void;
  placeholder?: string;
  audienceOptions?: AudienceOptions;
  compact?: boolean;
  className?: string;
}) {
  const { address, isConnected } = useAccount();
  const [comment, setComment] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState<Audience>(EVERYONE);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = comment.trim().length > 0 && isConnected && !sending;

  async function send() {
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/boards/${boardName}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment.trim(),
          subject: subject.trim() || null,
          walletAddress: address,
          anonymous: true,
          // The server re-parses this. Sending it is a request, not a decision.
          audience: serializeAudience(audience),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That did not go through.");
      setComment("");
      setSubject("");
      setAudience(EVERYONE);
      onPosted?.(data.threadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not go through.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900", className)}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        // text-base is 16px. Anything smaller and iOS Safari zooms on focus.
        className="w-full resize-none rounded-t-xl bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground"
      />

      {comment.trim().length > 0 && (
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Give it a title (optional)"
          className="min-h-11 w-full border-t border-zinc-100 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground dark:border-zinc-800"
        />
      )}

      <div className="border-t border-zinc-100 px-1 py-1 dark:border-zinc-800">
        <AudiencePicker value={audience} onChange={setAudience} options={audienceOptions} />
      </div>

      {error && <p className="px-3 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
        {boards && boards.length > 0 && (
          <select
            value={boardName}
            onChange={(e) => onBoardChange?.(e.target.value)}
            aria-label="Board"
            className="min-h-11 flex-1 rounded-lg bg-zinc-100 px-3 text-sm dark:bg-zinc-800"
          >
            {boards.map((b) => (
              <option key={b.name} value={b.name}>
                /{b.name}/ {b.title}
              </option>
            ))}
          </select>
        )}

        {isConnected ? (
          <button
            type="button"
            onClick={send}
            disabled={!ready}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--telescope-blue)] px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </button>
        ) : (
          // A second Connect Wallet button directly under the one in the
          // header is just the same shout twice. Say what is missing and let
          // the header carry the action.
          <span className="ml-auto flex min-h-11 items-center px-2 text-sm text-muted-foreground">
            Connect your wallet to post
          </span>
        )}
      </div>
    </div>
  );
}
