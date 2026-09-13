import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { Lock, Unlock, RefreshCw } from "lucide-react";

export function VoteLockSwitch() {
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { address } = useAccount();

  useEffect(() => {
    if (address) {
      fetchVoteLockStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/40">
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`p-2 rounded-md shrink-0 ${
            isLocked
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Global Vote Lock
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                isLocked
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {isLocked ? "Locked" : "Active"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLocked
              ? "Ballot voting and project votes are currently frozen platform-wide."
              : "Voting is active for all community members."}
          </p>
        </div>
      </div>
      <div className="flex items-center self-end sm:self-auto gap-2 shrink-0">
        <Switch
          checked={isLocked}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
