import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { calculateLevel, getXpForNextLevel } from "@/lib/xp";

interface UserStats {
  xp: number;
  level: number;
  xpForNextLevel: number;
}

export function useUserStats() {
  const { address, isConnected } = useAccount();

  return useQuery<UserStats>({
    queryKey: ["userStats", address],
    queryFn: async () => {
      if (!address) throw new Error("No address");

      const response = await fetch(`/api/users/${address}/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const { xp } = await response.json();
      return {
        xp,
        level: calculateLevel(xp),
        xpForNextLevel: getXpForNextLevel(xp),
      };
    },
    enabled: !!address && isConnected,
  });
}
