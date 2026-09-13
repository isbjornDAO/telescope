"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Trophy,
  MessageSquare,
  Users,
  Gift,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  FolderGit2,
  Lock,
  ExternalLink,
  Play,
  Sparkles,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RetroBox, Stat, NodeBadge, fmtDate, fmtDateTime } from "@/components/world/primitives";
import { VoteLockSwitch } from "@/components/admin/vote-lock-switch";
import { VotesChart } from "@/components/votes-chart";
import { LevelDistributionChart } from "@/components/level-distribution-chart";
import { VoteTimeDistributionChart } from "@/components/vote-time-distribution-chart";
import { DailyTopProjectsChart } from "@/components/daily-top-projects-chart";

export interface AdminDashboardProps {
  vitals: {
    totalUsers: number;
    discordUsers: number;
    eldersCount: number;
    anchorsCount: number;
    totalBoards: number;
    totalThreads: number;
    totalPosts: number;
    totalClaims: number;
    totalVotes: number;
    projectsCount: number;
    entriesCount: number;
  };
  topUsers: Array<{
    id: string;
    address: string;
    username: string | null;
    handle: string | null;
    xp: number;
    level: number;
    coins: number;
    discordId: string | null;
    nodeType: string;
    createdAt: string;
  }>;
  seasons: Array<{
    id: string;
    number: number;
    name: string;
    theme: string;
    status: string;
    startsAt: string;
    endsAt: string;
    entries: number;
  }>;
  rounds: Array<{
    id: string;
    seasonId: string;
    tournament: string;
    index: number;
    name: string;
    status: string;
    opensAt: string;
    closesAt: string;
    ballotCount: number;
  }>;
  recentEntries: Array<{
    id: string;
    title: string;
    tournament: string;
    status: string;
    createdAt: string;
    author: { handle: string | null; address: string };
  }>;
  boards: Array<{
    id: string;
    name: string;
    title: string;
    description: string | null;
    totalThreadsCreated: number;
  }>;
  recentThreads: Array<{
    id: string;
    title: string;
    createdAt: string;
    replyCount: number;
    ownerAddress: string;
    board: { name: string; title: string };
  }>;
  recentClaims: Array<{
    id: string;
    claimedAt: string;
    user: { address: string; discordId: string | null; username: string | null };
    reward: { name: string; xpRequired: number; imageUrl: string };
  }>;
  projects: Array<{
    id: string;
    name: string;
    voteCount: number;
  }>;
  chartData: {
    votesPerDay: Array<{ votedDate: Date; _count: number }>;
    levelDistribution: Array<{ level: number; _count: { _all: number } }>;
    voteTimeDistribution: Array<{ hour: number; count: number }>;
    dailyTopProjects: Array<{ date: Date; projectId: string; projectName: string; voteCount: number }>;
  };
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "forum", label: "Forum Moderation", icon: MessageSquare },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "claims", label: "Claims & Shop", icon: Gift },
  { id: "analytics", label: "Voting & Stats", icon: BarChart3 },
] as const;

