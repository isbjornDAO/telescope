"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { LeaderboardItem } from "@/types";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Countdown } from "@/components/countdown";
import { getTextColorClass } from "@/lib/utils";
import { Categories } from "@/components/categories";
import { useUserStats } from "@/hooks/use-user-stats";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { Address } from "viem";
import { useSession } from "next-auth/react";
import { PageNavigation } from "@/components/page-navigation";

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag") || undefined;

  const { address, isConnected } = useAccount();
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
    address as Address,
    isConnected
  );
  const { status: sessionStatus } = useSession();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery<LeaderboardItem[], Error>({
    queryKey: ["projects", selectedTag],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects${selectedTag ? `?tag=${selectedTag}` : ""}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch projects.");
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });

  const {
    data: season1Projects,
    isLoading: isLoadingSeason1,
    isError: isErrorSeason1,
  } = useQuery<LeaderboardItem[], Error>({
    queryKey: ["season1-projects", selectedTag],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/season1${selectedTag ? `?tag=${selectedTag}` : ""}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch season 1 projects.");
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
        <PageNavigation />

        <div className="mb-6">
          {isConnected && !isUserStatsLoading && !userStats?.discordId ? (
            <ConnectDiscordAlert />
          ) : sessionStatus !== "loading" ? (
            <Countdown />
          ) : null}
        </div>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="bg-transparent flex gap-2 justify-start mb-4">
            <div className="relative group">
              <TabsTrigger
                value="season3"
                disabled
                className="px-4 py-2 font-bold text-sm bg-white dark:bg-zinc-800 shadow opacity-50 cursor-not-allowed"
              >
                Season 3
              </TabsTrigger>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-zinc-400 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming Soon
              </div>
            </div>
            <div className="relative group">
              <TabsTrigger
                value="current"
                className="px-4 py-2 font-bold text-sm bg-white dark:bg-zinc-800 shadow"
              >
                Season 2
              </TabsTrigger>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                May 2025
              </div>
            </div>
            <div className="relative group">
              <TabsTrigger
                value="season1"
                className="px-4 py-2 font-bold text-sm bg-white dark:bg-zinc-800 shadow"
              >
                Season 1
              </TabsTrigger>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                December 2024
              </div>
            </div>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <div className="flex gap-1 flex-col mb-4">
              <h3 className="font-bold">Categories</h3>
              <Categories />
            </div>
            <LeaderboardTable
              items={(projects || [])
                .sort((a, b) => {
                  const aVotes = (a.metadata?.likes || 0) + (a.metadata?.dislikes || 0);
                  const bVotes = (b.metadata?.likes || 0) + (b.metadata?.dislikes || 0);
                  return bVotes - aVotes;
                })
                .map((item, idx) => ({ ...item, rank: idx + 1 }))}
              renderMetadata={(item) => {
                if (!item.metadata) return null;

                return (
                  <div className="flex flex-col items-end mr-4">
                    <div className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      {item.metadata.likes + item.metadata.dislikes} votes
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Users className={`h-3 w-3 ${item.rank === 1 ? "text-yellow-500" : item.rank === 2 ? "text-gray-400" : item.rank === 3 ? "text-amber-600" : ""}`} />
                      <span>
                        {item.metadata.voters.toLocaleString()} voters
                      </span>
                    </div>
                  </div>
                );
              }}
              isLoading={isLoading}
              isError={isError}
            />
          </TabsContent>

          <TabsContent value="season1" className="mt-4">
            <div className="flex gap-1 flex-col mb-4">
              <h3 className="font-bold">Categories</h3>
              <Categories />
            </div>
            <LeaderboardTable
              items={(season1Projects || [])
                .sort((a, b) => {
                  const aVotes = (a.metadata?.likes || 0) + (a.metadata?.dislikes || 0);
                  const bVotes = (b.metadata?.likes || 0) + (b.metadata?.dislikes || 0);
                  return bVotes - aVotes;
                })
                .map((item, idx) => ({ ...item, rank: idx + 1 }))}
              renderMetadata={(item) => {
                if (!item.metadata) return null;

                return (
                  <div className="flex flex-col items-end mr-4">
                    <div className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      {item.metadata.likes + item.metadata.dislikes} votes
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Users className={`h-3 w-3 ${item.rank === 1 ? "text-yellow-500" : item.rank === 2 ? "text-gray-400" : item.rank === 3 ? "text-amber-600" : ""}`} />
                      <span>
                        {item.metadata.voters.toLocaleString()} voters
                      </span>
                    </div>
                  </div>
                );
              }}
              isLoading={isLoadingSeason1}
              isError={isErrorSeason1}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
