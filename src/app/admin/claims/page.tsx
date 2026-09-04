"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Gift, Users } from "lucide-react";

interface Claim {
  id: string;
  claimedAt: string;
  coinsSpent: number;
  user: {
    address: string;
    name: string | null;
    handle: string | null;
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
  };
}

interface UserStats {
  address: string;
  name: string | null;
    handle: string | null;
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

      // Calculate claim counts for top users
      const usersWithClaims = leaderboardData.map((user: any) => ({
        ...user,
        claimCount: claimsData.filter(
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
  const totalCoinsSpent = Array.isArray(claims) ? claims.reduce((sum, claim) => sum + claim.coinsSpent, 0) : 0;
  const uniqueClaimers = Array.isArray(claims) ? new Set(claims.map((c) => c.user.address)).size : 0;

  return (
    <>
      <div className="container mx-auto py-8 max-w-screen-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Claims Management</h1>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Total Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalClaims}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Total Coins Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalCoinsSpent.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unique Claimers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{uniqueClaimers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Claims Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Address</th>
                    <th className="text-left p-3 font-semibold">Reward</th>
                    <th className="text-left p-3 font-semibold">Coins Spent</th>
                    <th className="text-left p-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : Array.isArray(claims) && claims.length > 0 ? (
                    claims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-zinc-50">
                        <td className="p-3">
                          <div>
                            <p className="font-mono text-sm">{claim.user.address}</p>
                            {claim.user.name && (
                              <p className="text-xs text-muted-foreground">@{claim.user.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                              {claim.reward.imageUrl && (
                                <img
                                  src={claim.reward.imageUrl}
                                  alt={claim.reward.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <span className="font-medium">{claim.reward.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold">{claim.coinsSpent}</span> coins
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(claim.claimedAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-muted-foreground">
                        No claims yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Claims Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : Array.isArray(claims) && claims.length > 0 ? (
                  claims.slice(0, 10).map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                        {claim.reward.imageUrl && (
                          <img
                            src={claim.reward.imageUrl}
                            alt={claim.reward.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {claim.user.name ||
                            `${claim.user.address.slice(0, 6)}...${claim.user.address.slice(-4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          claimed <span className="font-medium">{claim.reward.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {claim.coinsSpent} Coins • {formatDistanceToNow(new Date(claim.claimedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">Level {claim.user.level}</p>
                        <p className="text-xs font-medium">{claim.user.xp} XP • {claim.user.coins} Coins</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No claims yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Users by XP */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by XP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <div
                      key={user.address}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`font-bold text-lg min-w-[2.5rem] text-center ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-amber-600"
                              : ""
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {user.name ||
                              `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {user.level} • {user.claimCount} claims
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.xp.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No users yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
