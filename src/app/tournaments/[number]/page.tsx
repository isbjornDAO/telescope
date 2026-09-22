"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Snowflake,
  Crown,
  Users,
  FileText,
  Landmark,
  Handshake,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import {
  WorldPage,
  RetroBox,
  Empty,
  ErrorBlock,
  SeasonStrip,
  StatusBadge,
  fmtDate,
  fmtDateTime,
} from "@/components/world/primitives";
import { TournamentDetailSkeleton } from "@/components/ui/retro-skeletons";
import { Bracket, type BracketRound } from "@/components/world/bracket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Entry {
  id: string;
  tournament: string;
  status: string;
  title: string;
  summary: string | null;
  blind?: boolean;
  isVictor?: boolean;
  eliminatedRound?: number | null;
  crew?: { name: string; slug: string; region?: { name: string; slug: string } | null } | null;
  faction?: { name: string; slug: string } | null;
  region?: { name: string; slug: string } | null;
  author?: string;
  feedback: number;
  url?: string | null;
  mine?: boolean;
}

interface SeasonView {
  number: number;
  name: string;
  theme: string;
  researchQuestion: string;
  startsAt: string;
  submissionsClose: string;
  endsAt: string;
  retentionCheckAt: string | null;
  status: string;
  phase: string;
  week: number;
  weeks: number;
  poolAmount: number;
  sponsors: string[];
  panel: { name: string; handle: string | null; region: { name: string; slug: string } | null }[];
  reviewerPoolSize: number;
  rounds: BracketRound[];
  entries: Entry[];
  alliances: { id: string; name: string; factions: { name: string; slug: string }[] }[];
  victor: Entry | null;
}

