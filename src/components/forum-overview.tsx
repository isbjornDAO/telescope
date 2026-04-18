"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Users, Clock, CheckCircle, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAccount } from "wagmi";
import { useActivityTracker } from "@/hooks/use-activity-tracker";

interface Board {
  id: string;
  name: string;
  title: string;
  description: string;
  totalThreadsCreated: number;
  _count: {
    threads: number;
  };
}

interface Thread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  boardId: string;
  posts: Array<{
    id: string;
    comment: string;
    posterId: string;
    imageHash: string | null;
  }>;
}

export function ForumOverview() {
  const { address, isConnected } = useAccount();
  useActivityTracker(); // Track user activity
  const [boards, setBoards] = useState<Board[]>([]);
  const [recentThreads, setRecentThreads] = useState<Array<Thread & { boardName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBoards: 0, totalThreads: 0 });
  const [unlockProgress, setUnlockProgress] = useState(0); // Track all-time threads for unlocks

  // Define unlock thresholds
  const unlockThresholds = {
    'Development & Technical': 100,
    'DeFi & Trading': 500,
    'Projects & Applications': 1000,
    'Governance & Institutional': 2000
  };
  const [activeUsers, setActiveUsers] = useState(0);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [earnedToday, setEarnedToday] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkTodayXP = async () => {
      if (!address) {
        setEarnedToday(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/users/${address}/streak`);
        const data = await response.json();
        
        if (data.lastPostDate) {
          const lastPost = new Date(data.lastPostDate);
          const now = new Date();
          
          // Compare just the UTC date strings (YYYY-MM-DD)
          const lastPostDateStr = lastPost.toISOString().split('T')[0];
          const todayDateStr = now.toISOString().split('T')[0];
          
          const isToday = lastPostDateStr === todayDateStr;
          console.log('XP check - LastPost date:', lastPostDateStr, 'Today date:', todayDateStr, 'Equal?', isToday);
          setEarnedToday(isToday);
        } else {
          console.log('No last post date, XP available');
          setEarnedToday(false);
        }
      } catch (error) {
        console.error("Error checking XP status:", error);
        setEarnedToday(false);
      }
    };

    // Immediately reset state when address changes
    setEarnedToday(false);
    
    checkTodayXP();
    
    // Poll every 30 seconds to check if XP was earned
    const interval = setInterval(checkTodayXP, 30000);
    return () => clearInterval(interval);
  }, [address]); // Re-run when address changes

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch('/api/users/active');
        const data = await response.json();
        // Show at least 1 if user is connected (they are active)
        const count = data.activeCount || 0;
        setActiveUsers(isConnected ? Math.max(count, 1) : count);
      } catch (error) {
        console.error("Error fetching active users:", error);
      }
    };

    fetchActiveUsers();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    const calculateTrendingScore = (thread: Thread): number => {
      const now = new Date().getTime();
      const bumpedAt = new Date(thread.bumpedAt).getTime();
      const createdAt = new Date(thread.createdAt).getTime();

      const hoursSinceLastBump = (now - bumpedAt) / (1000 * 60 * 60);
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      // Trending score: higher for more replies, recent activity, and newer threads
      // Formula: (replies * 10) / (hours since bump + 2) + bonus for new threads
      const engagementScore = (thread.replyCount * 10) / (hoursSinceLastBump + 2);
      const recencyBonus = hoursSinceCreation < 24 ? 5 : 0;

      return engagementScore + recencyBonus;
    };

    const fetchForumData = async () => {
      try {
        // Fetch boards and trending threads in parallel
        const [boardsResponse, trendingResponse] = await Promise.all([
          fetch("/api/forum/boards"),
          fetch("/api/forum/trending")
        ]);

        const boardsData = await boardsResponse.json();
        const trendingData = await trendingResponse.json();

        if (Array.isArray(boardsData)) {
          setBoards(boardsData);

          // Calculate stats
          const totalThreadsCreated = boardsData.reduce((sum, board) => sum + (board.totalThreadsCreated || 0), 0);
          const currentThreadCount = boardsData.reduce((sum, board) => sum + (board._count?.threads || 0), 0);

          setUnlockProgress(totalThreadsCreated); // Use all-time for unlocks
          setStats({
            totalBoards: boardsData.length,
            totalThreads: currentThreadCount // Show current active threads
          });
        }

        if (Array.isArray(trendingData)) {
          // Calculate trending scores and sort
          const threadsWithScores = trendingData.map(thread => ({
            ...thread,
            trendingScore: calculateTrendingScore(thread)
          }));

          const trendingThreads = threadsWithScores
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 10);

          setRecentThreads(trendingThreads);
        }
      } catch (error) {
        console.error("Error fetching forum data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForumData();
  }, []);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trending Threads */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Threads
          </h2>
          {/* XP Text Link - Inline with title on desktop, below on mobile */}
          <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            {isConnected ? (
              <>
                {earnedToday ? (
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                )}
                <span className="whitespace-nowrap">
                  {earnedToday ? 'XP Earned Today' : '1 XP Available'}
                </span>
                <span className="hidden md:inline">·</span>
                <span className="whitespace-nowrap">Resets in {timeUntilReset}</span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Daily XP Reset:</span>
                <span className="whitespace-nowrap">{timeUntilReset}</span>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentThreads.length > 0 ? (
            recentThreads.slice(0, 3).map((thread) => (
              <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex gap-3 p-3">
                    {thread.posts[0]?.imageHash && (
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <img 
                          src={thread.posts[0].imageHash} 
                          alt={thread.subject || 'Thread image'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          {thread.subject && (
                            <h3 className="font-semibold text-sm truncate flex-1">
                              {thread.subject}
                            </h3>
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(thread.bumpedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {thread.posts[0]?.comment || "No content"}
                        </p>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700 text-sky-700 dark:text-sky-300">
                            /{thread.boardName}/
                          </Badge>
                          <span className="text-xs text-white dark:text-zinc-400">
                            {thread.replyCount} replies
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-8 text-center col-span-3">
              <p className="text-muted-foreground text-sm">No threads yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* All Boards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Boards
          </h2>
        </div>
        <div className="space-y-8">
          {/* General Discussion */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">General Discussion</h3>
            <Card className="overflow-hidden">
              <div className="divide-y">
                {boards.filter(b => ['gen', 'drama'].includes(b.name)).sort((a, b) => {
                  const order = ['gen', 'drama'];
                  return order.indexOf(a.name) - order.indexOf(b.name);
                }).map((board) => (
                  <Link key={board.id} href={`/forum/${board.name}`}>
                    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-bold text-sm whitespace-nowrap w-[5rem] pl-2 text-sky-700 dark:text-sky-300">
                            /{board.name}/
                          </h3>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">
                              {board.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {board.description}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {board._count.threads}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Development & Technical */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">
              Development & Technical
              {unlockProgress < unlockThresholds['Development & Technical'] && (
                <span className="ml-2 text-xs inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> {unlockThresholds['Development & Technical']} threads to unlock
                </span>
              )}
            </h3>
            <Card className={`overflow-hidden ${unlockProgress < unlockThresholds['Development & Technical'] ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="divide-y">
                {boards.filter(b => ['bridge', 'tech', 'sec', 'dev'].includes(b.name)).sort((a, b) => {
                  const order = ['bridge', 'tech', 'sec', 'dev'];
                  return order.indexOf(a.name) - order.indexOf(b.name);
                }).map((board) => (
                  <Link key={board.id} href={`/forum/${board.name}`}>
                    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-bold text-sm whitespace-nowrap w-[5rem] pl-2 text-sky-700 dark:text-sky-300">
                            /{board.name}/
                          </h3>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">
                              {board.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {board.description}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <Lock className="h-3 w-3" />
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* DeFi & Trading */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">
              DeFi & Trading
              {unlockProgress < unlockThresholds['DeFi & Trading'] && (
                <span className="ml-2 text-xs inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> {unlockThresholds['DeFi & Trading']} threads to unlock
                </span>
              )}
            </h3>
            <Card className={`overflow-hidden ${unlockProgress < unlockThresholds['DeFi & Trading'] ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="divide-y">
                {boards.filter(b => ['defi', 'price', 'meme'].includes(b.name)).sort((a, b) => {
                  const order = ['defi', 'price', 'meme'];
                  return order.indexOf(a.name) - order.indexOf(b.name);
                }).map((board) => (
                  <Link key={board.id} href={`/forum/${board.name}`}>
                    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-bold text-sm whitespace-nowrap w-[5rem] pl-2 text-sky-700 dark:text-sky-300">
                            /{board.name}/
                          </h3>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">
                              {board.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {board.description}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <Lock className="h-3 w-3" />
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Projects & Applications */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">
              Projects & Applications
              {unlockProgress < unlockThresholds['Projects & Applications'] && (
                <span className="ml-2 text-xs inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> {unlockThresholds['Projects & Applications']} threads to unlock
                </span>
              )}
            </h3>
            <Card className={`overflow-hidden ${unlockProgress < unlockThresholds['Projects & Applications'] ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="divide-y">
                {boards.filter(b => ['nft', 'avax_art', 'game', 'eco', 'adopt'].includes(b.name)).sort((a, b) => {
                  const order = ['nft', 'avax_art', 'game', 'eco', 'adopt'];
                  return order.indexOf(a.name) - order.indexOf(b.name);
                }).map((board) => (
                  <Link key={board.id} href={`/forum/${board.name}`}>
                    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-bold text-sm whitespace-nowrap w-[5rem] pl-2 text-sky-700 dark:text-sky-300">
                            /{board.name}/
                          </h3>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">
                              {board.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {board.description}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {board._count.threads === 0 ? <Lock className="h-3 w-3" /> : board._count.threads}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Governance & Institutional */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">
              Governance & Institutional
              {unlockProgress < unlockThresholds['Governance & Institutional'] && (
                <span className="ml-2 text-xs inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> {unlockThresholds['Governance & Institutional']} threads to unlock
                </span>
              )}
            </h3>
            <Card className={`overflow-hidden ${unlockProgress < unlockThresholds['Governance & Institutional'] ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="divide-y">
                {boards.filter(b => ['gov', 'inst', 'reg', 'rwa'].includes(b.name)).sort((a, b) => {
                  const order = ['gov', 'inst', 'reg', 'rwa'];
                  return order.indexOf(a.name) - order.indexOf(b.name);
                }).map((board) => (
                  <Link key={board.id} href={`/forum/${board.name}`}>
                    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-bold text-sm whitespace-nowrap w-[5rem] pl-2 text-sky-700 dark:text-sky-300">
                            /{board.name}/
                          </h3>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">
                              {board.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {board.description}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {board._count.threads === 0 ? <Lock className="h-3 w-3" /> : board._count.threads}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats - Moved to Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
        <Card className="p-2 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <MessageSquare className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-bold">{stats.totalBoards}</p>
              <p className="text-xs text-muted-foreground">Total Boards</p>
            </div>
          </div>
        </Card>
        <Card className="p-2 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-bold">{stats.totalThreads}</p>
              <p className="text-xs text-muted-foreground">Total Threads</p>
            </div>
          </div>
        </Card>
        <Card className="p-2 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-bold">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
