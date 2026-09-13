"use client";

import { useQuery } from "@tanstack/react-query";

export interface Board {
  id: string;
  name: string;
  title: string;
  description: string;
  totalThreadsCreated: number;
  _count: { threads: number };
}

export interface TrendingThread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  boardName: string;
  posts: {
    id: string;
    comment: string;
    imageHash?: string | null;
    walletAddress?: string | null;
    posterId?: string | null;
    anonymous?: boolean;
    authorName?: string;
    authorAvatar?: string | null;
    user?: {
      username?: string | null;
      handle?: string | null;
      discordAvatar?: string | null;
    };
  }[];
  audienceLabel?: string;
  restricted?: boolean;
}

export function useTrendingThreads() {
  return useQuery<TrendingThread[]>({
    queryKey: ["forum", "trending"],
    queryFn: async () => {
      const res = await fetch("/api/forum/trending");
      if (!res.ok) throw new Error("Failed to fetch trending discussions");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useForumBoards() {
  return useQuery<Board[]>({
    queryKey: ["forum", "boards"],
    queryFn: async () => {
      const res = await fetch("/api/forum/boards");
      if (!res.ok) throw new Error("Failed to fetch boards");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000, // 5 min cache: boards rarely change
    refetchOnWindowFocus: false,
  });
}
