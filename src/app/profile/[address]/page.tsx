"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Package, Link2, Radar, Flag, Users, MapPin, Pencil, Upload, Plus } from "lucide-react";
import { useWorldQuery, useWorldSession, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, NodeBadge, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, Weight, fmtDate } from "@/components/world/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  handle: string | null;
  name: string;
  bio: string | null;
  nodeType: "NODE" | "ANCHOR" | "ELDER";
  band: string;
  standing: number;
  region: { name: string; slug: string } | null;
  faction: { name: string; slug: string; vision: string; standing: number } | null;
  crews: { name: string; slug: string; standing: number; role: string | null; isLead: boolean; faction: { name: string; slug: string } | null }[];
  shipped: { id: string; kind: string; source: string; title: string; description: string | null; proofHash: string; verified: boolean; shippedAt: string | null; crew: { name: string; slug: string } | null }[];
  trust: { vouchesAtLeast: number; inPersonAtLeast: number; shippedTogetherAtLeast: number; sharedVisionAtLeast: number; regions: { slug: string; name: string; atLeast: number }[]; band: string; visibleVouchers: { handle: string; type: string }[] };
  lookingFor: { type: string; tags: string[]; expiresAt: string }[];
  seasonHistory: { id: string; title: string; tournament: string; status: string; isVictor: boolean; season: { number: number; name: string } }[];
  standingHistory: { id: string; amount: number; reason: string; createdAt: string; vestedFraction: number | null }[];
  since: string;
  // private
  address?: string;
  trustScore?: number;
  vouchBudget?: { total: number; spent: number; remaining: number };
}

const INTENT_LABEL: Record<string, string> = { ROLE: "a role to fill", PARTNER_PROJECT: "a partner project", REGION_ADOPT: "a region to bring a tool to", RESEARCH_QUESTION: "a research question" };

export default function ProfilePage() {
  const params = useParams();
  const key = decodeURIComponent(String(params.address));
  const { me, isSignedIn } = useWorldSession();
  const isOwn = !!me?.signedIn && (me.address?.toLowerCase() === key.toLowerCase() || (!!me.handle && me.handle === key));
  const url = isOwn && isSignedIn ? "/api/world/me" : `/api/world/profiles/${encodeURIComponent(key)}`;
  const { data, isLoading, error } = useWorldQuery<Profile>(["profile", key, isOwn], url);

  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.name}</h1>
                  <NodeBadge nodeType={data.nodeType} band={data.band} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{data.bio || (isOwn ? "No bio yet. Say what you build, not who you are." : "A profile is a name they chose.")}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-3">
                  {data.region && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-500" /><Link href={`/regions/${data.region.slug}`} className="hover:underline">{data.region.name}</Link></span>}
                  {data.faction && <span className="flex items-center gap-1"><Flag className="h-3.5 w-3.5 text-sky-500" /><Link href={`/factions/${data.faction.slug}`} className="hover:underline">{data.faction.name}</Link></span>}
                  {data.crews.map((c) => <span key={c.slug} className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-sky-500" /><Link href={`/crews/${c.slug}`} className="hover:underline">{c.name}</Link>{c.isLead && <span className="text-xs text-muted-foreground">lead</span>}</span>)}
                  <span className="text-muted-foreground">in the world since {fmtDate(data.since)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg"><Weight value={data.standing} /></div>
                {isOwn && data.trustScore !== undefined && <div className="text-xs text-muted-foreground">trust score {data.trustScore.toFixed(3)} · only you see this number</div>}
                {isOwn && <div className="mt-2"><EditProfile profile={data} /></div>}
              </div>
            </div>
          </Frost>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Layer 1: shipped */}
            <Frost>
              <SectionTitle icon={<Package className="h-4 w-4 text-sky-500" />} right={isOwn ? <AddProof /> : undefined}>What they shipped</SectionTitle>
              {data.shipped.length === 0 && <Empty>No proofs yet. {isOwn ? "Import from Builder\u2019s Hub or add one." : ""}</Empty>}
              <ul className="space-y-2">
                {data.shipped.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="font-semibold flex items-center gap-2">{p.title} {p.verified ? <span className="text-[10px] rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 px-1.5">proof</span> : <span className="text-[10px] rounded bg-zinc-200 dark:bg-zinc-700 px-1.5">unverified</span>}</div>
                    <div className="text-xs text-muted-foreground">{p.kind.toLowerCase()} · {p.source === "BUILDERS_HUB" ? "Builder's Hub" : p.source.toLowerCase()}{p.crew ? ` · with ${p.crew.name}` : ""}{p.shippedAt ? ` · ${fmtDate(p.shippedAt)}` : ""}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate" title={p.proofHash}>{p.proofHash.slice(0, 18)}…</div>
                  </li>
                ))}
              </ul>
            </Frost>

            {/* Layer 2: trust */}
            <Frost>
              <SectionTitle icon={<Link2 className="h-4 w-4 text-sky-500" />}>Who vouches</SectionTitle>
              <p className="text-xs text-muted-foreground mb-3">Shown as proofs and aggregates. Names only where both sides chose to be visible.</p>
              <ul className="text-sm space-y-1">
                <li>At least <b>{data.trust.vouchesAtLeast}</b> vouches</li>
                <li>At least <b>{data.trust.inPersonAtLeast}</b> in person · <b>{data.trust.shippedTogetherAtLeast}</b> shipped together · <b>{data.trust.sharedVisionAtLeast}</b> shared vision</li>
                {data.trust.regions.map((r) => <li key={r.slug}>At least <b>{r.atLeast}</b> in-person from <Link href={`/regions/${r.slug}`} className="hover:underline">{r.name}</Link></li>)}
                <li>Ice: <b>{data.trust.band}</b></li>
              </ul>
              {data.trust.visibleVouchers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {data.trust.visibleVouchers.map((v) => <Link key={v.handle + v.type} href={`/profile/${v.handle}`} className="text-xs rounded-full border px-2 py-0.5 hover:bg-sky-50 dark:hover:bg-sky-900/30">{v.handle}</Link>)}
                </div>
              )}
              {isOwn && data.vouchBudget && <p className="text-xs text-muted-foreground mt-3">Your vouch budget this season: {data.vouchBudget.remaining} of {data.vouchBudget.total}. <Link href="/trust" className="underline">Manage</Link></p>}
            </Frost>

            {/* Layer 3: looking for */}
            <Frost>
              <SectionTitle icon={<Radar className="h-4 w-4 text-sky-500" />} right={isOwn ? <Link href="/scout" className="text-xs text-sky-600 hover:underline">edit</Link> : undefined}>Looking for right now</SectionTitle>
              {data.lookingFor.length === 0 && <Empty>{isOwn ? "Nothing yet. Tell your scout." : "Nothing this season."}</Empty>}
              <ul className="space-y-2 text-sm">
                {data.lookingFor.map((i, k) => (
                  <li key={k}>
                    <div className="font-semibold">{INTENT_LABEL[i.type] ?? i.type}</div>
                    <div className="flex flex-wrap gap-1 mt-1">{i.tags.map((t) => <span key={t} className="text-[11px] rounded bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5">{t}</span>)}</div>
                    <div className="text-[11px] text-muted-foreground">renews {fmtDate(i.expiresAt)}</div>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">Scouts talk to scouts. Details are private until both humans accept a match.</p>
            </Frost>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle>Season history</SectionTitle>
              {data.seasonHistory.length === 0 && <Empty>No entries yet.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
                {data.seasonHistory.map((e) => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0"><Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.isVictor ? "👑 " : ""}{e.title}</Link><div className="text-xs text-muted-foreground">{e.season.name}</div></div>
                    <div className="flex gap-1 shrink-0"><TournamentBadge tournament={e.tournament} /><StatusBadge status={e.status} /></div>
                  </li>
                ))}
              </ul>
            </Frost>
            <Frost>
              <SectionTitle>Weight history</SectionTitle>
              {data.standingHistory.length === 0 && <Empty>Standing is season-earned trust. It belongs to whoever earned it and does not travel.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
                {data.standingHistory.map((s) => (
                  <li key={s.id} className="py-2 flex justify-between gap-2"><span className="text-muted-foreground">{s.reason}</span><span className={s.amount < 0 ? "text-red-600" : "text-emerald-600"}>{s.amount > 0 ? "+" : ""}{s.amount}{s.vestedFraction === null ? " (vesting)" : ""}</span></li>
                ))}
              </ul>
            </Frost>
          </div>
        </div>
      )}
    </WorldPage>
  );
}

