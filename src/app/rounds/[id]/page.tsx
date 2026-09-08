"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Vote, Lock, ShieldCheck } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, StatusBadge, fmtDateTime } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";

interface RoundView {
  id: string; season: { number: number; name: string }; tournament: string; index: number; name: string; threshold: number; opensAt: string; closesAt: string; status: string; ballotCount: number; totalWeight: number | null; tallyHash: string | null;
  entries: { id: string; title: string; summary: string; url: string | null; crew: { name: string; slug: string } | null; faction: { name: string; slug: string } | null; status: string; weight: number | null; share: number | null; advanced: boolean }[];
  viewer: { canVote: boolean; weight: number; voted: boolean; reason: string | null };
}

export default function RoundPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useWorldQuery<RoundView>(["round", id], `/api/world/rounds/${id}`);
  const { data: tally } = useWorldQuery<{ verifies: boolean; tallyHash: string | null }>(["tally", id], data?.status === "CLOSED" ? `/api/world/rounds/${id}/tally` : null);
  return (
    <WorldPage>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold"><Link href={`/seasons/${data.season.number}`} className="hover:underline">{data.season.name}</Link> · {data.tournament} · round {data.index}</div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Advance if ≥ {Math.round(data.threshold * 100)}% of weighted votes cast{data.threshold >= 0.5 ? " (majority)" : ""} · {fmtDateTime(data.opensAt)} → {fmtDateTime(data.closesAt)} · <span className="capitalize">{data.status.toLowerCase()}</span> · {data.ballotCount} ballots</p>
            {data.status === "CLOSED" && (
              <p className="text-xs mt-2 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Tally published with commitment <code className="font-mono">{data.tallyHash?.slice(0, 16)}…</code>{tally ? (tally.verifies ? " · verifies" : " · MISMATCH") : ""} · total weight {data.totalWeight}</p>
            )}
          </Frost>

          {data.tournament === "GTM" && data.status === "OPEN" && (
            <WorldGate message="Sign in to vote.">
              {data.viewer.canVote ? <BallotForm round={data} /> : <Frost className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> {data.viewer.reason ?? "You cannot vote in this round."}</Frost>}
            </WorldGate>
          )}

          <Frost>
            <SectionTitle icon={<Vote className="h-4 w-4 text-sky-500" />}>Entries in this round</SectionTitle>
            {data.entries.length === 0 && <Empty>Nobody here.</Empty>}
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {data.entries.map((e) => (
                <li key={e.id} className="py-3 relative overflow-hidden">
                  {e.share !== null && <div className="absolute inset-y-0 left-0 bg-sky-100/60 dark:bg-sky-900/20 rounded" style={{ width: `${Math.min(100, e.share * 100)}%` }} />}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.title}</Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">{e.summary}</p>
                      <p className="text-xs text-muted-foreground">{[e.crew?.name, e.faction?.name].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="text-right shrink-0 text-sm">
                      {e.share !== null ? <div className="tabular-nums font-semibold">{Math.round(e.share * 100)}%</div> : <div className="text-xs text-muted-foreground">tally at close</div>}
                      {data.status === "CLOSED" && (e.advanced ? <span className="text-[11px] text-emerald-600">advanced</span> : <StatusBadge status={e.status} />)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Frost>
        </div>
      )}
    </WorldPage>
  );
}

function BallotForm({ round }: { round: RoundView }) {
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const chosen = Object.entries(alloc).filter(([, v]) => v > 0);
  const total = chosen.reduce((s, [, v]) => s + v, 0);
  const cast = useWorldMutation(async () => worldFetch(`/api/world/rounds/${round.id}/ballot`, { method: "POST", body: { allocations: chosen.map(([entryId, share]) => ({ entryId, share })) } }));
  const set = (id: string, v: number) => {
    setAlloc((a) => {
      const next = { ...a, [id]: v };
      const active = Object.entries(next).filter(([, x]) => x > 0);
      if (active.length > 3) delete next[id];
      return next;
    });
  };
  return (
    <Frost>
      <SectionTitle icon={<Vote className="h-4 w-4 text-sky-500" />}>Your ballot</SectionTitle>
      <p className="text-xs text-muted-foreground mb-3">Your weight this round: <b>{round.viewer.weight}</b>. Spread it across up to three entries. Stored encrypted, never shown to entrants, replaceable until the round closes.{round.viewer.voted ? " You have a ballot in; submitting replaces it." : ""}</p>
      <ul className="space-y-2">
        {round.entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 text-sm">
            <input type="range" min={0} max={10} value={alloc[e.id] ?? 0} onChange={(ev) => set(e.id, Number(ev.target.value))} className="w-32 accent-sky-500" />
            <span className="w-10 tabular-nums text-xs text-muted-foreground">{total > 0 && (alloc[e.id] ?? 0) > 0 ? `${Math.round(((alloc[e.id] ?? 0) / total) * 100)}%` : ""}</span>
            <span className="truncate">{e.title}</span>
          </li>
        ))}
      </ul>
      {cast.error && <p className="text-xs text-red-600 mt-2">{(cast.error as Error).message}</p>}
      {cast.isSuccess && <p className="text-xs text-emerald-600 mt-2">Ballot sealed.</p>}
      <Button className="snow-button mt-3" onClick={() => cast.mutate(undefined)} disabled={cast.isPending || chosen.length === 0}>Seal ballot</Button>
    </Frost>
  );
}
