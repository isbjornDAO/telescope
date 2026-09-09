"use client";

import { useState } from "react";
import { Radar, Send, Check, X, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Stat, Empty, LoadingBlock, ErrorBlock, fmtDate } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Claims { nodeType: string; band: string; vouchesAtLeast: number; inPersonAtLeast: number; regions: string[]; shippedAtLeast: number; factionStandingBand: string; hasCrew: boolean }
interface Intent { id: string; type: string; text: string; tags: string[]; active: boolean; expiresAt: string; constraints: { minTrust?: number; regionSlug?: string } | null }
interface Match {
  id: string; status: string; score: number; reason: string;
  myIntent: { type: string; tags: string[] } | null; theirIntent: { type: string; tags: string[] } | null;
  theirClaims: Claims; theyWouldDisclose: string[]; myAccepted: boolean; theirAccepted: boolean;
  disclosure: { name: string; contact: string; history?: string } | null; expiresAt: string; createdAt: string;
}
interface ScoutView {
  budget: { perSeason: number; used: number; extra: number; remaining: number; dailyLimit: number; dailyUsed: number; dailyRemaining: number };
  pricing: { usdcPerQuery: number; treasury: string | null };
  claims: Claims; intents: Intent[]; matches: Match[];
}

const TYPES = [
  { v: "ROLE", l: "A role to fill" },
  { v: "PARTNER_PROJECT", l: "A partner project" },
  { v: "REGION_ADOPT", l: "A region to bring a tool to" },
  { v: "RESEARCH_QUESTION", l: "A research question I care about" },
];

export default function ScoutPage() {
  return (
    <WorldPage title="Your scout" subtitle="An agent that goes looking on your behalf, talks to other scouts, and only brings back matches worth a human conversation. It never reveals who you are without your consent.">
      <WorldGate message="Sign in so your scout can hold your private context.">
        <ScoutInner />
      </WorldGate>
    </WorldPage>
  );
}

function ScoutInner() {
  const { data, isLoading, error } = useWorldQuery<ScoutView>(["scout"], "/api/world/scout");
  const run = useWorldMutation(async () => worldFetch<{ queried: number; offers: number; reason: string | null }>("/api/world/scout/run", { method: "POST" }));
  if (isLoading) return <LoadingBlock lines={6} />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;
  const open = data.matches.filter((m) => ["OFFERED", "ACCEPTED_A", "ACCEPTED_B"].includes(m.status));
  const matched = data.matches.filter((m) => m.status === "MATCHED");
  const closed = data.matches.filter((m) => ["DECLINED", "EXPIRED"].includes(m.status));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Queries left" value={data.budget.remaining} hint={`${data.budget.perSeason} free per season${data.budget.extra ? ` + ${data.budget.extra} bought` : ""}`} />
        <Stat label="Today" value={`${data.budget.dailyRemaining}/${data.budget.dailyLimit}`} hint="rate limit per day" />
        <Stat label="Open offers" value={open.length} hint="need a human answer" />
        <Stat label="Matched" value={matched.length} hint="disclosed both ways" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="space-y-6">
          <Frost>
            <SectionTitle icon={<Radar className="h-4 w-4 text-sky-500" />} right={
              <Button size="sm" className="snow-button" onClick={() => run.mutate(undefined)} disabled={run.isPending || data.intents.filter((i) => i.active).length === 0}>
                <Send className="h-3.5 w-3.5 mr-1" /> {run.isPending ? "Roaming…" : "Send the scout out"}
              </Button>
            }>What you are looking for</SectionTitle>
            {run.data && <p className="text-xs text-muted-foreground mb-2">{run.data.reason ?? `Queried ${run.data.queried} scouts, raised ${run.data.offers} offers.`}</p>}
            {run.error && <p className="text-xs text-red-600 mb-2">{(run.error as Error).message}</p>}
            {data.intents.filter((i) => i.active).length === 0 && <Empty>Nothing yet. Intents are season-scoped: they go stale on purpose.</Empty>}
            <ul className="space-y-2">
              {data.intents.filter((i) => i.active).map((i) => <IntentRow key={i.id} intent={i} />)}
            </ul>
            <NewIntent />
          </Frost>

          <Frost>
            <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-sky-500" />}>What your scout may claim</SectionTitle>
            <p className="text-xs text-muted-foreground mb-2">Aggregates and proofs only. Signed by the Telescope trust service. Zero-knowledge in v2.</p>
            <ClaimsList c={data.claims} />
            <p className="text-[11px] text-muted-foreground mt-3">Above the free budget, capacity is priced at {data.pricing.usdcPerQuery} USDC per query on the C-Chain{data.pricing.treasury ? "" : " (not open yet)"}. Moves to Iggy L1 when it is live.</p>
          </Frost>
        </div>

        <div className="space-y-6">
          <Frost>
            <SectionTitle icon={<Sparkles className="h-4 w-4 text-sky-500" />}>Offers</SectionTitle>
            {open.length === 0 && <Empty>Your scout has nothing worth your time yet. That is the point.</Empty>}
            <div className="space-y-3">{open.map((m) => <MatchCard key={m.id} m={m} />)}</div>
          </Frost>
          {matched.length > 0 && (
            <Frost>
              <SectionTitle icon={<Check className="h-4 w-4 text-emerald-500" />}>Matched</SectionTitle>
              <div className="space-y-3">{matched.map((m) => <MatchCard key={m.id} m={m} />)}</div>
            </Frost>
          )}
          {closed.length > 0 && (
            <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">{closed.length} declined or expired</summary></details>
          )}
        </div>
      </div>
    </div>
  );
}

