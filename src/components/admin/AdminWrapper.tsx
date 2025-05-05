"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Address } from "viem";

export function AdminWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    data: adminData,
    isLoading: isAdminLoading,
    error,
  } = useAdminStatus(address as Address, isConnected);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log("🔒 Admin page access check:", {
        hasWallet: !!address,
        isConnected,
        isAdmin: adminData?.isAdmin,
        discordId: adminData?.discordId,
        isLoading: isAdminLoading,
        error,
      });

      // Don't redirect while loading
      if (isAdminLoading) {
        return;
      }

      // Don't redirect if we haven't checked yet
      if (isChecking) {
        return;
      }

      if (!isConnected || !address) {
        console.log("❌ No wallet connected");
        return;
      }

      if (error || !adminData?.isAdmin) {
        console.log("❌ User is not admin:", error || "No admin access");
        return;
      }

      console.log("✅ Admin access granted");
    };

    checkAdminAccess();
  }, [
    address,
    isConnected,
    adminData,
    isAdminLoading,
    error,
    router,
    isChecking,
  ]);

  // Update checking state when loading completes
  useEffect(() => {
    if (!isAdminLoading) {
      setIsChecking(false);
    }
  }, [isAdminLoading]);

  // Show loading state while checking access
  if (isChecking || isAdminLoading) {
    return (
      <div className="container mx-auto py-8 max-w-screen-lg">
        <div>Loading...</div>
      </div>
    );
  }

  // Only show content if we've finished checking and confirmed admin
  if (!isChecking && !isAdminLoading && (!adminData?.isAdmin || error)) {
    return null;
  }

  return <>{children}</>;
}
