"use client";

import Link from "next/link";
import { Trophy, Crown } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { WorldPage, Frost, Empty, LoadingBlock, ErrorBlock, fmtDate } from "@/components/world/primitives";

interface SeasonRow {
  number: number; name: string; theme: string; researchQuestion: string;
  startsAt: string; endsAt: string; status: string; phase: string; week: number; entries: number;
  victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null;
}

export default function TournamentsPage() {
  const { data, isLoading, error } = useWorldQuery<SeasonRow[]>(["seasons"], "/api/world/seasons");
  const live = data?.find((s) => s.phase === "building" || s.phase === "voting");
  const past = (data ?? []).filter((s) => s !== live);

  return (
    <WorldPage title="Tournaments">
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && data.length === 0 && <Empty>No tournament running yet.</Empty>}

      {live && (
        <Link href={`/tournaments/${live.number}`} className="block">
          <Frost className="hover:border-sky-400 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold">Running now</div>
                <h2 className="text-2xl font-bold mt-1">{live.theme}</h2>
                <p className="text-sm text-muted-foreground mt-1">{live.entries} entries · ends {fmtDate(live.endsAt)}</p>
              </div>
              <Trophy className="h-8 w-8 text-sky-500 flex-shrink-0" />
            </div>
          </Frost>
        </Link>
      )}

      {past.length > 0 && (
        <div className="mt-6 space-y-2">
          {past.map((s) => (
            <Link key={s.number} href={`/tournaments/${s.number}`} className="frost rounded-xl p-4 flex items-center justify-between gap-3 hover:border-sky-400 transition-colors">
              <div className="min-w-0">
                <div className="font-semibold truncate">{s.theme}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(s.startsAt)} · {s.entries} entries</div>
              </div>
              {s.victor && (
                <div className="text-sm flex items-center gap-1.5 flex-shrink-0">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="font-medium truncate max-w-[12rem]">{s.victor.title}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </WorldPage>
  );
}
