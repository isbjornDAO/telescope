"use client";

import Link from "next/link";
import {
  Trophy,
  Crown,
  Landmark,
  FileText,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  Snowflake,
} from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { RetroBox, fmtDate } from "@/components/world/primitives";
import { BuildPageShell } from "@/components/build/build-page-shell";

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

interface Journey {
  id: string;
  name: string;
  story: string;
  howItMaps: string;
}

const TOURNAMENT_TRACKS = [
  {
    id: "gtm",
    name: "GTM (Go-To-Market)",
    icon: Trophy,
    subtitle: "Ship a working tool · Community Bracket",
    line: "Crews ship a working product. Default settlement is Avalanche; tools may also land on Chainlink, Midnight, or elsewhere. The community votes with trust-weighted ballots.",
    enabled: true,
    href: "/tournaments",
    statusBadge: "OPEN",
    metricBadge: "Community bracket",
    rewardHint: "Standing, treasury & ecosystem programmes",
  },
  {
    id: "ls",
    name: "Local Systems",
    icon: Landmark,
    subtitle: "Governance & Ethics · Panel Review",
    line: "Design decentralized community initiatives without code. Evaluated by a published panel of Elders for architectural ethics.",
    enabled: false,
    href: "/tournaments",
    statusBadge: "COMING SOON",
    metricBadge: "Elder panel",
    rewardHint: "Foundation Grants & Adoption",
  },
  {
    id: "rp",
    name: "Research Papers",
    icon: FileText,
    subtitle: "Continuous bounties · Blind Peer Review",
    line: "Essay-style research events with deadlines and prizes. Lives on the Research tab; winners become tournament briefs and a citable archive.",
    enabled: true,
    href: "/research",
    statusBadge: "ON RESEARCH",
    metricBadge: "Paper archive",
    rewardHint: "Bounty, publication & citation",
  },
];

export default function TournamentsPage() {
  const { data } = useWorldQuery<SeasonRow[]>(["seasons"], "/api/world/seasons");
  const { data: journeys } = useWorldQuery<Journey[]>(["conservation"], "/api/world/conservation");
  const live = data?.find((s) => s.phase === "building" || s.phase === "voting");
  const past = (data ?? []).filter((s) => s !== live);
  const journey = journeys?.[0] ?? null;

  return (
    <BuildPageShell
      eyebrow="Seasonal competitive circuit"
      title="Tournaments"
      description={
        live?.theme ||
        "Research, design, and ship tools for governance, finance, and the planet. Every circuit leads to an Arctic conservation journey."
      }
      actions={
        live ? (
          <Link href={`/tournaments/${live.number}`}>
            <button className="retro-btn-blue text-sm px-4 py-2 font-bold flex items-center gap-2">
              Enter arena
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        ) : null
      }
    >
      {live && (
        <div className="retro-stat-counters grid-cols-2 sm:grid-cols-4">
          <div className="p-1">
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {live.name}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Active Season
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
              {live.poolAmount != null ? `$${live.poolAmount.toLocaleString()}` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Prize Pool
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              Week {live.week} / 6
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Phase: {live.phase}
            </div>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-700 p-1">
            <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {live.entries} entries
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Tournament Entries
            </div>
          </div>
        </div>
      )}

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

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {subtitle}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                        {line}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="retro-profile-tag">{metricBadge}</span>
                      <span className="retro-profile-tag">{rewardHint}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  {enabled ? (
                    <Link
                      href={id === "gtm" && live ? `/tournaments/${live.number}` : href}
                      className="block w-full"
                    >
                      <button className="retro-btn-blue w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5">
                        {id === "rp" ? "Open Research" : "Enter & View Bracket"}
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

      <RetroBox
        title="Arctic conservation journey"
        icon={<Snowflake className="h-4 w-4" />}
        iconColor="slate"
      >
        {journey ? (
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{journey.name}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{journey.story}</p>
            <p className="text-[11px] text-muted-foreground border-t border-zinc-200 dark:border-zinc-700 pt-2">
              How this circuit maps: {journey.howItMaps}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Every tournament leads toward polar bear and Arctic conservation journeys.
            Team1 funds prizes; the tools inspired by research become real infrastructure.
          </p>
        )}
      </RetroBox>

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
                The design becomes a working tool — default Avalanche, also Chainlink, Midnight, or elsewhere — and enters the community bracket.
              </p>
            </div>
          </div>
        </div>
      </RetroBox>

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
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
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
    </BuildPageShell>
  );
}
