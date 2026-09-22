"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Trophy, Landmark, FileText, Send } from "lucide-react";
import { useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, RetroBox } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KINDS = [
  {
    v: "GTM",
    l: "GTM: Something I built (Working Product)",
    hint: "A working product deployed on Avalanche. The community votes with trust-weighted ballots.",
    icon: Trophy,
    color: "blue" as const,
  },
  {
    v: "LOCAL_SYSTEMS",
    l: "Local Systems: An idea for my community",
    hint: "A governance & architectural design, not a build. An appointed panel of Elders judges it.",
    icon: Landmark,
    color: "gold" as const,
  },
  {
    v: "RESEARCH_PAPERS",
    l: "Research Papers: A piece of writing",
    hint: "Deep research advancing the seasonal research question. Double-blind reviewed without your name.",
    icon: FileText,
    color: "purple" as const,
  },
];

export default function EnterPage() {
  const router = useRouter();
  const params = useParams();
  const seasonNumber = params.number as string;

  const [tournament, setTournament] = useState("GTM");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");

  const submit = useWorldMutation(async () => {
    const res = await worldFetch<{ id: string }>("/api/world/entries", {
      method: "POST",
      body: {
        tournament,
        title,
        summary,
        url: url || undefined,
        body: body || undefined,
        deployedOn: tournament === "GTM" ? "C-Chain" : undefined,
      },
    });
    router.push(`/entries/${res.id}`);
  });

  const kind = KINDS.find((k) => k.v === tournament) || KINDS[0];
  const Icon = kind.icon;

  return (
    <WorldPage>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back Link */}
        <Link
          href={`/tournaments/${seasonNumber}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Season Arena
        </Link>

        <WorldGate message="Sign in with your wallet to enter the tournament.">
          <RetroBox
            title="Enter Seasonal Tournament"
            icon={<Icon className="h-5 w-5 drop-shadow-sm" />}
            iconColor={kind.color}
          >
            <div className="space-y-4 pt-1">
              <div>
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Select Tournament Track
                </Label>
                <Select value={tournament} onValueChange={setTournament}>
                  <SelectTrigger className="mt-1 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k.v} value={k.v} className="text-xs">
                        {k.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="retro-subtitle p-2.5 mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-500 shrink-0" />
                  <span>{kind.hint}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Project Title / Name
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GlacierPay, ArcticLedger"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  One-line Summary
                </Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="What does it do and what community does it serve?"
                  rows={2}
                  className="mt-1 text-xs"
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  Minimum 10 characters ({summary.length}/10)
                </span>
              </div>

              {tournament === "GTM" && (
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                    Product URL / Demo Link
                  </Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://myproduct.xyz"
                    className="mt-1"
                  />
                </div>
              )}

              {tournament !== "GTM" && (
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                    {tournament === "RESEARCH_PAPERS"
                      ? "Paper Submission / Abstract"
                      : "Governance Architecture & Design Spec"}
                  </Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Draft your proposal or paste your markdown outline..."
                    rows={8}
                    className="mt-1 text-xs font-mono"
                  />
                </div>
              )}

              {submit.error && (
                <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                  {(submit.error as Error).message}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[11px] text-muted-foreground">
                  You can update and enrich details while the building phase runs.
                </span>
                <button
                  className="retro-btn-blue text-xs px-5 py-2 font-bold shrink-0 flex items-center gap-1.5"
                  onClick={() => submit.mutate(undefined)}
                  disabled={submit.isPending || !title || summary.length < 10}
                >
                  <Send className="h-3.5 w-3.5" />
                  {submit.isPending ? "Submitting…" : "Enter Tournament"}
                </button>
              </div>
            </div>
          </RetroBox>
        </WorldGate>
      </div>
    </WorldPage>
  );
}
