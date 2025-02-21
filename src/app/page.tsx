"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { VoteButton } from "@/components/vote-button";
import { LeaderboardItem, IncubatorProject } from "@/types";
import { Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { getTextColorClass } from "@/lib/utils";
import { Categories } from "@/components/categories";
import { useUserStats } from "@/hooks/use-user-stats";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { Address } from "viem";
import { useSession } from "next-auth/react";
import { ProjectCard } from '@/components/project-card';
import { DisclaimerAlert } from "@/components/disclaimer-alert";
import { BearUniversityAlert } from "@/components/bear-university-alert";
import { MintWindow } from "@/components/mint-window";

interface VotingStatusProps {
  isLocked: boolean;
  nextVoteTime: Date | null;
}

const votingLocked = true;

const VotingStatusMessage = React.memo(
  ({ isLocked, nextVoteTime }: VotingStatusProps) => {
    if (votingLocked) {
      return (
        <div className="text-sm text-zinc-900 font-medium bg-white px-4 py-2 rounded-lg border-white border-2 flex items-center gap-2 shadow">
          <span>Voting is locked until next season</span>
          <img src="/telescope.svg" className="w-4 h-4" />
        </div>
      );
    }

    if (!isLocked) {
      return (
        <div className="text-sm text-zinc-900 font-medium bg-white px-4 py-2 rounded-lg border-white border-2 flex items-center gap-2 shadow">
          You can vote now! 🎉
        </div>
      );
    }

    if (nextVoteTime) {
      const timeRemaining = nextVoteTime.getTime() - Date.now();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
      );

      return (
        <div className="text-sm text-zinc-900 font-medium bg-white px-4 py-2 rounded-lg border-white border-2 flex items-center gap-2 shadow">
          You can vote again in {hoursRemaining}h {minutesRemaining}m ⏰
        </div>
      );
    }

    return null;
  }
);

VotingStatusMessage.displayName = "VotingStatusMessage";

export default function Home() {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag") || undefined;

  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
    address as Address,
    isConnected
  );
  const { status: sessionStatus } = useSession();
  const [isVotingLocked, setIsVotingLocked] = useState(false);
  const [nextVoteTime, setNextVoteTime] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<"projects" | "artists" | "incubator" | "mint">("projects");

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
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Remove data from cache immediately when unused
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
  });

  const { data: incubatorProjects } = useQuery<IncubatorProject[], Error>({
    queryKey: ["incubator-projects", selectedTag],
    queryFn: async () => {
      const url = `/api/incubator${selectedTag ? `?tag=${selectedTag}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch incubator projects.");
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

  // Check global voting status when component mounts or address changes
  useEffect(() => {
    const checkGlobalVotingStatus = async () => {
      if (isConnected && address) {
        try {
          const response = await fetch(
            `/api/users/voting-status?walletAddress=${address}`
          );
          if (response.ok) {
            const data = await response.json();
            setIsVotingLocked(data.isLocked);
            if (data.isLocked && data.nextVoteTime) {
              setNextVoteTime(new Date(data.nextVoteTime));
            } else {
              setNextVoteTime(null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch voting status:", error);
        }
      }
    };

    checkGlobalVotingStatus();
  }, [isConnected, address]);

  const handleVoteSuccess = useCallback(() => {
    setIsVotingLocked(true);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  }, [queryClient]);

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
        <Tabs defaultValue="projects"
          className="flex flex-col gap-4"
          onValueChange={(value) => {
            // @ts-ignore
            setActiveTab(value)
          }}>
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <TabsList className="gap-2 bg-transparent m-0 p-0">
                <TabsTrigger
                  value="projects"
                  className="px-4 py-2 font-bold text-md bg-white border-white border-2"
                  onClick={() => { setActiveTab("projects") }}
                >
                  Projects
                </TabsTrigger>
                <TabsTrigger
                  value="incubator"
                  className="px-4 py-2 font-bold text-md bg-white border-white border-2"
                >
                  Incubator
                </TabsTrigger>
                <TabsTrigger
                  value="artists"
                  className="px-4 py-2 font-bold text-md bg-white relative border-white border-2"
                  onClick={() => { setActiveTab("artists") }}
                >
                  <Badge className="absolute -top-3 -right-6 text-xs bg-sky-900 text-white hover:bg-sky-900 border-white">
                    Soon
                  </Badge>
                  Artists
                </TabsTrigger>
                <TabsTrigger
                  value="mint"
                  className="px-4 py-2 font-bold text-md bg-white border-white border-2"
                  onClick={() => { setActiveTab("mint") }}
                >
                  Mint
                </TabsTrigger>
              </TabsList>
            </div>
            {activeTab !== "mint" && (isConnected ? (
              <VotingStatusMessage
                isLocked={isVotingLocked}
                nextVoteTime={nextVoteTime}
              />
            ) : (
              <div className="text-sm text-zinc-900 font-medium bg-white px-4 py-2 rounded-lg border-white border-2 flex items-center gap-2 shadow">
                {votingLocked ? (
                  <>
                    <span>Voting is locked until next season</span>
                    <img src="/telescope.svg" className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Connect your wallet to vote</span>
                    <img src="/telescope.svg" className="w-4 h-4" />
                  </>
                )}
              </div>
            ))}
          </div>
          {activeTab !== "mint" && (isConnected && !isUserStatsLoading && !userStats?.discordId ? (
            <ConnectDiscordAlert />
          ) : sessionStatus !== "loading" ? (
            <>
              {activeTab === "projects" && <Countdown />}
              {activeTab === "incubator" && <DisclaimerAlert />}
            </>
          ) : null)}
          {activeTab === "mint" && <BearUniversityAlert />}
          <TabsContent
            value="projects"
            className="tab-content gap-4 flex flex-col"
          >
            <div className="flex gap-1 flex-col">
              <h3 className="font-bold">Categories</h3>
              <Categories />
            </div>
            <LeaderboardTable
              items={projects || []}
              renderMetadata={(item) => {
                if (!item.metadata) return null;

                return (
                  <div className="flex flex-col items-end mr-4">
                    <div className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                      {item.metadata.votes.toLocaleString()} votes
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs ${getTextColorClass(
                        item.rank
                      )}`}
                    >
                      <Users className="h-3 w-3" />
                      <span>
                        {item.metadata.voters.toLocaleString()} voters
                      </span>
                    </div>
                  </div>
                );
              }}
              renderActions={(item) => (
                <VoteButton
                  projectId={item.id.toString()}
                  onVoteSuccess={handleVoteSuccess}
                  isGloballyDisabled={isVotingLocked}
                />
              )}
              isLoading={isLoading}
              isError={isError}
            />
          </TabsContent>
          <TabsContent value="incubator" className="tab-content mt-2 flex flex-col gap-4">
            <div className="flex gap-1 flex-col">
              <h3 className="font-bold">Categories</h3>
              <Categories />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {incubatorProjects
                ?.filter(project => !selectedTag || project.tags.includes(selectedTag))
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="artists" className="tab-content">
            <div className="w-full bg-white rounded-lg py-8 shadow flex items-center justify-center flex-col gap-4">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold">Coming soon</h2>
                <span className=" text-zinc-500">
                  Join our Discord to apply
                </span>
              </div>
              <a
                href="https://discord.gg/K4z7xxFVGc"
                target="_blank"
                className="snow-button"
              >
                Apply now
              </a>
            </div>
          </TabsContent>
          <TabsContent value="mint" className="tab-content">
            <div className="w-full bg-white rounded-lg py-16 shadow flex items-center justify-center flex-col gap-4">
              <MintWindow />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
