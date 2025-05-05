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
      
      const response = await fetch(`/api/auth/check-admin?walletAddress=${address}`);
      if (!response.ok) {
        throw new Error("Failed to check admin status");
      }
      
      const data = await response.json();
      console.log("🔒 Admin status response:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    enabled: !!address && isConnected,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
} 