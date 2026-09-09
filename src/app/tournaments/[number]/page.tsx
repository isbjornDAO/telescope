"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Snowflake, Crown, Users, FileText, Landmark, Handshake } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, SeasonStrip, StatusBadge, fmtDate, fmtDateTime } from "@/components/world/primitives";
import { Bracket, type BracketRound } from "@/components/world/bracket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Entry { id: string; tournament: string; status: string; title: string; summary: string | null; blind?: boolean; isVictor?: boolean; eliminatedRound?: number | null; crew?: { name: string; slug: string; region?: { name: string; slug: string } | null } | null; faction?: { name: string; slug: string } | null; region?: { name: string; slug: string } | null; author?: string; feedback: number; url?: string | null; mine?: boolean }
interface SeasonView {
  number: number; name: string; theme: string; researchQuestion: string; startsAt: string; submissionsClose: string; endsAt: string; retentionCheckAt: string | null; status: string; phase: string; week: number; weeks: number; poolAmount: number; sponsors: string[];
  panel: { name: string; handle: string | null; region: { name: string; slug: string } | null }[]; reviewerPoolSize: number;
  rounds: BracketRound[]; entries: Entry[]; alliances: { id: string; name: string; factions: { name: string; slug: string }[] }[]; victor: Entry | null;
}

export default function SeasonPage() {
  const { number } = useParams();
  const { data, isLoading, error } = useWorldQuery<SeasonView>(["season", number], `/api/world/seasons/${number}`);
  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold flex items-center gap-1"><Snowflake className="h-3.5 w-3.5" /> {data.name} · {data.phase} · week {Math.max(0, data.week)}</div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.theme}</h1>
                <p className="text-sm text-muted-foreground mt-1"><b className="text-foreground">Research question:</b> {data.researchQuestion}</p>
                <p className="text-xs text-muted-foreground mt-1">Submissions close {fmtDateTime(data.submissionsClose)} · finals {fmtDate(data.endsAt)} · retention check {fmtDate(data.retentionCheckAt)}{data.poolAmount ? ` · pool ${data.poolAmount} (sponsor funded, Isbjorn takes nothing)` : ""}</p>
              </div>
              {data.phase === "building" && <Link href={`/tournaments/${data.number}/enter`}><Button className="snow-button">Enter a tournament</Button></Link>}
            </div>
            <div className="mt-4"><SeasonStrip week={data.week} weeks={data.weeks} phase={data.phase} /></div>
          </Frost>

          {data.victor && (
            <Frost className="border-amber-300/60">
              <div className="flex items-center gap-3"><Crown className="h-6 w-6 text-amber-500" /><div><div className="text-[11px] uppercase tracking-wider text-amber-600">Victor · best dapp on Avalanche, {data.name}</div><Link href={`/entries/${data.victor.id}`} className="text-xl font-bold hover:underline">{data.victor.title}</Link> <span className="text-sm text-muted-foreground">by {data.victor.crew?.name}</span></div></div>
            </Frost>
          )}

          <Tabs defaultValue="gtm">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="gtm"><Users className="h-3.5 w-3.5 mr-1" /> GTM</TabsTrigger>
              <TabsTrigger value="ls"><Landmark className="h-3.5 w-3.5 mr-1" /> Local Systems</TabsTrigger>
              <TabsTrigger value="rp"><FileText className="h-3.5 w-3.5 mr-1" /> Research Papers</TabsTrigger>
              <TabsTrigger value="alliances"><Handshake className="h-3.5 w-3.5 mr-1" /> Alliances</TabsTrigger>
            </TabsList>

            <TabsContent value="gtm" className="space-y-4 mt-4">
              <Frost>
                <SectionTitle>The bracket</SectionTitle>
                <p className="text-xs text-muted-foreground mb-3">Everyone above the line advances. Votes are private, the tally is public.</p>
                <Bracket rounds={data.rounds} entries={data.entries.filter((e) => e.tournament === "GTM")} />
              </Frost>
              <EntryList entries={data.entries.filter((e) => e.tournament === "GTM")} empty="No products entered yet. Crews are the unit that enters GTM." />
            </TabsContent>

            <TabsContent value="ls" className="space-y-4 mt-4">
              <Frost>
                <SectionTitle>The panel</SectionTitle>
                <p className="text-xs text-muted-foreground mb-2">Judged by a published panel. Advance on 60% approval.</p>
                {data.panel.length === 0 ? <Empty>Panel not yet published.</Empty> : <div className="flex flex-wrap gap-2">{data.panel.map((p) => <span key={p.name} className="text-xs rounded-full border px-2 py-0.5">{p.handle ? <Link href={`/profile/${p.handle}`} className="hover:underline">{p.name}</Link> : p.name}{p.region ? <span className="text-muted-foreground"> · {p.region.name}</span> : null}</span>)}</div>}
                <RoundList rounds={data.rounds.filter((r) => r.tournament === "LOCAL_SYSTEMS")} />
              </Frost>
              <EntryList entries={data.entries.filter((e) => e.tournament === "LOCAL_SYSTEMS")} empty="No designs yet. Local Systems is where non-developers compete and ethics are argued out loud." />
            </TabsContent>

            <TabsContent value="rp" className="space-y-4 mt-4">
              <Frost>
                <SectionTitle>Blind review</SectionTitle>
                <p className="text-xs text-muted-foreground mb-2">Private until the end. Reviewers see the paper, not the author.</p>
                <RoundList rounds={data.rounds.filter((r) => r.tournament === "RESEARCH_PAPERS")} />
              </Frost>
              <EntryList entries={data.entries.filter((e) => e.tournament === "RESEARCH_PAPERS")} empty="No papers yet. Winning papers become next season's Local Systems briefs." />
            </TabsContent>

            <TabsContent value="alliances" className="mt-4">
              <Frost>
                <SectionTitle>Registered alliances</SectionTitle>
                <p className="text-xs text-muted-foreground mb-2">Teams can enter together and share what they win.</p>
                {data.alliances.length === 0 && <Empty>None this season.</Empty>}
                <ul className="text-sm space-y-1">{data.alliances.map((a) => <li key={a.id}><b>{a.name}</b>: {a.factions.map((f, i) => <span key={f.slug}>{i > 0 ? " + " : ""}{f.name}</span>)}</li>)}</ul>
              </Frost>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </WorldPage>
  );
}

