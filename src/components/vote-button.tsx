"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface VoteButtonProps {
  projectId: string;
  onVoteSuccess?: () => void;
  isGloballyDisabled?: boolean;
}

export function VoteButton({ projectId, onVoteSuccess, isGloballyDisabled }: VoteButtonProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Fetch if the user has already voted for this project
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (isConnected && address) {
        setIsCheckingStatus(true);
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
        } finally {
          setIsCheckingStatus(false);
        }
      } else {
        setIsCheckingStatus(false);
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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isCheckingStatus 
    ? "Vote" 
    : isLoading 
      ? "Voting..." 
      : hasVoted 
        ? "Voted" 
        : isGloballyDisabled 
          ? "Vote" 
          : "Vote";

  return (
    <Button
      size="sm"
      disabled={!isConnected || isLoading || hasVoted || isGloballyDisabled || isCheckingStatus}
      onClick={handleVote}
    >
      {buttonText}
    </Button>
  );
}
