"use client";

import Link from "next/link";
import {
  Trophy,
  Crown,
  Landmark,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
} from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import {
  WorldPage,
  RetroBox,
  fmtDate,
} from "@/components/world/primitives";

interface SeasonRow {
  number: number;
  name: string;
  theme: string;
  researchQuestion: string;
  startsAt: string;
  endsAt: string;
  status: string;
  phase: string;
  week: number;
  entries: number;
  poolAmount?: number;
  victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null;
}

const TOURNAMENT_TRACKS = [
  {
    id: "gtm",
    name: "GTM (Go-To-Market)",
    icon: Trophy,
    iconColor: "blue" as const,
    subtitle: "Avalanche C-Chain · Community Bracket",
    line: "Crews ship a working product on Avalanche. The community votes with trust-weighted ballots, and the bracket decides the Victor.",
    enabled: true,
    href: "/tournaments/1",
    statusBadge: "ACTIVE · SEASON 1",
    metricBadge: "4 Competing Crews",
    rewardHint: "Treasury Standing & Ecosystem Grants",
  },
  {
    id: "ls",
    name: "Local Systems",
    icon: Landmark,
    iconColor: "gold" as const,
    subtitle: "Governance & Ethics · Panel Review",
    line: "Design decentralized community initiatives without code. Evaluated by a published panel of Elders for architectural ethics.",
    enabled: false,
    href: "/tournaments/1?tab=ls",
    statusBadge: "COMING SOON",
    metricBadge: "Panel Appointed",
    rewardHint: "Foundation Grants & Adoption",
  },
  {
    id: "rp",
    name: "Research Papers",
    icon: FileText,
    iconColor: "purple" as const,
    subtitle: "Academic Track · Blind Peer Review",
    line: "Deep research advancing the seasonal research question. Double-blind review protects against clout; winners become next season's briefs.",
    enabled: false,
    href: "/tournaments/1?tab=rp",
    statusBadge: "COMING SOON",
    metricBadge: "18 Reviewers Ready",
    rewardHint: "Brief Publication & Citation",
  },
];

