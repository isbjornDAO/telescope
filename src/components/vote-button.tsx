"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LeaderboardItem } from "@/types";

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
  const [projectName, setProjectName] = useState<string>("");

  const { signMessageAsync, isPending } = useSignMessage();
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
            setProjectName(data.projectName);
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

    console.log("🔵 Initiating vote process", { projectId, address });
    setIsLoading(true);
    const message = `I confirm that I want to vote for ${
      projectName || `project #${projectId}`
    }.\n\nThis signature is only used to verify your vote and cannot be used for any other purpose.`;

    try {
      const signature = await signMessageAsync({ message });

      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
        }),
      });

      const data = await response.json();
      console.log("🔵 Vote response:", { status: response.status, data });

      if (response.ok) {
        await queryClient.cancelQueries({ queryKey: ["projects"] });

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
      console.error("❌ Signature error:", error);

      toast({
        title: "Signature Failed",
        description: "You need to sign the message to vote.",
        variant: "destructive",
      });
    }
  };

  const isDisabled =
    isLoading || isPending || !isConnected || hasVoted || isGloballyDisabled;

  const buttonText = isLoading
    ? "Loading..."
    : isPending
    ? "Voting..."
    : hasVoted
    ? "Voted"
    : "Vote";

  return isLoading ? (
    <Button size="sm" disabled className="snow-button w-full md:w-auto">
      Loading...
    </Button>
  ) : (
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
