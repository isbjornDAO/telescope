"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, MessageSquare, Activity, Map as MapIcon } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, fmtDate } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Entry {
  id: string; tournament: string; status: string; title: string; summary?: string; body?: string | null; url?: string | null; repoUrl?: string | null; deployedOn?: string | null; blind?: boolean;
  ethicsStatement?: string | null; roadmap?: { milestone: string; due?: string; done?: boolean }[] | null; metrics?: { label: string; value: number | string; at: string }[] | null; meaningfulTxDefinition?: string | null;
  isVictor?: boolean; finalScore?: number | null; season: { number: number; name: string; status: string };
  crew?: { name: string; slug: string; region: { name: string; slug: string } | null; members: string[] } | null; faction?: { name: string; slug: string } | null; region?: { name: string; slug: string } | null; author?: string;
  feedback?: { id: string; body: string; by: string; at: string }[]; reviewSummary?: Record<string, unknown> | null;
  retention?: { day0: number | null; day90: number | null; ratio: number | null; vested: number | null; reports: { activeCount: number; walletCount: number; reportedAt: string }[] }; mine?: boolean;
}

export default function EntryPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useWorldQuery<Entry>(["entry", id], `/api/world/entries/${id}`);
  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex items-center gap-2 flex-wrap mb-2"><TournamentBadge tournament={data.tournament} /><StatusBadge status={data.status} /><Link href={`/seasons/${data.season.number}`} className="text-xs text-muted-foreground hover:underline">{data.season.name}</Link></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.isVictor ? "👑 " : ""}{data.title}</h1>
            {data.blind ? (
              <p className="text-sm text-muted-foreground mt-2">Research papers are private. Authorship is revealed when the season closes, unless the author chose to stay pseudonymous.</p>
            ) : (
              <>
                <p className="text-sm mt-2">{data.summary}</p>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                  {data.crew && <span>crew <Link href={`/crews/${data.crew.slug}`} className="hover:underline font-medium">{data.crew.name}</Link>{data.crew.region ? ` (${data.crew.region.name})` : ""}</span>}
                  {data.faction && <span>faction <Link href={`/factions/${data.faction.slug}`} className="hover:underline font-medium">{data.faction.name}</Link></span>}
                  {data.region && <span>serves <Link href={`/regions/${data.region.slug}`} className="hover:underline font-medium">{data.region.name}</Link></span>}
                  {data.author && <span>by {data.author}</span>}
                  {data.deployedOn && <span>on {data.deployedOn}</span>}
                  {typeof data.finalScore === "number" && <span>final {Math.round(data.finalScore * 100) / 100}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  {data.url && <a href={data.url} target="_blank" rel="noreferrer"><Button size="sm" className="snow-button">Use the product <ExternalLink className="h-3.5 w-3.5 ml-1" /></Button></a>}
                  {data.repoUrl && <a href={data.repoUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Repo</Button></a>}
                </div>
              </>
            )}
          </Frost>

          {!data.blind && (
            <div className="grid md:grid-cols-2 gap-6">
              {data.tournament === "GTM" && (
                <>
                  <Frost>
                    <SectionTitle icon={<MapIcon className="h-4 w-4 text-sky-500" />}>Roadmap</SectionTitle>
                    <ul className="text-sm space-y-1">{(data.roadmap ?? []).map((m, i) => <li key={i} className={m.done ? "line-through text-muted-foreground" : ""}>{m.done ? "✓ " : "· "}{m.milestone}{m.due ? <span className="text-xs text-muted-foreground"> · {m.due}</span> : null}</li>)}</ul>
                    {data.mine && data.season.status !== "CLOSED" && <RoadmapEditor entry={data} />}
                  </Frost>
                  <Frost>
                    <SectionTitle icon={<Activity className="h-4 w-4 text-sky-500" />}>Metrics</SectionTitle>
                    <p className="text-xs text-muted-foreground mb-2">Meaningful transaction: <b>{data.meaningfulTxDefinition}</b></p>
                    {(data.metrics ?? []).length === 0 && <Empty>No metrics published yet. Judging is six weeks of visible building.</Empty>}
                    <ul className="text-sm space-y-1">{(data.metrics ?? []).slice().reverse().map((m, i) => <li key={i} className="flex justify-between"><span>{m.label}</span><span className="tabular-nums">{m.value} <span className="text-xs text-muted-foreground">{fmtDate(m.at)}</span></span></li>)}</ul>
                    {data.mine && data.season.status !== "CLOSED" && <MetricEditor entry={data} />}
                    {data.retention && (data.retention.day0 !== null || data.mine) && (
                      <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-3 text-sm">
                        <div className="font-semibold">90-day retention</div>
                        <div className="text-xs text-muted-foreground">Day 0: {data.retention.day0 ?? "—"} · Day 90: {data.retention.day90 ?? "—"} · ratio {data.retention.ratio ?? "—"} · vested {data.retention.vested === null ? "pending" : `${Math.round((data.retention.vested ?? 0) * 100)}%`}</div>
                        {data.mine && <RetentionReporter entryId={data.id} />}
                      </div>
                    )}
                  </Frost>
                </>
              )}
              {data.tournament === "LOCAL_SYSTEMS" && (
                <>
                  <Frost className="md:col-span-2"><SectionTitle>The design</SectionTitle><pre className="whitespace-pre-wrap text-sm font-sans">{data.body}</pre></Frost>
                  <Frost className="md:col-span-2"><SectionTitle>Ethics</SectionTitle><pre className="whitespace-pre-wrap text-sm font-sans">{data.ethicsStatement}</pre></Frost>
                </>
              )}
              {data.tournament === "RESEARCH_PAPERS" && data.body && <Frost className="md:col-span-2"><SectionTitle>The paper</SectionTitle><pre className="whitespace-pre-wrap text-sm font-sans">{data.body}</pre></Frost>}
            </div>
          )}

          {data.reviewSummary && (
            <Frost>
              <SectionTitle>Review</SectionTitle>
              <pre className="text-xs text-muted-foreground">{JSON.stringify(data.reviewSummary, null, 1).replace(/[{}"]/g, "")}</pre>
            </Frost>
          )}

          {data.tournament !== "RESEARCH_PAPERS" && (
            <Frost>
              <SectionTitle icon={<MessageSquare className="h-4 w-4 text-sky-500" />}>Feedback from the world</SectionTitle>
              {(data.feedback ?? []).length === 0 && <Empty>The community uses the products and files feedback. Its usage counts.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{(data.feedback ?? []).map((f) => <li key={f.id} className="py-2"><div>{f.body}</div><div className="text-xs text-muted-foreground">{f.by} · {fmtDate(f.at)}</div></li>)}</ul>
              <div className="mt-3"><WorldGate compact><FeedbackForm entryId={data.id} /></WorldGate></div>
            </Frost>
          )}
        </div>
      )}
    </WorldPage>
  );
}

function FeedbackForm({ entryId }: { entryId: string }) {
  const [body, setBody] = useState("");
  const post = useWorldMutation(async () => { await worldFetch(`/api/world/entries/${entryId}/feedback`, { method: "POST", body: { body } }); setBody(""); });
  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="What worked, what broke, what you would need to keep using it." />
      {post.error && <p className="text-xs text-red-600">{(post.error as Error).message}</p>}
      <Button size="sm" className="snow-button" onClick={() => post.mutate(undefined)} disabled={post.isPending || body.length < 3}>File feedback</Button>
    </div>
  );
}

function RoadmapEditor({ entry }: { entry: Entry }) {
  const [text, setText] = useState((entry.roadmap ?? []).map((m) => `${m.done ? "[x] " : ""}${m.milestone}`).join("\n"));
  const save = useWorldMutation(async () => worldFetch(`/api/world/entries/${entry.id}`, { method: "PATCH", body: { roadmap: text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => ({ milestone: l.replace(/^\[x\]\s*/i, ""), done: /^\[x\]/i.test(l) })) } }));
  return (
    <div className="mt-3 space-y-2">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="One milestone per line. Prefix [x] when done." />
      <Button size="sm" variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending}>Update roadmap</Button>
    </div>
  );
}