export default function TournamentsPage() {
  const { data, isLoading } = useWorldQuery<SeasonRow[]>(["seasons"], "/api/world/seasons");
  const live = data?.find((s) => s.phase === "building" || s.phase === "voting");
  const past = (data ?? []).filter((s) => s !== live);

  return (
    <WorldPage wide>
      <div className="space-y-6">
        {/* ── Panoramic Marquee Cover ── */}
        <div className="retro-box overflow-hidden shadow-sm">
          <div className="retro-profile-cover flex flex-col justify-end p-5 sm:p-6 text-white min-h-[170px]">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    Bi-Annual Tournament Circuit
                  </span>
                  {isLoading ? (
                    <span className="bg-white/20 backdrop-blur-sm text-transparent font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse inline-block w-32 h-5">
                      Loading...
                    </span>
                  ) : live ? (
                    <span className="bg-emerald-500/90 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider border border-emerald-400/40">
                      Live: {live.name} · {live.phase}
                    </span>
                  ) : null}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
                  Telescope Tournaments
                </h1>
                {isLoading ? (
                  <div className="h-4 bg-white/20 rounded animate-pulse w-80 max-w-full mt-2" />
                ) : (
                  <p className="text-sm text-sky-100/90 max-w-2xl mt-1 drop-shadow-sm line-clamp-2">
                    {live
                      ? live.theme
                      : "The competitive arena of isbjornDAO. Research, design, and ship on Avalanche."}
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="retro-btn-blue text-sm px-4 py-2 font-bold opacity-80 animate-pulse w-48 h-9 shrink-0" />
              ) : live ? (
                <Link href={`/tournaments/${live.number}`} className="shrink-0">
                  <button className="retro-btn-blue text-sm px-4 py-2 font-bold flex items-center gap-2 shadow-lg">
                    Enter Tournament Arena
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── 4-Cell Metric Counters Strip ── */}
        <div className="retro-stat-counters grid-cols-2 sm:grid-cols-4">
          <div className="p-1">
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {isLoading ? (
                <span className="inline-block w-16 h-5 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded my-0.5" />
              ) : (
                live?.name ?? "Winter I"
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Active Season
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
              {isLoading ? (
                <span className="inline-block w-20 h-5 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded my-0.5" />
              ) : (
                `$${(live?.poolAmount ?? 50000).toLocaleString()}`
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Prize Pool
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {isLoading ? (
                <span className="inline-block w-20 h-5 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded my-0.5" />
              ) : (
                `Week ${live?.week ?? 2} / 6`
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Phase: {isLoading ? "..." : live?.phase ?? "Building"}
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {isLoading ? (
                <span className="inline-block w-16 h-5 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded my-0.5" />
              ) : (
                `${live?.entries ?? 4} Competing`
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Tournament Entries
            </div>
          </div>
        </div>

        {/* ── Three Tournament Tracks Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-500" />
              <h2 className="text-xs uppercase tracking-wider font-bold text-zinc-700 dark:text-zinc-300">
                Seasonal Tournament Tracks
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              3 Disciplines · 3 Legitimacy Models
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TOURNAMENT_TRACKS.map(
              ({
                id,
                name,
                icon: Icon,
                subtitle,
                line,
                enabled,
                href,
                statusBadge,
                metricBadge,
                rewardHint,
              }) => (
                <div
                  key={id}
                  className={`retro-box flex flex-col justify-between transition-all duration-200 ${
                    enabled
                      ? "border-sky-400/70 hover:border-sky-500 hover:shadow-md ring-1 ring-sky-400/20"
                      : "opacity-90"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="retro-box-title justify-between px-3.5 sm:px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                          {name}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          enabled
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
                            : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                        }`}
                      >
                        {statusBadge}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                          {subtitle}
                        </span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                          {line}
                        </p>
                      </div>

                      {/* Tag strip */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="retro-profile-tag">
                          {metricBadge}
                        </span>
                        <span className="retro-profile-tag">
                          🏆 {rewardHint}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 pt-0">
                    {enabled ? (
                      <Link href={href} className="block w-full">
                        <button className="retro-btn-blue w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5">
                          Enter & View Bracket
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 text-xs font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                      >
                        Opens Next Season
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Compounding Flywheel Educational Box (Retro Style) ── */}
        <RetroBox
          title="The Faction Flywheel"
          icon={<ShieldCheck className="h-5 w-5 drop-shadow-sm" />}
          iconColor="slate"
        >
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p>
              Telescope tournaments run in a self-reinforcing arc designed to turn ephemeral crews into lasting on-chain institutions:
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <div className="retro-subtitle p-3 space-y-1">
                <div className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-mono">1</span>
                  Season I · Research
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A faction submits a peer-reviewed research paper on the seasonal question.
                </p>
              </div>

              <div className="retro-subtitle p-3 space-y-1">
                <div className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-mono">2</span>
                  Season II · Design
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The approved paper becomes the brief for a Local Systems governance & ethical blueprint.
                </p>
              </div>

              <div className="retro-subtitle p-3 space-y-1">
                <div className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[10px] font-mono">3</span>
                  Season III · Ship (GTM)
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The design is coded into a functional dapp on Avalanche and entered into the community bracket.
                </p>
              </div>
            </div>
          </div>
        </RetroBox>

        {/* ── Past Seasons & Victor Hall of Fame ── */}
        {past.length > 0 && (
          <RetroBox
            title="Past Seasons & Hall of Fame"
            icon={<Award className="h-5 w-5 drop-shadow-sm" />}
            iconColor="gold"
          >
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {past.map((s) => (
                <Link
                  key={s.number}
                  href={`/tournaments/${s.number}`}
                  className="retro-topic-row block hover:no-underline group"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 transition-colors truncate">
                      {s.theme}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(s.startsAt)}
                      </span>
                      <span>·</span>
                      <span>{s.entries} entries</span>
                    </div>
                  </div>

                  {s.victor && (
                    <div className="flex items-center gap-2 shrink-0 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded text-xs">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-bold text-amber-900 dark:text-amber-200 truncate max-w-[14rem]">
                        {s.victor.title}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </RetroBox>
        )}
      </div>
    </WorldPage>
  );
}
