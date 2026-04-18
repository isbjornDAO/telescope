"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Wallet, TrendingUp, Newspaper, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserStats } from "@/hooks/use-user-stats";
import { useUserDiscord } from "@/hooks/use-user-discord";
import { CollectSnowdogButton } from "@/components/collect-snowdog-button";
import { Address } from "viem";
import { formatDistanceToNow, format } from "date-fns";

interface Thread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  boardName: string;
  posts: Array<{
    id: string;
    comment: string;
    imageHash: string | null;
  }>;
}

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  source: string;
  image: string | null;
}

interface DiscordEvent {
  id: string;
  name: string;
  description: string;
  scheduledStartTime: string;
  scheduledEndTime: string | null;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildInvite?: string;
  userCount?: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
    address as Address,
    isConnected
  );
  const { data: discordUser } = useUserDiscord(userStats?.discordId || "");
  const [trendingThreads, setTrendingThreads] = useState<Thread[]>([]);
  const [recentArticles, setRecentArticles] = useState<NewsArticle[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<DiscordEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateTrendingScore = useCallback((thread: Thread): number => {
    const now = new Date().getTime();
    const bumpedAt = new Date(thread.bumpedAt).getTime();
    const createdAt = new Date(thread.createdAt).getTime();
    const hoursSinceLastBump = (now - bumpedAt) / (1000 * 60 * 60);
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    const engagementScore = (thread.replyCount * 10) / (hoursSinceLastBump + 2);
    const recencyBonus = hoursSinceCreation < 24 ? 5 : 0;
    return engagementScore + recencyBonus;
  }, []);

  const fetchHomeData = useCallback(async () => {
    try {
      // Fetch trending threads, news, and events in parallel
      const [threadsResponse, newsResponse, eventsResponse] = await Promise.all([
        fetch("/api/forum/trending"),
        fetch("/api/news"),
        fetch("/api/discord/events")
      ]);

      const threadsData = await threadsResponse.json();
      const newsData = await newsResponse.json();
      const eventsData = await eventsResponse.json();

      if (Array.isArray(threadsData)) {
        const threadsWithScores = threadsData.map(thread => ({
          ...thread,
          trendingScore: calculateTrendingScore(thread)
        }));

        const trending = threadsWithScores
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .slice(0, 6);

        setTrendingThreads(trending);
      }

      if (Array.isArray(newsData)) {
        setRecentArticles(newsData.slice(0, 6));
      }

      // Filter for today's events
      if (eventsData.events && Array.isArray(eventsData.events)) {
        const today = new Date();
        const filtered = eventsData.events.filter((event: DiscordEvent) => {
          const eventDate = new Date(event.scheduledStartTime);
          return (
            eventDate >= new Date() && // Future events only
            eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear()
          );
        });
        setTodaysEvents(filtered);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  }, [calculateTrendingScore]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-8 md:mb-16 mobile-content-align">
        <PageNavigation />

        <div className="space-y-6">
          {/* User Profile / Connect Wallet */}
          <Card className="p-4 md:p-6">
            {isConnected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4">
                  {discordUser?.avatar_url ? (
                    <img
                      src={discordUser.avatar_url}
                      alt="Profile"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Wallet</p>
                    <p className="font-mono text-sm font-semibold">
                      {discordUser?.username || userStats?.username || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </p>
                    {discordUser?.username && (
                      <p className="text-xs text-muted-foreground">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
                {!isUserStatsLoading && userStats && (
                  <div className="flex flex-col gap-2 min-w-[280px]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Level {userStats.level || 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {userStats.progress.currentProgress} XP • {userStats.xpForNextLevel} XP next
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (userStats.progress.currentProgress / userStats.progress.totalNeeded) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-zinc-600" />
                </div>
                <div>
                  <p className="font-semibold">Connect Your Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to vote on projects and participate in the community
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Collect Snowdog Button */}
          {isConnected && (
            <CollectSnowdogButton address={address as Address} />
          )}

          {/* Today's Events Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Today</h2>
                {todaysEvents.length > 0 && (
                  <div className="px-2 py-0.5 bg-primary/10 rounded-md">
                    <span className="text-xs font-semibold text-primary">{todaysEvents.length}</span>
                  </div>
                )}
              </div>
              <Link href="/calendar" className="text-sm text-primary hover:underline">
                View calendar
              </Link>
            </div>
            {loading ? (
              <div className="h-32 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
            ) : (
              <Card className="p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800">
                {todaysEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground font-semibold mb-1">No events today</p>
                    <p className="text-xs text-muted-foreground">Check the calendar for upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysEvents.map((event) => (
                      <Link key={event.id} href="/calendar">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer">
                          {/* Column 1: Icon & Title */}
                          <div className="md:col-span-5 flex items-center gap-3">
                            {event.guildIcon && (
                              <img src={event.guildIcon} alt="" className="w-10 h-10 rounded-lg shadow-md flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm line-clamp-1">{event.name}</div>
                              <div className="text-xs text-muted-foreground">{event.guildName}</div>
                            </div>
                          </div>

                          {/* Column 2: Time */}
                          <div className="md:col-span-3 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <div className="text-xs">
                              <div className="font-semibold">
                                {format(new Date(event.scheduledStartTime), 'h:mm a')}
                              </div>
                              <div className="text-muted-foreground">
                                in {formatDistanceToNow(new Date(event.scheduledStartTime)).replace('about ', '')}
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Interested */}
                          <div className="md:col-span-3 flex items-center gap-2">
                            {event.userCount !== undefined && event.userCount > 0 && (
                              <>
                                <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="text-xs"><strong>{event.userCount}</strong> interested</span>
                              </>
                            )}
                          </div>

                          {/* Column 4: Arrow */}
                          <div className="md:col-span-1 flex justify-end">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Recent News */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Recent Articles
              </h2>
              <Link href="/news" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                  ))}
                </>
              ) : recentArticles.length > 0 ? (
                recentArticles.slice(0, 6).map((article, idx) => (
                  <Link key={idx} href={article.link} target="_blank">
                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                      {article.image && (
                        <div className="w-full h-32 overflow-hidden relative">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{article.title}</h3>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-xs">
                            {article.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="p-8 text-center col-span-3">
                  <p className="text-muted-foreground text-sm">No articles yet</p>
                </Card>
              )}
            </div>
          </div>

          {/* Trending Threads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Threads
              </h2>
              <Link href="/forum" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                  ))}
                </>
              ) : trendingThreads.length > 0 ? (
                trendingThreads.map((thread) => (
                  <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                      <div className="flex gap-3 p-3">
                        {thread.posts[0]?.imageHash && (
                          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2">
                            <img
                              src={thread.posts[0].imageHash}
                              alt={thread.subject || 'Thread image'}
                              className="w-full h-full object-cover rounded"
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
                              <span className="text-xs text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
}
