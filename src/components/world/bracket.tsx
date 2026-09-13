"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/components/world/primitives";

export interface BracketRound {
  id: string;
  tournament: string;
  index: number;
  name: string;
  threshold: number;
  opensAt: string;
  closesAt: string;
  status: "PENDING" | "OPEN" | "CLOSED" | string;
  ballotCount: number;
  totalWeight: number | null;
  tally: Record<string, number> | null;
  advancedIds: string[];
}

export interface BracketEntry {
  id: string;
  title: string;
  status: string;
  eliminatedRound?: number | null;
  isVictor?: boolean;
  crew?: { name: string; slug: string } | null;
}

/** Threshold, not rank: everyone above the line advances, so brackets can be uneven. */
export function Bracket({ rounds, entries }: { rounds: BracketRound[]; entries: BracketEntry[] }) {
  const gtm = rounds.filter((r) => r.tournament === "GTM").sort((a, b) => a.index - b.index);
  const alive = (round: BracketRound) =>
    entries.filter((e) => {
      if (e.status === "WITHDRAWN" || e.status === "DRAFT" || e.status === "SUBMITTED") return false;
      if (round.index === 0) return true;
      const prev = gtm.find((r) => r.index === round.index - 1);
      if (prev?.status === "CLOSED") return prev.advancedIds.includes(e.id);
      return false;
    });

  return (
    <div className="overflow-x-auto pb-3 -mx-1 px-1">
      <div className="flex gap-3.5 min-w-[760px]">
        {gtm.map((round) => {
          const list = alive(round);
          const total = round.totalWeight ?? 0;
          const isOpen = round.status === "OPEN";
          const isClosed = round.status === "CLOSED";

          return (
            <div key={round.id} className="flex-1 min-w-[170px]">
              {/* Round Header Bar (Retro Style) */}
              <Link href={`/rounds/${round.id}`} className="block group">
                <div
                  className={cn(
                    "rounded-md px-3 py-2 mb-2.5 text-xs transition-all border shadow-sm",
                    isOpen
                      ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white border-sky-400 ring-2 ring-sky-400/20 shadow-md"
                      : isClosed
                      ? "bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-850 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                      : "bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-300 dark:border-zinc-750 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black tracking-wide uppercase text-[12px] group-hover:underline">
                      {round.name}
                    </span>
                    {isOpen && (
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5 flex items-center justify-between">
                    <span>{round.index === gtm.length - 1 ? "Majority" : `≥ ${Math.round(round.threshold * 100)}%`}</span>
                    <span className="font-mono text-[10px]">
                      {isOpen
                        ? `${round.ballotCount} ballots`
                        : isClosed
                        ? `${round.ballotCount} votes`
                        : fmtDateTime(round.opensAt)}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Contestant Cards in this Round */}
              <div className="space-y-2">
                {list.length === 0 && (
                  <div className="text-center py-4 px-2 text-[11px] text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50/50 dark:bg-zinc-900/30">
                    {round.status === "PENDING" ? "Awaiting prior round" : "No entries"}
                  </div>
                )}

                {list.map((e) => {
                  const w = round.tally?.[e.id] ?? 0;
                  const share = total > 0 ? w / total : 0;
                  const advanced = round.advancedIds.includes(e.id);

                  return (
                    <Link
                      key={e.id}
                      href={`/entries/${e.id}`}
                      className={cn(
                        "block rounded-md border p-2 text-xs relative overflow-hidden transition-all duration-150 group shadow-xs",
                        advanced
                          ? "border-emerald-400/80 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-600/70"
                          : isOpen
                          ? "border-sky-300 dark:border-sky-800 bg-white dark:bg-zinc-850 hover:border-sky-500 hover:shadow"
                          : isClosed
                          ? "border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-900 opacity-70 hover:opacity-100"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      )}
                    >
                      {/* Vote share progress fill */}
                      {isClosed && share > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 bg-sky-200/40 dark:bg-sky-700/25 transition-all"
                          style={{ width: `${Math.min(100, share * 100)}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[12px] truncate text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 transition-colors flex items-center gap-1">
                            {e.isVictor ? "👑 " : ""}
                            {e.title}
                          </div>
                          {e.crew && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {e.crew.name}
                            </div>
                          )}
                        </div>

                        {/* Status/Share pill */}
                        <div className="shrink-0 text-right">
                          {isClosed ? (
                            <div className="font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300">
                              {Math.round(share * 100)}%
                            </div>
                          ) : advanced ? (
                            <span className="text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 rounded">
                              Adv
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
