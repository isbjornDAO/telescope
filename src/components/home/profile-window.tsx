"use client";

import Link from "next/link";
import { Sparkles, Radar, Link2, KeyRound, Wallet, CheckCircle2, Clock, ArrowRight, Users, Home, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeBadge } from "@/components/world/primitives";
import { CrystalAvatar } from "@/components/world/snow-crystal";
import { useDen } from "@/hooks/use-den";
import { useWorldSession } from "@/hooks/use-world";
import { useDailyXp, useActiveUsers } from "@/components/forum/use-forum";

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="panel p-6">{children}</div>;
}

function Row({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: React.ReactNode; href?: string }) {
  const body = (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:text-[var(--accent-ink)] transition-colors">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Who you are in this world, on the page you land on. */
export function ProfileWindow() {
  const { me, isSignedIn, isConnected, isLoading, mismatch, signIn } = useWorldSession();
  const { earnedToday, timeUntilReset } = useDailyXp();
  const activeUsers = useActiveUsers();
  const den = useDen(isSignedIn ? me?.address : undefined, { nodeType: me?.nodeType });

  if (isLoading) {
    return (
      <Shell>
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded bg-muted animate-pulse mt-4" />
        <div className="h-3 w-full rounded bg-muted animate-pulse mt-6" />
      </Shell>
    );
  }

  if (!isConnected) {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <Wallet className="h-4 w-4 ink-accent" strokeWidth={1.75} />
          You are a stranger here
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Read anything. To post, vouch or send a scout, connect a wallet with the button in the top right. A profile is a name you chose, never a legal identity.
        </p>
        <div className="h-px bg-[var(--hairline)] my-5" />
        <Row icon={<Users className="h-4 w-4" strokeWidth={1.75} />} label="In the world now" value={activeUsers} />
      </Shell>
    );
  }

  if (!isSignedIn) {
    return (
      <Shell>
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <KeyRound className="h-4 w-4 ink-accent" strokeWidth={1.75} />
          {mismatch ? "Your wallet changed" : "One signature to enter"}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          {mismatch ? "Sign in again with the wallet you are connected with now." : "It proves you control the wallet and reveals nothing else."}
        </p>
        {signIn.error && <p className="text-sm text-red-600 mt-3">{(signIn.error as Error).message}</p>}
        <Button className="snow-button w-full mt-5" onClick={() => signIn.mutate()} disabled={signIn.isPending}>
          {signIn.isPending ? "Waiting for signature…" : "Sign in to the world"}
        </Button>
      </Shell>
    );
  }

  const profileHref = `/profile/${me?.handle ?? me?.address}`;
  const levelRatio = den.progress.totalNeeded ? den.progress.currentProgress / den.progress.totalNeeded : 0;

  return (
    <Shell>
      <div className="flex items-start gap-4">
        <Link href={profileHref} className="shrink-0" title="Your profile">
          <CrystalAvatar
            seed={me?.handle ?? me?.address ?? ""}
            size="lg"
            nodeType={me?.nodeType}
            ring={levelRatio}
            title={me?.name ?? "Your snow crystal"}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="block text-lg font-semibold truncate hover:text-[var(--accent-ink)] transition-colors">
            {me?.name ?? "Unnamed node"}
          </Link>
          {me?.handle && <p className="text-xs text-muted-foreground mt-0.5 truncate">/{me.handle}</p>}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <NodeBadge nodeType={me?.nodeType} />
            <span className="text-[11px] text-muted-foreground tabular-nums">Level {den.level}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2.5">
        <span className="text-4xl font-semibold tabular-nums leading-none tracking-tight">{(me?.standing ?? 0).toFixed(2)}</span>
        <Sparkles className="h-4 w-4 ink-accent mb-1" strokeWidth={1.75} />
      </div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-2">Weight this season</p>

      {(me?.region || me?.faction) && (
        <div className="flex flex-wrap gap-2 mt-5">
          {me.region && (
            <Link href={`/regions/${me.region.slug}`} className="text-xs rounded-full border border-[var(--surface-border)] px-2.5 py-1 hover:bg-accent/60 transition-colors">
              {me.region.name}
            </Link>
          )}
          {me.faction && (
            <Link href={`/factions/${me.faction.slug}`} className="text-xs rounded-full border border-[var(--surface-border)] px-2.5 py-1 hover:bg-accent/60 transition-colors">
              {me.faction.name}
            </Link>
          )}
        </div>
      )}

      <div className="h-px bg-[var(--hairline)] my-5" />

      <div className="divide-y divide-[var(--hairline)]">
        <Row
          icon={earnedToday ? <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} /> : <Clock className="h-4 w-4" strokeWidth={1.75} />}
          label={earnedToday ? "XP earned today" : "1 XP available"}
          value={<span className="text-xs text-muted-foreground">resets in {timeUntilReset}</span>}
        />
        <Row icon={<Award className="h-4 w-4" strokeWidth={1.75} />} label="Badges earned" value={den.earned.length} href="/den" />
        <Row icon={<Radar className="h-4 w-4" strokeWidth={1.75} />} label="Scout offers" value={me?.pendingOffers ?? 0} href="/scout" />
        <Row icon={<Link2 className="h-4 w-4" strokeWidth={1.75} />} label="Vouches left" value={me?.scoutBudget?.remaining ?? "—"} href="/trust" />
        <Row icon={<Users className="h-4 w-4" strokeWidth={1.75} />} label="In the world now" value={activeUsers} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link
          href="/den"
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--surface-border)] text-sm font-medium hover:bg-accent/60 transition-colors"
        >
          <Home className="h-3.5 w-3.5" strokeWidth={1.75} /> Your snow den
        </Link>
        <Link
          href={profileHref}
          className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium ink-accent hover:underline underline-offset-4"
        >
          Profile <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </Shell>
  );
}
