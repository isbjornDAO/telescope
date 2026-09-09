"use client";

import Link from "next/link";
import { ArrowRight, Radar, Users, Flag, MapPin, Link2, Crown, MessageSquare } from "lucide-react";
import { useWorldQuery, useWorldSession } from "@/hooks/use-world";
import { WorldPage, Stat, SectionTitle, MoreLink, SeasonStrip, Empty, LoadingBlock, ErrorBlock, Weight } from "@/components/world/primitives";
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

/** The world at a glance: the map, the season, who carries weight. */
export default function WorldOverviewPage() {
  const { data, isLoading, error } = useWorldQuery<Overview>(["overview"], "/api/world/overview");
  const { me, isSignedIn } = useWorldSession();

  return (
    <WorldPage wide>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-20">
          {/* The season */}
          <section className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 items-end">
            {data.season ? (
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.14em] ink-accent font-semibold">
                  {data.season.name} · {data.season.phase}
                </p>
                <h1 className="text-3xl md:text-[2.75rem] font-semibold tracking-tight mt-3 text-balance">{data.season.theme}</h1>
                <p className="text-[15px] leading-relaxed text-muted-foreground mt-4 text-pretty">
                  <span className="text-foreground font-medium">Research question.</span> {data.season.researchQuestion}
                </p>
                <div className="mt-8 max-w-lg">
                  <SeasonStrip week={data.season.week} weeks={data.season.weeks} phase={data.season.phase} />
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-[2.75rem] font-semibold tracking-tight text-balance">Telescope is a world, not a social network.</h1>
                <p className="text-[15px] leading-relaxed text-muted-foreground mt-4 text-pretty">
                  Find your team, find other teams, connect the regions of Avalanche solving real problems where they live. The first winter is being prepared. Scouts are already roaming.
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {data.season ? (
                <>
                  <Link href={`/seasons/${data.season.number}`}>
                    <Button className="snow-button">Open the season <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Button>
                  </Link>
                  {data.season.phase === "building" && (
                    <Link href={`/seasons/${data.season.number}/enter`}>
                      <Button variant="outline">Enter a tournament</Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/rules"><Button variant="outline">Read the world rules</Button></Link>
              )}
            </div>
          </section>

          {/* Counts */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 py-10 border-y border-[var(--hairline)]">
            <Stat label="Nodes with trust" value={data.counts.nodes} hint={`${data.counts.anchors} anchors · ${data.counts.elders} elders`} />
            <Stat label="Vouches staked" value={data.counts.vouches} hint="every vouch is a stake" />
            <Stat label="Crews" value={data.counts.crews} hint={`${data.counts.factions} factions`} />
            <Stat label="Scouts looking" value={data.counts.activeIntents} hint={`${data.counts.matchesThisWeek} offers this week`} />
          </section>

          {/* The map */}
          <section>
            <SectionTitle
              icon={<MapPin className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
              right={<MoreLink href="/regions">all regions</MoreLink>}
              description="Floes are regions. Bright cores hold Anchors. The moving lights are scouts, roaming between rooms."
            >
              The Arctic
            </SectionTitle>
            {data.regions.length ? (
              <ArcticMap regions={data.regions} className="max-w-2xl mx-auto" />
            ) : (
              <Empty>No regions yet. Regions are local clusters; Telescope is the network that connects them.</Empty>
            )}
          </section>

          {/* Weight and the Victor */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <section>
              <SectionTitle icon={<Flag className="h-4 w-4 ink-accent" strokeWidth={1.75} />} right={<MoreLink href="/factions">all factions</MoreLink>}>
                Factions carrying weight
              </SectionTitle>
              {data.topFactions.length === 0 ? (
                <Empty>No faction has earned weight yet. Weight is what a bear needs to survive the winter.</Empty>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {data.topFactions.map((f, i) => (
                    <li key={f.slug} className="py-4 flex items-baseline justify-between gap-5">
                      <div className="min-w-0">
                        <Link href={`/factions/${f.slug}`} className="font-medium hover:text-[var(--accent-ink)] transition-colors">
                          <span className="text-muted-foreground tabular-nums mr-2">{i + 1}</span>
                          {f.name}
                        </Link>
                        <p className="text-sm text-muted-foreground truncate mt-1">{f.vision}</p>
                      </div>
                      <div className="text-sm whitespace-nowrap shrink-0"><Weight value={f.standing} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionTitle icon={<Crown className="h-4 w-4 text-amber-500" strokeWidth={1.75} />}>The Victor&apos;s seat</SectionTitle>
              {data.victor ? (
                <div>
                  <Link href={`/entries/${data.victor.id}`} className="text-2xl font-semibold tracking-tight hover:text-[var(--accent-ink)] transition-colors">
                    {data.victor.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-2">
                    by {data.victor.crew?.name ?? "a crew"} · best dapp on Avalanche, {data.victor.season.name}
                  </p>
                  {data.victor.url && (
                    <a href={data.victor.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium ink-accent hover:underline underline-offset-4 mt-5">
                      Use the product <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </a>
                  )}
                </div>
              ) : (
                <Empty>
                  Empty until the first winter ends. The community chooses its Victor, weighted by trust, and the title only fully vests if the product keeps its users for 90 days.
                </Empty>
              )}
            </section>
          </div>

          {/* What to do */}
          <section className="border-t border-[var(--hairline)] pt-10">
            <SectionTitle icon={<Radar className="h-4 w-4 ink-accent" strokeWidth={1.75} />}>What to do now</SectionTitle>
            <ul className="grid sm:grid-cols-2 gap-x-16 gap-y-1">
              {[
                { href: "/scout", icon: Radar, title: "Tell your scout what you are looking for.", body: "It searches while you sleep and only brings back matches worth a conversation." },
                { href: "/trust", icon: Link2, title: "Get vouched in a room.", body: "Trust is earned in rooms. Votes with no path to an Anchor weigh nothing." },
                { href: "/crews", icon: Users, title: "Form a crew, then a faction.", body: "Crews ship; factions last." },
                { href: "/", icon: MessageSquare, title: "Argue about what is worth building.", body: "The forum is the front door of this world." },
              ].map((i) => (
                <li key={i.href + i.title} className="border-b border-[var(--hairline)]">
                  <Link href={i.href} className="group flex items-start gap-4 py-5">
                    <i.icon className="h-4 w-4 ink-accent mt-1 shrink-0" strokeWidth={1.75} />
                    <span>
                      <span className="block font-medium group-hover:text-[var(--accent-ink)] transition-colors">{i.title}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed mt-1">{i.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {!isSignedIn && <div className="mt-8"><SignInInline /></div>}
            {isSignedIn && me?.handle == null && (
              <p className="text-sm text-muted-foreground mt-8">
                Pick a name for your profile on{" "}
                <Link href={`/profile/${me?.address}`} className="ink-accent hover:underline underline-offset-4">your profile</Link>. A name you chose, never a legal identity.
              </p>
            )}
          </section>
        </div>
      )}
    </WorldPage>
  );
}
