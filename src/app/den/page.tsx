"use client";

import Link from "next/link";
import { Flame, Coins, Sparkles, ArrowRight, Lock, Home } from "lucide-react";
import { useWorldQuery, useWorldSession } from "@/hooks/use-world";
import { useDen } from "@/hooks/use-den";
import { WorldPage, NodeBadge, Empty, LoadingBlock } from "@/components/world/primitives";
import { WorldGate } from "@/components/world/world-gate";
import { CrystalAvatar } from "@/components/world/snow-crystal";
import { BadgeGrid } from "@/components/world/badge-tile";
import type { Badge } from "@/lib/badges";

interface WorldSelf {
  band: string;
  shipped: unknown[];
  trust: { vouchesAtLeast: number };
}

/** Your den: everything you have earned, and everything still out on the ice. */
export default function SnowDenPage() {
  return (
    <WorldPage
      title="Your snow den"
      subtitle="What you have earned, and what is still out there. Only you see this page — your profile is what the world sees."
    >
      <DenGate />
    </WorldPage>
  );
}

function Figure({ icon, value, label, hint }: { icon: React.ReactNode; value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="text-3xl font-semibold tabular-nums leading-none mt-3">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  );
}

function Group({ title, badges, note }: { title: string; badges: Badge[]; note?: string }) {
  if (badges.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 mb-4 pb-3 border-b border-[var(--hairline)]">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{badges.length}</span>
      </div>
      {note && <p className="text-sm text-muted-foreground mb-4">{note}</p>}
      <BadgeGrid badges={badges} />
    </section>
  );
}

/** A signed world session is the proof of ownership; the wallet need not still be connected. */
function DenGate() {
  const { me, isSignedIn, isLoading } = useWorldSession();
  if (isLoading) return <LoadingBlock lines={4} />;
  if (!isSignedIn || !me?.address) {
    return <WorldGate message="Sign in to open your den."><span /></WorldGate>;
  }
  return <Den />;
}

function Den() {
  const { me } = useWorldSession();
  const address = me?.address;
  // The world half of the wall — ice band, proofs, vouches — lives on the profile.
  const { data: world } = useWorldQuery<WorldSelf>(["profile", "den"], "/api/world/me");
  const den = useDen(address, {
    nodeType: me?.nodeType,
    band: world?.band,
    shippedCount: world?.shipped.length,
    vouchesAtLeast: world?.trust.vouchesAtLeast,
  });

  if (den.isLoading) return <LoadingBlock lines={6} />;

  const seed = me?.handle ?? address ?? "unclaimed";
  const ratio = den.progress.totalNeeded ? den.progress.currentProgress / den.progress.totalNeeded : 0;
  const groups = ["World", "Forum", "Chain", "Collectables"] as const;

  return (
    <div className="space-y-16">
      {/* Who lives here */}
      <section className="panel p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <CrystalAvatar seed={seed} size="xl" nodeType={me?.nodeType} ring={ratio} title="Your snow crystal" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-semibold tracking-tight truncate">{me?.name ?? "Unnamed node"}</h2>
              <NodeBadge nodeType={me?.nodeType} />
            </div>
            {me?.handle && <p className="text-sm text-muted-foreground mt-1">/{me.handle}</p>}
            <div className="mt-5 max-w-md">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Level {den.level}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {den.progress.currentProgress} / {den.progress.totalNeeded} XP to level {den.level + 1}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-border)] mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-ink)] transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
            </div>
          </div>
          <Link
            href={`/profile/${me?.handle ?? address}`}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium ink-accent hover:underline underline-offset-4"
          >
            See your public profile <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      {/* What the den holds */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Figure icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />} value={den.earned.length} label="Badges" hint={`${den.locked.length} still out there`} />
        <Figure icon={<Flame className="h-4 w-4" strokeWidth={1.75} />} value={den.streak} label="Day streak" hint={`longest ${den.longestStreak}`} />
        <Figure icon={<Coins className="h-4 w-4" strokeWidth={1.75} />} value={den.coins} label="Coins" hint={`${den.xp} XP all time`} />
        <Figure
          icon={<Home className="h-4 w-4" strokeWidth={1.75} />}
          value={den.classOf ?? "—"}
          label="Class of"
          hint={den.classOf ? "your first C-Chain transaction" : "no C-Chain history found"}
        />
      </section>

      {/* Earned */}
      <section className="space-y-14">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">On the wall</h2>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-xl">
            Every badge here is derived from something the world already recorded. None of them can be bought.
          </p>
        </div>
        {den.earned.length === 0 ? (
          <Empty action={<Link href="/" className="text-sm font-medium ink-accent hover:underline underline-offset-4">Go say something</Link>}>
            The wall is bare. Post in a room, get vouched, ship something — the den fills itself.
          </Empty>
        ) : (
          groups.map((g) => <Group key={g} title={g} badges={den.earned.filter((b) => b.group === g)} />)
        )}
      </section>

      {/* Locked */}
      {den.locked.length > 0 && (
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="text-2xl font-semibold tracking-tight">Still out on the ice</h2>
          </div>
          <BadgeGrid badges={den.locked} />
        </section>
      )}

      <p className="text-xs text-muted-foreground border-t border-[var(--hairline)] pt-8">
        Nobody else can open your den. What a visitor sees is on your profile, and only what you chose to make visible.
      </p>
    </div>
  );
}
