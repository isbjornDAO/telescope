"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Package,
  Pencil,
  Plus,
  Trophy,
  Award,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  Clock,
  User as UserIcon,
  Search,
  Users,
  Flag,
  Trash2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useWorldQuery, useWorldSession, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { useUserDiscord } from "@/hooks/use-user-discord";
import {
  WorldPage,
  NodeBadge,
  TournamentBadge,
  StatusBadge,
  fmtDate,
  ErrorBlock,
} from "@/components/world/primitives";
import { ProfileSkeleton } from "@/components/ui/retro-skeletons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BadgeItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rarity: string;
  bg: string;
  awardedAt: string;
  reason?: string | null;
  awardedBy?: string | null;
}

interface Profile {
  handle: string | null;
  name: string;
  bio: string | null;
  nodeType?: "NODE" | "ANCHOR" | "ELDER" | string;
  standing?: number;
  level?: number;
  tags?: string[];
  badges?: BadgeItem[];
  region?: { name: string; slug: string } | null;
  faction?: { name: string; slug: string; vision: string; standing: number } | null;
  crews?: { name: string; slug: string; role: string; isLead: boolean }[];
  shipped: {
    id: string;
    kind: string;
    title: string;
    description: string | null;
    verified: boolean;
    shippedAt: string | null;
  }[];
  seasonHistory: {
    id: string;
    title: string;
    tournament: string;
    status: string;
    isVictor: boolean;
    season: { number: number; name: string };
  }[];
  since: string;
  address?: string;
  discordId?: string;
}

interface ForumStats {
  totalPosts: number;
  totalThreads: number;
  totalReplies: number;
  boardsPostedIn: { name: string; title: string; count: number }[];
  isSuperOG: boolean;
  currentPostStreak: number;
  longestPostStreak: number;
  joinedDate?: string;
}

interface UserStats {
  xp: number;
  coins: number;
  level?: number;
  discordId?: string;
  username?: string;
}

interface ForumPostItem {
  id: string;
  comment: string;
  threadId: string;
  threadSubject: string | null;
  boardName: string;
  boardTitle: string;
  isOp: boolean;
  createdAt: string;
  imageHash: string | null;
}

interface WallMessage {
  id: string;
  profileAddress: string;
  authorAddress?: string | null;
  authorName: string;
  content: string;
  createdAt: string;
}

const SUGGESTED_TAGS = [
  "Avalanche",
  "Governance",
  "DeFi",
  "Zero Knowledge",
  "Local Systems",
  "Smart Contracts",
  "AI Agents",
  "Infrastructure",
  "Cryptography",
  "GameFi",
];

