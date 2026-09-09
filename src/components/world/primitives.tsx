"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Anchor, Crown, Snowflake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageNavigation } from "@/components/page-navigation";
import { Skeleton } from "@/components/ui/skeleton";

/** Standard page container under the polar-bear header. */
export function WorldPage({ title, subtitle, actions, children, wide }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("w-full mx-auto pt-5 px-4 md:px-8 relative z-10 mb-16", wide ? "max-w-screen-xl" : "max-w-screen-lg")}>
      <PageNavigation />
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Frost({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("frost rounded-xl p-4 md:p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("frost rounded-xl px-4 py-3", className)}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold leading-tight mt-0.5 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

export function NodeBadge({ nodeType, band, className }: { nodeType?: "NODE" | "ANCHOR" | "ELDER" | string; band?: string; className?: string }) {
  const icon = nodeType === "ELDER" ? <Crown className="h-3 w-3" /> : nodeType === "ANCHOR" ? <Anchor className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />;
  const label = nodeType === "ELDER" ? "Elder" : nodeType === "ANCHOR" ? "Anchor" : "Node";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", nodeType === "ELDER" ? "ice-pill-elder" : nodeType === "ANCHOR" ? "ice-pill-anchor" : "ice-pill", className)}>
      {icon}
      {label}
      {band && band !== "none" && <span className="opacity-70">· {band} ice</span>}
    </span>
  );
}

export function TournamentBadge({ tournament }: { tournament: string }) {
  const map: Record<string, string> = { GTM: "GTM", LOCAL_SYSTEMS: "Local Systems", RESEARCH_PAPERS: "Research Papers" };
  return <span className="inline-flex rounded-md bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100 px-2 py-0.5 text-[11px] font-semibold">{map[tournament] ?? tournament}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "WINNER" ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" :
    status === "FINALIST" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" :
    status === "ELIMINATED" || status === "WITHDRAWN" ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" :
    "bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-100";
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold", tone)}>{status.toLowerCase()}</span>;
}

export function Weight({ value, word = "weight" }: { value: number; word?: string }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
      {value.toFixed(2)} <span className="text-muted-foreground text-xs">{word}</span>
    </span>
  );
}

export function SeasonStrip({ week, weeks = 6, phase }: { week: number; weeks?: number; phase: string }) {
  const labels = ["0 · announce", "1", "2", "3", "4", "5 · voting", "6 · finals"];
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: weeks + 1 }).map((_, i) => (
          <div key={i} className={cn("h-2 flex-1 rounded-full transition-colors", i < week ? "bg-sky-500" : i === week ? "bg-sky-300 animate-pulse" : "bg-zinc-200 dark:bg-zinc-700")} title={`Week ${labels[i] ?? i}`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>week 0 · theme announced</span>
        <span className="capitalize">{phase}</span>
        <span>week 6 · Victor named</span>
      </div>
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-muted-foreground">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something broke in the world.";
  return <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-800 dark:text-red-200">{message}</div>;
}

export function NameLink({ handle, name, className }: { handle?: string | null; name: string; className?: string }) {
  if (!handle) return <span className={className}>{name}</span>;
  return (
    <Link href={`/profile/${handle}`} className={cn("hover:underline font-medium", className)}>
      {name}
    </Link>
  );
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
