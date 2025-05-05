"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";

export function VoteLockSwitch() {
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { address } = useAccount();

  useEffect(() => {
    if (address) {
      fetchVoteLockStatus();
    }
  }, [address]);

  const fetchVoteLockStatus = async () => {
    try {
      const response = await fetch(`/api/admin/vote-lock?walletAddress=${address}`);
      if (!response.ok) throw new Error("Failed to fetch vote lock status");
      const data = await response.json();
      setIsLocked(data.voteLock);
    } catch (error) {
      console.error("Error fetching vote lock status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vote lock status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/vote-lock?walletAddress=${address}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteLock: !isLocked }),
      });

      if (!response.ok) throw new Error("Failed to update vote lock status");

      const data = await response.json();
      setIsLocked(data.voteLock);
      toast({
        title: "Success",
        description: `Voting is now ${data.voteLock ? "locked" : "unlocked"}`,
      });
    } catch (error) {
      console.error("Error updating vote lock status:", error);
      toast({
        title: "Error",
        description: "Failed to update vote lock status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Lock Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Switch
            checked={isLocked}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
          <span className="text-sm font-medium">
            {isLocked ? "Voting is locked" : "Voting is unlocked"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
