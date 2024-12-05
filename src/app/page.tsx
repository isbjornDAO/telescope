"use client";
import { ConnectButton } from "@/components/connect-button";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoteButton } from "@/components/vote-button";
import { projects } from "@/lib/projects";
import { LeaderboardItem } from "@/types";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
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
          items={projects}
          renderMetadata={(item: LeaderboardItem) => {
            if (!item.metadata) return null;
            return (
              <div className="flex flex-col items-end">
                <div className="text-base font-medium text-gray-700">
                  {item.metadata.votes.toLocaleString() || 0} votes
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>
                    {item.metadata.voters.toLocaleString() || 0} voters
                  </span>
                </div>
              </div>
            );
          }}
          renderActions={(item) => (
            <VoteButton projectId={item.id.toString()} />
          )}
        />
      </div>
    </div>
  );
}
