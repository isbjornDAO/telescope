"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Optimistic follow toggle. Shows "Following" until hovered, then "Unfollow" —
 * the convention that makes the destructive action explicit without a dialog.
 */
export function FollowButton({
  handle,
  initialFollowing,
  signedIn,
}: {
  handle: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/signin?callbackUrl=/u/${handle}`);
      return;
    }
    if (pending) return;

    const previous = following;
    setFollowing(!previous);
    setPending(true);

    try {
      const response = await fetch(`/api/follow/${handle}`, { method: "POST" });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not update");
      }
      const result = await response.json();
      setFollowing(result.following);
      router.refresh();
    } catch (error) {
      setFollowing(previous);
      toast({
        title: "Could not update follow",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={following ? "outline" : "default"}
      className={`group min-w-[104px] ${following ? "hover:border-red-300 hover:text-red-600" : ""}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        "Follow"
      )}
    </Button>
  );
}