function ClaimsList({ c }: { c: Claims }) {
  return (
    <ul className="text-sm space-y-1">
      <li>Node type: <b>{c.nodeType.toLowerCase()}</b> · ice: <b>{c.band}</b></li>
      <li>At least <b>{c.vouchesAtLeast}</b> vouches, <b>{c.inPersonAtLeast}</b> in person</li>
      <li>Regions with in-person vouches: <b>{c.regions.length ? c.regions.join(", ") : "none"}</b></li>
      <li>Shipped at least <b>{c.shippedAtLeast}</b> verified projects</li>
      <li>Faction standing: <b>{c.factionStandingBand}</b> · {c.hasCrew ? "in a crew" : "no crew"}</li>
    </ul>
  );
}

function IntentRow({ intent }: { intent: Intent }) {
  const remove = useWorldMutation(async () => worldFetch(`/api/world/scout/intents/${intent.id}`, { method: "DELETE" }));
  return (
    <li className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{TYPES.find((t) => t.v === intent.type)?.l ?? intent.type}</div>
          <p className="text-muted-foreground">{intent.text}</p>
          <div className="flex flex-wrap gap-1 mt-1">{intent.tags.map((t) => <span key={t} className="text-[11px] rounded bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5">{t}</span>)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">renews {fmtDate(intent.expiresAt)}{intent.constraints?.minTrust ? ` · min ice ${intent.constraints.minTrust}` : ""}{intent.constraints?.regionSlug ? ` · region ${intent.constraints.regionSlug}` : ""}</div>
        </div>
        <Button size="icon" variant="ghost" onClick={() => remove.mutate(undefined)} title="Retire this intent"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </li>
  );
}

function NewIntent() {
  const [type, setType] = useState("ROLE");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [minTrust, setMinTrust] = useState("");
  const create = useWorldMutation(async () => {
    await worldFetch("/api/world/scout/intents", {
      method: "POST",
      body: { type, text, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), constraints: minTrust ? { minTrust: Number(minTrust) } : undefined },
    });
    setText(""); setTags(""); setMinTrust("");
  });
  return (
    <div className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-4">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tell your scout</Label>
      <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Private context. Only tags, type and proofs leave your scout." rows={3} />
      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated: solidity, zk, records, payments" />
      <Input value={minTrust} onChange={(e) => setMinTrust(e.target.value)} placeholder="minimum trust score of a match (optional, 0–1.5)" type="number" step="0.1" min="0" max="1.5" />
      {create.error && <p className="text-xs text-red-600">{(create.error as Error).message}</p>}
      <Button size="sm" className="snow-button" onClick={() => create.mutate(undefined)} disabled={create.isPending || text.length < 10}>Save intent</Button>
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [history, setHistory] = useState("");
  const respond = useWorldMutation(async (action: "accept" | "decline") =>
    worldFetch(`/api/world/scout/matches/${m.id}`, { method: "POST", body: { action, disclosure: action === "accept" ? { name, contact, history: history || undefined } : undefined } })
  );
  const label = TYPES.find((t) => t.v === m.theirIntent?.type)?.l ?? m.theirIntent?.type;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{m.reason}</div>
          <div className="text-xs text-muted-foreground">{label} · {m.theirIntent?.tags.join(", ")} · offered {fmtDate(m.createdAt)}</div>
        </div>
        <div className="text-xs whitespace-nowrap">{Math.round(m.score * 100)}% fit</div>
      </div>
      <div className="mt-2 rounded bg-zinc-50 dark:bg-zinc-800/60 p-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Their scout claims</div>
        <ClaimsList c={m.theirClaims} />
      </div>
      {m.status === "MATCHED" && m.disclosure && (
        <div className="mt-2 rounded bg-emerald-50 dark:bg-emerald-900/20 p-2">
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">Disclosed to you</div>
          <div><b>{m.disclosure.name}</b> · {m.disclosure.contact}</div>
          {m.disclosure.history && <p className="text-xs text-muted-foreground mt-1">{m.disclosure.history}</p>}
        </div>
      )}
      {m.status !== "MATCHED" && (
        <div className="mt-2">
          {m.myAccepted ? (
            <p className="text-xs text-muted-foreground">You accepted. Waiting for them. Nothing is disclosed until both accept.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{m.theirAccepted ? "They already accepted." : ""} Choose what to disclose if you accept. They would disclose: {m.theyWouldDisclose.join(", ")}.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name to disclose" />
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact channel (telegram, email…)" />
              </div>
              <Input value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Chosen history (optional)" />
              {respond.error && <p className="text-xs text-red-600">{(respond.error as Error).message}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="snow-button" onClick={() => respond.mutate("accept")} disabled={respond.isPending || !name || !contact}><Check className="h-3.5 w-3.5 mr-1" /> Accept</Button>
                <Button size="sm" variant="outline" onClick={() => respond.mutate("decline")} disabled={respond.isPending}><X className="h-3.5 w-3.5 mr-1" /> Decline</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
