"use client";

import { useAccount } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStats } from "@/hooks/use-user-stats";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { VoteStreak } from "@/components/vote-streak";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { useSession } from "next-auth/react";

interface VoteHistory {
  votes: {
    projectId: string;
    projectName: string;
    votedDate: string;
  }[];
  currentStreak: number;
  longestStreak: number;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: userStats, isLoading: isLoadingStats } = useUserStats();
  const { data: session } = useSession();

  const { data: voteHistory, isLoading: isLoadingHistory } =
    useQuery<VoteHistory>({
      queryKey: ["voteHistory", address],
      queryFn: async () => {
        if (!address) throw new Error("No address");
        const response = await fetch(`/api/users/${address}/votes`);
        if (!response.ok) throw new Error("Failed to fetch vote history");
        return response.json();
      },
      enabled: !!address && isConnected,
    });

  if (!isConnected) {
    return (
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16 bg-white rounded-lg py-16 shadow flex items-center justify-center flex-col gap-4">
        <div className="flex flex-col items-center">
          <p className="text-lg text-zinc-500">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingStats || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-zinc-500">Loading...</p>
      </div>
    );
  }

  console.log(session?.discordUser);

  return (
    <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
      {/* Show Discord alert if no Discord account is connected */}
      {!session?.discordUser && (
        <div className="mb-8">
          <ConnectDiscordAlert />
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-md shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {session?.discordUser?.avatar ? (
                <AvatarImage
                  src={`https://cdn.discordapp.com/avatars/${
                    session.discordUser.id
                  }/${session.discordUser.avatar}.${
                    session.discordUser.avatar.startsWith("a_") ? "gif" : "png"
                  }`}
                  alt={session.discordUser.username}
                />
              ) : (
                <AvatarFallback>
                  {address?.substring(2, 4).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                {session?.discordUser?.global_name ||
                  `${address?.substring(0, 6)}...${address?.substring(38)}`}
              </h1>
              <p className="text-sm text-zinc-500">
                {address?.substring(0, 6)}...{address?.substring(38)}
                {session?.discordUser?.username &&
                  ` • @${session.discordUser.username}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-zinc-900">
              Level {userStats?.level}
            </p>
            <p className="text-sm text-zinc-700">
              {userStats?.xp} XP • {userStats?.xpForNextLevel} XP until next
              level
            </p>
          </div>
        </div>
      </div>

      {/* Vote Streak */}
      {/* <VoteStreak /> */}

      {/* Vote History */}
      <div className="bg-white rounded-md shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-zinc-900">Vote History</h2>
        </div>
        <div className="divide-y">
          {voteHistory?.votes.map((vote) => (
            <div
              key={`${vote.projectId}-${vote.votedDate}`}
              className="p-4 flex items-center justify-between hover:bg-zinc-50"
            >
              <div>
                <p className="font-medium text-zinc-900">{vote.projectName}</p>
                <p className="text-sm text-zinc-500">
                  {formatDistanceToNow(new Date(vote.votedDate), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="text-sm text-zinc-500">+1 XP</div>
            </div>
          ))}
          {voteHistory?.votes.length === 0 && (
            <div className="p-4 text-center text-zinc-500">
              No votes recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
