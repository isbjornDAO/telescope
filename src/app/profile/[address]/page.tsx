"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStats } from "@/hooks/use-user-stats";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns"; // eslint-disable-line
// import { VoteStreak } from "@/components/vote-streak";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { useUserDiscord } from "@/hooks/use-user-discord";
import { Address } from "viem";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { UserBadge } from "@/components/user-badge";

interface VoteHistory {
  votes: {
    projectId: string;
    projectName: string;
    votedDate: string;
    type: "like" | "dislike";
    season: string;
  }[];
  currentStreak: number;
  longestStreak: number;
}

export default function ProfilePage() {
  const params = useParams();
  const addressParam = params.address as Address;

  const { address: connectedAddress } = useAccount();
  const isOwnProfile = addressParam === connectedAddress;

  const { data: userStats, isLoading: isLoadingStats } = useUserStats(
    addressParam,
    !!addressParam
  );
  const { data: discordUser, isLoading: isLoadingDiscordUser } = useUserDiscord(
    userStats?.discordId || ""
  );

  const { data: voteHistory, isLoading: isLoadingHistory } =
    useQuery<VoteHistory>({
      queryKey: ["voteHistory", addressParam],
      queryFn: async () => {
        if (!addressParam) throw new Error("No address");
        const response = await fetch(`/api/users/${addressParam}/votes`);
        if (!response.ok) throw new Error("Failed to fetch vote history");
        return response.json();
      },
      enabled: !!addressParam,
    });

  if (!addressParam) {
    return (
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16 bg-white rounded-lg py-16 shadow flex items-center justify-center flex-col gap-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-64 h-6 mb-4" />
          <Skeleton className="w-48 h-4" />
        </div>
      </div>
    );
  }

  if (isLoadingStats || isLoadingHistory || isLoadingDiscordUser) {
    return (
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
        {/* Discord Alert Skeleton */}
        {isOwnProfile && !discordUser && (
          <div className="mb-8">
            <Skeleton className="w-full h-12" />
          </div>
        )}

        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-md shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div>
                <Skeleton className="w-48 h-6 mb-2" />
                <Skeleton className="w-32 h-4" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="w-24 h-6 mb-2" />
              <Skeleton className="w-40 h-4" />
            </div>
          </div>
        </div>

        {/* Vote History Skeleton */}
        {isOwnProfile && (
          <div className="bg-white rounded-md shadow">
            <div className="p-4 border-b">
              <Skeleton className="w-32 h-6" />
            </div>
            <div className="divide-y">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50"
                >
                  <div>
                    <Skeleton className="w-40 h-4 mb-2" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                  <Skeleton className="w-16 h-4" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
      {/* Show Discord alert if no Discord account is connected and on own profile */}
      {isOwnProfile && !discordUser && (
        <div className="mb-8">
          <ConnectDiscordAlert />
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-md shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {discordUser?.avatar_url ? (
                <AvatarImage
                  src={discordUser.avatar_url}
                  alt={discordUser.username}
                />
              ) : (
                <AvatarFallback>
                  {addressParam?.substring(2, 4).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                {discordUser?.global_name ||
                  `${addressParam?.substring(0, 6)}...${addressParam?.substring(
                    38
                  )}`}
                <UserBadge address={addressParam} />
              </h1>
              {/* TODO: Create badge component */}
              <p className="text-sm text-zinc-500">
                {discordUser?.username &&
                  `${addressParam?.substring(0, 6)}...
                ${addressParam?.substring(38)} • @${discordUser.username}`}
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

      {/* Vote History (only on own profile) */}
      {isOwnProfile && (
        <div className="bg-white rounded-md shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-zinc-900">
              Vote History
            </h2>
          </div>
          <div className="divide-y">
            {voteHistory?.votes.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">
                No votes recorded yet
              </div>
            ) : (
              <>
                {/* Current Season */}
                {/* <div className="p-4 bg-zinc-50">
                  <h3 className="font-medium text-zinc-900">Current Season</h3>
                </div> */}
                {voteHistory?.votes
                  .filter(vote => vote.season === 'Current Season')
                  .map((vote) => (
                    <div
                      key={`${vote.projectId}-${vote.votedDate}`}
                      className="p-4 flex items-center justify-between hover:bg-zinc-50"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {vote.projectName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <span>
                            {formatDistanceToNow(new Date(vote.votedDate), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${vote.type === "like" ? "text-green-600" : "text-red-600"}`}>
                          {vote.type === "like" ? "👍" : "👎"}
                        </span>
                        <div className="text-sm text-zinc-500">+1 XP</div>
                      </div>
                    </div>
                  ))}

                {/* Season 1 */}
                {/* <div className="p-4 bg-zinc-50">
                  <h3 className="font-medium text-zinc-900">Season 1</h3>
                </div> */}
                {voteHistory?.votes
                  .filter(vote => vote.season === 'Season 1')
                  .map((vote) => (
                    <div
                      key={`${vote.projectId}-${vote.votedDate}`}
                      className="p-4 flex items-center justify-between hover:bg-zinc-50"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {vote.projectName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <span>
                            {formatDistanceToNow(new Date(vote.votedDate), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${vote.type === "like" ? "text-green-600" : "text-red-600"}`}>
                          {vote.type === "like" ? "👍" : "👎"}
                        </span>
                        <div className="text-sm text-zinc-500">+1 XP</div>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
