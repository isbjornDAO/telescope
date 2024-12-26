"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
export default function Profile() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push(`/profile/${address}`);
    }

    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router, address]);
}