export function AdminDashboard({
  vitals,
  topUsers,
  seasons: initialSeasons,
  rounds: initialRounds,
  recentEntries,
  boards,
  recentThreads,
  recentClaims,
  projects,
  chartData,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("overview");
  const [rounds, setRounds] = useState(initialRounds);
  const [userSearch, setUserSearch] = useState("");
  const [targetHandle, setTargetHandle] = useState("");
  const [selectedNodeType, setSelectedNodeType] = useState<"NODE" | "ANCHOR" | "ELDER">("ELDER");
  const [isUpdatingNode, setIsUpdatingNode] = useState(false);
  const [isSeedingBoards, setIsSeedingBoards] = useState(false);
  const [isTicking, setIsTicking] = useState(false);
  const [roundActionPending, setRoundActionPending] = useState<string | null>(null);

  const { toast } = useToast();

  // Trigger heartbeat tick
  const handleRunTick = async () => {
    setIsTicking(true);
    try {
      const res = await fetch("/api/world/jobs/tick", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger cron tick");
      toast({
        title: "Heartbeat Executed",
        description: `Seasons updated: ${data.seasons?.length || 0}. Retention & trust recalculated.`,
      });
    } catch (err: any) {
      toast({
        title: "Tick Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsTicking(false);
    }
  };

  // Seed forum boards
  const handleSeedBoards = async () => {
    setIsSeedingBoards(true);
    try {
      const res = await fetch("/api/forum/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed boards");
      toast({
        title: "Forum Boards Initialized",
        description: data.message || `Boards initialized successfully (${data.count ?? 20} boards).`,
      });
    } catch (err: any) {
      toast({
        title: "Seed Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSeedingBoards(false);
    }
  };

  // Open / Close round
  const handleRoundToggle = async (roundId: string, action: "open" | "close") => {
    setRoundActionPending(roundId);
    try {
      const res = await fetch(`/api/world/admin/rounds/${roundId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} round`);

      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, status: action === "open" ? "OPEN" : "CLOSED" }
            : r
        )
      );

      toast({
        title: `Round ${action === "open" ? "Opened" : "Closed"}`,
        description: `Round status successfully updated to ${action.toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({
        title: "Round Action Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRoundActionPending(null);
    }
  };

  // Update node type
  const handleSetNodeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHandle.trim()) return;
    setIsUpdatingNode(true);
    try {
      const cleanKey = targetHandle.trim().toLowerCase();
      const res = await fetch(`/api/world/admin/users/${encodeURIComponent(cleanKey)}/node-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeType: selectedNodeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update node role");

      toast({
        title: "Role Updated",
        description: `Node ${data.handle || cleanKey} promoted to ${data.nodeType}.`,
      });
      setTargetHandle("");
    } catch (err: any) {
      toast({
        title: "Role Update Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingNode(false);
    }
  };

  const filteredUsers = topUsers.filter(
    (u) =>
      u.address.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.handle && u.handle.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.discordId && u.discordId.includes(userSearch))
  );

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Retro Topic Header Breadcrumb */}
      <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
          >
            Home
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#D9383A]" />
            Control Room
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#D9383A]/10 border border-[#D9383A]/30 text-[#D9383A]">
            ADMIN PRIVILEGES ACTIVE
          </span>
        </div>
      </div>

      {/* Header Card */}
      <div className="retro-box">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Platform Management Console
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Monitor vital statistics, govern tournament brackets, moderate discussions, and configure platform settings.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleRunTick}
              disabled={isTicking}
              className="snow-button text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTicking ? "animate-spin" : ""}`} />
              {isTicking ? "Running Tick..." : "Run Heartbeat Tick"}
            </button>
            <Link href="/admin/projects" className="snow-button-secondary text-xs gap-1.5 inline-flex">
              <FolderGit2 className="h-3.5 w-3.5" />
              Projects
            </Link>
            <Link href="/admin/claims" className="snow-button-secondary text-xs gap-1.5 inline-flex">
              <Gift className="h-3.5 w-3.5" />
              Claims Log
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-900/40 px-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? "border-[#12BDE7] text-[#12BDE7] bg-white dark:bg-zinc-800/80"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & VITALS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <Stat label="Total Users" value={vitals.totalUsers} hint={`${vitals.discordUsers} Discord linked`} />
            <Stat label="Elders & Anchors" value={`${vitals.eldersCount} / ${vitals.anchorsCount}`} hint="Governance nodes" />
            <Stat label="Forum Posts" value={vitals.totalPosts} hint={`${vitals.totalThreads} threads / ${vitals.totalBoards} boards`} />
            <Stat label="Tournaments" value={initialSeasons.length} hint={`${vitals.entriesCount} entries filed`} />
            <Stat label="Shop Claims" value={vitals.totalClaims} hint="Rewards claimed" />
            <Stat label="Total Votes" value={vitals.totalVotes} hint={`${vitals.projectsCount} active projects`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Global Operations */}
            <div className="lg:col-span-1 space-y-4">
              <RetroBox title="Platform Controls" icon={<ShieldCheck className="h-4 w-4" />} iconColor="rose">
                <div className="space-y-3">
                  <VoteLockSwitch />

                  <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Forum State Initializer
                      </span>
                      <button
                        onClick={handleSeedBoards}
                        disabled={isSeedingBoards}
                        className="snow-button-secondary text-[11px] h-7 px-2.5 gap-1 inline-flex"
                      >
                        <Sparkles className="h-3 w-3" />
                        {isSeedingBoards ? "Seeding..." : "Seed Default Boards"}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Creates the standard community discussion boards if missing without wiping threads.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Nightly Cron Heartbeat
                      </span>
                      <button
                        onClick={handleRunTick}
                        disabled={isTicking}
                        className="snow-button text-[11px] h-7 px-2.5 gap-1 inline-flex"
                      >
                        <RefreshCw className={`h-3 w-3 ${isTicking ? "animate-spin" : ""}`} />
                        {isTicking ? "Ticking..." : "Tick Now"}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Recomputes trust scores, transitions tournament phases, and vests reviewer retention.
                    </p>
                  </div>
                </div>
              </RetroBox>
            </div>

            {/* Quick Live Highlights */}
            <div className="lg:col-span-2 space-y-4">
              <RetroBox title="Recent Forum Threads" icon={<MessageSquare className="h-4 w-4" />} iconColor="blue">
                {recentThreads.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No discussions created yet.</p>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                    {recentThreads.map((thread) => (
                      <div key={thread.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/forum/thread/${thread.id}`}
                            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline truncate block"
                          >
                            {thread.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">
                              /{thread.board.name}
                            </span>
                            <span>by {thread.ownerAddress ? `${thread.ownerAddress.slice(0, 6)}...${thread.ownerAddress.slice(-4)}` : "Anon"}</span>
                            <span>· {fmtDate(thread.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </RetroBox>

              <RetroBox title="Recent Reward Claims" icon={<Gift className="h-4 w-4" />} iconColor="green">
                {recentClaims.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No reward claims submitted yet.</p>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                    {recentClaims.map((claim) => (
                      <div key={claim.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center font-bold text-[10px]">
                            🎁
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                              {claim.reward.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {claim.user.address.slice(0, 6)}...{claim.user.address.slice(-4)} {claim.user.discordId ? `· Discord: ${claim.user.discordId}` : ""}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                          {fmtDate(claim.claimedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </RetroBox>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: TOURNAMENTS & SEASONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "tournaments" && (
        <div className="space-y-4">
          <RetroBox
            title="Active Seasons & Tournament Rounds"
            icon={<Trophy className="h-4 w-4" />}
            iconColor="blue"
            actions={
              <button
                onClick={handleRunTick}
                disabled={isTicking}
                className="snow-button-secondary text-xs h-7 px-2.5 gap-1 inline-flex"
              >
                <RefreshCw className={`h-3 w-3 ${isTicking ? "animate-spin" : ""}`} />
                {isTicking ? "Ticking..." : "Tick Rounds"}
              </button>
            }
          >
            {initialSeasons.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Trophy className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No World Seasons initialized yet.
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Seasons define tournament brackets, Go-To-Market tracks, reviewer pools, and trust score weightings.
                </p>
                <button
                  onClick={handleRunTick}
                  disabled={isTicking}
                  className="snow-button text-xs gap-1.5 inline-flex"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Initialize Season 1 via Heartbeat
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {initialSeasons.map((season) => (
                  <div key={season.id} className="border border-zinc-200 dark:border-zinc-700/80 rounded-lg p-4 bg-white/40 dark:bg-zinc-800/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Season {season.number}: {season.name}
                          </h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-400 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                            {season.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{season.theme}</p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right">
                        <span>{fmtDate(season.startsAt)} → {fmtDate(season.endsAt)}</span>
                        <span className="block font-semibold text-zinc-700 dark:text-zinc-300">
                          {season.entries} {season.entries === 1 ? "Entry" : "Entries"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Rounds Schedule & Controls
                      </h4>
                      {rounds.filter((r) => r.seasonId === season.id).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No rounds scheduled for this season.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rounds
                            .filter((r) => r.seasonId === season.id)
                            .map((round) => {
                              const isPending = roundActionPending === round.id;
                              return (
                                <div
                                  key={round.id}
                                  className="flex items-center justify-between p-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/60 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                        {round.tournament} #{round.index}
                                      </span>
                                      <span
                                        className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded ${
                                          round.status === "OPEN"
                                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                            : round.status === "PENDING"
                                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                                        }`}
                                      >
                                        {round.status}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                      {round.name} · {round.ballotCount} ballots
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {round.status === "PENDING" && (
                                      <button
                                        onClick={() => handleRoundToggle(round.id, "open")}
                                        disabled={isPending}
                                        className="snow-button text-[10px] h-6 px-2 gap-1 inline-flex"
                                      >
                                        <Play className="h-2.5 w-2.5" />
                                        Open
                                      </button>
                                    )}
                                    {round.status === "OPEN" && (
                                      <button
                                        onClick={() => handleRoundToggle(round.id, "close")}
                                        disabled={isPending}
                                        className="snow-button-secondary text-[10px] h-6 px-2 gap-1 inline-flex text-rose-600 border-rose-300"
                                      >
                                        <Lock className="h-2.5 w-2.5" />
                                        Close
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RetroBox>

          <RetroBox title="Tournament Entries" icon={<Trophy className="h-4 w-4" />} iconColor="green">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No entries submitted yet. Builders can enter through <Link href="/tournaments" className="text-sky-500 hover:underline">Tournaments</Link>.
              </p>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <Link
                        href={`/entries/${entry.id}`}
                        className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline"
                      >
                        {entry.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">
                          {entry.tournament}
                        </span>
                        <span>by {entry.author.handle || `${entry.author.address.slice(0, 6)}...${entry.author.address.slice(-4)}`}</span>
                        <span>· {fmtDate(entry.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </RetroBox>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: FORUM MODERATION
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "forum" && (
        <div className="space-y-4">
          <RetroBox
            title="Discussion Boards & Topics"
            icon={<MessageSquare className="h-4 w-4" />}
            iconColor="blue"
            actions={
              <button
                onClick={handleSeedBoards}
                disabled={isSeedingBoards}
                className="snow-button text-xs h-7 px-2.5 gap-1 inline-flex"
              >
                <Sparkles className="h-3 w-3" />
                {isSeedingBoards ? "Seeding..." : "Seed Default Boards"}
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {boards.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-800/40 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Link
                        href={`/forum/${b.name}`}
                        className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline"
                      >
                        /{b.name}
                      </Link>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {b.totalThreadsCreated} threads
                      </span>
                    </div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 block truncate">
                      {b.title}
                    </span>
                    {b.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {b.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Visit channel</span>
                    <Link href={`/forum/${b.name}`} className="hover:text-sky-500">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </RetroBox>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: USERS & NODE ROLES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Role Promoter Form */}
          <RetroBox title="Node Role Promotion" icon={<Users className="h-4 w-4" />} iconColor="purple">
            <form onSubmit={handleSetNodeType} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Wallet address (0x...) or handle..."
                value={targetHandle}
                onChange={(e) => setTargetHandle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-sky-500"
              />
              <select
                value={selectedNodeType}
                onChange={(e) => setSelectedNodeType(e.target.value as any)}
                className="px-3 py-2 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
              >
                <option value="ELDER">ELDER (3x Vote Weight & Slashing Authority)</option>
                <option value="ANCHOR">ANCHOR (1.5x Vote Weight & Regional Attestation)</option>
                <option value="NODE">NODE (Standard Community Member)</option>
              </select>
              <button
                type="submit"
                disabled={isUpdatingNode || !targetHandle.trim()}
                className="snow-button text-xs whitespace-nowrap"
              >
                {isUpdatingNode ? "Promoting..." : "Apply Role"}
              </button>
            </form>
          </RetroBox>

          {/* User Directory */}
          <RetroBox
            title="User Directory"
            icon={<Users className="h-4 w-4" />}
            iconColor="blue"
            actions={
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-36 sm:w-48 h-7 pl-2.5 pr-7 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                />
                <Search className="h-3 w-3 absolute right-2 text-muted-foreground pointer-events-none" />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Address / Handle</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Level & XP</th>
                    <th className="pb-2">Coins</th>
                    <th className="pb-2">Discord ID</th>
                    <th className="pb-2 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                  {filteredUsers.slice(0, 15).map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 font-semibold">
                        <Link href={`/profile/${user.address}`} className="hover:text-sky-500 hover:underline">
                          {user.handle || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                        </Link>
                        {user.username && (
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {user.username}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <NodeBadge nodeType={user.nodeType} />
                      </td>
                      <td className="py-2.5 font-bold">
                        Lv {user.level} · <span className="text-muted-foreground font-normal">{user.xp} XP</span>
                      </td>
                      <td className="py-2.5 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {user.coins}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {user.discordId || "—"}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {fmtDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RetroBox>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: CLAIMS & SHOP
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          <RetroBox
            title="Reward Claims History"
            icon={<Gift className="h-4 w-4" />}
            iconColor="green"
            actions={
              <Link href="/admin/claims" className="snow-button-secondary text-xs h-7 px-2.5 gap-1 inline-flex">
                <ExternalLink className="h-3 w-3" />
                Full Claims Manager
              </Link>
            }
          >
            {recentClaims.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No user claims have been processed yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Reward</th>
                      <th className="pb-2">Claimant</th>
                      <th className="pb-2">Discord ID</th>
                      <th className="pb-2">XP Required</th>
                      <th className="pb-2 text-right">Date Claimed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
                    {recentClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span className="text-base">🎁</span>
                          {claim.reward.name}
                        </td>
                        <td className="py-2.5">
                          <Link href={`/profile/${claim.user.address}`} className="hover:text-sky-500 hover:underline">
                            {claim.user.address.slice(0, 6)}...{claim.user.address.slice(-4)}
                          </Link>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {claim.user.discordId || "—"}
                        </td>
                        <td className="py-2.5 font-bold tabular-nums">
                          {claim.reward.xpRequired} XP
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {fmtDateTime(claim.claimedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </RetroBox>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: VOTING & ANALYTICS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RetroBox title="Votes Over Time (Last 30 Days)" icon={<BarChart3 className="h-4 w-4" />} iconColor="blue">
              <VotesChart data={chartData.votesPerDay} />
            </RetroBox>

            <RetroBox title="Voter Level Distribution" icon={<BarChart3 className="h-4 w-4" />} iconColor="purple">
              <LevelDistributionChart data={chartData.levelDistribution} />
            </RetroBox>

            <RetroBox title="Hourly Vote Distribution" icon={<BarChart3 className="h-4 w-4" />} iconColor="gold">
              <VoteTimeDistributionChart data={chartData.voteTimeDistribution} />
            </RetroBox>

            <RetroBox title="Top Projects by Volume" icon={<BarChart3 className="h-4 w-4" />} iconColor="green">
              <DailyTopProjectsChart data={chartData.dailyTopProjects} />
            </RetroBox>
          </div>
        </div>
      )}
    </div>
  );
}
