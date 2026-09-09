"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Plus } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Empty, LoadingBlock, ErrorBlock, Weight } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Faction { name: string; slug: string; vision: string; standing: number; members: number; crews: number; entries: number; regions: number; victor: string | null }

export default function FactionsPage() {
  const { data, isLoading, error } = useWorldQuery<Faction[]>(["factions"], "/api/world/factions");
  return (
    <WorldPage title="Factions" subtitle="The container for a large, lasting company: more than one crew, held together by a shared vision, with a treasury, presence in more than one region, and standing that compounds across seasons. Factions form around visions, not tokens." actions={<NewFaction />}>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && data.length === 0 && <Empty>No factions yet. A faction that only exists in one place is a crew with ambitions.</Empty>}
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((f) => (
          <Link key={f.slug} href={`/factions/${f.slug}`} className="frost rounded-xl p-4 hover:border-sky-400 transition-colors">
            <div className="flex items-start justify-between gap-2"><div className="font-semibold flex items-center gap-2"><Flag className="h-4 w-4 text-sky-500" />{f.victor ? "👑 " : ""}{f.name}</div><Weight value={f.standing} /></div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.vision}</p>
            <div className="text-xs text-muted-foreground mt-2">{f.crews} crews · {f.members} members · {f.regions} regions · {f.entries} entries{f.regions > 1 && f.crews > 1 ? " · lasting" : ""}</div>
          </Link>
        ))}
      </div>
    </WorldPage>
  );
}

function NewFaction() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");
  const [crewSlug, setCrewSlug] = useState("");
  const { data: me } = useWorldQuery<{ crews: { name: string; slug: string; isLead: boolean }[] }>(["me-full"], open ? "/api/world/me" : null);
  const create = useWorldMutation(async () => { await worldFetch("/api/world/factions", { method: "POST", body: { name, vision, crewSlug } }); setOpen(false); });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="snow-button"><Plus className="h-4 w-4 mr-1" /> Found a faction</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Found a faction</DialogTitle></DialogHeader>
        <WorldGate message="Sign in to found a faction.">
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Vision: what the faction exists to build</Label><Textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={3} placeholder="privacy infrastructure, local records systems, climate and conservation tooling, agentic finance…" /></div>
            <div>
              <Label>Bring a crew you lead</Label>
              <Select value={crewSlug} onValueChange={setCrewSlug}><SelectTrigger><SelectValue placeholder="Pick a crew" /></SelectTrigger><SelectContent>{(me?.crews ?? []).filter((c) => c.isLead).map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <p className="text-xs text-muted-foreground">One faction per person. Moving between factions happens between seasons, not during.</p>
            {create.error && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
            <Button className="snow-button" onClick={() => create.mutate(undefined)} disabled={create.isPending || name.length < 2 || vision.length < 10 || !crewSlug}>Found</Button>
          </div>
        </WorldGate>
      </DialogContent>
    </Dialog>
  );
}
