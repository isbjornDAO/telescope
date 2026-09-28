"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  FileText,
  Trophy,
  Kanban,
  MessageSquare,
  Snowflake,
  Sparkles,
  Clock,
} from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { useTrendingThreads } from "@/hooks/use-forum";
import { Countdown } from "@/components/countdown";
import { RetroBox } from "@/components/world/primitives";
import { cn } from "@/lib/utils";

interface LiveResearch {
  id: string;
  number: number;
  question: string;
  bounty: string;
  deadline: string;
  minWordCount: number;
  status: string;
  entries?: number;
}

interface SeasonRow {
  number: number;
  name: string;
  theme: string;
  researchQuestion: string;
  phase: string;
  status: string;
}

interface Journey {
  id: string;
  slug: string;
  name: string;
  story: string;
  howItMaps: string;
}

interface BoardProject {
  id: string;
  title: string;
  summary: string;
  categoryLabel: string;
  columnLabel: string;
  column: string;
  owner: { handle: string | null; address: string };
  crew: { name: string; slug: string } | null;
  updatedAt: string;
}

interface BoardPayload {
  projects: BoardProject[];
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-md bg-zinc-100 dark:bg-zinc-800/80 animate-pulse"
        />
      ))}
    </div>
  );
}

/**
 * Homepage: short thesis, then live activity you can act on —
 * forum threads, projects on the board, research and seasons.
 */
