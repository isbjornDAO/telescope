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
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [projectName, setProjectName] = useState<string>("");

  const { signMessageAsync, isPending } = useSignMessage();

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
            setProjectName(data.projectName);
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
      console.log("❌ Wallet not connected");
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to vote.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔵 Initiating vote process", { projectId, address });
    setIsLoading(true);
    const message = `I confirm that I want to vote for ${projectName || `project #${projectId}`}.\n\nThis signature is only used to verify your vote and cannot be used for any other purpose.`;
    
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
          className: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50",
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

  const buttonText = isCheckingStatus
    ? "Vote..."
    : isPending
    ? "Voting..."
    : isLoading
    ? "Voting..."
    : hasVoted
    ? "Voted"
    : "Vote";

  return (
    <Button
      size="sm"
      disabled={
        !isConnected ||
        isLoading ||
        isPending ||
        hasVoted ||
        isGloballyDisabled ||
        isCheckingStatus
      }
      onClick={handleVote}
      className="snow-button w-full md:w-auto"
    >
      {buttonText}
    </Button>
  );
}
