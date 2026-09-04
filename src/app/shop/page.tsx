"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUserStats } from "@/hooks/use-user-stats";
import { Gift } from "lucide-react";
import Image from "next/image";

interface Reward {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  nftCollectionUrl: string;
  tokenId: string | null;
  xpRequired: number;
  totalAvailable: number;
  claimed: number;
  available: number;
  claimCount: number;
  hasClaimed: boolean;
}


export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { data: userStats, refetch: refetchUserStats } = useUserStats(
    address as Address,
    isConnected
  );

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const lastFetchRef = useRef<{ address: string | undefined; data: Reward[] } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = address && isConnected
        ? `/api/rewards?address=${address}`
        : "/api/rewards";
      console.log("Fetching rewards from:", url);
      const rewardsRes = await fetch(url);
      const rewardsData = await rewardsRes.json();
      console.log("Rewards data with hasClaimed:", rewardsData.map((r: Reward) => ({ name: r.name, hasClaimed: r.hasClaimed })));

      // Only update state if we're fetching with an address, OR if we don't have cached data with an address
      if (address && isConnected) {
        // Always update if we have an address (this is the authoritative state)
        setRewards(rewardsData);
        lastFetchRef.current = { address, data: rewardsData };
      } else if (!lastFetchRef.current?.address) {
        // Only update if we don't have address-based data cached
        setRewards(rewardsData);
      } else {
        // We have address-based data cached, keep using it
        console.log("Ignoring fetch without address, keeping cached data with address:", lastFetchRef.current.address);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, toast]);

  useEffect(() => {
    const fetchKey = `${isConnected}-${address || 'none'}`;
    console.log("useEffect triggered. isConnected:", isConnected, "address:", address, "key:", fetchKey);

    // Only fetch when component mounts or when wallet connection state changes
    if (isConnected && address) {
      console.log("Fetching with address");
      fetchData();
    } else if (!isConnected && !lastFetchRef.current) {
      console.log("Fetching without address (first load)");
      fetchData();
    }
  }, [address, isConnected, fetchData]);

  const handleClaim = async (rewardId: string) => {
    if (!address) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to claim rewards",
        variant: "destructive",
      });
      return;
    }

    setClaiming(rewardId);
    try {
      const response = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          rewardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim reward");
      }

      toast({
        title: "Success!",
        description: "Reward claimed successfully!",
      });

      // Refresh data
      await fetchData();
      await refetchUserStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim reward",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-16 md:mb-24 pb-8">

        <div className="space-y-6">
          {/* Available Rewards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Shop</h2>
            </div>
            <div className="space-y-4">
              {loading ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                  ))}
                </>
              ) : rewards.length > 0 ? (
                rewards.filter(reward => reward.available > 0).map((reward) => {
                  const isMysteriousKey = reward.name === 'Mysterious Key';
                  return (
                  <div key={reward.id} className="relative">
                    <div className={`snow-button-card rounded-lg shadow-lg hover:shadow-xl transition-all overflow-hidden ${
                      isMysteriousKey 
                        ? 'bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950 dark:via-zinc-900 dark:to-blue-950 border-2 border-blue-300 dark:border-blue-700 animate-shimmer bg-[length:200%_100%]' 
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}>
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Image Section */}
                        <div className="flex-shrink-0 w-full md:w-48 h-48 rounded-lg overflow-hidden">
                          {reward.imageUrl && (
                            <Image
                              src={reward.imageUrl}
                              alt={reward.name}
                              width={192}
                              height={192}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className={`font-bold text-2xl mb-2 ${isMysteriousKey ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 animate-shimmer-text bg-[length:200%_100%]' : ''}`}>{reward.name}</h3>
                            <p className={`mb-4 ${isMysteriousKey ? 'text-blue-700 dark:text-blue-300 font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 animate-shimmer-text bg-[length:200%_100%]' : 'text-muted-foreground'}`}>
                              {reward.description}
                            </p>
                            {reward.nftCollectionUrl !== '#' && (
                              <a
                                href={reward.nftCollectionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View Collection on Salvor →
                              </a>
                            )}
                          </div>

                          {/* Stats and Button */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4">
                            <div className="flex gap-6">
                              <div>
                                <p className={`text-sm ${isMysteriousKey ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>Price</p>
                                <p className={`text-2xl font-bold ${isMysteriousKey ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 animate-shimmer-text bg-[length:200%_100%]' : ''}`}>{reward.xpRequired} <span className={`text-sm ${isMysteriousKey ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>Coins</span></p>
                              </div>
                              <div className="border-l pl-6">
                                <p className={`text-sm ${isMysteriousKey ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>Available</p>
                                <p className={`text-2xl font-bold ${isMysteriousKey ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 animate-shimmer-text bg-[length:200%_100%]' : ''}`}>{reward.available}<span className={`text-sm ${isMysteriousKey ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>/{reward.totalAvailable}</span></p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleClaim(reward.id)}
                              disabled={
                                !isConnected ||
                                claiming === reward.id ||
                                (userStats?.coins || 0) < reward.xpRequired ||
                                reward.available <= 0 ||
                                reward.hasClaimed
                              }
                              className="snow-button sm:ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {claiming === reward.id ? (
                                "Claiming..."
                              ) : reward.hasClaimed ? (
                                "Claimed"
                              ) : reward.available <= 0 ? (
                                "Sold Out"
                              ) : (userStats?.coins || 0) < reward.xpRequired ? (
                                `Need ${reward.xpRequired - (userStats?.coins || 0)} more`
                              ) : (
                                `Buy Now`
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No rewards available at the moment</p>
                </Card>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
