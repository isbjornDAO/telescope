"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Flag, Handshake, Landmark } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, Weight, fmtDate } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FactionView {
  name: string; slug: string; vision: string; description: string | null; standing: number; standingBand: string; treasury: number; founder: string | null; members: number; lasting: boolean; createdAt: string;
  regions: { name: string; slug: string }[]; crews: { name: string; slug: string; standing: number; region: { name: string; slug: string } | null; members: number }[];
  record: { id: string; title: string; tournament: string; status: string; isVictor: boolean; season: { number: number; name: string }; crew: { name: string; slug: string } | null }[];
  alliances: { id: string; name: string; seasonNumber: number; status: string; terms: string; factions: { id: string; name: string; slug: string }[]; accepted: string[] }[];
  standingHistory: { id: string; amount: number; reason: string; createdAt: string; vestedFraction: number | null }[];
  viewer: { isMember: boolean; isFounder: boolean };
}

export default function FactionPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useWorldQuery<FactionView>(["faction", slug], `/api/world/factions/${slug}`);
  const join = useWorldMutation(async () => worldFetch(`/api/world/factions/${slug}/join`, { method: "POST" }));
  const leave = useWorldMutation(async () => worldFetch(`/api/world/factions/${slug}/leave`, { method: "POST" }));
  const { data: treasury } = useWorldQuery<{ balance: number; entries: { id: string; amount: number; reason: string; paidOut: boolean; createdAt: string }[] }>(["treasury", slug], data?.viewer.isMember ? `/api/world/factions/${slug}/treasury` : null);
  return (
    <WorldPage>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"><Flag className="h-6 w-6 text-sky-500" />{data.name}{data.lasting && <span className="text-xs font-semibold rounded-full ice-pill-anchor border px-2 py-0.5">lasting</span>}</h1>
                <p className="text-base mt-1"><b>Vision:</b> {data.vision}</p>
                {data.description && <p className="text-sm text-muted-foreground mt-1">{data.description}</p>}
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                  <span>{data.members} members</span><span>{data.crews.length} crews</span>
                  <span>regions: {data.regions.length ? data.regions.map((r, i) => <span key={r.slug}>{i > 0 ? ", " : ""}<Link href={`/regions/${r.slug}`} className="hover:underline">{r.name}</Link></span>) : "none"}</span>
                  <span>founded {fmtDate(data.createdAt)}{data.founder ? ` by ${data.founder}` : ""}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg"><Weight value={data.standing} /></div>
                <div className="text-xs text-muted-foreground">{data.standingBand} ice · treasury {data.treasury}</div>
                <WorldGate compact>
                  <div className="mt-2">{data.viewer.isMember ? <Button size="sm" variant="ghost" onClick={() => leave.mutate(undefined)}>Leave</Button> : <Button size="sm" className="snow-button" onClick={() => join.mutate(undefined)} disabled={join.isPending}>Join</Button>}</div>
                  {(join.error || leave.error) && <p className="text-xs text-red-600 mt-1">{((join.error ?? leave.error) as Error).message}</p>}
                </WorldGate>
              </div>
            </div>
          </Frost>
          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle>Crews</SectionTitle>
              <ul className="text-sm space-y-1">{data.crews.map((c) => <li key={c.slug} className="flex justify-between"><span><Link href={`/crews/${c.slug}`} className="font-medium hover:underline">{c.name}</Link> <span className="text-xs text-muted-foreground">{c.members} · {c.region?.name ?? "no region"}</span></span><Weight value={c.standing} /></li>)}</ul>
              {data.viewer.isMember && <AttachCrew slug={data.slug} />}
            </Frost>
            <Frost>
              <SectionTitle>Record</SectionTitle>
              {data.record.length === 0 && <Empty>Research → design → ship. A faction that carries one idea through all three has done what a company does.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.record.map((e) => <li key={e.id} className="py-2 flex items-center justify-between gap-2"><div><Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.isVictor ? "👑 " : ""}{e.title}</Link><div className="text-xs text-muted-foreground">{e.season.name}{e.crew ? ` · ${e.crew.name}` : ""}</div></div><div className="flex gap-1"><TournamentBadge tournament={e.tournament} /><StatusBadge status={e.status} /></div></li>)}</ul>
            </Frost>
            <Frost>
              <SectionTitle icon={<Handshake className="h-4 w-4 text-sky-500" />}>Alliances</SectionTitle>
              {data.alliances.length === 0 && <Empty>None. Allies pool Local Systems and Research Papers entries and share standing by terms set in advance.</Empty>}
              <ul className="text-sm space-y-2">{data.alliances.map((a) => <AllianceRow key={a.id} a={a} />)}</ul>
              {data.viewer.isMember && <ProposeAlliance />}
            </Frost>
            <Frost>
              <SectionTitle icon={<Landmark className="h-4 w-4 text-sky-500" />}>Weight and treasury</SectionTitle>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.standingHistory.map((s) => <li key={s.id} className="py-1.5 flex justify-between gap-2"><span className="text-muted-foreground">{s.reason}</span><span className={s.amount < 0 ? "text-red-600" : "text-emerald-600"}>{s.amount > 0 ? "+" : ""}{s.amount}{s.vestedFraction === null ? " (vesting)" : ""}</span></li>)}</ul>
              {treasury && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">Treasury ledger (members only) · balance {treasury.balance}</div>
                  <ul>{treasury.entries.map((t) => <li key={t.id}>{fmtDate(t.createdAt)} · {t.amount} · {t.reason}{t.paidOut ? " · paid" : ""}</li>)}</ul>
                  <p className="mt-1">Season One treasuries are ledger entries, paid out manually.</p>
                </div>
              )}
            </Frost>
          </div>
        </div>
      )}
    </WorldPage>
  );
}

