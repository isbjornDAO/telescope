"use client";

import Link from "next/link";
import { Snowflake, Crown } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { WorldPage, Frost, Empty, LoadingBlock, ErrorBlock, SeasonStrip, fmtDate } from "@/components/world/primitives";

interface SeasonRow { number: number; name: string; theme: string; researchQuestion: string; startsAt: string; submissionsClose: string; endsAt: string; status: string; phase: string; week: number; entries: number; poolAmount: number; sponsors: string[]; victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null }

export default function SeasonsPage() {
  const { data, isLoading, error } = useWorldQuery<SeasonRow[]>(["seasons"], "/api/world/seasons");
  return (
    <WorldPage title="Seasons" subtitle="Two winters a year, six weeks each. Three tournaments at once: Local Systems (a panel of Elders), Research Papers (blind review), GTM (community vote weighted by trust). What you win is standing that compounds.">
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && data.length === 0 && <Empty>The first winter is being prepared. Scouts keep running between seasons.</Empty>}
      <div className="space-y-4">
        {data?.map((s) => (
          <Frost key={s.number}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold flex items-center gap-1"><Snowflake className="h-3.5 w-3.5" /> {s.name} · {s.phase}</div>
                <Link href={`/seasons/${s.number}`} className="text-xl font-bold hover:underline">{s.theme}</Link>
                <p className="text-sm text-muted-foreground mt-1">{s.researchQuestion}</p>
                <p className="text-xs text-muted-foreground mt-1">{fmtDate(s.startsAt)} → {fmtDate(s.endsAt)} · {s.entries} entries{s.poolAmount ? ` · pool ${s.poolAmount}` : ""}{s.sponsors.length ? ` · ${s.sponsors.join(", ")}` : ""}</p>
              </div>
              {s.victor && <div className="text-sm shrink-0 flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /><Link href={`/entries/${s.victor.id}`} className="font-semibold hover:underline">{s.victor.title}</Link></div>}
            </div>
            <div className="mt-4"><SeasonStrip week={s.week} phase={s.phase} /></div>
          </Frost>
        ))}
      </div>
    </WorldPage>
  );
}
