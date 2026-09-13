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
  Crown,
  Shield,
  Flame,
  Globe,
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
  Eye,
  Flag,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useWorldQuery, useWorldSession, useWorldMutation, worldFetch } from "@/hooks/use-world";
import {
  WorldPage,
  NodeBadge,
  TournamentBadge,
  StatusBadge,
  fmtDate,
  LoadingBlock,
  ErrorBlock,
} from "@/components/world/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Profile {
  handle: string | null;
  name: string;
  bio: string | null;
  nodeType?: "NODE" | "ANCHOR" | "ELDER" | string;
  standing?: number;
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
  author: string;
  authorAddress?: string;
  content: string;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const rawKey = decodeURIComponent(String(params.address));
  const { me, isSignedIn } = useWorldSession();
  const { address: currentAccount } = useAccount();

  const isOwn =
    !!me?.signedIn &&
    (me.address?.toLowerCase() === rawKey.toLowerCase() ||
      (!!me.handle && me.handle.toLowerCase() === rawKey.toLowerCase()));

  const profileUrl = isOwn && isSignedIn ? "/api/world/me" : `/api/world/profiles/${encodeURIComponent(rawKey)}`;
  const { data: profile, isLoading, error } = useWorldQuery<Profile>(["profile", rawKey, isOwn], profileUrl);

  // Address resolution for user-specific forum stats
  const targetAddress = profile?.address || (rawKey.startsWith("0x") ? rawKey : undefined);

  const { data: forumStats } = useWorldQuery<ForumStats>(
    ["userForumStats", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/forum-stats` : ""
  );

  const { data: userStats } = useWorldQuery<UserStats>(
    ["userStats", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/stats` : ""
  );

  const { data: userPosts } = useWorldQuery<ForumPostItem[]>(
    ["userPosts", targetAddress],
    targetAddress ? `/api/users/${targetAddress}/forum-posts` : ""
  );

  // Local state
  const [topicSearch, setTopicSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [wallInput, setWallInput] = useState("");
  const [wallMessages, setWallMessages] = useState<WallMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`profile_wall_${rawKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [
      {
        id: "default-1",
        author: "Telescope Protocol",
        content: "Welcome to the decentralized node profile on Telescope! Leave a signature or greeting.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];
  });

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostWall = () => {
    if (!wallInput.trim()) return;
    const newMsg: WallMessage = {
      id: "msg-" + Date.now(),
      author: me?.handle ? `@${me.handle}` : currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : "Guest Visitor",
      authorAddress: currentAccount || undefined,
      content: wallInput.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [newMsg, ...wallMessages];
    setWallMessages(next);
    setWallInput("");
    if (typeof window !== "undefined") {
      localStorage.setItem(`profile_wall_${rawKey}`, JSON.stringify(next));
    }
  };

  // Badges array calculation (Retro inspired)
  const badges = useMemo(() => {
    if (!profile) return [];
    const list: { id: string; title: string; desc: string; icon: string; rarity: string; bg: string }[] = [];

    if (forumStats?.isSuperOG) {
      list.push({
        id: "super-og",
        title: "Super OG Pioneer",
        desc: "Among the first 100 pioneer nodes to post on Telescope",
        icon: "🌟",
        rarity: "Legendary",
        bg: "from-amber-400 to-amber-600",
      });
    }

    if (profile.nodeType === "ELDER") {
      list.push({
        id: "elder",
        title: "Elder Node",
        desc: "Trusted sovereign elder of the Telescope governance ring",
        icon: "👑",
        rarity: "Epic",
        bg: "from-purple-500 to-indigo-600",
      });
    } else if (profile.nodeType === "ANCHOR") {
      list.push({
        id: "anchor",
        title: "Anchor Node",
        desc: "In-person verified anchor supporting consensus security",
        icon: "⚓",
        rarity: "Rare",
        bg: "from-sky-400 to-blue-600",
      });
    } else {
      list.push({
        id: "node",
        title: "Verified Node",
        desc: "Cryptographically verified Avalanche C-Chain network node",
        icon: "❄️",
        rarity: "Common",
        bg: "from-emerald-400 to-teal-600",
      });
    }

    const hasWon = profile.seasonHistory.some((e) => e.isVictor);
    if (hasWon) {
      list.push({
        id: "victor",
        title: "Tournament Victor",
        desc: "Champion of an official Telescope protocol tournament",
        icon: "🏆",
        rarity: "Legendary",
        bg: "from-yellow-400 to-amber-500",
      });
    }

    if (profile.seasonHistory.length > 0) {
      list.push({
        id: "competitor",
        title: "Tournament Builder",
        desc: `Participated in ${profile.seasonHistory.length} Season tournament rounds`,
        icon: "⚔️",
        rarity: "Rare",
        bg: "from-red-400 to-pink-600",
      });
    }

    if (profile.shipped.length > 0) {
      list.push({
        id: "shipped",
        title: "Master Craftsperson",
        desc: `Shipped ${profile.shipped.length} verified protocol artifacts`,
        icon: "📦",
        rarity: "Rare",
        bg: "from-blue-500 to-cyan-600",
      });
    }

    if ((forumStats?.totalPosts ?? 0) >= 5) {
      list.push({
        id: "broadcaster",
        title: "Active Broadcaster",
        desc: "Contributed 5+ public discussions to the network forum",
        icon: "💬",
        rarity: "Common",
        bg: "from-emerald-500 to-green-600",
      });
    }

    if ((forumStats?.longestPostStreak ?? 0) >= 2) {
      list.push({
        id: "streak",
        title: "Signal Beacon",
        desc: `Maintained a ${forumStats?.longestPostStreak}-day active communication streak`,
        icon: "🔥",
        rarity: "Rare",
        bg: "from-orange-400 to-red-500",
      });
    }

    if (profile.faction) {
      list.push({
        id: "faction",
        title: `${profile.faction.name} Herald`,
        desc: `Loyal member of the ${profile.faction.name} faction`,
        icon: "🛡️",
        rarity: "Rare",
        bg: "from-indigo-400 to-purple-600",
      });
    }

    return list;
  }, [profile, forumStats]);

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

  const level = Math.max(1, Math.floor((userStats?.xp ?? 0) / 10));

  return (
    <WorldPage wide>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}

      {profile && (
        <div className="space-y-6">
          {/* Panoramic Cover Banner */}
          <div className="retro-box overflow-hidden shadow-sm">
            <div className="retro-profile-cover flex items-end justify-end p-3 sm:p-4">
              <div className="relative z-10 flex items-center gap-2">
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
                {isOwn && <EditProfile profile={profile} />}
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
                <div className="retro-profile-avatar-frame flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-tr from-[#2495D4] to-[#43B2EE] flex items-center justify-center font-bold text-white text-3xl shadow-inner">
                    {profile.handle
                      ? profile.handle.slice(0, 2).toUpperCase()
                      : targetAddress
                      ? targetAddress.slice(2, 4).toUpperCase()
                      : "0X"}
                  </div>
                </div>

                {/* Name & Handle */}
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {profile.name}
                </h1>
                {profile.handle && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">@{profile.handle}</p>
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

                {/* Tag Interests / Focus Areas */}
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Focus & Domains</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="retro-profile-tag">Avalanche</span>
                    <span className="retro-profile-tag">Governance</span>
                    <span className="retro-profile-tag">Local Systems</span>
                    {profile.faction && (
                      <span className="retro-profile-tag bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                        {profile.faction.name}
                      </span>
                    )}
                    {profile.region && (
                      <span className="retro-profile-tag bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                        {profile.region.name}
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
                    {profile.bio || (isOwn ? "You haven't written a bio yet. Click Edit to tell the community what you build!" : "This explorer hasn't added a bio yet.")}
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
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Faction</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{profile.faction.name}</div>
                        {profile.faction.vision && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{profile.faction.vision}"</p>
                        )}
                      </div>
                    )}
                    {profile.region && (
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Regional Node</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{profile.region.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Badges, Topics, Tournaments, Wall ─── */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Badges Showcase */}
              <div className="retro-box shadow-sm">
                <div className="retro-box-title bg-gradient-to-r from-[#FAC72B] to-[#D98200] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white drop-shadow-sm">
                      My Badges ({badges.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-white/90 font-medium">Protocol Achievements</span>
                </div>

                <div className="p-4 sm:p-5">
                  {badges.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No badges earned yet.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {badges.map((b) => (
                        <div
                          key={b.id}
                          className="retro-badge-card group relative"
                          title={`${b.title} — ${b.desc} (${b.rarity})`}
                        >
                          <span className="text-xl select-none filter drop-shadow-sm">{b.icon}</span>
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-44 p-2 bg-zinc-900 text-white text-[10px] rounded-md shadow-lg pointer-events-none text-center">
                            <div className="font-bold text-amber-300">{b.title}</div>
                            <div className="text-zinc-300 text-[9px] mt-0.5">{b.desc}</div>
                            <div className="text-[8px] uppercase tracking-wider text-amber-400/80 mt-1 font-mono">
                              {b.rarity}
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
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1 rounded">
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
                    {isOwn && <AddProof />}
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

              {/* 4. Guestbook / Message Wall */}
              <div className="retro-box overflow-hidden shadow-sm">
                <div className="retro-box-title bg-gradient-to-r from-[#40586F] to-[#2B3B4B] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white">
                      Message Wall ({wallMessages.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80 font-medium">Public Guestbook</span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Composer for Guestbook */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`Leave a message on ${profile.name}'s wall...`}
                      value={wallInput}
                      onChange={(e) => setWallInput(e.target.value)}
                      rows={2}
                      className="text-xs bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 rounded-md"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handlePostWall}
                        disabled={!wallInput.trim()}
                        className="retro-btn retro-btn-green px-4 py-1.5 text-xs font-bold uppercase inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>Sign Wall</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-3 pt-2">
                    {wallMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex gap-3 items-start"
                      >
                        <div className="w-8 h-8 rounded bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-xs flex-shrink-0">
                          {msg.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{msg.author}</span>
                            <span className="text-[10px] text-muted-foreground">{fmtDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
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

function EditProfile({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const save = useWorldMutation(async () => {
    await worldFetch("/api/world/me", {
      method: "PATCH",
      body: { handle: handle || undefined, bio },
    });
    setOpen(false);
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
          {save.error && <p className="text-xs text-red-600">{(save.error as Error).message}</p>}
          <div className="flex justify-end gap-2 pt-2">
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

function AddProof() {
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
          <div className="flex justify-end gap-2 pt-2">
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
