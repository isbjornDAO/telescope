"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Gavel, FileCheck } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, TournamentBadge, fmtDate } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EldersView { elders: { name: string; handle: string | null; bio: string | null; since: string | null; region: { name: string; slug: string } | null }[]; admissions: { id: string; candidate: string; nominatedBy: string; statement: string; approvals: number; needed: number; approvedByMe: boolean; createdAt: string }[]; canNominate: boolean }
interface Review { id: string; tournament: string; stage: string; submittedAt: string | null; entry: { id: string; title: string; summary: string; body?: string | null; ethicsStatement?: string | null; blind: boolean; season: { name: string }; region?: { name: string } | null; crew?: { name: string } | null } }
interface Finding { id: string; target: string; region: { name: string; slug: string } | null; rationale: string; status: string; elderApprovals: number; anchorApprovals: number; needed: { elders: number; anchors: number }; appealText: string | null; createdAt: string }

export default function EldersPage() {
  const { data, isLoading, error } = useWorldQuery<EldersView>(["elders"], "/api/world/elders");
  const { data: findings } = useWorldQuery<Finding[]>(["slashing"], "/api/world/slashing");
  return (
    <WorldPage title="Elders" subtitle="Verifiers with recognised expertise and standing outside the world: teachers, researchers, practitioners. They sit on the Local Systems panel, review papers blind, carry higher weight, and are admitted by existing Elders and region Anchors.">
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <WorldGate compact><MyReviews /></WorldGate>
          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle icon={<Crown className="h-4 w-4 text-amber-500" />}>The Elders</SectionTitle>
              {data.elders.length === 0 && <Empty>None yet. Isbjorn seeds the first Elders with Team1.</Empty>}
              <ul className="text-sm space-y-2">{data.elders.map((e) => <li key={e.name}><Link href={e.handle ? `/profile/${e.handle}` : "#"} className="font-semibold hover:underline">{e.name}</Link>{e.region && <span className="text-xs text-muted-foreground"> · {e.region.name}</span>}{e.bio && <p className="text-xs text-muted-foreground">{e.bio}</p>}</li>)}</ul>
            </Frost>
            <Frost>
              <SectionTitle>Admissions</SectionTitle>
              {data.admissions.length === 0 && <p className="text-xs text-muted-foreground">No open nominations{data.canNominate ? "" : ". Anchors and Elders see and vote on them"}.</p>}
              <ul className="space-y-2 text-sm">{data.admissions.map((a) => <AdmissionRow key={a.id} a={a} />)}</ul>
              {data.canNominate && <Nominate />}
            </Frost>
          </div>
          <Frost>
            <SectionTitle icon={<Gavel className="h-4 w-4 text-sky-500" />}>Slashing findings</SectionTitle>
            <p className="text-xs text-muted-foreground mb-2">A vouch is a stake. A finding by three Elders and the region&apos;s Anchors, with a published rationale, slashes a node and costs its vouchers 20% of what they staked. One appeal. The record is permanent.</p>
            {(findings ?? []).length === 0 && <Empty>No findings. Good.</Empty>}
            <ul className="space-y-2 text-sm">{(findings ?? []).map((f) => <FindingRow key={f.id} f={f} />)}</ul>
            <WorldGate compact><ProposeFinding /></WorldGate>
          </Frost>
        </div>
      )}
    </WorldPage>
  );
}

