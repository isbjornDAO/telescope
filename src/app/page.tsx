"use client";
import { ConnectButton } from "@/components/connect-button";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoteButton } from "@/components/vote-button";
import { LeaderboardItem } from "@/types";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading, isError } = useQuery<LeaderboardItem[], Error>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects.");
      }
      return response.json();
    },
  });

  const handleVoteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto my-16">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ConnectButton />
          </div>
        </header>
        <LeaderboardTable
          items={projects || []}
          renderMetadata={(item) => {
            if (!item.metadata) return null;
            return (
              <div className="flex flex-col items-end">
                <div className="text-base font-medium text-zinc-700 dark:text-zinc-200">
                  {item.metadata.votes.toLocaleString()} votes
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                  <Users className="h-3 w-3" />
                  <span>
                    {item.metadata.voters.toLocaleString()} voters
                  </span>
                </div>
              </div>
            );
          }}
          renderActions={(item) => (
            <VoteButton projectId={item.id.toString()} onVoteSuccess={handleVoteSuccess} />
          )}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