export function HomeVision() {
  const { data: liveResearch, isLoading: researchLoading } =
    useWorldQuery<LiveResearch | null>(
      ["research", "live"],
      "/api/world/research/live"
    );
  const { data: seasons, isLoading: seasonsLoading } = useWorldQuery<
    SeasonRow[]
  >(["seasons"], "/api/world/seasons");
  const { data: journeys } = useWorldQuery<Journey[]>(
    ["conservation"],
    "/api/world/conservation"
  );
  const { data: board, isLoading: projectsLoading } =
    useWorldQuery<BoardPayload>(
      ["builder-projects"],
      "/api/world/builder-projects"
    );
  const { data: trending = [], isLoading: threadsLoading } =
    useTrendingThreads();

  const liveSeason = seasons?.find(
    (s) => s.phase === "building" || s.phase === "voting"
  );
  const journey = journeys?.[0] ?? null;
  const latestProjects = (board?.projects ?? []).slice(0, 5);
  const latestThreads = trending.slice(0, 6);

  return (
    <div className="w-full relative z-10 mb-8 space-y-6">
      {/* Compact hero */}
      <div className="retro-box overflow-hidden shadow-sm">
        <div className="retro-profile-cover flex flex-col justify-end p-5 sm:p-7 text-white min-h-[160px] sm:min-h-[180px]">
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Discover stars
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              Find who is building — and what is worth building next
            </h1>
            <p className="text-sm text-sky-100/95 max-w-xl drop-shadow-sm leading-relaxed">
              Isbjorn&apos;s discovery world for research, projects, and
              tournaments — in service of polar bear and Arctic conservation.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/forum">
                <button className="retro-btn-blue inline-flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Join the conversation
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/projects">
                <button className="retro-btn-secondary inline-flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  See who&apos;s building
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main: live activity */}
        <div className="lg:col-span-8 space-y-6">
          <RetroBox
            title="From the forum"
            icon={<MessageSquare className="h-4 w-4" />}
            iconColor="blue"
            actions={
              <Link
                href="/forum"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
              >
                Open forum <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {threadsLoading ? (
              <ListSkeleton rows={4} />
            ) : latestThreads.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No threads yet. Start the first conversation.
                </p>
                <Link href="/forum">
                  <button className="retro-btn retro-btn-green px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    Post in the forum
                  </button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {latestThreads.map((thread) => {
                  const preview = thread.posts?.[0]?.comment ?? "";
                  return (
                    <li key={thread.id}>
                      <Link
                        href={`/forum/thread/${thread.id}`}
                        className="flex gap-3 px-3.5 sm:px-4 py-3 hover:bg-sky-50/60 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              /{thread.boardName}/
                            </span>
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(thread.bumpedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {thread.subject || "Untitled thread"}
                          </p>
                          {preview ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {preview}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 self-center retro-comments-badge text-zinc-700 dark:text-zinc-200">
                          {thread.replyCount}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </RetroBox>

          <RetroBox
            title="On the board"
            icon={<Kanban className="h-4 w-4" />}
            iconColor="blue"
            actions={
              <Link
                href="/projects"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
              >
                Full board <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {projectsLoading ? (
              <ListSkeleton rows={3} />
            ) : latestProjects.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nobody has pinned a project yet. Be the first.
                </p>
                <Link href="/projects">
                  <button className="retro-btn retro-btn-green px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    Pin your project
                  </button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {latestProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href="/projects"
                      className="flex flex-col sm:flex-row sm:items-center gap-2 px-3.5 sm:px-4 py-3 hover:bg-sky-50/60 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {project.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {project.summary}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {project.crew?.name ||
                            project.owner.handle ||
                            shortAddress(project.owner.address)}
                          {" · "}
                          {project.categoryLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 self-start sm:self-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                          project.column === "SHIPPING"
                            ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                            : project.column === "BUILDING"
                              ? "border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300"
                              : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                        )}
                      >
                        {project.columnLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </RetroBox>
        </div>

        {/* Side: discord, live activity, shortcuts */}
        <div className="lg:col-span-4 space-y-4">
          <Countdown />

          {(researchLoading || seasonsLoading || liveResearch || liveSeason) && (
            <RetroBox
              title="Live now"
              icon={<Sparkles className="h-4 w-4" />}
              iconColor="gold"
              contentClassName="!p-0"
            >
              {researchLoading || seasonsLoading ? (
                <ListSkeleton rows={2} />
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {liveResearch ? (
                    <li>
                      <Link
                        href="/research"
                        className="block px-3.5 sm:px-4 py-3 hover:bg-sky-50/60 dark:hover:bg-zinc-800/50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                            Research bounty #{liveResearch.number}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                          {liveResearch.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {liveResearch.bounty}
                          {" · "}
                          Due{" "}
                          {new Date(liveResearch.deadline).toLocaleDateString()}
                          {typeof liveResearch.entries === "number"
                            ? ` · ${liveResearch.entries} entries`
                            : ""}
                        </p>
                      </Link>
                    </li>
                  ) : null}

                  {liveSeason ? (
                    <li>
                      <Link
                        href={`/tournaments/${liveSeason.number}`}
                        className="block px-3.5 sm:px-4 py-3 hover:bg-sky-50/60 dark:hover:bg-zinc-800/50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {liveSeason.name} · {liveSeason.phase}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                          {liveSeason.theme || liveSeason.researchQuestion}
                        </p>
                      </Link>
                    </li>
                  ) : null}
                </ul>
              )}
            </RetroBox>
          )}

          <RetroBox
            title="Explore"
            icon={<Kanban className="h-4 w-4" />}
            iconColor="blue"
            contentClassName="!p-0"
          >
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[
                {
                  href: "/research",
                  icon: FileText,
                  label: "Research",
                  hint: "Bounties and paper archive",
                },
                {
                  href: "/projects",
                  icon: Kanban,
                  label: "Projects",
                  hint: "Public board of work in motion",
                },
                {
                  href: "/tournaments",
                  icon: Trophy,
                  label: "Tournaments",
                  hint: "Local Systems and GTM seasons",
                },
                {
                  href: "/forum",
                  icon: MessageSquare,
                  label: "Forum",
                  hint: "Talk — no preamble",
                },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 px-3.5 sm:px-4 py-3 hover:bg-sky-50/60 dark:hover:bg-zinc-800/50 transition-colors group"
                  >
                    <item.icon className="h-4 w-4 mt-0.5 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 mt-1 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-3.5 sm:px-4 py-3 flex gap-2.5">
              <Snowflake className="h-3.5 w-3.5 mt-0.5 text-sky-500 dark:text-sky-400 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {journey ? (
                  <>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {journey.name}.
                    </span>{" "}
                    {journey.story}
                  </>
                ) : (
                  <>
                    Arctic conservation is the through-line — Churchill,
                    Svalbard, and beyond. Every season maps toward that
                    journey.
                  </>
                )}
              </p>
            </div>
          </RetroBox>
        </div>
      </div>
    </div>
  );
}