function RoundList({ rounds }: { rounds: BracketRound[] }) {
  if (rounds.length === 0) return null;
  return (
    <ul className="mt-3 text-xs space-y-1">
      {rounds.map((r) => (
        <li key={r.id} className="flex justify-between gap-2"><span><b>{r.name}</b> · {fmtDateTime(r.opensAt)} → {fmtDateTime(r.closesAt)}</span><span className="capitalize text-muted-foreground">{r.status.toLowerCase()}{r.status === "CLOSED" ? ` · ${r.advancedIds.length} advanced` : ""}</span></li>
      ))}
    </ul>
  );
}

function EntryList({ entries, empty }: { entries: Entry[]; empty: string }) {
  if (entries.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {entries.map((e) => (
        <Link key={e.id} href={`/entries/${e.id}`} className="frost rounded-xl p-4 hover:border-sky-400 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold">{e.isVictor ? "👑 " : ""}{e.title}</div>
            <StatusBadge status={e.status} />
          </div>
          {!e.blind && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.summary}</p>}
          <div className="text-xs text-muted-foreground mt-2">
            {e.blind ? "authorship revealed at season close" : [e.crew?.name, e.faction?.name, e.region?.name, e.author].filter(Boolean).join(" · ")}
            {e.feedback ? ` · ${e.feedback} feedback` : ""}
          </div>
        </Link>
      ))}
    </div>
  );
}
