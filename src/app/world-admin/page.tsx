"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch, useWorldSession } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, fmtDateTime } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface State {
  seasons: { id: string; number: number; name: string; theme: string; status: string; phase: string; startsAt: string; endsAt: string; entries: number; panelIds: string[]; reviewerPoolIds: string[]; poolAmount: number }[];
  rounds: { id: string; seasonId: string; tournament: string; index: number; name: string; status: string; opensAt: string; closesAt: string; ballotCount: number }[];
  pendingProofs: { id: string; title: string; kind: string; source: string; by: string; createdAt: string }[];
  elders: string[]; anchors: number; regions: { name: string; slug: string; adminAddresses: string[] }[]; openFindings: number;
}

export default function WorldAdminPage() {
  const { me } = useWorldSession();
  return (
    <WorldPage title="World admin" subtitle="Isbjorn runs the world; the trust graph and the tournament record belong to the network. Panels, pools and thresholds are published before a season and locked during it.">
      <WorldGate message="Sign in as a world admin.">
        {me?.isAdmin ? <AdminInner /> : <Empty>Not a world admin. Set WORLD_ADMIN_ADDRESSES.</Empty>}
      </WorldGate>
    </WorldPage>
  );
}

function AdminInner() {
  const { data, isLoading, error } = useWorldQuery<State>(["admin"], "/api/world/admin/state");
  const tick = useWorldMutation(async () => worldFetch<{ seasons: string[] }>("/api/world/jobs/tick", { method: "POST" }));
  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Frost>
          <SectionTitle icon={<Settings className="h-4 w-4 text-sky-500" />} right={<Button size="sm" variant="outline" onClick={() => tick.mutate(undefined)} disabled={tick.isPending}>Run tick now</Button>}>Seasons</SectionTitle>
          {tick.data && <p className="text-xs text-muted-foreground mb-2">{tick.data.seasons.length ? tick.data.seasons.join(" · ") : "Nothing to transition."}</p>}
          {tick.error && <p className="text-xs text-red-600 mb-2">{(tick.error as Error).message}</p>}
          {data.seasons.length === 0 && <Empty>No seasons.</Empty>}
          <ul className="text-sm space-y-3">
            {data.seasons.map((s) => (
              <li key={s.id}>
                <div className="flex justify-between"><b>{s.name} · {s.theme}</b><span className="text-xs capitalize text-muted-foreground">{s.status.toLowerCase()} / {s.phase}</span></div>
                <div className="text-xs text-muted-foreground">{fmtDateTime(s.startsAt)} → {fmtDateTime(s.endsAt)} · {s.entries} entries · panel {s.panelIds.length} · pool {s.reviewerPoolIds.length} · {s.poolAmount}</div>
                <ul className="mt-1 grid sm:grid-cols-2 gap-1">
                  {data.rounds.filter((r) => r.seasonId === s.id).map((r) => <RoundRow key={r.id} r={r} />)}
                </ul>
              </li>
            ))}
          </ul>
          <NewSeason />
        </Frost>
        <div className="space-y-6">
          <Frost>
            <SectionTitle>Seed node types</SectionTitle>
            <p className="text-xs text-muted-foreground mb-2">(proposal) Isbjorn seeds the first Elders with Team1. {data.elders.length} elders: {data.elders.join(", ") || "none"} · {data.anchors} anchors.</p>
            <SeedNode />
          </Frost>
          <Frost>
            <SectionTitle>Regions</SectionTitle>
            <ul className="text-xs text-muted-foreground mb-2">{data.regions.map((r) => <li key={r.slug}>{r.name} · {r.adminAddresses.length} admins</li>)}</ul>
            <NewRegion />
          </Frost>
          <Frost>
            <SectionTitle>Unverified proofs · {data.pendingProofs.length}</SectionTitle>
            <ul className="text-sm space-y-1">{data.pendingProofs.map((p) => <ProofRow key={p.id} p={p} />)}</ul>
          </Frost>
        </div>
      </div>
    </div>
  );
}