function MetricEditor({ entry }: { entry: Entry }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const save = useWorldMutation(async () => { await worldFetch(`/api/world/entries/${entry.id}`, { method: "PATCH", body: { metricsAppend: [{ label, value: isNaN(Number(value)) ? value : Number(value) }] } }); setLabel(""); setValue(""); });
  return (
    <div className="mt-3 flex gap-2">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="metric" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" className="w-28" />
      <Button size="sm" variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending || !label || !value}>Publish</Button>
    </div>
  );
}

function RetentionReporter({ entryId }: { entryId: string }) {
  const [wallets, setWallets] = useState("");
  const report = useWorldMutation(async () => worldFetch<{ activeCount: number; walletCount: number }>(`/api/world/entries/${entryId}/retention`, { method: "POST", body: { wallets: wallets.split(/[\s,]+/).filter(Boolean) } }));
  return (
    <div className="mt-2 space-y-2">
      <Textarea value={wallets} onChange={(e) => setWallets(e.target.value)} rows={3} placeholder="Wallets with a meaningful transaction in the trailing 30 days, one per line. Only trust-graph wallets count." />
      {report.data && <p className="text-xs text-emerald-600">Reported {report.data.walletCount} wallets, {report.data.activeCount} on the trust graph.</p>}
      {report.error && <p className="text-xs text-red-600">{(report.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => report.mutate(undefined)} disabled={report.isPending || !wallets.trim()}>Report active wallets</Button>
    </div>
  );
}
