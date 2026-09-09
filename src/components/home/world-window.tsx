"use client";

import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { SeasonStrip } from "@/components/world/primitives";

interface OverviewLite {
  season: { number: number; name: string; theme: string; researchQuestion: string; phase: string; week: number; weeks: number } | null;
  counts: { nodes: number; crews: number; factions: number; regions: number; vouches: number; activeIntents: number };
  victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null;
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-semibold tabular-nums leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5">{label}</div>
    </div>
  );
}

/** The world, compressed to a sidebar. The full map lives at /world. */
export function WorldWindow() {
  const { data } = useWorldQuery<OverviewLite>(["overview"], "/api/world/overview");
  if (!data) return null;

  return (
    <div className="panel p-6">
      {data.season ? (
        <>
          <p className="text-[11px] uppercase tracking-[0.14em] ink-accent font-semibold">
            {data.season.name} · {data.season.phase}
          </p>
          <h2 className="text-base font-semibold mt-2 leading-snug">{data.season.theme}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{data.season.researchQuestion}</p>
          <div className="mt-5">
            <SeasonStrip week={data.season.week} weeks={data.season.weeks} phase={data.season.phase} />
          </div>
          <Link
            href={`/seasons/${data.season.number}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium ink-accent hover:underline underline-offset-4"
          >
            Open the season <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </>
      ) : (
        <>
          <p className="text-[11px] uppercase tracking-[0.14em] ink-accent font-semibold">Before the first winter</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Telescope is a world, not a social network. The first season is being prepared. Scouts are already roaming.
          </p>
        </>
      )}

      <div className="h-px bg-[var(--hairline)] my-6" />

      <div className="grid grid-cols-3 gap-y-6 gap-x-3">
        <Figure label="Nodes" value={data.counts.nodes} />
        <Figure label="Crews" value={data.counts.crews} />
        <Figure label="Regions" value={data.counts.regions} />
        <Figure label="Vouches" value={data.counts.vouches} />
        <Figure label="Factions" value={data.counts.factions} />
        <Figure label="Scouting" value={data.counts.activeIntents} />
      </div>

      {data.victor && (
        <>
          <div className="h-px bg-[var(--hairline)] my-6" />
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} /> The Victor&apos;s seat
          </p>
          <Link href={`/entries/${data.victor.id}`} className="block text-sm font-semibold mt-2 hover:text-[var(--accent-ink)] transition-colors">
            {data.victor.title}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">by {data.victor.crew?.name ?? "a crew"}</p>
        </>
      )}

      <Link href="/world" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium ink-accent hover:underline underline-offset-4">
        See the whole world <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
