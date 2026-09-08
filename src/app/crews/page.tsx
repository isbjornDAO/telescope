"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Empty, LoadingBlock, ErrorBlock, Weight } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Crew { name: string; slug: string; description: string | null; standing: number; region: { name: string; slug: string } | null; faction: { name: string; slug: string } | null; members: number; entries: number; victor: string | null }

export default function CrewsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useWorldQuery<Crew[]>(["crews", q], `/api/world/crews${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return (
    <WorldPage title="Crews" subtitle="A crew is a small team that ships something. Crews form through scouts, at in-person events, or by invitation. Crews are the unit that enters GTM." actions={<NewCrew />}>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crews" className="max-w-sm mb-4" />
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && data.length === 0 && <Empty>No crews yet. Form one.</Empty>}
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((c) => (
          <Link key={c.slug} href={`/crews/${c.slug}`} className="frost rounded-xl p-4 hover:border-sky-400 transition-colors">
            <div className="flex items-start justify-between gap-2"><div className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-sky-500" />{c.victor ? "👑 " : ""}{c.name}</div><Weight value={c.standing} /></div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
            <div className="text-xs text-muted-foreground mt-2">{c.members} members · {c.entries} entries{c.region ? ` · ${c.region.name}` : ""}{c.faction ? ` · ${c.faction.name}` : ""}</div>
          </Link>
        ))}
      </div>
    </WorldPage>
  );
}

function NewCrew() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useWorldMutation(async () => { await worldFetch("/api/world/crews", { method: "POST", body: { name, description } }); setOpen(false); setName(""); setDescription(""); });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="snow-button"><Plus className="h-4 w-4 mr-1" /> Form a crew</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Form a crew</DialogTitle></DialogHeader>
        <WorldGate message="Sign in to form a crew.">
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>What you ship</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <p className="text-xs text-muted-foreground">You lead it. Region of origin is your home region. If you are in a faction, the crew joins it.</p>
            {create.error && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
            <Button className="snow-button" onClick={() => create.mutate(undefined)} disabled={create.isPending || name.length < 2}>Create</Button>
          </div>
        </WorldGate>
      </DialogContent>
    </Dialog>
  );
}
