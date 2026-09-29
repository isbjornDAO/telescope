import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

interface AdminResponse {
  isAdmin: boolean;
  discordId?: string;
  error?: string;
}

export function useAdminStatus(address: Address | undefined, isConnected: boolean) {
  return useQuery<AdminResponse>({
    queryKey: ["adminStatus", address],
    queryFn: async () => {
      if (!address) throw new Error("No address provided");
      
      const response = await fetch("/api/auth/check-admin");
      const data = await response.json().catch(() => ({ isAdmin: false }));
      return { isAdmin: Boolean(data.isAdmin) };
    },
    enabled: !!address && isConnected,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
} 