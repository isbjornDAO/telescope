"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Address } from "viem";
import { ShieldAlert, RefreshCw } from "lucide-react";

export function AdminWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const {
    data: adminData,
    isLoading: isAdminLoading,
    error,
  } = useAdminStatus(address as Address, isConnected);
  const [isChecking, setIsChecking] = useState(true);

  // Update checking state when loading completes
  useEffect(() => {
    if (!isAdminLoading) {
      setIsChecking(false);
    }
  }, [isAdminLoading]);

  // Show themed loading state while checking access
  if (isChecking || isAdminLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 text-sky-500 animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Verifying Admin Credentials...
        </span>
      </div>
    );
  }

  // Not connected
  if (!isConnected || !address) {
    return (
      <div className="w-full py-8">
        <div className="retro-box max-w-md mx-auto">
          <div className="retro-box-title px-3.5 sm:px-4 gap-2">
            <ShieldAlert className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              Admin Access Required
            </span>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please connect an authorized admin wallet to access the control room.
            </p>
            <Link href="/" className="snow-button-secondary inline-flex">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Connected but unauthorized
  if (!adminData?.isAdmin || error) {
    return (
      <div className="w-full py-8">
        <div className="retro-box max-w-md mx-auto">
          <div className="retro-box-title px-3.5 sm:px-4 gap-2">
            <ShieldAlert className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              Access Denied
            </span>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Wallet {address.slice(0, 6)}...{address.slice(-4)} is not registered as an administrator.
            </p>
            <p className="text-xs text-muted-foreground">
              Access to this console is restricted to authorized platform maintainers.
            </p>
            <div>
              <Link href="/" className="snow-button-secondary inline-flex">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