export default function SeasonPage() {
  const { number } = useParams();
  const { data, isLoading, error } = useWorldQuery<SeasonView>(
    ["season", number],
    `/api/world/seasons/${number}`
  );

  return (
    <WorldPage wide>
      {isLoading && <TournamentDetailSkeleton />}
      {error && <ErrorBlock error={error} />}

      {data && (
        <div className="space-y-6">
          {/* ── Season Hero Panorama Box (Retro Style) ── */}
          <div className="retro-box overflow-hidden shadow-sm">
            <div className="retro-profile-cover flex flex-col justify-between p-5 sm:p-6 text-white min-h-[190px]">
              {/* Back navigation & Phase Pill */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <Link
                  href="/tournaments"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All Tournaments
                </Link>

                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Snowflake className="h-3 w-3 text-sky-200" />
                    {data.name} · {data.phase}
                  </span>
                </div>
              </div>

              {/* Title & Action */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                <div className="max-w-3xl">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                    {data.theme}
                  </h1>
                  <p className="text-xs sm:text-sm text-sky-100/90 mt-1 drop-shadow-sm font-medium">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px] mr-1.5 bg-sky-950/50 px-1.5 py-0.5 rounded">
                      Research Question
                    </span>
                    {data.researchQuestion}
                  </p>
                </div>

                {data.phase === "building" && (
                  <Link href={`/tournaments/${data.number}/enter`} className="shrink-0">
                    <button className="retro-btn-blue text-sm px-4 py-2 font-bold shadow-lg flex items-center gap-2">
                      Enter Tournament
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Timeline & Subtitle Strip */}
            <div className="bg-[#F3F3F3] dark:bg-[#1f1f23] p-3 px-5 border-t border-[#C8C8C8] dark:border-[#38383e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-3 flex-wrap font-mono text-[11px]">
                <span>Close: {fmtDateTime(data.submissionsClose)}</span>
                <span>·</span>
                <span>Finals: {fmtDate(data.endsAt)}</span>
                {data.poolAmount ? (
                  <>
                    <span>·</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      Pool: ${data.poolAmount.toLocaleString()} USDC
                    </span>
                  </>
                ) : null}
              </div>
              <div className="w-full sm:w-48">
                <SeasonStrip week={data.week} weeks={data.weeks} phase={data.phase} />
              </div>
            </div>
          </div>

          {/* ── 4-Cell Metric Counters Strip ── */}
          <div className="retro-stat-counters grid-cols-2 sm:grid-cols-4">
            <div className="p-1">
              <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                Week {Math.max(0, data.week)} of {data.weeks}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Timeline Progress
              </div>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
              <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {data.entries.filter((e) => e.tournament === "GTM").length} Products
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                GTM Shipped
              </div>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {data.panel.length} Elders
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Local Systems Panel
              </div>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
              <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {data.reviewerPoolSize} Reviewers
              </div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Blind Research Pool
              </div>
            </div>
          </div>

          {/* ── Victor Crown Box (If Champion Decided) ── */}
          {data.victor && (
            <RetroBox
              title="Tournament Champion · Victor of Avalanche"
              icon={<Crown className="h-5 w-5 drop-shadow-sm text-amber-500" />}
              iconColor="gold"
              className="border-amber-300 dark:border-amber-700/60"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-600 font-bold">
                    Crowned in {data.name}
                  </div>
                  <Link
                    href={`/entries/${data.victor.id}`}
                    className="text-xl font-bold hover:underline text-zinc-900 dark:text-zinc-100"
                  >
                    👑 {data.victor.title}
                  </Link>
                  {data.victor.crew && (
                    <span className="text-sm text-muted-foreground ml-2">
                      by {data.victor.crew.name}
                    </span>
                  )}
                </div>
                <Link href={`/entries/${data.victor.id}`}>
                  <button className="retro-btn-blue text-xs px-3 py-1.5 font-bold">
                    Inspect Winning Entry →
                  </button>
                </Link>
              </div>
            </RetroBox>
          )}

          {/* ── Tabs Navigation & Arena Arenas ── */}
          <Tabs defaultValue="gtm" className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
                <TabsTrigger value="gtm" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-sky-600 shadow-xs">
                  <Users className="h-3.5 w-3.5 text-sky-500" />
                  GTM Bracket
                </TabsTrigger>
                <TabsTrigger value="ls" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-amber-600 shadow-xs">
                  <Landmark className="h-3.5 w-3.5 text-amber-500" />
                  Local Systems
                </TabsTrigger>
                <TabsTrigger value="rp" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-purple-600 shadow-xs">
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                  Research Papers
                </TabsTrigger>
                <TabsTrigger value="alliances" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 shadow-xs">
                  <Handshake className="h-3.5 w-3.5 text-zinc-500" />
                  Alliances ({data.alliances.length})
                </TabsTrigger>
              </TabsList>

              {data.phase === "building" && (
                <Link href={`/tournaments/${data.number}/enter`}>
                  <button className="retro-btn-green text-xs px-3 py-1.5 font-bold">
                    + Submit Entry
                  </button>
                </Link>
              )}
            </div>

            {/* ── GTM TRACK ── */}
            <TabsContent value="gtm" className="space-y-6 mt-4">
              {/* Bracket Box */}
              <RetroBox
                title="The Knockout Bracket"
                icon={<Trophy className="h-5 w-5 drop-shadow-sm" />}
                iconColor="blue"
                actions={
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Majority & threshold elimination
                  </span>
                }
              >
                <div className="mb-3 text-xs text-muted-foreground">
                  Everyone above the threshold advances. Ballots are encrypted and weighted by trust standing; tally is verified on-chain.
                </div>
                <Bracket
                  rounds={data.rounds}
                  entries={data.entries.filter((e) => e.tournament === "GTM")}
                />
              </RetroBox>

              {/* Competing Entries Grid */}
              <RetroBox
                title="Competing Products"
                icon={<Users className="h-5 w-5 drop-shadow-sm" />}
                iconColor="slate"
              >
                <EntryList
                  entries={data.entries.filter((e) => e.tournament === "GTM")}
                  empty="No products entered yet. Crews are the unit that enters GTM."
                />
              </RetroBox>
            </TabsContent>

            {/* ── LOCAL SYSTEMS TRACK ── */}
            <TabsContent value="ls" className="space-y-6 mt-4">
              <RetroBox
                title="The Judging Panel"
                icon={<Landmark className="h-5 w-5 drop-shadow-sm" />}
                iconColor="gold"
                actions={
                  <span className="text-[11px] text-muted-foreground font-mono">
                    60% Approval Threshold
                  </span>
                }
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Judged by a published panel of Elders. Entries argue design quality, local governance, and ethics out loud.
                </p>
                {data.panel.length === 0 ? (
                  <Empty>Panel not yet published for this season.</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.panel.map((p) => (
                      <span
                        key={p.name}
                        className="retro-profile-tag"
                      >
                        {p.handle ? (
                          <Link href={`/profile/${p.handle}`} className="hover:underline">
                            {p.name}
                          </Link>
                        ) : (
                          p.name
                        )}
                        {p.region && (
                          <span className="text-muted-foreground"> · {p.region.name}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <RoundList rounds={data.rounds.filter((r) => r.tournament === "LOCAL_SYSTEMS")} />
                </div>
              </RetroBox>

              <RetroBox
                title="Local Systems Designs"
                icon={<Landmark className="h-5 w-5 drop-shadow-sm" />}
                iconColor="slate"
              >
                <EntryList
                  entries={data.entries.filter((e) => e.tournament === "LOCAL_SYSTEMS")}
                  empty="No designs entered yet. Local Systems is where non-developers compete."
                />
              </RetroBox>
            </TabsContent>

            {/* ── RESEARCH PAPERS TRACK ── */}
            <TabsContent value="rp" className="space-y-6 mt-4">
              <RetroBox
                title="Double-Blind Peer Review"
                icon={<FileText className="h-5 w-5 drop-shadow-sm" />}
                iconColor="purple"
                actions={
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Anti-Clout Protocol
                  </span>
                }
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Submissions remain completely private until the close of the season. Reviewers see the paper, never the author.
                </p>
                <RoundList rounds={data.rounds.filter((r) => r.tournament === "RESEARCH_PAPERS")} />
              </RetroBox>

              <RetroBox
                title="Research Submissions"
                icon={<FileText className="h-5 w-5 drop-shadow-sm" />}
                iconColor="slate"
              >
                <EntryList
                  entries={data.entries.filter((e) => e.tournament === "RESEARCH_PAPERS")}
                  empty="No papers yet. Winning papers become next season's Local Systems briefs."
                />
              </RetroBox>
            </TabsContent>

            {/* ── ALLIANCES TRACK ── */}
            <TabsContent value="alliances" className="mt-4">
              <RetroBox
                title="Registered Team Alliances"
                icon={<Handshake className="h-5 w-5 drop-shadow-sm" />}
                iconColor="slate"
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Teams and factions can register mutual alliances to share treasury standing and rewards.
                </p>
                {data.alliances.length === 0 ? (
                  <Empty>No alliances registered this season.</Empty>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.alliances.map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {a.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {a.factions.map((f, i) => (
                            <span key={f.slug}>
                              {i > 0 ? " + " : ""}
                              <span className="retro-profile-tag">{f.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </RetroBox>
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
    <div className="space-y-1.5">
      {rounds.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs"
        >
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {r.name}
            <span className="text-muted-foreground font-normal ml-2 font-mono text-[11px]">
              {fmtDateTime(r.opensAt)} → {fmtDateTime(r.closesAt)}
            </span>
          </span>
          <span className="font-mono text-[11px] capitalize text-muted-foreground">
            {r.status.toLowerCase()}
            {r.status === "CLOSED" ? ` · ${r.advancedIds.length} advanced` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function EntryList({ entries, empty }: { entries: Entry[]; empty: string }) {
  if (entries.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="grid md:grid-cols-2 gap-3.5">
      {entries.map((e) => (
        <Link
          key={e.id}
          href={`/entries/${e.id}`}
          className="retro-box p-3.5 hover:border-sky-400 hover:shadow-sm transition-all duration-150 block group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 transition-colors">
              {e.isVictor ? "👑 " : ""}
              {e.title}
            </div>
            <StatusBadge status={e.status} />
          </div>

          {!e.blind && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {e.summary}
            </p>
          )}

          <div className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-1">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {e.blind
                ? "Authorship revealed at season close"
                : [e.crew?.name, e.faction?.name, e.region?.name, e.author]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
            {e.feedback ? (
              <span className="retro-profile-tag text-[10px]">
                💬 {e.feedback}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
