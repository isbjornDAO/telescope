"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { WorldPage } from "@/components/world/primitives";

const BUILD_SECTIONS = [
  { href: "/research", label: "Research", match: (p: string) => p.startsWith("/research") },
  { href: "/projects", label: "Projects", match: (p: string) => p.startsWith("/projects") },
  {
    href: "/tournaments",
    label: "Tournaments",
    match: (p: string) =>
      p.startsWith("/tournaments") ||
      p.startsWith("/entries") ||
      p.startsWith("/rounds"),
  },
] as const;

function BuildBreadcrumb() {
  const pathname = usePathname() ?? "";
  const current =
    BUILD_SECTIONS.find((s) => s.match(pathname)) ?? BUILD_SECTIONS[0];

  return (
    <div className="retro-topic-header flex items-center gap-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <Link
          href="/research"
          className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors"
        >
          Build
        </Link>
        <span className="text-zinc-400 dark:text-zinc-600 select-none">/</span>
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {current.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Shared chrome for Build sub-pages (Research, Projects, Tournaments).
 * Forum-style breadcrumb + shared cover marquee.
 */
export function BuildPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <WorldPage wide>
      <div className="space-y-6">
        <BuildBreadcrumb />

        <div className="retro-box overflow-hidden shadow-sm">
          <div className="retro-profile-cover flex flex-col justify-end p-5 sm:p-6 text-white min-h-[140px] sm:min-h-[160px]">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-mono text-[11px] px-2.5 py-0.5 rounded uppercase font-bold tracking-wider inline-flex items-center gap-1.5">
                  {eyebrow}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                  {title}
                </h1>
                <p className="text-sm text-sky-100/90 drop-shadow-sm max-w-2xl leading-relaxed">
                  {description}
                </p>
              </div>
              {actions ? (
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {children}
      </div>
    </WorldPage>
  );
}
