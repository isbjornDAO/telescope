"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Snowflake,
  Send,
} from "lucide-react";
import { useWorldMutation, useWorldQuery, worldFetch } from "@/hooks/use-world";
import { RetroBox, fmtDate } from "@/components/world/primitives";
import { BuildPageShell } from "@/components/build/build-page-shell";
import { WorldGate } from "@/components/world/world-gate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ResearchPayload {
  live: {
    id: string;
    number: number;
    question: string;
    terms: string;
    minWordCount: number;
    deadline: string;
    bounty: string;
    category: string | null;
    status: string;
    journey: { slug: string; name: string } | null;
    entries: number;
  } | null;
  queued: Array<{
    id: string;
    number: number;
    question: string;
    deadline: string;
    bounty: string;
    category: string | null;
  }>;
  archive: Array<{
    id: string;
    number: number;
    question: string;
    terms: string;
    deadline: string;
    bounty: string;
    category: string | null;
    closedAt: string | null;
    entries: number;
  }>;
  acps: Array<{
    id: string;
    title: string;
    url: string;
    summary: string;
  }>;
}

export default function ResearchPage() {
  const { data, isLoading, refetch } = useWorldQuery<ResearchPayload>(
    ["research"],
    "/api/world/research"
  );
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const submit = useWorldMutation(async () => {
    await worldFetch("/api/world/research/submit", {
      method: "POST",
      body: { title, summary, body },
    });
    setTitle("");
    setSummary("");
    setBody("");
    setShowForm(false);
    refetch();
  });

  const live = data?.live;

  return (
    <BuildPageShell
      eyebrow="Continuous bounties · paper archive"
      title="Research"
      description="Essay-style bounties with deadlines, word counts, and prizes. When one event closes, the next starts. Papers become briefs for tournaments and a citable library of strategic development work."
      actions={
        live ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="retro-btn-blue text-sm px-4 py-2 font-bold"
          >
            {showForm ? "Hide form" : "Submit paper"}
          </button>
        ) : null
      }
    >
        {/* Live bounty */}
        <RetroBox
          title={live ? `RE-${live.number} · Live bounty` : "Live bounty"}
          icon={<FileText className="h-4 w-4" />}
          iconColor="purple"
        >
          {isLoading ? (
            <div className="h-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
          ) : live ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {live.question}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                {live.terms}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="retro-profile-tag">
                  Min {live.minWordCount.toLocaleString()} words
                </span>
                <span className="retro-profile-tag">
                  Due {fmtDate(live.deadline)}
                </span>
                <span className="retro-profile-tag">{live.bounty}</span>
                {live.category && (
                  <span className="retro-profile-tag">{live.category}</span>
                )}
                <span className="retro-profile-tag">
                  {live.entries} submitted
                </span>
              </div>
              {live.journey && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Snowflake className="h-3.5 w-3.5" />
                  Conservation journey: {live.journey.name}
                </p>
              )}

              {showForm && (
                <WorldGate>
                  <form
                    className="space-y-3 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit.mutate(undefined);
                    }}
                  >
                    <div>
                      <Label htmlFor="rp-title">Title</Label>
                      <Input
                        id="rp-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        minLength={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rp-summary">Summary</Label>
                      <Textarea
                        id="rp-summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        required
                        rows={2}
                        minLength={10}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rp-body">
                        Paper (min {live.minWordCount.toLocaleString()} words)
                      </Label>
                      <Textarea
                        id="rp-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submissions are blind to reviewers. Authorship is revealed
                      when the event closes unless you opt out later.
                    </p>
                    {submit.isError && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {(submit.error as Error)?.message || "Submit failed"}
                      </p>
                    )}
                    {submit.isSuccess && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Paper submitted.</p>
                    )}
                    <button
                      type="submit"
                      disabled={submit.isPending}
                      className="retro-btn-blue text-sm px-4 py-2 font-bold inline-flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submit.isPending ? "Submitting…" : "Submit paper"}
                    </button>
                  </form>
                </WorldGate>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No live bounty right now. Queued events and the archive are below.
              Admins can open the next question at any time.
            </p>
          )}
        </RetroBox>

        {/* Queued */}
        {(data?.queued?.length ?? 0) > 0 && (
          <RetroBox title="Up next" iconColor="slate">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data!.queued.map((e) => (
                <li key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-mono text-[11px] text-muted-foreground mr-2">
                      RE-{e.number}
                    </span>
                    <span className="text-sm font-bold">{e.question}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {e.bounty} · due {fmtDate(e.deadline)}
                  </span>
                </li>
              ))}
            </ul>
          </RetroBox>
        )}

        {/* Archive */}
        <RetroBox
          title="Published archive"
          icon={<FileText className="h-4 w-4" />}
          iconColor="purple"
        >
          {(data?.archive?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Closed events and their papers will appear here as a numbered,
              citable shelf — organised like ACPs.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data!.archive.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                      RE-{e.number}
                    </span>
                    <span className="text-sm font-bold">{e.question}</span>
                    {e.category && (
                      <span className="retro-profile-tag">{e.category}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {e.entries} papers · closed{" "}
                    {e.closedAt ? fmtDate(e.closedAt) : "—"} · {e.bounty}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </RetroBox>

        {/* ACP shelf */}
        <RetroBox
          title="ACP shelf"
          icon={<ExternalLink className="h-4 w-4" />}
          iconColor="blue"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Curated Avalanche Community Proposals for strategic context —
            sitting beside the research archive.
          </p>
          <ul className="space-y-2">
            {(data?.acps ?? []).map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 p-2 rounded hover:bg-sky-50/60 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 shrink-0 pt-0.5">
                    {a.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {a.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {a.summary}
                    </span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-1" />
                </a>
              </li>
            ))}
          </ul>
        </RetroBox>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          Research feeds{" "}
          <Link href="/tournaments" className="font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline">
            tournaments <ArrowRight className="h-3 w-3" />
          </Link>
          and the project board.
        </p>
    </BuildPageShell>
  );
}
