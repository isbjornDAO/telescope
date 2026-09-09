"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DoorOpen, ShieldCheck, Link2 } from "lucide-react";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost, SectionTitle, Empty, LoadingBlock, ErrorBlock, NameLink, NodeBadge, fmtDateTime } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EventView {
  id: string; name: string; startsAt: string; endsAt: string; region: { name: string; slug: string }; checkIns: number; checkedIn: boolean; isAdmin: boolean; pendingVouches: number;
  attendees?: { id: string; name: string; handle: string | null; nodeType: string; checkedInAt: string }[];
}

export default function EventPage() {
  const { slug, eventId } = useParams();
  const search = useSearchParams();
  const [code, setCode] = useState(search.get("code") ?? "");
  const { data, isLoading, error } = useWorldQuery<EventView>(["event", eventId], `/api/world/regions/${slug}/events/${eventId}`);
  const checkin = useWorldMutation(async () => worldFetch(`/api/world/regions/${slug}/events/${eventId}/checkin`, { method: "POST", body: { code } }));
  const attest = useWorldMutation(async () => worldFetch<{ attested: number }>(`/api/world/regions/${slug}/events/${eventId}/attest`, { method: "POST", body: {} }));
  return (
    <WorldPage>
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          <Frost>
            <div className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold">{data.region.name} · a room</div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"><DoorOpen className="h-6 w-6 text-sky-500" />{data.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{fmtDateTime(data.startsAt)} → {fmtDateTime(data.endsAt)} · {data.checkIns} checked in</p>
            <WorldGate message="Sign in to check in.">
              {data.checkedIn ? (
                <p className="text-sm mt-3 flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-4 w-4" /> You were in this room.</p>
              ) : (
                <div className="mt-3 flex gap-2 max-w-sm">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="door code" className="font-mono" />
                  <Button className="snow-button" onClick={() => checkin.mutate(undefined)} disabled={checkin.isPending || code.length < 4}>Check in</Button>
                </div>
              )}
              {checkin.error && <p className="text-xs text-red-600 mt-1">{(checkin.error as Error).message}</p>}
            </WorldGate>
          </Frost>

          {data.attendees && (
            <Frost>
              <SectionTitle icon={<Link2 className="h-4 w-4 text-sky-500" />} right={data.isAdmin ? <Button size="sm" className="snow-button" onClick={() => attest.mutate(undefined)} disabled={attest.isPending}>Attest the room{data.pendingVouches ? ` (${data.pendingVouches} pending)` : ""}</Button> : undefined}>People in the room</SectionTitle>
              <p className="text-xs text-muted-foreground mb-2">Vouch in person for someone you met here. Costs 1.0 of your budget. It counts once the region attests the room.</p>
              {attest.data && <p className="text-xs text-emerald-600 mb-2">Attested {attest.data.attested} vouches.</p>}
              {attest.error && <p className="text-xs text-red-600 mb-2">{(attest.error as Error).message}</p>}
              {data.attendees.length === 0 && <Empty>Nobody yet.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">{data.attendees.map((a) => <AttendeeRow key={a.id} a={a} eventId={String(eventId)} />)}</ul>
            </Frost>
          )}
        </div>
      )}
    </WorldPage>
  );
}

function AttendeeRow({ a, eventId }: { a: NonNullable<EventView["attendees"]>[number]; eventId: string }) {
  const vouch = useWorldMutation(async () => worldFetch("/api/world/vouches", { method: "POST", body: { to: a.handle ?? a.id, type: "IN_PERSON", eventId } }));
  return (
    <li className="py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2"><NameLink handle={a.handle} name={a.name} /><NodeBadge nodeType={a.nodeType} /><span className="text-xs text-muted-foreground">{fmtDateTime(a.checkedInAt)}</span></div>
      <div className="text-right">
        <Button size="sm" variant="outline" onClick={() => vouch.mutate(undefined)} disabled={vouch.isPending || vouch.isSuccess || !a.handle}>{vouch.isSuccess ? "Staked" : "Vouch in person"}</Button>
        {vouch.error && <p className="text-[11px] text-red-600">{(vouch.error as Error).message}</p>}
        {!a.handle && <p className="text-[10px] text-muted-foreground">no name chosen yet</p>}
      </div>
    </li>
  );
}
