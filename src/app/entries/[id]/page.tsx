"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  MessageSquare,
  Activity,
  Map as MapIcon,
  ArrowLeft,
  Crown,
  Trophy,
  GitBranch,
  Shield,
  Layers,
  Send,
} from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import {
  WorldPage,
  RetroBox,
  Empty,
  LoadingBlock,
  ErrorBlock,
  TournamentBadge,
  StatusBadge,
  fmtDate,
} from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Entry {
  id: string;
  tournament: string;
  status: string;
  title: string;
  summary?: string;
  body?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  deployedOn?: string | null;
  blind?: boolean;
  ethicsStatement?: string | null;
  roadmap?: { milestone: string; due?: string; done?: boolean }[] | null;
  metrics?: { label: string; value: number | string; at: string }[] | null;
  meaningfulTxDefinition?: string | null;
  isVictor?: boolean;
  finalScore?: number | null;
  season: { number: number; name: string; status: string };
  crew?: { name: string; slug: string; region: { name: string; slug: string } | null; members: string[] } | null;
  faction?: { name: string; slug: string } | null;
  region?: { name: string; slug: string } | null;
  author?: string;
  feedback?: { id: string; body: string; by: string; at: string }[];
  reviewSummary?: Record<string, unknown> | null;
  retention?: {
    day0: number | null;
    day90: number | null;
    ratio: number | null;
    vested: number | null;
    reports: { activeCount: number; walletCount: number; reportedAt: string }[];
  };
  mine?: boolean;
}

