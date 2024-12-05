"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

interface VoteButtonProps {
  projectId: string;
}

export function VoteButton({ projectId }: VoteButtonProps) {
  const { isConnected } = useAccount();

  return (
    <Button size="sm" disabled={!isConnected}>
      Vote
    </Button>
  );
}
