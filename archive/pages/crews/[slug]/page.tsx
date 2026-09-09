"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, UserPlus, LogOut } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, NameLink, NodeBadge, TournamentBadge, StatusBadge, Weight, fmtDate } from "@/components/world/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CrewView {
  name: string; slug: string; description: string | null; standing: number; region: { name: string; slug: string } | null; faction: { name: string; slug: string; vision: string } | null; createdAt: string;
  members: { id: string; name: string; handle: string | null; nodeType: string; role: string | null; isLead: boolean }[];
  record: { id: string; title: string; tournament: string; status: string; isVictor: boolean; season: { number: number; name: string } }[];
  shipped: { id: string; title: string; kind: string; shippedAt: string | null }[];
  viewer: { isMember: boolean; isLead: boolean };
}

export default function CrewPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useWorldQuery<CrewView>(["crew", slug], `/api/world/crews/${slug}`);
  const [handle, setHandle] = useState("");
  const invite = useWorldMutation(async () => { await worldFetch(`/api/world/crews/${slug}/members`, { method: "POST", body: { handle } }); setHandle(""); });
  const leave = useWorldMutation(async () => worldFetch(`/api/world/crews/${slug}/members/me`, { method: "DELETE" }));
  return (
    <WorldPage>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"><Users className="h-6 w-6 text-sky-500" />{data.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                  {data.region && <span>from <Link href={`/regions/${data.region.slug}`} className="hover:underline font-medium">{data.region.name}</Link></span>}
                  {data.faction ? <span>faction <Link href={`/factions/${data.faction.slug}`} className="hover:underline font-medium">{data.faction.name}</Link></span> : <span>no faction yet</span>}
                  <span>since {fmtDate(data.createdAt)}</span>
                </div>
              </div>
              <div className="text-right"><div className="text-lg"><Weight value={data.standing} /></div>{data.viewer.isMember && <Button size="sm" variant="ghost" onClick={() => leave.mutate(undefined)} className="mt-1"><LogOut className="h-3.5 w-3.5 mr-1" /> Leave</Button>}</div>
            </div>
          </Frost>
          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle>Members</SectionTitle>
              <ul className="space-y-1 text-sm">{data.members.map((m) => <li key={m.id} className="flex items-center gap-2"><NameLink handle={m.handle} name={m.name} /><NodeBadge nodeType={m.nodeType} />{m.isLead && <span className="text-xs text-muted-foreground">lead</span>}{m.role && !m.isLead && <span className="text-xs text-muted-foreground">{m.role}</span>}</li>)}</ul>
              {data.viewer.isLead && (
                <div className="mt-4 flex gap-2">
                  <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="invite by name or wallet" />
                  <Button size="sm" className="snow-button" onClick={() => invite.mutate(undefined)} disabled={invite.isPending || !handle}><UserPlus className="h-3.5 w-3.5" /></Button>
                </div>
              )}
              {invite.error && <p className="text-xs text-red-600 mt-1">{(invite.error as Error).message}</p>}
            </Frost>
            <Frost>
              <SectionTitle>Record</SectionTitle>
              {data.record.length === 0 && <Empty>Nothing entered yet.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.record.map((e) => <li key={e.id} className="py-2 flex items-center justify-between gap-2"><div><Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.isVictor ? "👑 " : ""}{e.title}</Link><div className="text-xs text-muted-foreground">{e.season.name}</div></div><div className="flex gap-1"><TournamentBadge tournament={e.tournament} /><StatusBadge status={e.status} /></div></li>)}</ul>
              {data.shipped.length > 0 && <div className="mt-3 text-xs text-muted-foreground">Verified shipped: {data.shipped.map((p) => p.title).join(", ")}</div>}
            </Frost>
          </div>
        </div>
      )}
    </WorldPage>
  );
}