function MyReviews() {
  const { data } = useWorldQuery<Review[]>(["reviews"], "/api/world/reviews/mine");
  if (!data || data.length === 0) return null;
  const pending = data.filter((r) => !r.submittedAt);
  return (
    <Frost>
      <SectionTitle icon={<FileCheck className="h-4 w-4 text-sky-500" />}>Your reviews · {pending.length} pending</SectionTitle>
      <div className="space-y-3">{data.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
    </Frost>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const [open, setOpen] = useState(false);
  const [approve, setApprove] = useState<boolean | null>(null);
  const [score, setScore] = useState(7);
  const [advances, setAdvances] = useState(7);
  const [rigour, setRigour] = useState(7);
  const [buildable, setBuildable] = useState(7);
  const [comment, setComment] = useState("");
  const submit = useWorldMutation(async () => worldFetch(`/api/world/reviews/${r.id}`, { method: "POST", body: r.tournament === "LOCAL_SYSTEMS" ? (r.stage === "round" ? { approve, comment } : { score, comment }) : { advances, rigour, buildable, comment } }));
  const Ten = ({ v, set, label }: { v: number; set: (n: number) => void; label: string }) => (
    <label className="text-xs flex items-center gap-2">{label}<input type="range" min={1} max={10} value={v} onChange={(e) => set(Number(e.target.value))} className="accent-sky-500" /><b className="w-5">{v}</b></label>
  );
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div><TournamentBadge tournament={r.tournament} /> <span className="text-xs text-muted-foreground">{r.stage} · {r.entry.season.name}</span><div className="font-semibold mt-1">{r.entry.title}</div><p className="text-xs text-muted-foreground">{r.entry.summary}</p>{r.entry.blind && <p className="text-[11px] text-muted-foreground">Blind: you see the paper, not the author.</p>}</div>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>{r.submittedAt ? "Submitted" : open ? "Close" : "Review"}</Button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {r.entry.body && <details><summary className="cursor-pointer text-xs">Read the {r.tournament === "RESEARCH_PAPERS" ? "paper" : "design"}</summary><pre className="whitespace-pre-wrap text-xs font-sans mt-2 max-h-96 overflow-auto">{r.entry.body}</pre></details>}
          {r.entry.ethicsStatement && <details><summary className="cursor-pointer text-xs">Ethics statement</summary><pre className="whitespace-pre-wrap text-xs font-sans mt-2">{r.entry.ethicsStatement}</pre></details>}
          {!r.submittedAt && (
            <>
              {r.tournament === "LOCAL_SYSTEMS" && r.stage === "round" && <div className="flex gap-2"><Button size="sm" variant={approve === true ? "default" : "outline"} onClick={() => setApprove(true)}>Approve</Button><Button size="sm" variant={approve === false ? "default" : "outline"} onClick={() => setApprove(false)}>Do not approve</Button></div>}
              {r.tournament === "LOCAL_SYSTEMS" && r.stage === "final" && <Ten v={score} set={setScore} label="Score" />}
              {r.tournament === "RESEARCH_PAPERS" && <div className="grid gap-1"><Ten v={advances} set={setAdvances} label="Advances the question" /><Ten v={rigour} set={setRigour} label="Rigour and honesty" /><Ten v={buildable} set={setBuildable} label="Could a crew build from it" /></div>}
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Comment (kept with the review)" />
              {submit.error && <p className="text-xs text-red-600">{(submit.error as Error).message}</p>}
              <Button size="sm" className="snow-button" onClick={() => submit.mutate(undefined)} disabled={submit.isPending || (r.tournament === "LOCAL_SYSTEMS" && r.stage === "round" && approve === null)}>Submit review</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdmissionRow({ a }: { a: EldersView["admissions"][number] }) {
  const approve = useWorldMutation(async () => worldFetch(`/api/world/elders/${a.id}/approve`, { method: "POST" }));
  return (
    <li className="rounded border border-zinc-200 dark:border-zinc-700 p-2">
      <div className="flex justify-between gap-2"><b>{a.candidate}</b><span className="text-xs text-muted-foreground">{a.approvals}/{a.needed} · by {a.nominatedBy} · {fmtDate(a.createdAt)}</span></div>
      <p className="text-xs text-muted-foreground mt-1">{a.statement}</p>
      {!a.approvedByMe && <Button size="sm" variant="outline" className="mt-2" onClick={() => approve.mutate(undefined)} disabled={approve.isPending}>Approve</Button>}
      {approve.error && <p className="text-xs text-red-600">{(approve.error as Error).message}</p>}
    </li>
  );
}

function Nominate() {
  const [handle, setHandle] = useState("");
  const [statement, setStatement] = useState("");
  const nominate = useWorldMutation(async () => { await worldFetch("/api/world/elders/nominate", { method: "POST", body: { handle, statement } }); setHandle(""); setStatement(""); });
  return (
    <div className="mt-3 border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nominate an Elder</Label>
      <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="name or wallet" />
      <Textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={2} placeholder="Their expertise and verified standing outside the world" />
      {nominate.error && <p className="text-xs text-red-600">{(nominate.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => nominate.mutate(undefined)} disabled={nominate.isPending || !handle || statement.length < 20}>Nominate</Button>
    </div>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const approve = useWorldMutation(async () => worldFetch(`/api/world/slashing/${f.id}/approve`, { method: "POST" }));
  const [appeal, setAppeal] = useState("");
  const doAppeal = useWorldMutation(async () => worldFetch(`/api/world/slashing/${f.id}/appeal`, { method: "POST", body: { text: appeal } }));
  const resolve = useWorldMutation(async (uphold: boolean) => worldFetch(`/api/world/slashing/${f.id}/resolve`, { method: "POST", body: { uphold } }));
  return (
    <li className="rounded border border-zinc-200 dark:border-zinc-700 p-2">
      <div className="flex justify-between gap-2"><b>{f.target}</b><span className="text-xs capitalize text-muted-foreground">{f.status.toLowerCase()} · {f.elderApprovals}/{f.needed.elders} elders · {f.anchorApprovals}/{f.needed.anchors} anchors{f.region ? ` (${f.region.name})` : ""} · {fmtDate(f.createdAt)}</span></div>
      <p className="text-xs mt-1">{f.rationale}</p>
      {f.appealText && <p className="text-xs mt-1 text-muted-foreground"><b>Appeal:</b> {f.appealText}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {f.status === "PROPOSED" && <Button size="sm" variant="outline" onClick={() => approve.mutate(undefined)} disabled={approve.isPending}>Confirm finding</Button>}
        {f.status === "CONFIRMED" && <><Input value={appeal} onChange={(e) => setAppeal(e.target.value)} placeholder="appeal (once)" className="max-w-xs" /><Button size="sm" variant="outline" onClick={() => doAppeal.mutate(undefined)} disabled={doAppeal.isPending || appeal.length < 40}>Appeal</Button></>}
        {f.status === "APPEALED" && <><Button size="sm" variant="outline" onClick={() => resolve.mutate(true)}>Uphold</Button><Button size="sm" variant="outline" onClick={() => resolve.mutate(false)}>Overturn</Button></>}
      </div>
      {(approve.error || doAppeal.error || resolve.error) && <p className="text-xs text-red-600 mt-1">{((approve.error ?? doAppeal.error ?? resolve.error) as Error).message}</p>}
    </li>
  );
}

function ProposeFinding() {
  const [handle, setHandle] = useState("");
  const [rationale, setRationale] = useState("");
  const propose = useWorldMutation(async () => { await worldFetch("/api/world/slashing", { method: "POST", body: { handle, rationale } }); setHandle(""); setRationale(""); });
  return (
    <div className="mt-3 border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Propose a finding (Elders)</Label>
      <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="name or wallet" />
      <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={3} placeholder="Confirmed fraud, stolen treasury, fabricated submission. This is published." />
      {propose.error && <p className="text-xs text-red-600">{(propose.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => propose.mutate(undefined)} disabled={propose.isPending || !handle || rationale.length < 40}>Propose</Button>
    </div>
  );
}
