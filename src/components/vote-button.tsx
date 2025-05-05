"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LeaderboardItem } from "@/types";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address } from "viem";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteButtonProps {
  projectId: string;
  onVoteSuccess?: () => void;
  isGloballyDisabled?: boolean;
}

export function VoteButton({
  projectId,
  onVoteSuccess,
  isGloballyDisabled,
}: VoteButtonProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [voteStatus, setVoteStatus] = useState<{
    hasVoted: boolean;
    voteType: "like" | "dislike" | null;
    metadata?: {
      likes: number;
      dislikes: number;
      voters: number;
    };
  }>({ hasVoted: false, voteType: null });
  const { data: userStats } = useUserStats(address as Address, isConnected);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (isConnected && address) {
        try {
          const response = await fetch(
            `/api/projects/${projectId}/vote/status?walletAddress=${address}`,
            {
              method: "GET",
            }
          );
          if (response.ok) {
            const data = await response.json();
            setVoteStatus({
              hasVoted: data.hasVoted,
              voteType: data.voteType,
              metadata: data.metadata,
            });
          } else {
            console.error("Failed to fetch vote status:", response.statusText);
          }
        } catch (error) {
          console.error("Failed to fetch vote status:", error);
        }
      }
      setIsLoading(false);
    };

    checkVoteStatus();
  }, [isConnected, address, projectId]);

  const handleVote = async (type: "like" | "dislike") => {
    if (!isConnected || !address) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to vote.",
        variant: "destructive",
      });
      return;
    }

    if (!userStats?.discordId) {
      toast({
        title: "Discord Required",
        description: "Please connect your Discord account to vote.",
        variant: "destructive",
      });
      return;
    }

    const previousProjects = queryClient.getQueryData<LeaderboardItem[]>([
      "projects",
    ]);

    // Optimistically update the UI
    queryClient.setQueryData<LeaderboardItem[]>(["projects"], (old) => {
      if (!old) return old;
      return old.map((project) => {
        if (project.id === projectId) {
          const metadata = project.metadata as {
            likes: number;
            dislikes: number;
            voters: number;
          };
          return {
            ...project,
            metadata: {
              ...metadata,
              likes:
                type === "like"
                  ? (metadata.likes || 0) + 1
                  : metadata.likes || 0,
              dislikes:
                type === "dislike"
                  ? (metadata.dislikes || 0) + 1
                  : metadata.dislikes || 0,
            },
          };
        }
        return project;
      });
    });

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });

        toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Successful`,
          description: `Thank you for your ${type}!`,
          variant: "default",
          className:
            "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50",
        });
        setVoteStatus((prev) => ({ ...prev, hasVoted: true, voteType: type }));
        onVoteSuccess?.();
      } else {
        queryClient.setQueryData(["projects"], previousProjects);

        toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Failed`,
          description: data.error || `An error occurred while ${type}ing.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      queryClient.setQueryData(["projects"], previousProjects);
      console.error("Error voting:", error);

      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    isLoading || !isConnected || isGloballyDisabled || !userStats?.discordId;

  return (
    <div className="">
      <div className="flex gap-2">
        <Button
          variant={voteStatus.voteType === "like" ? "default" : "outline"}
          size="sm"
          onClick={() => handleVote("like")}
          disabled={isDisabled}
          className={
            voteStatus.voteType === "like" ? "bg-green-800" : "bg-transparent"
          }
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{voteStatus.metadata?.likes || 0}</span>
        </Button>
        <Button
          variant={voteStatus.voteType === "dislike" ? "default" : "outline"}
          size="sm"
          onClick={() => handleVote("dislike")}
          disabled={isDisabled}
          className={
            voteStatus.voteType === "dislike" ? "bg-red-800" : "bg-transparent"
          }
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{voteStatus.metadata?.dislikes || 0}</span>
        </Button>
      </div>
      {/* Ratio Bar */}
      <div className="h-1 mt-2 rounded bg-gray-200 overflow-hidden flex">
        {(() => {
          const likes = voteStatus.metadata?.likes || 0;
          const dislikes = voteStatus.metadata?.dislikes || 0;
          const total = likes + dislikes;
          const likeRatio = total > 0 ? (likes / total) * 100 : 0;
          const dislikeRatio = total > 0 ? (dislikes / total) * 100 : 0;
          return (
            <>
              <div
                className="bg-green-700 h-full"
                style={{ width: `${likeRatio}%` }}
              />
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${dislikeRatio}%` }}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
}
