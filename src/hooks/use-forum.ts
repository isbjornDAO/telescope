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

export interface FeedPost {
  id: string;
  comment: string;
  imageHash: string | null;
  walletAddress: string | null;
  posterId: string;
  anonymous: boolean;
  createdAt: string;
  isOp: boolean;
  authorName: string;
  authorAvatar: string | null;
  user?: {
    username?: string | null;
    handle?: string | null;
    discordAvatar?: string | null;
  };
}

export interface FeedThread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  board: {
    id: string;
    name: string;
    title: string;
  };
  opPost: FeedPost | null;
  previewReplies: FeedPost[];
  audienceLabel?: string;
  restricted?: boolean;
}

export interface FeedPagination {
  page: number;
  limit: number;
  totalThreads: number;
  totalPages: number;
}

export interface FeedResponse {
  threads: FeedThread[];
  pagination: FeedPagination;
}

export interface UseForumFeedOptions {
  page?: number;
  limit?: number;
  board?: string | null;
}

export function useForumFeed({ page = 1, limit = 8, board = null }: UseForumFeedOptions = {}) {
  return useQuery<FeedResponse>({
    queryKey: ["forum", "feed", { page, limit, board }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (board && board !== "all") {
        params.set("board", board);
      }
      const res = await fetch(`/api/forum/feed?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch forum feed");
      return res.json();
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

