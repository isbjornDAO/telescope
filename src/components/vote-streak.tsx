import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Flame } from "lucide-react";

export function VoteStreak() {
  const { address, isConnected } = useAccount();

  const { data: voteData } = useQuery({
    queryKey: ["voteHistory", address],
    queryFn: async () => {
      if (!address) throw new Error("No address");
      const response = await fetch(`/api/users/${address}/votes`);
      if (!response.ok) throw new Error("Failed to fetch vote history");
      return response.json();
    },
    enabled: !!address && isConnected,
  });

  if (!voteData || !isConnected) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-zinc-900 mb-4">Vote Streak</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-2xl font-bold text-zinc-900">
              {voteData.currentStreak}
            </span>
          </div>
          <span className="text-zinc-500">days</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">
            Longest streak: {voteData.longestStreak} days
          </p>
        </div>
      </div>
    </div>
  );
} 