"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Package, Link2, Radar, Flag, Users, MapPin, Pencil, Upload, Plus, Home, Sparkles, Award, Check, ShieldCheck, LogOut,
} from "lucide-react";
import { useWorldQuery, useWorldSession, useWorldMutation, worldFetch } from "@/hooks/use-world";
import { useDen } from "@/hooks/use-den";
import { buildBadges, sortBadges } from "@/lib/badges";
import { WorldPage, Frost, SectionTitle, NodeBadge, Empty, LoadingBlock, ErrorBlock, TournamentBadge, StatusBadge, fmtDate } from "@/components/world/primitives";
import { CrystalAvatar } from "@/components/world/snow-crystal";
import { BadgeRow, BadgeGrid } from "@/components/world/badge-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Profile {
  handle: string | null;
  name: string;
  bio: string | null;
  nodeType: "NODE" | "ANCHOR" | "ELDER";
  band: string;
  standing: number;
  region: { name: string; slug: string } | null;
  faction: { name: string; slug: string; vision: string; standing: number } | null;
  crews: { name: string; slug: string; standing: number; role: string | null; isLead: boolean; faction: { name: string; slug: string } | null }[];
  shipped: { id: string; kind: string; source: string; title: string; description: string | null; proofHash: string; verified: boolean; shippedAt: string | null; crew: { name: string; slug: string } | null }[];
  trust: { vouchesAtLeast: number; inPersonAtLeast: number; shippedTogetherAtLeast: number; sharedVisionAtLeast: number; regions: { slug: string; name: string; atLeast: number }[]; band: string; visibleVouchers: { handle: string; type: string }[] };
  lookingFor: { type: string; tags: string[]; expiresAt: string }[];
  seasonHistory: { id: string; title: string; tournament: string; status: string; isVictor: boolean; season: { number: number; name: string } }[];
  standingHistory: { id: string; amount: number; reason: string; createdAt: string; vestedFraction: number | null }[];
  since: string;
  // private
  address?: string;
  trustScore?: number;
  vouchBudget?: { total: number; spent: number; remaining: number };
}

const INTENT_LABEL: Record<string, string> = {
  ROLE: "a role to fill",
  PARTNER_PROJECT: "a partner project",
  REGION_ADOPT: "a region to bring a tool to",
  RESEARCH_QUESTION: "a research question",
};

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

