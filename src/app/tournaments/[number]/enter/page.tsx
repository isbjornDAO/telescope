"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KINDS = [
  { v: "GTM", l: "Something I built", hint: "A working product. The community votes." },
  { v: "LOCAL_SYSTEMS", l: "An idea for my community", hint: "A design, not a build. A panel judges it." },
  { v: "RESEARCH_PAPERS", l: "A piece of writing", hint: "Private. Reviewed without your name on it." },
];

export default function EnterPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState("GTM");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");

  const submit = useWorldMutation(async () => {
    const res = await worldFetch<{ id: string }>("/api/world/entries", {
      method: "POST",
      body: {
        tournament,
        title,
        summary,
        url: url || undefined,
        body: body || undefined,
        deployedOn: tournament === "GTM" ? "C-Chain" : undefined,
      },
    });
    router.push(`/entries/${res.id}`);
  });

  const kind = KINDS.find((k) => k.v === tournament)!;

  return (
    <WorldPage title="Enter">
      <WorldGate message="Sign in to enter.">
        <Frost className="max-w-xl">
          <div className="space-y-4">
            <div>
              <Label>What are you entering?</Label>
              <Select value={tournament} onValueChange={setTournament}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.l}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{kind.hint}</p>
            </div>

            <div><Label>Name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>One line about it</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} /></div>

            {tournament === "GTM" && (
              <div><Label>Link</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></div>
            )}
            {tournament !== "GTM" && (
              <div><Label>{tournament === "RESEARCH_PAPERS" ? "Your writing" : "The idea"}</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} /></div>
            )}

            {submit.error && <p className="text-sm text-red-600">{(submit.error as Error).message}</p>}
            <Button className="snow-button" onClick={() => submit.mutate(undefined)} disabled={submit.isPending || !title || summary.length < 10}>
              {submit.isPending ? "Entering…" : "Enter"}
            </Button>
            <p className="text-xs text-muted-foreground">You can add more detail after entering, while the season runs.</p>
          </div>
        </Frost>
      </WorldGate>
    </WorldPage>
  );
}