function EditProfile({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [regionSlug, setRegionSlug] = useState(profile.region?.slug ?? "");
  const { data: regions } = useWorldQuery<{ name: string; slug: string }[]>(["regions"], "/api/world/regions");
  const save = useWorldMutation(async () => {
    await worldFetch("/api/world/me", { method: "PATCH", body: { handle: handle || undefined, bio, regionSlug: regionSlug || null } });
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Your profile</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name you chose</Label><Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="3–24 letters, digits, underscores" /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="What you build. Not who you are." /></div>
          <div>
            <Label>Home region</Label>
            <Select value={regionSlug || "none"} onValueChange={(v) => setRegionSlug(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Pick a region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No region yet</SelectItem>
                {(regions ?? []).map((r) => <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {save.error && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
          <Button className="snow-button" onClick={() => save.mutate(undefined)} disabled={save.isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProof() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("SHIPPED");
  const [description, setDescription] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const add = useWorldMutation(async () => {
    await worldFetch("/api/world/me/proofs", { method: "POST", body: { title, kind, description: description || undefined, externalRef: externalRef || undefined } });
    setOpen(false);
    setTitle(""); setDescription(""); setExternalRef("");
  });
  const importHub = useWorldMutation(async () => worldFetch<{ imported: number }>("/api/world/me/proofs/import", { method: "POST" }));
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => importHub.mutate(undefined)} disabled={importHub.isPending} title="Import from Builder's Hub"><Upload className="h-3.5 w-3.5" /></Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button size="sm" variant="ghost"><Plus className="h-3.5 w-3.5" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a proof</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Builder&apos;s Hub import verifies automatically. Manual proofs show as unverified until a world admin confirms them against the source.</p>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <Label>Kind</Label>
              <Select value={kind} onValueChange={setKind}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SHIPPED">Shipped product</SelectItem><SelectItem value="HACKATHON">Hackathon</SelectItem><SelectItem value="ACTIVITY">Activity</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div><Label>Source reference (private)</Label><Input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="Builder's Hub project id, repo, tx…" /></div>
            {add.error && <p className="text-sm text-red-600">{(add.error as Error).message}</p>}
            <Button className="snow-button" onClick={() => add.mutate(undefined)} disabled={add.isPending || !title}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
      {importHub.error && <span className="text-[11px] text-muted-foreground self-center">{(importHub.error as Error).message}</span>}
    </div>
  );
}
