"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { calculateLevel, getXpProgress, getXpForNextLevel } from "@/lib/xp";
import { buildBadges, sortBadges, type Badge } from "@/lib/badges";

interface StatsResponse {
  xp: number;
  coins: number;
  discordId: string | null;
  username: string | null;
}
interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastVoteDate: string | null;
  lastPostDate: string | null;
}
interface CollectableResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  category: string | null;
  hasClaimed: boolean;
  acquiredAt?: string | null;
}

/** A den is only ever read for one address at a time: your own, or the one on a profile. */
export function useDen(
  address: string | undefined,
  world?: { nodeType?: string | null; band?: string | null; shippedCount?: number; vouchesAtLeast?: number }
) {
  const enabled = !!address;

  const stats = useQuery<StatsResponse>({
    queryKey: ["den", "stats", address],
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}/stats`);
      if (!res.ok) throw new Error("Could not read stats");
      return res.json();
    },
    enabled,
    staleTime: 30_000,
  });

  const streak = useQuery<StreakResponse>({
    queryKey: ["den", "streak", address],
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}/streak`);
      if (!res.ok) throw new Error("Could not read streak");
      return res.json();
    },
    enabled,
    staleTime: 30_000,
  });

  const collectables = useQuery<CollectableResponse[]>({
    queryKey: ["den", "collectables", address],
    queryFn: async () => {
      const res = await fetch(`/api/collectables?address=${address}`);
      if (!res.ok) throw new Error("Could not read collectables");
      return res.json();
    },
    enabled,
    staleTime: 60_000,
  });

  // The chain is the slowest and least important of the four: never block on it.
  const chain = useQuery<{ classOf: string; firstTxDate: string }>({
    queryKey: ["den", "chain", address],
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}/avax-first-tx`);
      if (!res.ok) throw new Error("No first transaction found");
      return res.json();
    },
    enabled,
    retry: false,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const xp = stats.data?.xp ?? 0;
  const level = calculateLevel(xp);
  const progress = getXpProgress(xp);

  const badges: Badge[] = useMemo(
    () =>
      sortBadges(
        buildBadges({
          nodeType: world?.nodeType,
          band: world?.band,
          level,
          xp,
          streak: streak.data?.currentStreak ?? 0,
          longestStreak: streak.data?.longestStreak ?? 0,
          shippedCount: world?.shippedCount ?? 0,
          vouchesAtLeast: world?.vouchesAtLeast ?? 0,
          classOf: chain.data?.classOf ?? null,
          collectables: collectables.data ?? [],
        })
      ),
    [world?.nodeType, world?.band, world?.shippedCount, world?.vouchesAtLeast, level, xp, streak.data, chain.data, collectables.data]
  );

  return {
    xp,
    coins: stats.data?.coins ?? 0,
    level,
    progress,
    xpToNextLevel: getXpForNextLevel(xp),
    streak: streak.data?.currentStreak ?? 0,
    longestStreak: streak.data?.longestStreak ?? 0,
    classOf: chain.data?.classOf ?? null,
    firstTxDate: chain.data?.firstTxDate ?? null,
    badges,
    earned: badges.filter((b) => b.earned),
    locked: badges.filter((b) => !b.earned),
    isLoading: stats.isLoading || collectables.isLoading,
  };
}
