"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Vote, Lock, ShieldCheck, ArrowLeft, Trophy } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import {
  WorldPage,
  RetroBox,
  Empty,
  ErrorBlock,
  StatusBadge,
  fmtDateTime,
} from "@/components/world/primitives";
import { MatchupRoundSkeleton } from "@/components/ui/retro-skeletons";
import { WorldGate } from "@/components/world/world-gate";

interface RoundView {
  id: string;
  season: { number: number; name: string };
  tournament: string;
  index: number;
  name: string;
  threshold: number;
  opensAt: string;
  closesAt: string;
  status: string;
  ballotCount: number;
  totalWeight: number | null;
  tallyHash: string | null;
  entries: {
    id: string;
    title: string;
    summary: string;
    url: string | null;
    crew: { name: string; slug: string } | null;
    faction: { name: string; slug: string } | null;
    status: string;
    weight: number | null;
    share: number | null;
    advanced: boolean;
  }[];
  viewer: { canVote: boolean; weight: number; voted: boolean; reason: string | null };
}

export default function RoundPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useWorldQuery<RoundView>(["round", id], `/api/world/rounds/${id}`);
  const { data: tally } = useWorldQuery<{ verifies: boolean; tallyHash: string | null }>(
    ["tally", id],
    data?.status === "CLOSED" ? `/api/world/rounds/${id}/tally` : null
  );

  return (
    <WorldPage wide>
      {isLoading && <MatchupRoundSkeleton />}
      {error && <ErrorBlock error={error} />}

      {data && (
        <div className="space-y-6">
          {/* Round Header */}
          <RetroBox
            title={`${data.tournament} · Round ${data.index}`}
            icon={<Trophy className="h-5 w-5 drop-shadow-sm" />}
            iconColor="blue"
            actions={
              <Link
                href={`/tournaments/${data.season.number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {data.season.name} Bracket
              </Link>
            }
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {data.name}
                </h1>
                <StatusBadge status={data.status} />
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                Advance threshold: <b>≥ {Math.round(data.threshold * 100)}%</b> of weighted votes cast
                {data.threshold >= 0.5 ? " (majority)" : ""} · {fmtDateTime(data.opensAt)} →{" "}
                {fmtDateTime(data.closesAt)} · <b>{data.ballotCount}</b> ballots cast
              </p>

              {data.status === "CLOSED" && (
                <div className="retro-subtitle p-2.5 text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    Tally published with commitment{" "}
                    <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                      {data.tallyHash?.slice(0, 16)}…
                    </code>
                    {tally ? (tally.verifies ? " · verifies" : " · MISMATCH") : ""} · Total weight:{" "}
                    {data.totalWeight}
                  </span>
                </div>
              )}
            </div>
          </RetroBox>

          {/* Voting Box (If Open) */}
          {data.tournament === "GTM" && data.status === "OPEN" && (
            <WorldGate message="Sign in with your wallet to vote in this bracket round.">
              {data.viewer.canVote ? (
                <BallotForm round={data} />
              ) : (
                <RetroBox title="Ballot Sealed" iconColor="slate">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>{data.viewer.reason ?? "You cannot vote in this round."}</span>
                  </div>
                </RetroBox>
              )}
            </WorldGate>
          )}

          {/* Contestants List */}
          <RetroBox
            title="Contestants in this Round"
            icon={<Vote className="h-5 w-5 drop-shadow-sm" />}
            iconColor="blue"
          >
            {data.entries.length === 0 ? (
              <Empty>No entries currently in this round.</Empty>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.entries.map((e) => (
                  <div key={e.id} className="retro-topic-row py-3 relative overflow-hidden">
                    {e.share !== null && (
                      <div
                        className="absolute inset-y-0 left-0 bg-sky-100/60 dark:bg-sky-900/20 rounded"
                        style={{ width: `${Math.min(100, e.share * 100)}%` }}
                      />
                    )}
                    <div className="relative z-10 flex items-start justify-between gap-3 w-full">
                      <div className="min-w-0">
                        <Link
                          href={`/entries/${e.id}`}
                          className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-sky-600 transition-colors"
                        >
                          {e.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {e.summary}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {[e.crew?.name, e.faction?.name].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 text-sm">
                        {e.share !== null ? (
                          <div className="tabular-nums font-mono font-bold text-sky-600 dark:text-sky-400">
                            {Math.round(e.share * 100)}%
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-mono">Tally at close</div>
                        )}
                        {data.status === "CLOSED" &&
                          (e.advanced ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Advanced
                            </span>
                          ) : (
                            <StatusBadge status={e.status} />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RetroBox>
        </div>
      )}
    </WorldPage>
  );
}

function BallotForm({ round }: { round: RoundView }) {
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const chosen = Object.entries(alloc).filter(([, v]) => v > 0);
  const total = chosen.reduce((s, [, v]) => s + v, 0);
  const cast = useWorldMutation(async () =>
    worldFetch(`/api/world/rounds/${round.id}/ballot`, {
      method: "POST",
      body: { allocations: chosen.map(([entryId, share]) => ({ entryId, share })) },
    })
  );

  const set = (id: string, v: number) => {
    setAlloc((a) => {
      const next = { ...a, [id]: v };
      const active = Object.entries(next).filter(([, x]) => x > 0);
      if (active.length > 3) delete next[id];
      return next;
    });
  };

  return (
    <RetroBox
      title="Cast Your Trust Ballot"
      icon={<Vote className="h-5 w-5 drop-shadow-sm" />}
      iconColor="blue"
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Your voting power this round: <b>{round.viewer.weight}</b>. Spread it across up to three entries. Stored encrypted on-chain, never revealed to entrants, and replaceable until the round closes.
          {round.viewer.voted ? " (You currently have a ballot in; submitting will update it)." : ""}
        </p>

        <div className="space-y-2 pt-1">
          {round.entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <input
                type="range"
                min={0}
                max={10}
                value={alloc[e.id] ?? 0}
                onChange={(ev) => set(e.id, Number(ev.target.value))}
                className="w-32 accent-sky-500 cursor-pointer"
              />
              <span className="w-12 tabular-nums font-mono font-bold text-sky-600 dark:text-sky-400">
                {total > 0 && (alloc[e.id] ?? 0) > 0
                  ? `${Math.round(((alloc[e.id] ?? 0) / total) * 100)}%`
                  : "0%"}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1">
                {e.title}
              </span>
            </div>
          ))}
        </div>

        {cast.error && <p className="text-xs text-red-600">{(cast.error as Error).message}</p>}
        {cast.isSuccess && <p className="text-xs text-emerald-600 font-bold">✓ Ballot sealed and encrypted successfully.</p>}

        <button
          className="retro-btn-blue text-xs px-4 py-2 font-bold flex items-center gap-1.5 mt-2"
          onClick={() => cast.mutate(undefined)}
          disabled={cast.isPending || chosen.length === 0}
        >
          <Vote className="h-3.5 w-3.5" />
          {cast.isPending ? "Sealing Ballot…" : "Seal Encrypted Ballot"}
        </button>
      </div>
    </RetroBox>
  );
}
