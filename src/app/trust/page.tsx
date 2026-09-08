"use client";

import { useState } from "react";
import Link from "next/link";
import { useSendTransaction } from "wagmi";
import { Link2, Eye, EyeOff, Anchor, Trash2 } from "lucide-react";
import { useWorldQuery, useWorldMutation, useWorldSession, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Stat, Empty, LoadingBlock, ErrorBlock, NameLink, NodeBadge, fmtDate } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { IceGraph, type IceLink } from "@/components/world/ice-graph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Vouch {
  id: string; type: string; status: string; weight: number; budgetCost: number; note: string | null;
  fromVisible: boolean; toVisible: boolean; commitment: string; onchainTx: string | null; createdAt: string; attestedAt: string | null;
  region: { name: string; slug: string } | null; counterpart: { name: string; handle: string | null; nodeType: string };
}
interface VouchView { budget: { total: number; spent: number; remaining: number; seasonNumber: number | null; costs: Record<string, number> }; given: Vouch[]; received: Vouch[] }

const TYPE_LABEL: Record<string, string> = { IN_PERSON: "in person", SHIPPED_TOGETHER: "shipped together", SHARED_VISION: "shared vision" };

export default function TrustPage() {
  return (
    <WorldPage title="Your ice" subtitle="Trust is modelled like node infrastructure. Every vouch is a link with a weight and a stake. Strong links are thick ice; a slashing is a crack. Only you and the other party see who is on each end.">
      <WorldGate message="Sign in to see your trust graph.">
        <TrustInner />
      </WorldGate>
    </WorldPage>
  );
}

function TrustInner() {
  const { me } = useWorldSession();
  const { data, isLoading, error } = useWorldQuery<VouchView>(["vouches"], "/api/world/vouches");
  if (isLoading) return <LoadingBlock lines={6} />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;
  const links: IceLink[] = [
    ...data.received.map((v) => ({ id: v.id, type: v.type, status: v.status, weight: v.weight, direction: "received" as const, name: v.counterpart.name, handle: v.counterpart.handle, nodeType: v.counterpart.nodeType })),
    ...data.given.map((v) => ({ id: v.id, type: v.type, status: v.status, weight: v.weight, direction: "given" as const, name: v.counterpart.name, handle: v.counterpart.handle, nodeType: v.counterpart.nodeType })),
  ];
  const band = me?.trustScore ? (me.trustScore >= 1 ? "thick" : me.trustScore >= 0.4 ? "firm" : "thin") : "none";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Your node" value={<NodeBadge nodeType={me?.nodeType} band={band} />} hint={me?.trustScore !== undefined ? `score ${me.trustScore.toFixed(3)}` : ""} />
        <Stat label="Vouch budget" value={`${data.budget.remaining} / ${data.budget.total}`} hint="score × 5 per season" />
        <Stat label="Received" value={data.received.filter((v) => v.status === "ACTIVE").length} hint={`${data.received.filter((v) => v.status === "PENDING").length} pending attestation`} />
        <Stat label="Staked" value={data.given.filter((v) => v.status === "ACTIVE").length} hint="if they rug, you lose standing" />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <Frost className="p-3 md:p-4">
          <IceGraph me={me?.name ?? "you"} links={links} band={band} />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-2">
            <span><span className="inline-block w-6 h-1.5 rounded align-middle" style={{ background: "var(--ice-in-person)" }} /> in person 1.0</span>
            <span><span className="inline-block w-6 h-1 rounded align-middle" style={{ background: "var(--ice-shipped)" }} /> shipped together 0.8</span>
            <span><span className="inline-block w-6 h-0.5 rounded align-middle" style={{ background: "var(--ice-vision)" }} /> shared vision 0.3</span>
            <span>dotted = pending a room&apos;s attestation · dashed red = slashed</span>
          </div>
        </Frost>
        <Frost>
          <SectionTitle icon={<Link2 className="h-4 w-4 text-sky-500" />}>Vouch for someone</SectionTitle>
          <GiveVouch costs={data.budget.costs} remaining={data.budget.remaining} />
        </Frost>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Frost>
          <SectionTitle>Vouches you hold</SectionTitle>
          {data.received.length === 0 && <Empty>None yet. The strongest trust comes from people who have physically met. Find a <Link href="/regions" className="underline">room</Link>.</Empty>}
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.received.map((v) => <VouchRow key={v.id} v={v} side="to" />)}</ul>
        </Frost>
        <Frost>
          <SectionTitle>Vouches you gave</SectionTitle>
          {data.given.length === 0 && <Empty>A vouch is a stake. Spend it on people you have met or built with.</Empty>}
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.given.map((v) => <VouchRow key={v.id} v={v} side="from" />)}</ul>
        </Frost>
      </div>
    </div>
  );
}