function AttachCrew({ slug }: { slug: string }) {
  const [crewSlug, setCrewSlug] = useState("");
  const attach = useWorldMutation(async () => { await worldFetch(`/api/world/factions/${slug}/crews`, { method: "POST", body: { crewSlug } }); setCrewSlug(""); });
  return (
    <div className="mt-3 flex gap-2">
      <Input value={crewSlug} onChange={(e) => setCrewSlug(e.target.value)} placeholder="bring a crew you lead (slug)" />
      <Button size="sm" variant="outline" onClick={() => attach.mutate(undefined)} disabled={attach.isPending || !crewSlug}>Attach</Button>
      {attach.error && <p className="text-xs text-red-600">{(attach.error as Error).message}</p>}
    </div>
  );
}

function AllianceRow({ a }: { a: FactionView["alliances"][number] }) {
  const accept = useWorldMutation(async () => worldFetch(`/api/world/alliances/${a.id}/accept`, { method: "POST" }));
  return (
    <li className="rounded border border-zinc-200 dark:border-zinc-700 p-2">
      <div className="flex items-center justify-between gap-2"><b>{a.name}</b><span className="text-xs capitalize text-muted-foreground">season {a.seasonNumber} · {a.status.toLowerCase()}</span></div>
      <div className="text-xs">{a.factions.map((f, i) => <span key={f.id}>{i > 0 ? " + " : ""}<Link href={`/factions/${f.slug}`} className="hover:underline">{f.name}</Link>{a.accepted.includes(f.id) ? " ✓" : ""}</span>)}</div>
      <p className="text-xs text-muted-foreground mt-1">{a.terms}</p>
      {a.status === "PROPOSED" && <Button size="sm" variant="outline" className="mt-2" onClick={() => accept.mutate(undefined)} disabled={accept.isPending}>Accept for my faction</Button>}
      {accept.error && <p className="text-xs text-red-600">{(accept.error as Error).message}</p>}
    </li>
  );
}

function ProposeAlliance() {
  const [name, setName] = useState("");
  const [slugs, setSlugs] = useState("");
  const [terms, setTerms] = useState("");
  const propose = useWorldMutation(async () => { await worldFetch("/api/world/alliances", { method: "POST", body: { name, factionSlugs: slugs.split(",").map((s) => s.trim()).filter(Boolean), terms } }); setName(""); setSlugs(""); setTerms(""); });
  return (
    <div className="mt-3 space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Propose an alliance for this season</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="alliance name" />
      <Input value={slugs} onChange={(e) => setSlugs(e.target.value)} placeholder="other faction slugs, comma separated" />
      <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="how standing is shared, in plain words (equal split by default)" />
      {propose.error && <p className="text-xs text-red-600">{(propose.error as Error).message}</p>}
      <Button size="sm" variant="outline" onClick={() => propose.mutate(undefined)} disabled={propose.isPending || !name || !slugs || terms.length < 10}>Propose</Button>
    </div>
  );
}
