"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { useAccount } from "wagmi";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Address } from "viem";

export default function NewProjectPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus(
    address as Address,
    isConnected
  );
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isConnected || !address) {
        console.log("❌ No wallet connected");
        router.push("/");
        return;
      }

      if (isAdminLoading) {
        return;
      }

      if (!isAdmin) {
        console.log("❌ User is not admin");
        router.push("/");
        return;
      }

      console.log("✅ Admin access granted");
      setIsChecking(false);
    };

    checkAdminAccess();
  }, [address, isConnected, isAdmin, isAdminLoading, router]);

  // Show loading state while checking access
  if (isChecking || isAdminLoading) {
    return <div>Loading...</div>;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return null;
  }

  return <ProjectForm mode="create" />;
}
