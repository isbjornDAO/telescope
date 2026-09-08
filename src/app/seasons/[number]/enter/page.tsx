"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorldQuery, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { WorldPage, Frost } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Me { crews: { name: string; slug: string }[]; faction: { name: string; slug: string } | null }

export default function EnterPage() {
  const { number } = useParams();
  const router = useRouter();
  const { data: me } = useWorldQuery<Me>(["me-full"], "/api/world/me");
  const { data: regions } = useWorldQuery<{ name: string; slug: string }[]>(["regions"], "/api/world/regions");
  const { data: alliances } = useWorldQuery<{ id: string; name: string; status: string }[]>(["alliances"], "/api/world/alliances");

  const [tournament, setTournament] = useState("GTM");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployedOn, setDeployedOn] = useState("C-Chain");
  const [crewSlug, setCrewSlug] = useState("");
  const [regionSlug, setRegionSlug] = useState("");
  const [ethics, setEthics] = useState("");
  const [roadmap, setRoadmap] = useState("Week 1: \nWeek 2: \nWeek 3: \nWeek 4: ");
  const [meaningful, setMeaningful] = useState("");
  const [reveal, setReveal] = useState(true);
  const [allianceId, setAllianceId] = useState("");

  const submit = useWorldMutation(async () => {
    const res = await worldFetch<{ id: string }>("/api/world/entries", {
      method: "POST",
      body: {
        tournament, title, summary,
        body: body || undefined,
        url: url || undefined,
        repoUrl: repoUrl || undefined,
        deployedOn: tournament === "GTM" ? deployedOn : undefined,
        crewSlug: crewSlug || undefined,
        regionSlug: regionSlug || undefined,
        ethicsStatement: ethics || undefined,
        roadmap: tournament === "GTM" ? roadmap.split("\n").map((l) => l.trim()).filter(Boolean).map((milestone) => ({ milestone })) : undefined,
        meaningfulTxDefinition: meaningful || undefined,
        revealAuthorship: reveal,
        allianceId: allianceId || undefined,
      },
    });
    router.push(`/entries/${res.id}`);
  });

  return (
    <WorldPage title={`Enter Season ${number}`} subtitle="Three tournaments, three kinds of legitimacy. Pick the one your work fits.">
      <WorldGate message="Sign in to enter.">
        <Frost className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <Label>Tournament</Label>
              <Select value={tournament} onValueChange={setTournament}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GTM">GTM · shipped product, community vote, Victor</SelectItem>
                  <SelectItem value="LOCAL_SYSTEMS">Local Systems · a design for a real community, panel of Elders</SelectItem>
                  <SelectItem value="RESEARCH_PAPERS">Research Papers · private, blind review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Summary (public{tournament === "RESEARCH_PAPERS" ? " at season close" : ""})</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>

            {tournament !== "RESEARCH_PAPERS" && (
              <div>
                <Label>Crew {tournament === "GTM" ? "(required: crews are the unit that enters GTM)" : "(optional)"}</Label>
                <Select value={crewSlug || "none"} onValueChange={(v) => setCrewSlug(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Pick a crew" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No crew</SelectItem>{(me?.crews ?? []).map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            {tournament === "GTM" && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Live URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></div>
                  <div><Label>Deployed on</Label><Select value={deployedOn} onValueChange={setDeployedOn}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="C-Chain">C-Chain</SelectItem><SelectItem value="L1">An Avalanche L1</SelectItem><SelectItem value="Iggy">Iggy L1</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Repo (optional)</Label><Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://" /></div>
                <div><Label>Roadmap, one milestone per line (public, updatable through the season)</Label><Textarea value={roadmap} onChange={(e) => setRoadmap(e.target.value)} rows={5} /></div>
                <div><Label>What counts as a meaningful transaction with your product?</Label><Input value={meaningful} onChange={(e) => setMeaningful(e.target.value)} placeholder="a swap, a post, a record written…" /><p className="text-xs text-muted-foreground mt-1">Retention at 90 days is measured on this. Only trust-graph wallets count.</p></div>
              </>
            )}

            {tournament === "LOCAL_SYSTEMS" && (
              <>
                <div>
                  <Label>Community it serves</Label>
                  <Select value={regionSlug || "none"} onValueChange={(v) => setRegionSlug(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Not a specific region</SelectItem>{(regions ?? []).map((r) => <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>The design (markdown)</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Smart contract design: sound, safe, minimal. How it uses Avalanche infrastructure and real-world assets. Could the community run it themselves?" /></div>
                <div><Label>Ethics statement</Label><Textarea value={ethics} onChange={(e) => setEthics(e.target.value)} rows={5} placeholder="Who does this serve? Who could it harm? What happens when it fails? Who holds power over it?" /></div>
              </>
            )}

            {tournament === "RESEARCH_PAPERS" && (
              <>
                <div><Label>The paper (markdown). Reviewers see this and nothing about you.</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} /></div>
                <div className="flex items-center justify-between"><Label>Reveal my authorship at season close</Label><Switch checked={reveal} onCheckedChange={setReveal} /></div>
              </>
            )}

            {tournament !== "GTM" && me?.faction && (alliances ?? []).filter((a) => a.status === "ACTIVE").length > 0 && (
              <div>
                <Label>Enter as an alliance (optional)</Label>
                <Select value={allianceId || "none"} onValueChange={(v) => setAllianceId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Just my faction</SelectItem>{(alliances ?? []).filter((a) => a.status === "ACTIVE").map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            {submit.error && <p className="text-sm text-red-600">{(submit.error as Error).message}</p>}
            <Button className="snow-button" onClick={() => submit.mutate(undefined)} disabled={submit.isPending || !title || summary.length < 10}>Submit</Button>
          </div>
        </Frost>
      </WorldGate>
    </WorldPage>
  );
}
