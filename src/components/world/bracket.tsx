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
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-[720px]">
        {gtm.map((round) => {
          const list = alive(round);
          const total = round.totalWeight ?? 0;
          return (
            <div key={round.id} className="flex-1 min-w-[140px]">
              <Link href={`/rounds/${round.id}`} className="block">
                <div className={cn("rounded-lg px-3 py-2 mb-2 text-xs", round.status === "OPEN" ? "bg-sky-500 text-white" : round.status === "CLOSED" ? "bg-zinc-200 dark:bg-zinc-700" : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground")}>
                  <div className="font-bold text-sm">{round.name}</div>
                  <div>{round.index === gtm.length - 1 ? "majority" : `≥ ${Math.round(round.threshold * 100)}%`} · {round.status === "OPEN" ? `${round.ballotCount} ballots · open` : round.status === "CLOSED" ? `${round.ballotCount} ballots` : fmtDateTime(round.opensAt)}</div>
                </div>
              </Link>
              <div className="space-y-1.5">
                {list.length === 0 && <div className="text-xs text-muted-foreground px-2">{round.status === "PENDING" ? "waiting" : "no entries"}</div>}
                {list.map((e) => {
                  const w = round.tally?.[e.id] ?? 0;
                  const share = total > 0 ? w / total : 0;
                  const advanced = round.advancedIds.includes(e.id);
                  return (
                    <Link key={e.id} href={`/entries/${e.id}`} className={cn("block rounded-md border px-2 py-1.5 text-xs relative overflow-hidden", advanced ? "border-sky-400 bg-sky-50 dark:bg-sky-900/30" : round.status === "CLOSED" ? "border-zinc-200 dark:border-zinc-700 opacity-60" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800")}>
                      {round.status === "CLOSED" && <div className="absolute inset-y-0 left-0 bg-sky-200/50 dark:bg-sky-700/30" style={{ width: `${Math.min(100, share * 100)}%` }} />}
                      <div className="relative">
                        <div className="font-semibold truncate">{e.isVictor ? "👑 " : ""}{e.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{e.crew?.name ?? ""}{round.status === "CLOSED" ? ` · ${Math.round(share * 100)}%` : ""}</div>
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
