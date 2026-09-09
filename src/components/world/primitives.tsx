"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Anchor, Crown, Snowflake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageNavigation } from "@/components/page-navigation";
import { Skeleton } from "@/components/ui/skeleton";

/** Standard page container under the header. Wide gutters, quiet air. */
export function WorldPage({ title, subtitle, actions, children, wide, nav = true }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; wide?: boolean; nav?: boolean }) {
  return (
    <div className={cn("w-full mx-auto px-5 sm:px-8 lg:px-10 relative z-10 pt-2 pb-24", wide ? "max-w-[1400px]" : "max-w-5xl")}>
      {nav && <PageNavigation />}
      {(title || actions) && (
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            {title && <h1 className="text-3xl md:text-[2.5rem] font-semibold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-[15px] leading-relaxed text-muted-foreground mt-3 text-pretty">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}

/** Flat panel. Kept under the old name so every page keeps working. */
export function Frost({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel p-6 md:p-8", className)} {...rest}>
      {children}
    </div>
  );
}

export const Panel = Frost;

/** A section with no box around it: air does the separating. */
export function Section({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("space-y-5", className)} {...rest}>
      {children}
    </section>
  );
}

export function SectionTitle({ icon, children, right, description }: { icon?: ReactNode; children: ReactNode; right?: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 mb-5">
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
          {icon}
          {children}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
      </div>
      {right && <div className="shrink-0 text-sm order-first sm:order-none self-start sm:self-auto">{right}</div>}
    </div>
  );
}

/** Quiet inline link, used for the "all X" affordance beside a section title. */
export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[13px] font-medium ink-accent hover:underline underline-offset-4">
      {children}
    </Link>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("py-1", className)}>
      <div className="text-3xl font-semibold leading-none tabular-nums tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-2">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
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
      <div className="flex gap-1.5">
        {Array.from({ length: weeks + 1 }).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < week ? "bg-sky-500" : i === week ? "bg-sky-400" : "bg-[var(--surface-border)]")} title={`Week ${labels[i] ?? i}`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-2.5">
        <span>week 0 · theme announced</span>
        <span className="capitalize">{phase}</span>
        <span>week 6 · Victor named</span>
      </div>
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--surface-border)] px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground text-pretty">
      <p className="max-w-md mx-auto">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something broke in the world.";
  return <div className="rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/25 dark:border-red-900/60 px-5 py-4 text-sm text-red-800 dark:text-red-200">{message}</div>;
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
