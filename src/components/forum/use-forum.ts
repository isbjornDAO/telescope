"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export interface Board {
  id: string;
  name: string;
  title: string;
  description: string;
  totalThreadsCreated: number;
  _count: { threads: number };
}

export interface Thread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  boardId: string;
  boardName: string;
  posts: Array<{ id: string; comment: string; posterId: string; imageHash: string | null }>;
}

/** Boards open in order. A room only appears once the world is loud enough for it. */
export const UNLOCK_THRESHOLDS: Record<string, number> = {
  "Development & Technical": 100,
  "DeFi & Trading": 500,
  "Projects & Applications": 1000,
  "Governance & Institutional": 2000,
};

export const BOARD_GROUPS: { label: string; names: string[] }[] = [
  { label: "General Discussion", names: ["gen", "drama"] },
  { label: "Development & Technical", names: ["bridge", "tech", "sec", "dev"] },
  { label: "DeFi & Trading", names: ["defi", "price", "meme"] },
  { label: "Projects & Applications", names: ["nft", "avax_art", "game", "eco", "adopt"] },
  { label: "Governance & Institutional", names: ["gov", "inst", "reg", "rwa"] },
];

/** Newer threads and busy threads float; a thread nobody answers sinks. */
function trendingScore(thread: Thread): number {
  const now = Date.now();
  const hoursSinceBump = (now - new Date(thread.bumpedAt).getTime()) / 3_600_000;
  const hoursSinceCreation = (now - new Date(thread.createdAt).getTime()) / 3_600_000;
  return (thread.replyCount * 10) / (hoursSinceBump + 2) + (hoursSinceCreation < 24 ? 5 : 0);
}

export function useForumData() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBoards: 0, totalThreads: 0 });
  const [unlockProgress, setUnlockProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [boardsRes, trendingRes] = await Promise.all([fetch("/api/forum/boards"), fetch("/api/forum/trending")]);
        const boardsData = await boardsRes.json();
        const trendingData = await trendingRes.json();
        if (cancelled) return;

        if (Array.isArray(boardsData)) {
          setBoards(boardsData);
          setUnlockProgress(boardsData.reduce((sum: number, b: Board) => sum + (b.totalThreadsCreated || 0), 0));
          setStats({
            totalBoards: boardsData.length,
            totalThreads: boardsData.reduce((sum: number, b: Board) => sum + (b._count?.threads || 0), 0),
          });
        }
        if (Array.isArray(trendingData)) {
          setThreads([...trendingData].sort((a, b) => trendingScore(b) - trendingScore(a)));
        }
      } catch (error) {
        console.error("Error fetching forum data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { boards, threads, loading, stats, unlockProgress };
}

/** How many people are in the world right now. */
export function useActiveUsers() {
  const { isConnected } = useAccount();
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("/api/users/active");
        const data = await res.json();
        const count = data.activeCount || 0;
        setActiveUsers(isConnected ? Math.max(count, 1) : count);
      } catch (error) {
        console.error("Error fetching active users:", error);
      }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 30_000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return activeUsers;
}

/** One XP a day for showing up and saying something. Resets at midnight UTC. */
export function useDailyXp() {
  const { address } = useAccount();
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [earnedToday, setEarnedToday] = useState(false);

  useEffect(() => {
    const tick = () => {
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - Date.now();
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setEarnedToday(false);
    if (!address) return;
    const check = async () => {
      try {
        const res = await fetch(`/api/users/${address}/streak`);
        const data = await res.json();
        if (!data.lastPostDate) return setEarnedToday(false);
        const lastPost = new Date(data.lastPostDate).toISOString().split("T")[0];
        setEarnedToday(lastPost === new Date().toISOString().split("T")[0]);
      } catch (error) {
        console.error("Error checking XP status:", error);
        setEarnedToday(false);
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [address]);

  return { timeUntilReset, earnedToday };
}