export default function ProfilePage() {
  const params = useParams();
  const rawKey = decodeURIComponent(String(params.address));
  const { me, isSignedIn } = useWorldSession();
  const { address: currentAccount } = useAccount();

  const isOwn =
    (!!me?.signedIn &&
      (me.address?.toLowerCase() === rawKey.toLowerCase() ||
        (!!me.handle && me.handle.toLowerCase() === rawKey.toLowerCase()))) ||
    (!!currentAccount && currentAccount.toLowerCase() === rawKey.toLowerCase());

  const profileUrl = isOwn && isSignedIn ? "/api/world/me" : `/api/world/profiles/${encodeURIComponent(rawKey)}`;
  const { data: profile, isLoading, error, refetch: mutateProfile } = useWorldQuery<Profile>(
    ["profile", rawKey, isOwn],
    profileUrl
  );

  // Address resolution for user-specific forum stats & wall
  const targetAddress = profile?.address || (rawKey.startsWith("0x") ? rawKey : undefined);

  const { data: forumStats } = useWorldQuery<ForumStats>(
    ["userForumStats", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/forum-stats` : ""
  );

  const { data: userStats } = useWorldQuery<UserStats>(
    ["userStats", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/stats` : ""
  );

  // Discord user data — discordId comes from userStats (public) or profile.discordId (own session via /api/world/me)
  const discordId = userStats?.discordId || (profile as any)?.discordId || "";
  const { data: discordUser } = useUserDiscord(discordId);

  const { data: userPosts } = useWorldQuery<ForumPostItem[]>(
    ["userPosts", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/forum-posts` : ""
  );

  // Message Wall (Persistent Database Backend)
  const wallAddress = targetAddress || (rawKey.startsWith("0x") ? rawKey : profile?.address);
  const wallUrl = wallAddress ? `/api/users/${encodeURIComponent(wallAddress)}/wall` : "";
  const { data: wallMessages, refetch: mutateWall } = useWorldQuery<WallMessage[]>(
    ["profileWall", wallAddress],
    wallUrl
  );

  // Local state
  const [topicSearch, setTopicSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [wallInput, setWallInput] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const postWallMutation = useWorldMutation(async () => {
    if (!wallInput.trim() || !wallUrl) return;
    await worldFetch(wallUrl, {
      method: "POST",
      body: {
        content: wallInput.trim(),
        authorAddress: currentAccount || undefined,
        authorName: me?.handle ? `@${me.handle}` : currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : undefined,
      },
    });
    setWallInput("");
    await mutateWall();
  });

  const handleDeleteWallMessage = async (msgId: string) => {
    if (!wallUrl) return;
    try {
      await worldFetch(`${wallUrl}?id=${encodeURIComponent(msgId)}`, {
        method: "DELETE",
      });
      await mutateWall();
    } catch (err) {
      console.error("Failed to delete wall message:", err);
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered topics
  const filteredPosts = useMemo(() => {
    if (!userPosts) return [];
    if (!topicSearch.trim()) return userPosts;
    const q = topicSearch.toLowerCase();
    return userPosts.filter(
      (p) =>
        p.threadSubject?.toLowerCase().includes(q) ||
        p.boardName.toLowerCase().includes(q) ||
        p.comment.toLowerCase().includes(q)
    );
  }, [userPosts, topicSearch]);

  // Real level from database (userStats.level or profile.level, fallback to 1)
  const level = userStats?.level ?? profile?.level ?? 1;

  return (
    <WorldPage wide>
      {isLoading && <ProfileSkeleton />}
      {error && <ErrorBlock error={error} />}

      {profile && (
        <div className="space-y-6">
          {/* Panoramic Cover Banner */}
          <div className="retro-box overflow-hidden shadow-sm relative z-20">
            <div className="retro-profile-cover flex items-end justify-end p-3 sm:p-4 relative z-20">
              <div className="relative z-20 flex items-center gap-2">
                {targetAddress && (
                  <button
                    onClick={() => handleCopyAddress(targetAddress)}
                    className="retro-btn retro-btn-gray px-2.5 py-1 text-xs inline-flex items-center gap-1.5 shadow-sm"
                    title="Copy C-Chain address"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </button>
                )}
                {isOwn && (
                  <EditProfile
                    profile={profile}
                    open={isEditOpen}
                    setOpen={setIsEditOpen}
                    onUpdated={() => mutateProfile()}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Dual-Column Magazine Layout (32% Left Identity / 68% Right Feed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: User Card, Stats, Bio, Tags ────────── */}
            <div className="lg:col-span-4 space-y-5">
              {/* Primary Identity Box */}
              <div className="retro-box p-4 pt-0 text-center relative">
                {/* Framed Avatar Stand */}
                <div className="retro-profile-avatar-frame flex items-center justify-center overflow-hidden">
                  {discordUser?.avatar_url ? (
                    <img
                      src={discordUser.avatar_url}
                      alt={discordUser.global_name || discordUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#2495D4] to-[#43B2EE] flex items-center justify-center font-bold text-white text-3xl shadow-inner">
                      {profile.handle
                        ? profile.handle.slice(0, 2).toUpperCase()
                        : targetAddress
                        ? targetAddress.slice(2, 4).toUpperCase()
                        : "0X"}
                    </div>
                  )}
                </div>

                {/* Name & Handle */}
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {profile.name}
                </h1>
                {profile.handle && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">@{profile.handle}</p>
                )}
                {(discordUser?.global_name || discordUser?.username) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                    {discordUser.global_name || discordUser.username}
                  </p>
                )}

                {/* Node Tier Badge */}
                <div className="mt-2 flex justify-center">
                  <NodeBadge nodeType={profile.nodeType || "NODE"} />
                </div>

                {/* Wallet Address Chip */}
                {targetAddress && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 max-w-[220px] mx-auto">
                    <span>
                      {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
                    </span>
                    <a
                      href={`https://snowtrace.io/address/${targetAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-sky-600 transition-colors ml-1"
                      title="View on Snowtrace"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* 3-Cell Metric Counters Strip */}
                <div className="retro-stat-counters">
                  <div>
                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {forumStats?.totalThreads ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Topics
                    </div>
                  </div>
                  <div className="border-x border-zinc-200 dark:border-zinc-700">
                    <div className="text-base font-bold text-[#2495D4] dark:text-sky-400 tabular-nums">
                      Lvl {level}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {userStats?.xp ?? 0} XP
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {profile.standing ?? 100}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Standing
                    </div>
                  </div>
                </div>

                {/* Focus & Domains Tags (Real User Tags) */}
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Focus & Domains</span>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-normal"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tags && profile.tags.length > 0 ? (
                      profile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="retro-profile-tag bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-mono"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        {isOwn
                          ? "No domains added yet. Click Edit to add your focus areas."
                          : "No focus domains listed."}
                      </p>
                    )}
                    {profile.faction && (
                      <span className="retro-profile-tag bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                        🛡️ {profile.faction.name}
                      </span>
                    )}
                    {profile.region && (
                      <span className="retro-profile-tag bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                        📍 {profile.region.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* "About Me" Bio Box */}
              <div className="retro-box overflow-hidden">
                <div className="retro-box-title bg-gradient-to-r from-[#2B83B7] to-[#1E6B99] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white">About Me</span>
                  </div>
                  <span className="text-[10px] text-white/80 font-mono">ID #{profile.since.slice(0, 4)}</span>
                </div>
                <div className="p-4 text-xs space-y-3">
                  <p className="leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {profile.bio ||
                      (isOwn
                        ? "You haven't written a bio yet. Click Edit to tell the community what you build!"
                        : "This explorer hasn't added a bio yet.")}
                  </p>
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" />
                      <span>Member since</span>
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{fmtDate(profile.since)}</span>
                  </div>
                </div>
              </div>

              {/* Faction & Regional Alignment */}
              {(profile.faction || profile.region) && (
                <div className="retro-box overflow-hidden">
                  <div className="retro-box-title bg-gradient-to-r from-[#833F96] to-[#5D236E] text-white flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white">Affiliations</span>
                  </div>
                  <div className="p-4 text-xs space-y-2.5">
                    {profile.faction && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Faction
                        </div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {profile.faction.name}
                        </div>
                        {profile.faction.vision && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                            &ldquo;{profile.faction.vision}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                    {profile.region && (
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Regional Node
                        </div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {profile.region.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Badges, Topics, Tournaments, Wall ─── */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Official Team-Awarded Badges Showcase */}
              <div className="retro-box shadow-sm relative">
                <div className="retro-box-title bg-gradient-to-r from-[#FAC72B] to-[#D98200] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white drop-shadow-sm">
                      Protocol Badges ({profile.badges?.length ?? 0})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/90 font-medium hidden sm:inline">
                      Official Honors
                    </span>
                    {me?.isAdmin && (
                      <AwardBadgeDialog
                        target={profile.handle || targetAddress || rawKey}
                        onAwarded={() => mutateProfile()}
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {!profile.badges || profile.badges.length === 0 ? (
                    <div className="text-center py-6 px-4 space-y-1.5">
                      <Award className="w-8 h-8 text-amber-500/40 mx-auto" />
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        No official badges awarded yet
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        Badges are granted by the Telescope team for protocol milestones, tournament leadership, and community contributions.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {profile.badges.map((b) => (
                        <div
                          key={b.id}
                          className="retro-badge-card group relative"
                          title={`${b.title} — ${b.desc} (${b.rarity})`}
                        >
                          <span className="text-xl select-none filter drop-shadow-sm">{b.icon}</span>
                          {/* Rich Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 p-2.5 bg-zinc-950 text-white text-[10px] rounded-md shadow-xl pointer-events-none text-center border border-zinc-700">
                            <div className="font-bold text-amber-300">{b.title}</div>
                            <div className="text-zinc-300 text-[9px] mt-0.5 leading-tight">{b.desc}</div>
                            {b.reason && (
                              <div className="text-emerald-400 text-[9px] mt-1 italic">&ldquo;{b.reason}&rdquo;</div>
                            )}
                            <div className="flex items-center justify-between pt-1 mt-1.5 border-t border-zinc-800 text-[8px] text-zinc-400 font-mono">
                              <span className="text-amber-400 uppercase tracking-wider">{b.rarity}</span>
                              <span>{fmtDate(b.awardedAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. User Topics & Forum Activity */}
              <div className="retro-box overflow-hidden shadow-sm">
                <div className="retro-box-title bg-gradient-to-r from-[#2495D4] to-[#126391] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white drop-shadow-sm">
                      Discussions & Topics ({userPosts?.length ?? 0})
                    </span>
                  </div>

                  {/* Search inside topics bar (Retro style) */}
                  <div className="relative w-full sm:w-48">
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      className="w-full h-6 pl-6 pr-2 text-[11px] rounded bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:bg-white focus:text-zinc-900 dark:focus:bg-zinc-800 dark:focus:text-zinc-100 transition-all"
                    />
                    <Search className="w-3 h-3 text-white/70 absolute left-2 top-1.5 pointer-events-none" />
                  </div>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredPosts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No forum topics found for this node.
                    </div>
                  ) : (
                    filteredPosts.slice(0, 6).map((post) => (
                      <div key={post.id} className="retro-topic-row">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-900">
                              /{post.boardName}/
                            </span>
                            {post.isOp && (
                              <span
                                className="retro-op-badge"
                                title="Original Poster (Thread Creator)">
                                OP
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{fmtDate(post.createdAt)}</span>
                          </div>
                          <Link
                            href={`/forum/thread/${post.threadId}`}
                            className="font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:text-primary hover:underline line-clamp-1"
                          >
                            {post.threadSubject || post.comment.slice(0, 60)}
                          </Link>
                        </div>
                        <Link
                          href={`/forum/thread/${post.threadId}`}
                          className="retro-btn retro-btn-gray px-2 py-1 text-[10px] flex-shrink-0"
                        >
                          View &gt;
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Tournaments & Shipped Artifacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tournaments History */}
                <div className="retro-box overflow-hidden shadow-sm">
                  <div className="retro-box-title bg-gradient-to-r from-[#54C301] to-[#3B8F00] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-white" />
                      <span className="font-bold text-xs uppercase tracking-wider text-white">Season Tournaments</span>
                    </div>
                    <span className="text-[10px] text-white/80 font-bold">{profile.seasonHistory.length}</span>
                  </div>
                  <div className="p-3 text-xs">
                    {profile.seasonHistory.length === 0 ? (
                      <p className="text-muted-foreground py-3 text-center">No tournament entries yet.</p>
                    ) : (
                      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {profile.seasonHistory.map((e) => (
                          <li key={e.id} className="py-2 flex items-center justify-between gap-2">
                            <Link href={`/entries/${e.id}`} className="font-bold hover:underline line-clamp-1">
                              {e.isVictor ? "👑 " : ""}
                              {e.title}
                            </Link>
                            <div className="flex items-center gap-1 flex-shrink-0 scale-90 origin-right">
                              <TournamentBadge tournament={e.tournament} />
                              <StatusBadge status={e.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Shipped Proofs */}
                <div className="retro-box overflow-hidden shadow-sm">
                  <div className="retro-box-title bg-gradient-to-r from-[#2495D4] to-[#126391] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-white" />
                      <span className="font-bold text-xs uppercase tracking-wider text-white">Shipped Proofs</span>
                    </div>
                    {isOwn && <AddProof onAdded={() => mutateProfile()} />}
                  </div>
                  <div className="p-3 text-xs">
                    {profile.shipped.length === 0 ? (
                      <p className="text-muted-foreground py-3 text-center">No shipped artifacts listed.</p>
                    ) : (
                      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {profile.shipped.map((p) => (
                          <li key={p.id} className="py-2">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{p.title}</span>
                            </div>
                            {p.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Guestbook / Persistent Message Wall */}
              <div className="retro-box overflow-hidden shadow-sm">
                <div className="retro-box-title bg-gradient-to-r from-[#40586F] to-[#2B3B4B] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                      Message Wall ({wallMessages?.length ?? 0})
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80 font-medium">Verified Guestbook</span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Composer for Guestbook */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`Leave a message on ${profile.name}'s wall...`}
                      value={wallInput}
                      onChange={(e) => setWallInput(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className="text-xs bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 rounded-md focus:border-sky-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {wallInput.length}/500 chars
                      </span>
                      <button
                        onClick={() => postWallMutation.mutate(undefined)}
                        disabled={!wallInput.trim() || postWallMutation.isPending}
                        className="retro-btn retro-btn-green px-4 py-1.5 text-xs font-bold uppercase inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{postWallMutation.isPending ? "Signing..." : "Sign Wall"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-3 pt-2">
                    {!wallMessages || wallMessages.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No signatures on this node&apos;s wall yet. Be the first to leave a greeting!
                      </p>
                    ) : (
                      wallMessages.map((msg) => {
                        const canDelete =
                          isOwn ||
                          me?.isAdmin ||
                          (!!currentAccount && msg.authorAddress?.toLowerCase() === currentAccount.toLowerCase());

                        return (
                          <div
                            key={msg.id}
                            className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex gap-3 items-start group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                          >
                            <div className="w-8 h-8 rounded bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-xs flex-shrink-0">
                              {msg.authorName.slice(0, 2).replace(/^@/, "").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                                  {msg.authorName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">{fmtDate(msg.createdAt)}</span>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteWallMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-0.5"
                                      title="Delete signature"
                                      aria-label="Delete signature"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </WorldPage>
  );
}

function EditProfile({
  profile,
  open,
  setOpen,
  onUpdated,
}: {
  profile: Profile;
  open: boolean;
  setOpen: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [tags, setTags] = useState<string[]>(profile.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (t?: string) => {
    const raw = (t ?? tagInput).trim();
    if (!raw) return;
    const clean = raw.replace(/^#/, "").trim();
    if (!clean || clean.length > 30) return;
    if (tags.some((existing) => existing.toLowerCase() === clean.toLowerCase())) return;
    if (tags.length >= 12) return;
    setTags([...tags, clean]);
    if (!t) setTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const save = useWorldMutation(async () => {
    await worldFetch("/api/world/me", {
      method: "PATCH",
      body: { handle: handle || undefined, bio, tags },
    });
    setOpen(false);
    onUpdated();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="retro-btn retro-btn-blue px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
          <Pencil className="w-3 h-3" />
          <span>Edit Profile</span>
        </button>
      </DialogTrigger>
      <DialogContent className="retro-box p-0 border-0 overflow-hidden max-w-md">
        <div className="retro-box-title bg-gradient-to-r from-[#2B83B7] to-[#1E6B99] text-white">
          <span className="font-bold text-sm">Edit Your Profile</span>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div>
            <Label className="font-bold text-xs">Handle / Username</Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="e.g. satoshi, alex"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="font-bold text-xs">Bio & What You Build</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Tell the community about yourself..."
              className="mt-1 text-xs"
            />
          </div>

          {/* Focus & Domains Tags Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="font-bold text-xs">Focus & Domains Tags</Label>
              <span className="text-[10px] text-muted-foreground">{tags.length}/12 tags</span>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {tags.length === 0 ? (
                <span className="text-[11px] text-muted-foreground italic px-1">
                  No tags added yet. Choose suggestions or type below.
                </span>
              ) : (
                tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-red-500 ml-0.5 font-bold"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Tag Input */}
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a domain and press Enter..."
                className="text-xs h-8"
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                disabled={!tagInput.trim() || tags.length >= 12}
                className="retro-btn retro-btn-blue px-3 text-xs font-bold disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Suggested Tags Pills */}
            <div className="mt-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Suggestions:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {SUGGESTED_TAGS.filter(
                  (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddTag(s)}
                    disabled={tags.length >= 12}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    +{s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {save.error && <p className="text-xs text-red-600">{(save.error as Error).message}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setOpen(false)}
              className="retro-btn retro-btn-gray px-4 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => save.mutate(undefined)}
              disabled={save.isPending}
              className="retro-btn retro-btn-green px-5 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {save.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AwardBadgeDialog({ target, onAwarded }: { target: string; onAwarded: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [reason, setReason] = useState("");
  const { data: availableBadges, isLoading } = useWorldQuery<
    { id: string; name: string; description: string; icon: string; rarity: string }[]
  >(["availableBadges"], open ? "/api/admin/badges" : "");

  const award = useWorldMutation(async () => {
    if (!selectedBadgeId) return;
    await worldFetch("/api/admin/badges", {
      method: "POST",
      body: {
        target,
        badgeId: selectedBadgeId,
        reason: reason.trim() || undefined,
      },
    });
    setOpen(false);
    setSelectedBadgeId("");
    setReason("");
    onAwarded();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="retro-btn retro-btn-green px-2.5 py-1 text-xs inline-flex items-center gap-1.5 shadow-sm font-bold"
          title="Award an official badge to this node"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Award Badge</span>
        </button>
      </DialogTrigger>
      <DialogContent className="retro-box p-0 border-0 overflow-hidden max-w-md">
        <div className="retro-box-title bg-gradient-to-r from-[#FAC72B] to-[#D98200] text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-white" />
          <span className="font-bold text-sm">Award Official Badge</span>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <p className="text-muted-foreground text-[11px]">
            As a Telescope World Admin, you can grant an official protocol badge to this user.
          </p>
          <div>
            <Label className="font-bold text-xs">Select Badge</Label>
            {isLoading ? (
              <p className="text-xs text-muted-foreground mt-1">Loading badges...</p>
            ) : (
              <select
                value={selectedBadgeId}
                onChange={(e) => setSelectedBadgeId(e.target.value)}
                className="w-full mt-1 p-2 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">-- Choose a badge to award --</option>
                {availableBadges?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon} {b.name} ({b.rarity}) — {b.description}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label className="font-bold text-xs">Reason / Citation (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="e.g. Outstanding contributor to the Avalanche consensus testing round..."
              className="mt-1 text-xs"
            />
          </div>
          {award.error && <p className="text-xs text-red-600">{(award.error as Error).message}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setOpen(false)}
              className="retro-btn retro-btn-gray px-4 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => award.mutate(undefined)}
              disabled={award.isPending || !selectedBadgeId}
              className="retro-btn retro-btn-green px-5 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {award.isPending ? "Granting..." : "Grant Badge"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProof({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const add = useWorldMutation(async () => {
    await worldFetch("/api/world/me/proofs", {
      method: "POST",
      body: { title, kind: "SHIPPED", description: description || undefined },
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    onAdded?.();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="retro-btn retro-btn-gray px-2 py-0.5 text-[10px] inline-flex items-center gap-1"
          title="Add shipped artifact"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </DialogTrigger>
      <DialogContent className="retro-box p-0 border-0 overflow-hidden max-w-md">
        <div className="retro-box-title bg-gradient-to-r from-[#2495D4] to-[#126391] text-white">
          <span className="font-bold text-sm">Add Built Artifact</span>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div>
            <Label className="font-bold text-xs">Artifact Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Decentralized Oracle Subnet"
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label className="font-bold text-xs">Description & Verification Link</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short summary of what was built..."
              className="mt-1 text-xs"
            />
          </div>
          {add.error && <p className="text-xs text-red-600">{(add.error as Error).message}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setOpen(false)}
              className="retro-btn retro-btn-gray px-4 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => add.mutate(undefined)}
              disabled={add.isPending || !title.trim()}
              className="retro-btn retro-btn-green px-5 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {add.isPending ? "Adding..." : "Add Artifact"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
