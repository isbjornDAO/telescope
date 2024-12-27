"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LeaderboardItem } from "@/types";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address } from "viem";

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
  const [hasVoted, setHasVoted] = useState<boolean>(false);
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
            setHasVoted(data.hasVoted);
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

  const handleVote = async () => {
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

    queryClient.setQueryData<LeaderboardItem[]>(["projects"], (old) => {
      if (!old) return old;
      return old.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            metadata: {
              ...project.metadata,
              votes: (project.metadata?.votes || 0) + 1,
              voters: (project.metadata?.voters || 0) + 1,
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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });

        toast({
          title: "Vote Successful",
          description: "Thank you for voting!",
          variant: "default",
          className:
            "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50",
        });
        setHasVoted(true);
        onVoteSuccess?.();
      } else {
        queryClient.setQueryData(["projects"], previousProjects);

        toast({
          title: "Vote Failed",
          description: data.error || "An error occurred while voting.",
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
    isLoading ||
    !isConnected ||
    hasVoted ||
    isGloballyDisabled ||
    !userStats?.discordId;

  const buttonText = isLoading
    ? "Loading..."
    : hasVoted
    ? "Voted"
    : !userStats?.discordId
    ? "Vote"
    : "Vote";

  return (
    <Button
      size="sm"
      disabled={isDisabled}
      onClick={handleVote}
      className="snow-button w-full md:w-auto"
    >
      {buttonText}
    </Button>
  );
}