function VouchRow({ v, side }: { v: Vouch; side: "from" | "to" }) {
  const visible = side === "from" ? v.fromVisible : v.toVisible;
  const toggle = useWorldMutation(async (next: boolean) => worldFetch(`/api/world/vouches/${v.id}/visibility`, { method: "POST", body: { visible: next } }));
  const revoke = useWorldMutation(async () => worldFetch(`/api/world/vouches/${v.id}`, { method: "DELETE" }));
  const attest = useWorldMutation(async (txHash: string) => worldFetch(`/api/world/vouches/${v.id}/attest`, { method: "POST", body: { txHash } }));
  const { sendTransactionAsync, isPending: sending } = useSendTransaction();
  const { address } = useWorldSession();

  const anchorOnChain = async () => {
    if (!address) return;
    const hash = await sendTransactionAsync({ to: address as `0x${string}`, value: BigInt(0), data: v.commitment as `0x${string}` });
    await attest.mutateAsync(hash);
  };

  return (
    <li className="py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <NameLink handle={v.counterpart.handle} name={v.counterpart.name} />
            <NodeBadge nodeType={v.counterpart.nodeType} />
            <span className="text-xs text-muted-foreground">{TYPE_LABEL[v.type]} · {v.weight}</span>
            <span className={`text-[10px] rounded px-1.5 ${v.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : v.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" : v.status === "SLASHED" ? "bg-red-100 text-red-800" : "bg-zinc-200 dark:bg-zinc-700"}`}>{v.status.toLowerCase()}</span>
          </div>
          <div className="text-xs text-muted-foreground">{v.region ? `${v.region.name} · ` : ""}{fmtDate(v.createdAt)}{v.note ? ` · “${v.note}”` : ""}</div>
          {v.onchainTx ? (
            <a className="text-[11px] text-sky-600 hover:underline" href={`https://snowtrace.io/tx/${v.onchainTx}`} target="_blank" rel="noreferrer">attested on C-Chain</a>
          ) : (
            side === "from" && v.status === "ACTIVE" && <button className="text-[11px] text-sky-600 hover:underline flex items-center gap-1" onClick={anchorOnChain} disabled={sending || attest.isPending}><Anchor className="h-3 w-3" /> {sending || attest.isPending ? "attesting…" : "attest on C-Chain"}</button>
          )}
          {attest.error && <p className="text-[11px] text-red-600">{(attest.error as Error).message}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button title={visible ? "Visible on the profile" : "Private to the two of you"} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700" onClick={() => toggle.mutate(!visible)}>{visible ? <Eye className="h-4 w-4 text-sky-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</button>
          {side === "from" && v.status !== "SLASHED" && v.status !== "REVOKED" && <button title="Revoke (budget is not refunded)" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700" onClick={() => revoke.mutate(undefined)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
      </div>
    </li>
  );
}

function GiveVouch({ costs, remaining }: { costs: Record<string, number>; remaining: number }) {
  const [to, setTo] = useState("");
  const [type, setType] = useState("SHARED_VISION");
  const [note, setNote] = useState("");
  const [eventId, setEventId] = useState("");
  const [crewSlug, setCrewSlug] = useState("");
  const [visible, setVisible] = useState(false);
  const give = useWorldMutation(async () => {
    await worldFetch("/api/world/vouches", { method: "POST", body: { to, type, note: note || undefined, eventId: eventId || undefined, crewSlug: crewSlug || undefined, visible } });
    setTo(""); setNote(""); setEventId(""); setCrewSlug("");
  });
  const cost = costs[type] ?? 0;
  return (
    <div className="space-y-3 text-sm">
      <div><Label>Their name or wallet</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="handle or 0x…" /></div>
      <div>
        <Label>Link type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_PERSON">In person · same room, region attests · costs 1.0</SelectItem>
            <SelectItem value="SHIPPED_TOGETHER">Shipped together · same crew, verified proof · 0.8</SelectItem>
            <SelectItem value="SHARED_VISION">Shared vision · reviewed their work · 0.3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "IN_PERSON" && <div><Label>Event id (the room you both checked in to)</Label><Input value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="from the event page" /></div>}
      {type === "SHIPPED_TOGETHER" && <div><Label>Crew</Label><Input value={crewSlug} onChange={(e) => setCrewSlug(e.target.value)} placeholder="crew slug" /></div>}
      <div><Label>Note (private to the two of you)</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What you reviewed or built together" /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show my name on their profile</Label><Switch checked={visible} onCheckedChange={setVisible} /></div>
      <div className="text-xs text-muted-foreground">Costs {cost} of your {remaining} remaining budget. If they rug, you lose 20% of what you staked.</div>
      {give.error && <p className="text-xs text-red-600">{(give.error as Error).message}</p>}
      {give.isSuccess && <p className="text-xs text-emerald-600">Staked.</p>}
      <Button className="snow-button" onClick={() => give.mutate(undefined)} disabled={give.isPending || !to || cost > remaining}>Stake the vouch</Button>
    </div>
  );
}