function RoundRow({ r }: { r: State["rounds"][number] }) {
  const open = useWorldMutation(async () => worldFetch(`/api/world/admin/rounds/${r.id}/open`, { method: "POST" }));
  const close = useWorldMutation(async () => worldFetch(`/api/world/admin/rounds/${r.id}/close`, { method: "POST" }));
  return (
    <li className="text-xs flex items-center justify-between gap-1 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1">
      <span>{r.tournament.slice(0, 3)} {r.index} {r.name} · <span className="capitalize">{r.status.toLowerCase()}</span>{r.ballotCount ? ` · ${r.ballotCount}` : ""}</span>
      {r.status === "PENDING" && <button className="text-sky-600 hover:underline" onClick={() => open.mutate(undefined)}>open</button>}
      {r.status === "OPEN" && <button className="text-sky-600 hover:underline" onClick={() => close.mutate(undefined)}>close</button>}
    </li>
  );
}

function NewSeason() {
  const [theme, setTheme] = useState("");
  const [rq, setRq] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [pool, setPool] = useState("0");
  const [panel, setPanel] = useState("");
  const [reviewers, setReviewers] = useState("");
  const create = useWorldMutation(async () => worldFetch("/api/world/admin/seasons", { method: "POST", body: { theme, researchQuestion: rq, startsAt: new Date(startsAt).toISOString(), poolAmount: Number(pool) || 0, panelHandles: panel.split(",").map((s) => s.trim()).filter(Boolean), reviewerHandles: reviewers.split(",").map((s) => s.trim()).filter(Boolean) } }));
  return (
    <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Announce a winter</Label>
      <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="theme" />
      <Textarea value={rq} onChange={(e) => setRq(e.target.value)} rows={2} placeholder="the season's research question" />
      <div className="grid grid-cols-2 gap-2"><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /><Input type="number" value={pool} onChange={(e) => setPool(e.target.value)} placeholder="season pool (sponsor funded)" /></div>
      <Input value={panel} onChange={(e) => setPanel(e.target.value)} placeholder="Local Systems panel: elder handles, comma separated (9–15)" />
      <Input value={reviewers} onChange={(e) => setReviewers(e.target.value)} placeholder="Research review pool: handles, comma separated" />
      {create.error && <p className="text-xs text-red-600">{(create.error as Error).message}</p>}
      <Button size="sm" className="snow-button" onClick={() => create.mutate(undefined)} disabled={create.isPending || !theme || rq.length < 10 || !startsAt}>Create season</Button>
    </div>
  );
}

function SeedNode() {
  const [handle, setHandle] = useState("");
  const [nodeType, setNodeType] = useState("ELDER");
  const seed = useWorldMutation(async () => worldFetch(`/api/world/admin/users/${encodeURIComponent(handle)}/node-type`, { method: "POST", body: { nodeType } }));
  return (
    <div className="flex gap-2">
      <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="name or wallet" />
      <Select value={nodeType} onValueChange={setNodeType}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ELDER">Elder</SelectItem><SelectItem value="ANCHOR">Anchor</SelectItem><SelectItem value="NODE">Node</SelectItem></SelectContent></Select>
      <Button size="sm" variant="outline" onClick={() => seed.mutate(undefined)} disabled={seed.isPending || !handle}>Set</Button>
      {seed.error && <p className="text-xs text-red-600">{(seed.error as Error).message}</p>}
    </div>
  );
}

function NewRegion() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [admins, setAdmins] = useState("");
  const create = useWorldMutation(async () => worldFetch("/api/world/regions", { method: "POST", body: { name, country: country || undefined, lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined, adminAddresses: admins.split(",").map((s) => s.trim()).filter(Boolean) } }));
  return (
    <div className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="region name (a Team1 chapter)" />
      <div className="grid grid-cols-3 gap-2"><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="country" /><Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="lat" /><Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="lng" /></div>
      <Input value={admins} onChange={(e) => setAdmins(e.target.value)} placeholder="region admin wallets, comma separated (seeded as Anchors)" />
      {create.error && <p className="text-xs text-red-600">{(create.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => create.mutate(undefined)} disabled={create.isPending || !name}>Create region</Button>
    </div>
  );
}

function ProofRow({ p }: { p: State["pendingProofs"][number] }) {
  const verify = useWorldMutation(async (verified: boolean) => worldFetch(`/api/world/admin/proofs/${p.id}/verify`, { method: "POST", body: { verified } }));
  return (
    <li className="flex items-center justify-between gap-2"><span>{p.title} <span className="text-xs text-muted-foreground">{p.kind.toLowerCase()} · {p.by}</span></span><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => verify.mutate(true)}>Verify</Button></div></li>
  );
}
