"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface VoteButtonProps {
  projectId: string;
  onVoteSuccess?: () => void;
}

export function VoteButton({ projectId, onVoteSuccess }: VoteButtonProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Fetch if the user has already voted for this project
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
          }
        } catch (error) {
          console.error("Failed to fetch vote status:", error);
        }
      }
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

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        toast({
          title: "Vote Successful",
          description: "Thank you for voting!",
        });
        setHasVoted(true);
        onVoteSuccess?.();
      } else {
        const errorData = await response.json();
        toast({
          title: "Vote Failed",
          description: errorData.error || "An error occurred while voting.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Vote Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      disabled={!isConnected || isLoading || hasVoted}
      onClick={handleVote}
    >
      {isLoading ? "Voting..." : hasVoted ? "Voted" : "Vote"}
    </Button>
  );
}