export default function EntryPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useWorldQuery<Entry>(["entry", id], `/api/world/entries/${id}`);

  return (
    <WorldPage wide>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}

      {data && (
        <div className="space-y-6">
          {/* ── Product Header Box (Retro Style) ── */}
          <RetroBox
            title="Tournament Competitor"
            icon={<Trophy className="h-5 w-5 drop-shadow-sm" />}
            iconColor="blue"
            actions={
              <Link
                href={`/tournaments/${data.season.number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {data.season.name} Arena
              </Link>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <TournamentBadge tournament={data.tournament} />
                <StatusBadge status={data.status} />
                {data.isVictor && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                    <Crown className="h-3 w-3 text-amber-500" />
                    Tournament Victor
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {data.title}
              </h1>

              {data.blind ? (
                <div className="retro-subtitle p-3 text-xs text-muted-foreground">
                  Research papers are double-blind during the competition. Authorship is revealed when the season closes, unless the author opted to remain pseudonymous.
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
                    {data.summary}
                  </p>

                  {/* Metadata Chips */}
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    {data.crew && (
                      <span className="retro-profile-tag">
                        Crew: <b>{data.crew.name}</b>
                        {data.crew.region ? ` (${data.crew.region.name})` : ""}
                      </span>
                    )}
                    {data.faction && (
                      <span className="retro-profile-tag">
                        Faction: <b>{data.faction.name}</b>
                      </span>
                    )}
                    {data.region && (
                      <span className="retro-profile-tag">
                        Serves: <b>{data.region.name}</b>
                      </span>
                    )}
                    {data.author && (
                      <span className="retro-profile-tag">
                        Lead: <b>{data.author}</b>
                      </span>
                    )}
                    {data.deployedOn && (
                      <span className="retro-profile-tag">
                        Network: <b>{data.deployedOn}</b>
                      </span>
                    )}
                    {typeof data.finalScore === "number" && (
                      <span className="retro-profile-tag">
                        Score: <b>{Math.round(data.finalScore * 100) / 100}</b>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {data.url && (
                      <a href={data.url} target="_blank" rel="noreferrer">
                        <button className="retro-btn-blue text-xs px-4 py-2 font-bold flex items-center gap-1.5">
                          Use the Product
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </a>
                    )}
                    {data.repoUrl && (
                      <a href={data.repoUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="text-xs font-bold flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5" />
                          Source Repo
                        </Button>
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </RetroBox>

          {!data.blind && (
            <div className="grid md:grid-cols-2 gap-6">
              {data.tournament === "GTM" && (
                <>
                  {/* Roadmap Box */}
                  <RetroBox
                    title="Product Milestones & Roadmap"
                    icon={<MapIcon className="h-5 w-5 drop-shadow-sm" />}
                    iconColor="blue"
                  >
                    <ul className="text-xs space-y-2">
                      {(data.roadmap ?? []).map((m, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded ${
                            m.done
                              ? "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground line-through"
                              : "bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <span className={m.done ? "text-emerald-500 font-bold" : "text-sky-500"}>
                            {m.done ? "✓" : "•"}
                          </span>
                          <span className="flex-1 font-medium">{m.milestone}</span>
                          {m.due && <span className="text-[10px] text-muted-foreground font-mono">{m.due}</span>}
                        </li>
                      ))}
                    </ul>
                    {data.mine && data.season.status !== "CLOSED" && <RoadmapEditor entry={data} />}
                  </RetroBox>

                  {/* Metrics Box */}
                  <RetroBox
                    title="Live On-Chain Telemetry"
                    icon={<Activity className="h-5 w-5 drop-shadow-sm" />}
                    iconColor="green"
                  >
                    {data.meaningfulTxDefinition && (
                      <div className="retro-subtitle p-2.5 mb-3 text-xs text-muted-foreground">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[10px] block mb-0.5">
                          Meaningful Transaction Definition
                        </span>
                        {data.meaningfulTxDefinition}
                      </div>
                    )}

                    {(data.metrics ?? []).length === 0 ? (
                      <Empty>No metrics published yet. Judging is six weeks of visible building.</Empty>
                    ) : (
                      <div className="space-y-1.5">
                        {(data.metrics ?? []).slice().reverse().map((m, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs"
                          >
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{m.label}</span>
                            <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
                              {m.value}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({fmtDate(m.at)})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {data.mine && data.season.status !== "CLOSED" && <MetricEditor entry={data} />}

                    {data.retention && (data.retention.day0 !== null || data.mine) && (
                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                          90-Day Retention Tracking
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          Day 0: {data.retention.day0 ?? "—"} · Day 90: {data.retention.day90 ?? "—"} · Ratio:{" "}
                          {data.retention.ratio ?? "—"} · Vested:{" "}
                          {data.retention.vested === null
                            ? "Pending"
                            : `${Math.round((data.retention.vested ?? 0) * 100)}%`}
                        </div>
                        {data.mine && <RetentionReporter entryId={data.id} />}
                      </div>
                    )}
                  </RetroBox>
                </>
              )}

              {data.tournament === "LOCAL_SYSTEMS" && (
                <>
                  <RetroBox title="The Design Blueprint" iconColor="gold" className="md:col-span-2">
                    <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {data.body}
                    </pre>
                  </RetroBox>
                  <RetroBox title="Ethical Assessment Statement" iconColor="gold" className="md:col-span-2">
                    <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {data.ethicsStatement}
                    </pre>
                  </RetroBox>
                </>
              )}

              {data.tournament === "RESEARCH_PAPERS" && data.body && (
                <RetroBox title="The Research Paper" iconColor="purple" className="md:col-span-2">
                  <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {data.body}
                  </pre>
                </RetroBox>
              )}
            </div>
          )}

          {data.reviewSummary && (
            <RetroBox title="Panel Review Breakdown" iconColor="gold">
              <pre className="text-xs text-muted-foreground font-mono">
                {JSON.stringify(data.reviewSummary, null, 1).replace(/[{}"]/g, "")}
              </pre>
            </RetroBox>
          )}

          {data.tournament !== "RESEARCH_PAPERS" && (
            <RetroBox
              title="Community Feedback Stream"
              icon={<MessageSquare className="h-5 w-5 drop-shadow-sm" />}
              iconColor="blue"
            >
              {(data.feedback ?? []).length === 0 ? (
                <Empty>The community tests and files feedback. Every review counts toward Standing.</Empty>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {(data.feedback ?? []).map((f) => (
                    <div key={f.id} className="retro-topic-row py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                          {f.body}
                        </p>
                        <div className="text-[11px] text-muted-foreground font-mono mt-1">
                          By <span className="font-semibold text-foreground">{f.by}</span> · {fmtDate(f.at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <WorldGate compact>
                  <FeedbackForm entryId={data.id} />
                </WorldGate>
              </div>
            </RetroBox>
          )}
        </div>
      )}
    </WorldPage>
  );
}

function FeedbackForm({ entryId }: { entryId: string }) {
  const [body, setBody] = useState("");
  const post = useWorldMutation(async () => {
    await worldFetch(`/api/world/entries/${entryId}/feedback`, { method: "POST", body: { body } });
    setBody("");
  });
  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="What worked, what broke, what you would need to keep using it..."
        className="text-xs"
      />
      {post.error && <p className="text-xs text-red-600">{(post.error as Error).message}</p>}
      <button
        className="retro-btn-blue text-xs px-4 py-1.5 font-bold flex items-center gap-1.5"
        onClick={() => post.mutate(undefined)}
        disabled={post.isPending || body.length < 3}
      >
        <Send className="h-3 w-3" />
        {post.isPending ? "Submitting…" : "Post Feedback"}
      </button>
    </div>
  );
}

function RoadmapEditor({ entry }: { entry: Entry }) {
  const [text, setText] = useState(
    (entry.roadmap ?? []).map((m) => `${m.done ? "[x] " : ""}${m.milestone}`).join("\n")
  );
  const save = useWorldMutation(async () =>
    worldFetch(`/api/world/entries/${entry.id}`, {
      method: "PATCH",
      body: {
        roadmap: text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => ({ milestone: l.replace(/^\[x\]\s*/i, ""), done: /^\[x\]/i.test(l) })),
      },
    })
  );
  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="One milestone per line. Prefix [x] when done."
        className="text-xs"
      />
      <Button size="sm" variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
        Update roadmap
      </Button>
    </div>
  );
}

function MetricEditor({ entry }: { entry: Entry }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const save = useWorldMutation(async () => {
    await worldFetch(`/api/world/entries/${entry.id}`, {
      method: "PATCH",
      body: { metricsAppend: [{ label, value: isNaN(Number(value)) ? value : Number(value) }] },
    });
    setLabel("");
    setValue("");
  });
  return (
    <div className="mt-3 flex gap-2">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="metric label" className="text-xs" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" className="w-28 text-xs" />
      <Button size="sm" variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending || !label || !value}>
        Publish Metric
      </Button>
    </div>
  );
}

function RetentionReporter({ entryId }: { entryId: string }) {
  const [wallets, setWallets] = useState("");
  const report = useWorldMutation(async () =>
    worldFetch<{ activeCount: number; walletCount: number }>(`/api/world/entries/${entryId}/retention`, {
      method: "POST",
      body: { wallets: wallets.split(/[\s,]+/).filter(Boolean) },
    })
  );
  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={wallets}
        onChange={(e) => setWallets(e.target.value)}
        rows={3}
        placeholder="Wallets with a meaningful transaction in the trailing 30 days, one per line. Only trust-graph wallets count."
        className="text-xs font-mono"
      />
      {report.data && (
        <p className="text-xs text-emerald-600">
          Reported {report.data.walletCount} wallets, {report.data.activeCount} on the trust graph.
        </p>
      )}
      {report.error && <p className="text-xs text-red-600">{(report.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => report.mutate(undefined)} disabled={report.isPending || !wallets.trim()}>
        Report active wallets
      </Button>
    </div>
  );
}
