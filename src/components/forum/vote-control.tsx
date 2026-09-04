"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

/**
 * Optimistic vote arrows. `targetId` is the topic slug for topics and the reply
 * id for replies, matching the two API routes.
 */
export function VoteControl({
  targetId,
  kind,
  score,
  initialValue,
  canVote,
}: {
  targetId: string;
  kind: "topic" | "reply";
  score: number;
  initialValue: number;
  canVote: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState({ score, value: initialValue });
  const [pending, setPending] = useState(false);

  const endpoint =
    kind === "topic"
      ? `/api/forum/topics/${targetId}/vote`
      : `/api/forum/replies/${targetId}/vote`;

  async function vote(value: 1 | -1) {
    if (pending) return;
    if (!canVote) {
      router.push("/signin");
      return;
    }

    const previous = state;
    // Clicking the active arrow retracts, which the server mirrors.
    const nextValue = state.value === value ? 0 : value;
    setState({ score: state.score - state.value + nextValue, value: nextValue });
    setPending(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Vote failed");
      }

      const result = await response.json();
      setState({ score: result.score, value: result.value });
    } catch (error) {
      setState(previous);
      toast({
        title: "Could not record your vote",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
      <Arrow
        direction="up"
        active={state.value === 1}
        disabled={pending}
        onClick={() => vote(1)}
      />
      <span className="text-sm font-semibold tabular-nums">{state.score}</span>
      <Arrow
        direction="down"
        active={state.value === -1}
        disabled={pending}
        onClick={() => vote(-1)}
      />
    </div>
  );
}

function Arrow({
  direction,
  active,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "up" ? "Upvote" : "Downvote"}
      aria-pressed={active}
      className={`rounded-md p-1 transition-colors disabled:opacity-50 ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
