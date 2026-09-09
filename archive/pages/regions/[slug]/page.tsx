"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, CalendarPlus, Home } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Stat, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, Weight, fmtDateTime } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegionView {
  id: string; name: string; slug: string; description: string | null; country: string | null; isChapter: boolean; runsNode: boolean; standing: number; nodes: number; anchors: number; elders: number; admins: string[] | number;
  crews: { name: string; slug: string; standing: number; faction: { name: string; slug: string } | null }[];
  events: { id: string; name: string; startsAt: string; endsAt: string; _count: { checkIns: number } }[];
  localSystems: { id: string; title: string; tournament: string; status: string; season: { number: number; name: string } }[];
  factions: { name: string; slug: string; standing: number }[];
  viewer: { isAdmin: boolean; isMember: boolean; isRegionAdmin: boolean };
}

export default function RegionPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useWorldQuery<RegionView>(["region", slug], `/api/world/regions/${slug}`);
  const join = useWorldMutation(async () => worldFetch(`/api/world/regions/${slug}/join`, { method: "POST" }));
  return (
    <WorldPage>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"><MapPin className="h-6 w-6 text-sky-500" />{data.name}{data.isChapter && <span className="text-xs rounded bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5">Team1 chapter</span>}</h1>
                <p className="text-sm text-muted-foreground mt-1">{data.description ?? "A floe: the ice this community stands on."}{data.country ? ` · ${data.country}` : ""}</p>
              </div>
              <div className="text-right">
                <div className="text-lg"><Weight value={data.standing} /></div>
                <WorldGate compact>{!data.viewer.isMember && <Button size="sm" variant="outline" className="mt-1" onClick={() => join.mutate(undefined)} disabled={join.isPending}><Home className="h-3.5 w-3.5 mr-1" /> Make this my home</Button>}</WorldGate>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Stat label="Nodes" value={data.nodes} />
              <Stat label="Anchors" value={data.anchors} hint="verified in person" />
              <Stat label="Elders" value={data.elders} />
            </div>
          </Frost>
          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle icon={<CalendarPlus className="h-4 w-4 text-sky-500" />}>Rooms</SectionTitle>
              <p className="text-xs text-muted-foreground mb-2">Check in at an event with the code on the door. Vouch for people you met there. The region attests it, and that is the only link that creates an Anchor.</p>
              {data.events.length === 0 && <Empty>No events yet.</Empty>}
              <ul className="text-sm space-y-1">{data.events.map((e) => <li key={e.id} className="flex justify-between gap-2"><Link href={`/regions/${data.slug}/events/${e.id}`} className="font-medium hover:underline">{e.name}</Link><span className="text-xs text-muted-foreground">{fmtDateTime(e.startsAt)} · {e._count.checkIns} checked in</span></li>)}</ul>
              {(data.viewer.isRegionAdmin || data.viewer.isAdmin) && <NewEvent slug={data.slug} />}
            </Frost>
            <Frost>
              <SectionTitle>Crews and factions here</SectionTitle>
              {data.crews.length === 0 && <Empty>No crews from here yet.</Empty>}
              <ul className="text-sm space-y-1">{data.crews.map((c) => <li key={c.slug} className="flex justify-between"><span><Link href={`/crews/${c.slug}`} className="font-medium hover:underline">{c.name}</Link>{c.faction && <span className="text-xs text-muted-foreground"> · {c.faction.name}</span>}</span><Weight value={c.standing} /></li>)}</ul>
              {data.factions.length > 0 && <div className="text-xs text-muted-foreground mt-2">Factions present: {data.factions.map((f, i) => <span key={f.slug}>{i > 0 ? ", " : ""}<Link href={`/factions/${f.slug}`} className="hover:underline">{f.name}</Link></span>)}</div>}
            </Frost>
            <Frost className="md:col-span-2">
              <SectionTitle>Local Systems for this community</SectionTitle>
              {data.localSystems.length === 0 && <Empty>Records, identity, payments, data, voting: the things a community actually needs. Designs entered for this region appear here.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.localSystems.map((e) => <li key={e.id} className="py-2 flex items-center justify-between gap-2"><div><Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.title}</Link><div className="text-xs text-muted-foreground">{e.season.name}</div></div><div className="flex gap-1"><TournamentBadge tournament={e.tournament} /><StatusBadge status={e.status} /></div></li>)}</ul>
            </Frost>
          </div>
        </div>
      )}
    </WorldPage>
  );
}

function NewEvent({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const create = useWorldMutation(async () => worldFetch<{ id: string; code: string; checkInUrl: string }>(`/api/world/regions/${slug}/events`, { method: "POST", body: { name, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() } }));
  return (
    <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Open a room</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="event name" />
      <div className="grid grid-cols-2 gap-2"><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
      {create.data && <div className="text-sm rounded bg-emerald-50 dark:bg-emerald-900/20 p-2">Door code: <b className="font-mono text-lg">{create.data.code}</b> · shown once. Put it on a QR at the door: <Link href={create.data.checkInUrl} className="underline break-all">{create.data.checkInUrl}</Link></div>}
      {create.error && <p className="text-xs text-red-600">{(create.error as Error).message}</p>}
      <Button size="sm" className="snow-button" onClick={() => create.mutate(undefined)} disabled={create.isPending || !name || !startsAt || !endsAt}>Create event</Button>
    </div>
  );
}
