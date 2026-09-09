"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Package, Pencil, Plus } from "lucide-react";
import { useWorldQuery, useWorldSession, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, fmtDate } from "@/components/world/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Profile {
  handle: string | null;
  name: string;
  bio: string | null;
  shipped: { id: string; kind: string; title: string; description: string | null; verified: boolean; shippedAt: string | null }[];
  seasonHistory: { id: string; title: string; tournament: string; status: string; isVictor: boolean; season: { number: number; name: string } }[];
  since: string;
  address?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const key = decodeURIComponent(String(params.address));
  const { me, isSignedIn } = useWorldSession();
  const isOwn = !!me?.signedIn && (me.address?.toLowerCase() === key.toLowerCase() || (!!me.handle && me.handle === key));
  const url = isOwn && isSignedIn ? "/api/world/me" : `/api/world/profiles/${encodeURIComponent(key)}`;
  const { data, isLoading, error } = useWorldQuery<Profile>(["profile", key, isOwn], url);

  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={4} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{data.bio || (isOwn ? "Add a line about what you build." : "")}</p>
                <p className="text-xs text-muted-foreground mt-2">Here since {fmtDate(data.since)}</p>
              </div>
              {isOwn && <EditProfile profile={data} />}
            </div>
          </Frost>

          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle icon={<Package className="h-4 w-4 text-sky-500" />} right={isOwn ? <AddProof /> : undefined}>Built</SectionTitle>
              {data.shipped.length === 0 && <Empty>Nothing listed yet.</Empty>}
              <ul className="space-y-2">
                {data.shipped.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="font-semibold">{p.title}</div>
                    {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                    {p.shippedAt && <div className="text-xs text-muted-foreground">{fmtDate(p.shippedAt)}</div>}
                  </li>
                ))}
              </ul>
            </Frost>

            <Frost>
              <SectionTitle>Tournaments</SectionTitle>
              {data.seasonHistory.length === 0 && <Empty>No entries yet.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
                {data.seasonHistory.map((e) => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/entries/${e.id}`} className="font-semibold hover:underline">{e.isVictor ? "👑 " : ""}{e.title}</Link>
                    </div>
                    <div className="flex gap-1 flex-shrink-0"><TournamentBadge tournament={e.tournament} /><StatusBadge status={e.status} /></div>
                  </li>
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
  const save = useWorldMutation(async () => {
    await worldFetch("/api/world/me", { method: "PATCH", body: { handle: handle || undefined, bio } });
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Your profile</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="letters, digits, underscores" /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} /></div>
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
  const [description, setDescription] = useState("");
  const add = useWorldMutation(async () => {
    await worldFetch("/api/world/me/proofs", { method: "POST", body: { title, kind: "SHIPPED", description: description || undefined } });
    setOpen(false);
    setTitle(""); setDescription("");
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Plus className="h-3.5 w-3.5" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add something you built</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>What is it</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          {add.error && <p className="text-sm text-red-600">{(add.error as Error).message}</p>}
          <Button className="snow-button" onClick={() => add.mutate(undefined)} disabled={add.isPending || !title}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