export default function ProfilePage() {
  const params = useParams();
  const key = decodeURIComponent(String(params.address));
  const { me, isSignedIn, signOut } = useWorldSession();
  const isOwn = !!me?.signedIn && (me.address?.toLowerCase() === key.toLowerCase() || (!!me.handle && me.handle === key));
  const url = isOwn && isSignedIn ? "/api/world/me" : `/api/world/profiles/${encodeURIComponent(key)}`;
  const { data, isLoading, error } = useWorldQuery<Profile>(["profile", key, isOwn], url);

  // A visitor never triggers a lookup by someone else's address: their den is theirs.
  const den = useDen(isOwn ? data?.address : undefined, {
    nodeType: data?.nodeType,
    band: data?.band,
    shippedCount: data?.shipped.length,
    vouchesAtLeast: data?.trust.vouchesAtLeast,
  });

  // Everyone else gets the badges that public data alone can prove.
  const publicBadges = useMemo(
    () =>
      data
        ? sortBadges(
            buildBadges({
              nodeType: data.nodeType,
              band: data.band,
              shippedCount: data.shipped.length,
              vouchesAtLeast: data.trust.vouchesAtLeast,
            })
          ).filter((b) => b.earned)
        : [],
    [data]
  );

  const earned = isOwn ? den.earned : publicBadges;

  return (
    <WorldPage>
      {isLoading && <LoadingBlock lines={6} />}
      {error && <ErrorBlock error={error} />}
      {data && (
        <div className="space-y-12">
          {/* ── Identity ────────────────────────────────────────────── */}
          <header className="panel overflow-hidden">
            <div className="profile-banner h-24 md:h-28" aria-hidden />
            <div className="px-6 md:px-8 pb-7 -mt-12 md:-mt-14">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="min-w-0">
                  <CrystalAvatar
                    seed={data.handle ?? key}
                    size="xl"
                    nodeType={data.nodeType}
                    title={`${data.name}'s snow crystal`}
                    className="ring-4 ring-[hsl(var(--card))] rounded-full"
                  />
                  <div className="flex items-center gap-3 flex-wrap mt-4">
                    <h1 className="text-3xl md:text-[2.25rem] font-semibold tracking-tight">{data.name}</h1>
                    <NodeBadge nodeType={data.nodeType} band={data.band} />
                  </div>
                  {data.handle && <p className="text-sm text-muted-foreground mt-1">/{data.handle}</p>}
                  <p className="text-[15px] leading-relaxed text-muted-foreground mt-4 max-w-xl text-pretty">
                    {data.bio || (isOwn ? "No bio yet. Say what you build, not who you are." : "A profile is a name they chose.")}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mt-5">
                    {data.region && (
                      <Link href={`/regions/${data.region.slug}`} className="flex items-center gap-1.5 hover:text-[var(--accent-ink)] transition-colors">
                        <MapPin className="h-3.5 w-3.5 ink-accent" strokeWidth={1.75} />
                        {data.region.name}
                      </Link>
                    )}
                    {data.faction && (
                      <Link href={`/factions/${data.faction.slug}`} className="flex items-center gap-1.5 hover:text-[var(--accent-ink)] transition-colors">
                        <Flag className="h-3.5 w-3.5 ink-accent" strokeWidth={1.75} />
                        {data.faction.name}
                      </Link>
                    )}
                    {data.crews.map((c) => (
                      <Link key={c.slug} href={`/crews/${c.slug}`} className="flex items-center gap-1.5 hover:text-[var(--accent-ink)] transition-colors">
                        <Users className="h-3.5 w-3.5 ink-accent" strokeWidth={1.75} />
                        {c.name}
                        {c.isLead && <span className="text-xs text-muted-foreground">lead</span>}
                      </Link>
                    ))}
                    <span className="text-muted-foreground">in the world since {fmtDate(data.since)}</span>
                  </div>
                  {earned.length > 0 && (
                    <div className="mt-5">
                      <BadgeRow badges={earned} max={10} />
                    </div>
                  )}
                </div>

                {/* Actions sit where the eye lands, never buried in a menu. */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isOwn ? (
                    <>
                      <EditProfile profile={data} />
                      <Link href="/den">
                        <Button variant="outline">
                          <Home className="h-4 w-4" strokeWidth={1.75} /> Your snow den
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/trust">
                        <Button className="snow-button">
                          <Link2 className="h-4 w-4" strokeWidth={1.75} /> Vouch for {data.handle ? `/${data.handle}` : "them"}
                        </Button>
                      </Link>
                      <Link href="/scout">
                        <Button variant="outline">
                          <Radar className="h-4 w-4" strokeWidth={1.75} /> Send a scout
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {isOwn && <Completion profile={data} />}

          {/* ── Metrics ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-8 py-8 border-y border-[var(--hairline)]">
            <Metric label="Weight" value={data.standing.toFixed(2)} hint="season-earned" />
            <Metric label="Ice" value={<span className="capitalize">{data.band}</span>} hint="trust band" />
            <Metric label="Badges" value={earned.length} hint={isOwn ? `${den.locked.length} still out there` : "earned in the world"} />
            <Metric label="Shipped" value={data.shipped.length} hint="proofs of work" />
            <Metric label="Vouches" value={`≥ ${data.trust.vouchesAtLeast}`} hint="never an exact count" />
            {isOwn ? (
              <Metric label="Level" value={den.level} hint={`${den.streak} day streak`} />
            ) : (
              <Metric label="Crews" value={data.crews.length} hint={data.faction ? data.faction.name : "no faction"} />
            )}
          </section>

          {/* ── Everything else, one cluster at a time ──────────────── */}
          <Tabs defaultValue="shipped">
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 gap-1 border-b border-[var(--surface-border)] overflow-x-auto">
              {[
                { value: "shipped", label: "Shipped", icon: Package },
                { value: "trust", label: "Trust", icon: Link2 },
                { value: "looking", label: "Looking for", icon: Radar },
                { value: "seasons", label: "Seasons", icon: Flag },
                { value: "badges", label: "Badges", icon: Award },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-sm text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-[var(--accent-ink)] data-[state=active]:text-foreground data-[state=active]:font-semibold"
                >
                  <t.icon className="h-4 w-4 mr-2" strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="shipped" className="pt-10">
              <SectionTitle
                icon={<Package className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
                right={isOwn ? <AddProof /> : undefined}
                description="A proof is a thing that exists. Builder's Hub imports verify themselves; anything else waits on a world admin."
              >
                What they shipped
              </SectionTitle>
              {data.shipped.length === 0 ? (
                <Empty>{isOwn ? "No proofs yet. Import from Builder's Hub, or add one by hand." : "Nothing shipped yet."}</Empty>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {data.shipped.map((p) => (
                    <li key={p.id} className="py-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium">{p.title}</span>
                        <span
                          className={cn(
                            "shrink-0 text-[11px] rounded-full px-2 py-0.5 border",
                            p.verified
                              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                              : "border-[var(--surface-border)] text-muted-foreground"
                          )}
                        >
                          {p.verified ? "verified" : "unverified"}
                        </span>
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.description}</p>}
                      <div className="text-xs text-muted-foreground mt-2">
                        {p.kind.toLowerCase()} · {p.source === "BUILDERS_HUB" ? "Builder's Hub" : p.source.toLowerCase()}
                        {p.crew ? ` · with ${p.crew.name}` : ""}
                        {p.shippedAt ? ` · ${fmtDate(p.shippedAt)}` : ""}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate" title={p.proofHash}>
                        {p.proofHash.slice(0, 24)}…
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="trust" className="pt-10">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
                <div>
                  <SectionTitle
                    icon={<Link2 className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
                    description="Aggregates and proofs, never a list. Names appear only where both sides chose to be visible."
                  >
                    Who vouches
                  </SectionTitle>
                  <ul className="divide-y divide-[var(--hairline)] text-sm">
                    <Claim label="Vouches" value={`at least ${data.trust.vouchesAtLeast}`} />
                    <Claim label="Met in person" value={`at least ${data.trust.inPersonAtLeast}`} />
                    <Claim label="Shipped together" value={`at least ${data.trust.shippedTogetherAtLeast}`} />
                    <Claim label="Shared vision" value={`at least ${data.trust.sharedVisionAtLeast}`} />
                    {data.trust.regions.map((r) => (
                      <Claim key={r.slug} label={<Link href={`/regions/${r.slug}`} className="hover:underline">In person from {r.name}</Link>} value={`at least ${r.atLeast}`} />
                    ))}
                    <Claim label="Ice" value={<span className="capitalize">{data.trust.band}</span>} />
                  </ul>
                  {data.trust.visibleVouchers.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs text-muted-foreground mb-2">Visible by mutual choice</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.trust.visibleVouchers.map((v) => (
                          <Link
                            key={v.handle + v.type}
                            href={`/profile/${v.handle}`}
                            className="text-xs rounded-full border border-[var(--surface-border)] px-2.5 py-1 hover:bg-accent/60 transition-colors"
                          >
                            /{v.handle}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <SectionTitle icon={<Sparkles className="h-4 w-4 ink-accent" strokeWidth={1.75} />}>Weight history</SectionTitle>
                  {data.standingHistory.length === 0 ? (
                    <Empty>Weight is season-earned trust. It belongs to whoever earned it and does not travel.</Empty>
                  ) : (
                    <ul className="divide-y divide-[var(--hairline)] text-sm">
                      {data.standingHistory.map((s) => (
                        <li key={s.id} className="py-3 flex items-baseline justify-between gap-4">
                          <span className="text-muted-foreground min-w-0">{s.reason}</span>
                          <span className={cn("shrink-0 tabular-nums font-medium", s.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                            {s.amount > 0 ? "+" : ""}
                            {s.amount}
                            {s.vestedFraction === null ? " (vesting)" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isOwn && data.vouchBudget && (
                    <p className="text-sm text-muted-foreground mt-6">
                      Your vouch budget this season: <b className="text-foreground tabular-nums">{data.vouchBudget.remaining}</b> of {data.vouchBudget.total}.{" "}
                      <Link href="/trust" className="ink-accent hover:underline underline-offset-4">Manage</Link>
                    </p>
                  )}
                  {isOwn && data.trustScore !== undefined && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Trust score {data.trustScore.toFixed(3)} — only you ever see this number.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="looking" className="pt-10">
              <SectionTitle
                icon={<Radar className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
                right={isOwn ? <Link href="/scout" className="text-[13px] font-medium ink-accent hover:underline underline-offset-4">edit intents</Link> : undefined}
                description="Scouts talk to scouts. Details stay private until both humans accept a match."
              >
                Looking for right now
              </SectionTitle>
              {data.lookingFor.length === 0 ? (
                <Empty
                  action={
                    isOwn ? (
                      <Link href="/scout" className="text-sm font-medium ink-accent hover:underline underline-offset-4">
                        Tell your scout
                      </Link>
                    ) : undefined
                  }
                >
                  {isOwn ? "Nothing yet. A scout with no intent searches for nothing." : "Nothing this season."}
                </Empty>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {data.lookingFor.map((i, k) => (
                    <li key={k} className="py-5">
                      <div className="font-medium">{INTENT_LABEL[i.type] ?? i.type}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {i.tags.map((t) => (
                          <span key={t} className="text-[11px] rounded-full border border-[var(--surface-border)] px-2.5 py-1 text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2.5">renews {fmtDate(i.expiresAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="seasons" className="pt-10">
              <SectionTitle icon={<Flag className="h-4 w-4 ink-accent" strokeWidth={1.75} />}>Season history</SectionTitle>
              {data.seasonHistory.length === 0 ? (
                <Empty>No entries yet. Seasons are six weeks long and end with a Victor.</Empty>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {data.seasonHistory.map((e) => (
                    <li key={e.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/entries/${e.id}`} className="font-medium hover:text-[var(--accent-ink)] transition-colors">
                          {e.isVictor ? "👑 " : ""}
                          {e.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">{e.season.name}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <TournamentBadge tournament={e.tournament} />
                        <StatusBadge status={e.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="badges" className="pt-10">
              <SectionTitle
                icon={<Award className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
                right={isOwn ? <Link href="/den" className="text-[13px] font-medium ink-accent hover:underline underline-offset-4">open your den</Link> : undefined}
                description={isOwn ? "Your full wall, including what is still locked, lives in your snow den." : "Only badges this profile can prove in public."}
              >
                Badges
              </SectionTitle>
              {earned.length === 0 ? <Empty>No badges yet.</Empty> : <BadgeGrid badges={earned} />}
            </TabsContent>
          </Tabs>

          {/* Account actions live last, well away from everything else. */}
          {isOwn && (
            <footer className="border-t border-[var(--hairline)] pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground max-w-lg">
                A profile is a name you chose, never a legal identity. Nothing here reveals who vouched for you unless both of you asked for it.
              </p>
              <Button variant="ghost" size="sm" className="text-muted-foreground self-start" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> Sign out of the world
              </Button>
            </footer>
          )}
        </div>
      )}
    </WorldPage>
  );
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-2">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Claim({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <li className="py-3 flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground min-w-0">{label}</span>
      <span className="shrink-0 font-medium tabular-nums">{value}</span>
    </li>
  );
}

/** A quiet nudge, not a nag: it disappears the moment the profile is whole. */
function Completion({ profile }: { profile: Profile }) {
  const steps = [
    { done: !!profile.handle, label: "Pick a name", hint: "A name you chose." },
    { done: !!profile.bio, label: "Write a bio", hint: "What you build, not who you are." },
    { done: !!profile.region, label: "Set a home region", hint: "Regions are where trust starts." },
    { done: profile.shipped.length > 0, label: "Add one proof", hint: "Something that exists." },
    { done: profile.trust.vouchesAtLeast > 0, label: "Get one vouch", hint: "Trust is earned in rooms." },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <Frost className="p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Finish your profile</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done} of {steps.length}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[var(--surface-border)] mt-3 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--accent-ink)] transition-all duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
        {steps.map((s) => (
          <li key={s.label} className={cn("flex items-start gap-2.5 py-2 text-sm", s.done && "text-muted-foreground")}>
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                s.done ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-[var(--surface-border)]"
              )}
            >
              {s.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className={cn("block", s.done && "line-through")}>{s.label}</span>
              {!s.done && <span className="block text-xs text-muted-foreground mt-0.5">{s.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Frost>
  );
}

function EditProfile({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [regionSlug, setRegionSlug] = useState(profile.region?.slug ?? "");
  const { data: regions } = useWorldQuery<{ name: string; slug: string }[]>(["regions"], "/api/world/regions");

  // Validate as they type, so nobody hits Save to find out.
  const handleError = handle && !HANDLE_RE.test(handle) ? "3–24 lowercase letters, digits or underscores." : null;
  const locked = !!profile.handle && handle !== profile.handle;

  const save = useWorldMutation(async () => {
    await worldFetch("/api/world/me", { method: "PATCH", body: { handle: handle || undefined, bio, regionSlug: regionSlug || null } });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="snow-button">
          <Pencil className="h-4 w-4" strokeWidth={1.75} /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-4">
            <CrystalAvatar seed={handle || profile.handle || "unclaimed"} size="lg" nodeType={profile.nodeType} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your crystal is grown from your name. Change the name and the crystal changes with it. Nothing to upload, nothing to leak.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Name you chose</Label>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().trim())}
              placeholder="polarwatch"
              aria-invalid={!!handleError}
            />
            <p className={cn("text-xs", handleError ? "text-red-600" : "text-muted-foreground")}>
              {handleError ?? (locked ? "Changing your name changes every link to this profile." : "3–24 lowercase letters, digits or underscores.")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{bio.length}/280</span>
            </div>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} placeholder="What you build. Not who you are." />
          </div>

          <div className="space-y-2">
            <Label>Home region</Label>
            <Select value={regionSlug || "none"} onValueChange={(v) => setRegionSlug(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No region yet</SelectItem>
                {(regions ?? []).map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-[var(--surface-border)] p-4 text-xs text-muted-foreground leading-relaxed">
            <span className="flex items-center gap-1.5 font-medium text-foreground mb-1.5">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> What stays private
            </span>
            Your wallet address, your trust score, and who vouched for you. Vouch visibility is per vouch and needs both sides —{" "}
            <Link href="/trust" className="ink-accent hover:underline underline-offset-4" onClick={() => setOpen(false)}>
              manage it in Trust
            </Link>
            .
          </div>

          {save.error && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
          <Button className="snow-button w-full" onClick={() => save.mutate(undefined)} disabled={save.isPending || !!handleError}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddProof() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("SHIPPED");
  const [description, setDescription] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const add = useWorldMutation(async () => {
    await worldFetch("/api/world/me/proofs", { method: "POST", body: { title, kind, description: description || undefined, externalRef: externalRef || undefined } });
    setOpen(false);
    setTitle("");
    setDescription("");
    setExternalRef("");
  });
  const importHub = useWorldMutation(async () => worldFetch<{ imported: number }>("/api/world/me/proofs/import", { method: "POST" }));

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => importHub.mutate(undefined)} disabled={importHub.isPending} title="Import from Builder's Hub">
        <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> Import
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Add
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a proof</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Builder&apos;s Hub imports verify automatically. Manual proofs show as unverified until a world admin confirms them against the source.
          </p>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="proof-title">Title</Label>
              <Input id="proof-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What you built" />
            </div>
            <div className="space-y-2">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPPED">Shipped product</SelectItem>
                  <SelectItem value="HACKATHON">Hackathon</SelectItem>
                  <SelectItem value="ACTIVITY">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-desc">Description</Label>
              <Textarea id="proof-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-ref">Source reference</Label>
              <Input id="proof-ref" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="Builder's Hub project id, repo, tx…" />
              <p className="text-xs text-muted-foreground">Private. Used to verify the proof, never shown on your profile.</p>
            </div>
            {add.error && <p className="text-sm text-red-600">{(add.error as Error).message}</p>}
            <Button className="snow-button w-full" onClick={() => add.mutate(undefined)} disabled={add.isPending || !title}>
              {add.isPending ? "Adding…" : "Add proof"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {importHub.error && <span className="text-[11px] text-muted-foreground self-center">{(importHub.error as Error).message}</span>}
    </div>
  );
}
