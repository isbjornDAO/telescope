"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import { useToast } from "@/hooks/use-toast";
import { useWorldSession } from "@/hooks/use-world";
import Image from "next/image";

interface CollectSnowdogButtonProps {
  address: Address;
}

export function CollectSnowdogButton({ address }: CollectSnowdogButtonProps) {
  const { toast } = useToast();
  const world = useWorldSession();
  const [claiming, setClaiming] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  // Check eligibility and claim status on mount
  useEffect(() => {
    checkEligibilityAndClaimed();
  }, [address]);

  // Update timer every minute
  useEffect(() => {
    const updateTimer = () => {
      // Set end date to November 6, 2025 at 11:59 PM
      const endDate = new Date('2025-11-06T23:59:59');

      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Expired");
        return;
      }

      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      setTimeRemaining(`${days}d left`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const checkEligibilityAndClaimed = async () => {
    setChecking(true);
    try {
      // Check if already claimed
      const collectablesRes = await fetch(`/api/collectables?address=${address}`);
      const collectablesData = await collectablesRes.json();

      const snowdogCollectable = collectablesData.find((c: any) => c.id === "snowdog");

      if (snowdogCollectable?.hasClaimed) {
        setHasClaimed(true);
        setChecking(false);
        return;
      }

      // Check eligibility via blockchain - fetch transactions from 2021
      const response = await fetch(
        `https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc`
      );

      const data = await response.json();

      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        const yearStart = new Date(`2021-01-01`).getTime() / 1000;
        const yearEnd = new Date(`2022-01-01`).getTime() / 1000;
        const targetContract = '0xdE9E52F1838951e4d2bb6C59723B003c353979b6'.toLowerCase();

        const interacted = data.result.some((tx: any) => {
          const timestamp = parseInt(tx.timeStamp);
          const isCorrectYear = timestamp >= yearStart && timestamp < yearEnd;
          const txTo = tx.to ? tx.to.toLowerCase() : '';
          const txFrom = tx.from ? tx.from.toLowerCase() : '';
          const isCorrectContract = txTo === targetContract || txFrom === targetContract;

          return isCorrectYear && isCorrectContract;
        });

        setIsEligible(interacted);
      } else {
        setIsEligible(false);
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
    } finally {
      setChecking(false);
    }
  };

  const handleCollect = async () => {
    if (!address || !isEligible) {
      return;
    }

    setClaiming(true);

    try {
      if (!world.isLoading && !world.isSignedIn) await world.signIn.mutateAsync();
      const response = await fetch("/api/collectables/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          collectableId: "snowdog",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to collect Snowdog");
      }

      toast({
        title: "Success!",
        description: "Snowdog collected! Check your profile.",
      });

      setHasClaimed(true);
    } catch (error) {
      console.error("Error claiming Snowdog:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to collect Snowdog",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  // Don't show if expired
  if (isExpired) {
    return null;
  }

  return (
    <div
      onClick={isEligible && !claiming && !checking ? handleCollect : undefined}
      className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-blue-50/30 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-lg border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center overflow-hidden">
          <img
            src="/collectables/snowdog-og.png"
            alt="Snowdog"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold" style={{ fontSize: '10px', letterSpacing: '0.1em', marginBottom: '2px' }}>
            Collectable
          </p>
          <p className="font-bold text-blue-900 dark:text-blue-100">Snowdog</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            2021 participant
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {timeRemaining && (
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            {timeRemaining}
          </span>
        )}
        {checking ? (
          <div className="px-4 py-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg">
            <span className="text-sm font-semibold">Checking...</span>
          </div>
        ) : claiming ? (
          <div className="px-4 py-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg">
            <span className="text-sm font-semibold">Claiming...</span>
          </div>
        ) : hasClaimed ? (
          <div className="px-4 py-2 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-lg">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">Claimed</span>
          </div>
        ) : isEligible ? (
          <button type="button" className="retro-btn-blue">
            <span>Collect</span>
          </button>
        ) : (
          <div className="px-4 py-2 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-lg">
            <span className="text-sm font-semibold">Not Eligible</span>
          </div>
        )}
      </div>
    </div>
  );
}

