"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Search, Trophy, ShieldCheck, Flame } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { NodeBadge } from "@/components/world/primitives";

interface SeasonOverview {
  number: number;
  name: string;
  phase: string;
  status: string;
}

export function UserStatusStrip() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: me } = useWorldQuery<{
    signedIn: boolean;
    handle?: string | null;
    nodeType?: "NODE" | "ANCHOR" | "ELDER";
  }>(["me"], "/api/world/auth/me");

  const { data: seasons } = useWorldQuery<SeasonOverview[]>(
    ["seasons"],
    "/api/world/seasons"
  );

  const activeSeason = seasons?.find(
    (s) => s.phase === "building" || s.phase === "voting"
  ) || seasons?.[0];

  return (
    <div className="retro-user-bar mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: User Avatar & Node Identity */}
      <div className="flex items-center gap-2.5">
        {isConnected && address ? (
          <Link href={`/profile/${address}`} className="flex items-center gap-2.5 group">
            <div className="retro-avatar-plate">
              <div className="retro-avatar-stand w-9 h-9 rounded bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-sm shadow-sm group-hover:scale-105 transition-transform">
                {address.slice(2, 4).toUpperCase()}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors">
                  {me?.handle ? `@${me.handle}` : `${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
                <NodeBadge nodeType={me?.nodeType || "NODE"} className="scale-90 origin-left" />
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Verified C-Chain Node
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="retro-avatar-plate">
              <div className="retro-avatar-stand w-9 h-9 rounded bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-sm shadow-sm">
                🐻
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                Visitor
              </span>
              <span className="text-[10px] text-muted-foreground">
                Connect wallet to vote & post
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center: Live World Status Ticker */}
      <div className="hidden md:flex items-center gap-3 py-1 px-3 rounded-md bg-white/70 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-zinc-700 dark:text-zinc-200">
            {activeSeason ? `Season ${activeSeason.number}` : "World Online"}
          </span>
          {activeSeason?.phase && (
            <span className="font-semibold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60">
              {activeSeason.phase}
            </span>
          )}
        </div>

        <span className="text-zinc-300 dark:text-zinc-600">|</span>

        <Link
          href="/tournaments"
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-[var(--telescope-blue)] transition-colors"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Tournaments</span>
        </Link>

        <span className="text-zinc-300 dark:text-zinc-600">|</span>

        <Link
          href="/calendar"
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Live Events</span>
        </Link>
      </div>

      {/* Right: Search Bar */}
      <div className="flex items-center ml-auto sm:ml-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Telescope..."
            className="w-36 sm:w-44 h-7 pl-2.5 pr-7 text-[11px] rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 shadow-inner"
          />
          <button
            type="button"
            className="absolute right-1 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            aria-label="Search"
          >
            <Search className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
