"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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

    toast({
      title: "Processing Vote",
      description: "Your vote is being recorded...",
      variant: "default",
    });

    console.log("🔵 Initiating vote process", { projectId, address });
    setIsLoading(true);
    const message = `I confirm that I want to vote for ${
      projectName || `project #${projectId}`
    }.\n\nThis signature is only used to verify your vote and cannot be used for any other purpose.`;

    try {
      const signature = await signMessageAsync({ message });
      console.log("🔵 Signature successful:", { signature });

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
        console.error("❌ Vote failed:", data.error);
        toast({
          title: "Vote Failed",
          description: data.error || "An error occurred while voting.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Signature error:", error);
      toast({
        title: "Signature Failed",
        description: "You need to sign the message to vote.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // The button should be disabled if:
  // - It's still loading the vote status
  // - The user is not connected
  // - A vote transaction is pending
  // - The user has already voted
  // - Voting is globally disabled
  const isDisabled =
    isLoading || isPending || !isConnected || hasVoted || isGloballyDisabled;

  // Determine the button text based on the current state
  const buttonText = isLoading
    ? "Loading..."
    : isPending
    ? "Voting..."
    : hasVoted
    ? "Voted"
    : "Vote";

  // Conditional Rendering: Show a loader or the button based on the loading state
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
