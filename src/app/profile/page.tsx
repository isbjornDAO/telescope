"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
export default function Profile() {
  const { address, isConnected, status } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (status === "connecting" || status === "reconnecting") {
      return;
    }
    if (isConnected && address) {
      router.replace(`/profile/${address}`);
    } else if (status === "disconnected") {
      router.replace("/");
    }
  }, [isConnected, status, router, address]);

  return (
    <div className="w-full py-16 flex flex-col items-center justify-center animate-pulse">
      <div className="retro-box p-8 text-center max-w-sm w-full space-y-3">
        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto" />
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
        <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded mx-auto" />
      </div>
    </div>
  );
}
