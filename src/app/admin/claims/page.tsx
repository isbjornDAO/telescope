"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Gift, Users, ArrowLeft } from "lucide-react";
import { RetroBox, Stat } from "@/components/world/primitives";

interface Claim {
  id: string;
  claimedAt: string;
  coinsSpent: number;
  user: {
    address: string;
    username: string | null;
    xp: number;
    coins: number;
    level: number;
    discordId: string | null;
  };
  reward: {
    name: string;
    description: string;
    xpRequired: number;
    imageUrl: string;
  } | null;
}

interface UserStats {
  address: string;
  username: string | null;
  xp: number;
  level: number;
  discordId: string | null;
  claimCount: number;
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [claimsRes, leaderboardRes] = await Promise.all([
        fetch("/api/admin/claims"),
        fetch("/api/leaderboard?limit=10"),
      ]);

      const claimsData = await claimsRes.json();
      const leaderboardData = await leaderboardRes.json();

      setClaims(claimsData);

      const usersWithClaims = (Array.isArray(leaderboardData) ? leaderboardData : []).map((user: any) => ({
        ...user,
        claimCount: (Array.isArray(claimsData) ? claimsData : []).filter(
          (claim: Claim) => claim.user.address === user.address
        ).length,
      }));

      setTopUsers(usersWithClaims);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalClaims = Array.isArray(claims) ? claims.length : 0;
  const totalCoinsSpent = Array.isArray(claims)
    ? claims.reduce((sum, claim) => sum + (claim.coinsSpent || 0), 0)
    : 0;
  const uniqueClaimers = Array.isArray(claims)
    ? new Set(claims.map((c) => c.user.address)).size
    : 0;

  return (
    <AdminWrapper>
      <div className="w-full space-y-4 pb-12">
        {/* Retro Topic Header Breadcrumb */}
        <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Admin
            </Link>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-emerald-500" />
              Claims Management
            </span>
          </div>
          <Link href="/admin" className="snow-button-secondary text-xs h-7 px-2.5 inline-flex">
            Dashboard
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Total Claims" value={totalClaims} hint="Rewards claimed by community" />
          <Stat label="Total Coins Spent" value={totalCoinsSpent.toLocaleString()} hint="Reward store volume" />
          <Stat label="Unique Claimers" value={uniqueClaimers} hint="Distinct wallet addresses" />
        </div>

        {/* Claims Table */}
        <RetroBox title="All Reward Claims" icon={<Gift className="h-4 w-4" />} iconColor="green">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Address</th>
                  <th className="pb-2">Reward</th>
                  <th className="pb-2">Coins Spent</th>
                  <th className="pb-2 text-right">Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading claims...
                    </td>
                  </tr>
                ) : Array.isArray(claims) && claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5">
                        <Link
                          href={`/profile/${claim.user.address}`}
                          className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline"
                        >
                          {claim.user.address.slice(0, 6)}...{claim.user.address.slice(-4)}
                        </Link>
                        {claim.user.username && (
                          <span className="block text-[10px] text-muted-foreground">@{claim.user.username}</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs">
                            🎁
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {claim.reward?.name || "Deleted Reward"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {claim.coinsSpent} coins
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(claim.claimedAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      No claims logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RetroBox>

        {/* Bottom Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RetroBox title="Recent Activity Stream" icon={<Gift className="h-4 w-4" />} iconColor="blue">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loading ? (
                <p className="text-muted-foreground text-xs">Loading activity...</p>
              ) : Array.isArray(claims) && claims.length > 0 ? (
                claims.slice(0, 10).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-lg bg-white/60 dark:bg-zinc-800/40 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {claim.user.username || `${claim.user.address.slice(0, 6)}...${claim.user.address.slice(-4)}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        claimed <span className="font-medium text-zinc-800 dark:text-zinc-200">{claim.reward ? claim.reward.name : "Deleted Reward"}</span> · {claim.coinsSpent} Coins
                      </p>
                    </div>
                    <div className="text-right shrink-0 text-muted-foreground text-[10px]">
                      <span>Level {claim.user.level}</span>
                      <span className="block font-medium">{formatDistanceToNow(new Date(claim.claimedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs text-center py-6">No claims yet.</p>
              )}
            </div>
          </RetroBox>

          <RetroBox title="Top Community Members" icon={<Trophy className="h-4 w-4" />} iconColor="gold">
            <div className="space-y-2.5">
              {loading ? (
                <p className="text-muted-foreground text-xs">Loading leaderboard...</p>
              ) : topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div
                    key={user.address}
                    className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-lg bg-white/60 dark:bg-zinc-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-xs min-w-[1.5rem] text-center text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${user.address}`}
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline truncate block"
                        >
                          {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">
                          Level {user.level} · {user.claimCount} claims
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.xp.toLocaleString()}</span>
                      <span className="block text-[10px] text-muted-foreground">XP</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs text-center py-6">No leaderboard data.</p>
              )}
            </div>
          </RetroBox>
        </div>
      </div>
    </AdminWrapper>
  );
}
