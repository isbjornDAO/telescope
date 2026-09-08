"use client";

import Link from "next/link";
import { ArrowRight, Radar, Snowflake, Users, Flag, MapPin, Link2, Crown, MessageSquare } from "lucide-react";
import { useWorldQuery, useWorldSession } from "@/hooks/use-world";
import { WorldPage, Frost, Stat, SectionTitle, SeasonStrip, Empty, LoadingBlock, ErrorBlock, Weight } from "@/components/world/primitives";
import { ArcticMap, type MapRegion } from "@/components/world/arctic-map";
import { SignInInline } from "@/components/world/world-gate";
import { Button } from "@/components/ui/button";

interface Overview {
  version: string;
  season: { number: number; name: string; theme: string; researchQuestion: string; phase: string; week: number; weeks: number; entries: Record<string, number> } | null;
  counts: { nodes: number; anchors: number; elders: number; crews: number; factions: number; regions: number; vouches: number; activeIntents: number; matchesThisWeek: number };
  regions: MapRegion[];
  topFactions: { name: string; slug: string; vision: string; standing: number; crews: number; members: number }[];
  victor: { id: string; title: string; url: string | null; crew: { name: string; slug: string } | null; season: { name: string; number: number } } | null;
}

export default function Home() {
  const { data, isLoading, error } = useWorldQuery<Overview>(["overview"], "/api/world/overview");
  const { me, isSignedIn } = useWorldSession();

  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-6">
          {/* Season banner */}
          <Frost>
            {data.season ? (
              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold flex items-center gap-1">
                    <Snowflake className="h-3.5 w-3.5" /> {data.season.name} · {data.season.phase}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{data.season.theme}</h1>
                  <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">Research question:</span> {data.season.researchQuestion}</p>
                  <div className="mt-4"><SeasonStrip week={data.season.week} weeks={data.season.weeks} phase={data.season.phase} /></div>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Link href={`/seasons/${data.season.number}`}><Button className="snow-button w-full">Open the season <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
                  {data.season.phase === "building" && <Link href={`/seasons/${data.season.number}/enter`}><Button variant="outline" className="w-full">Enter a tournament</Button></Link>}
                  <div className="text-xs text-muted-foreground grid grid-cols-3 gap-1 text-center mt-1">
                    <div><div className="font-bold text-foreground">{data.season.entries.GTM ?? 0}</div>GTM</div>
                    <div><div className="font-bold text-foreground">{data.season.entries.LOCAL_SYSTEMS ?? 0}</div>Local</div>
                    <div><div className="font-bold text-foreground">{data.season.entries.RESEARCH_PAPERS ?? 0}</div>Papers</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Telescope is a world, not a social network.</h1>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">Find your team, find other teams, connect the regions of Avalanche solving real problems where they live. The first winter is being prepared. Scouts are already roaming.</p>
                </div>
                <Link href="/rules"><Button variant="outline">Read the world rules</Button></Link>
              </div>
            )}
          </Frost>

          {/* Map + counts */}
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
            <Frost className="p-3 md:p-4">
              <SectionTitle icon={<MapPin className="h-4 w-4 text-sky-500" />} right={<Link href="/regions" className="text-xs text-sky-600 hover:underline">all regions</Link>}>The Arctic</SectionTitle>
              {data.regions.length ? <ArcticMap regions={data.regions} /> : <Empty>No regions yet. Regions are local clusters; Telescope is the network that connects them.</Empty>}
              <p className="text-[11px] text-muted-foreground mt-2">Floes are regions. Bright cores hold Anchors. The moving lights are scouts, roaming between rooms.</p>
            </Frost>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Nodes with trust" value={data.counts.nodes} hint={`${data.counts.anchors} anchors · ${data.counts.elders} elders`} />
                <Stat label="Vouches staked" value={data.counts.vouches} hint="every vouch is a stake" />
                <Stat label="Crews" value={data.counts.crews} hint={`${data.counts.factions} factions`} />
                <Stat label="Scouts looking" value={data.counts.activeIntents} hint={`${data.counts.matchesThisWeek} offers this week`} />
              </div>
              <Frost>
                <SectionTitle icon={<Radar className="h-4 w-4 text-sky-500" />}>What to do now</SectionTitle>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><Radar className="h-4 w-4 mt-0.5 text-sky-500" /><span><Link href="/scout" className="font-semibold hover:underline">Tell your scout what you are looking for.</Link> It searches while you sleep and only brings back matches worth a conversation.</span></li>
                  <li className="flex items-start gap-2"><Link2 className="h-4 w-4 mt-0.5 text-sky-500" /><span><Link href="/trust" className="font-semibold hover:underline">Get vouched in a room.</Link> Trust is earned in rooms. Votes with no path to an Anchor weigh nothing.</span></li>
                  <li className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 text-sky-500" /><span><Link href="/crews" className="font-semibold hover:underline">Form a crew,</Link> then <Link href="/factions" className="font-semibold hover:underline">a faction</Link> around a vision. Crews ship; factions last.</span></li>
                  <li className="flex items-start gap-2"><MessageSquare className="h-4 w-4 mt-0.5 text-sky-500" /><span><Link href="/forum" className="font-semibold hover:underline">Argue about what is worth building.</Link></span></li>
                </ul>
                {!isSignedIn && <div className="mt-3"><SignInInline /></div>}
                {isSignedIn && me?.handle == null && <p className="text-xs text-muted-foreground mt-3">Pick a name for your profile on <Link href={`/profile/${me?.address}`} className="underline">your profile</Link>. A name you chose, never a legal identity.</p>}
              </Frost>
            </div>
          </div>

          {/* Weight + Victor */}
          <div className="grid md:grid-cols-2 gap-6">
            <Frost>
              <SectionTitle icon={<Flag className="h-4 w-4 text-sky-500" />} right={<Link href="/factions" className="text-xs text-sky-600 hover:underline">all factions</Link>}>Factions carrying weight</SectionTitle>
              {data.topFactions.length === 0 && <Empty>No faction has earned weight yet. Weight is what a bear needs to survive the winter.</Empty>}
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {data.topFactions.map((f, i) => (
                  <li key={f.slug} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/factions/${f.slug}`} className="font-semibold hover:underline">{i + 1}. {f.name}</Link>
                      <p className="text-xs text-muted-foreground truncate">{f.vision}</p>
                    </div>
                    <div className="text-sm whitespace-nowrap"><Weight value={f.standing} /></div>
                  </li>
                ))}
              </ul>
            </Frost>
            <Frost>
              <SectionTitle icon={<Crown className="h-4 w-4 text-amber-500" />}>The Victor&apos;s seat</SectionTitle>
              {data.victor ? (
                <div>
                  <Link href={`/entries/${data.victor.id}`} className="text-xl font-bold hover:underline">{data.victor.title}</Link>
                  <p className="text-sm text-muted-foreground">by {data.victor.crew?.name ?? "a crew"} · best dapp on Avalanche, {data.victor.season.name}</p>
                  {data.victor.url && <a href={data.victor.url} target="_blank" rel="noreferrer" className="text-sm text-sky-600 hover:underline mt-2 inline-block">Use the product →</a>}
                </div>
              ) : (
                <Empty>Empty until the first winter ends. The community chooses its Victor, weighted by trust, and the title only fully vests if the product keeps its users for 90 days.</Empty>
              )}
            </Frost>
          </div>
        </div>
      )}
    </WorldPage>
  );
}
