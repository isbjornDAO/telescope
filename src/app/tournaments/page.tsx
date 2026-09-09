"use client";

import Link from "next/link";
import { Trophy, Crown, Users, Landmark, FileText } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { WorldPage, Frost, fmtDate } from "@/components/world/primitives";

interface SeasonRow {
  number: number; name: string; theme: string; researchQuestion: string;
  startsAt: string; endsAt: string; status: string; phase: string; week: number; entries: number;
  victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null;
}

/** The three tournaments a season runs. One line each — the rules live in docs/. */
const TOURNAMENTS = [
  { name: "GTM", icon: Users, line: "Crews ship a product. Everyone votes, the bracket decides." },
  { name: "Local Systems", icon: Landmark, line: "Design without code. A published panel judges." },
  { name: "Research Papers", icon: FileText, line: "Write it up. Reviewers see the paper, never the author." },
];

export default function TournamentsPage() {
  const { data } = useWorldQuery<SeasonRow[]>(["seasons"], "/api/world/seasons");
  const live = data?.find((s) => s.phase === "building" || s.phase === "voting");
  const past = (data ?? []).filter((s) => s !== live);

  return (
    <WorldPage title="Tournaments">
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

      {/* The three tournaments are the page until a season opens. They are
          static, so a slow or failing season list never blanks them out. */}
      {!live && (
        <div className="grid gap-3 sm:grid-cols-3">
          {TOURNAMENTS.map(({ name, icon: Icon, line }) => (
            <Frost key={name} className="flex flex-col gap-2">
              <Icon className="h-5 w-5 text-sky-500" />
              <div className="font-semibold">{name}</div>
              <p className="text-sm text-muted-foreground flex-1">{line}</p>
              <span className="inline-flex self-start rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-semibold text-muted-foreground">
                Coming soon
              </span>
            </Frost>
          ))}
        </div>
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
