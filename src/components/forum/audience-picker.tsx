"use client";

import { useState } from "react";
import { Globe, Lock, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVERYONE, describeAudience, type Audience, type NodeType } from "@/lib/world/audience";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Choosing who can read what you are about to post.
 *
 * The paper this forum follows warns that fine-grained access control
 * "requires additional effort from the users" and that it would be
 * inappropriate to use it on every contribution. Telescope's own rule is
 * blunter: nothing may stand between arriving and talking.
 *
 * So this is a single line that already holds the right answer. It reads
 * "Anyone can read this", it is not a required field, and posting without
 * touching it is the same one tap it always was. Only someone who wants a
 * narrower audience ever opens it.
 *
 * The options are attributes, never people. You cannot pick a reader here,
 * because the author of a post is usually looking for readers they have
 * never met — that is the paper's whole argument against naming names.
 */

export interface AudienceOptions {
  /** The author's own faction, if they have one. You can only hand a key to a door you are behind. */
  factionSlug?: string | null;
  factionName?: string | null;
  regionSlug?: string | null;
  regionName?: string | null;
}

interface Choice {
  key: string;
  label: string;
  hint: string;
  audience: Audience;
}

function choicesFor(opts: AudienceOptions): Choice[] {
  const out: Choice[] = [
    { key: "everyone", label: "Anyone", hint: "Signed in or not", audience: EVERYONE },
    ...(["ANCHOR", "ELDER"] as NodeType[]).map((atLeast) => ({
      key: atLeast,
      label: atLeast === "ANCHOR" ? "Anchors and above" : "Elders only",
      hint: atLeast === "ANCHOR" ? "Verified in person" : "The smallest room",
      audience: { kind: "attributes", require: [{ attr: "nodeType" as const, atLeast }] } as Audience,
    })),
  ];
  if (opts.factionSlug) {
    out.push({
      key: `faction:${opts.factionSlug}`,
      label: opts.factionName ?? opts.factionSlug,
      hint: "Your faction",
      audience: { kind: "attributes", require: [{ attr: "faction", slug: opts.factionSlug }] },
    });
  }
  if (opts.regionSlug) {
    out.push({
      key: `region:${opts.regionSlug}`,
      label: opts.regionName ?? opts.regionSlug,
      hint: "Your region",
      audience: { kind: "attributes", require: [{ attr: "region", slug: opts.regionSlug }] },
    });
  }
  return out;
}

export function AudienceDropdown({
  value,
  onChange,
  options = {},
  className,
}: {
  value: Audience;
  onChange: (a: Audience) => void;
  options?: AudienceOptions;
  className?: string;
}) {
  const choices = choicesFor(options);
  const restricted = value.kind !== "everyone";
  const current = describeAudience(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all border outline-none",
            restricted
              ? "border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 shadow-sm"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600",
            className
          )}
          aria-label="Audience access level"
        >
          {restricted ? (
            <Lock className="h-3.5 w-3.5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
          ) : (
            <Globe className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
          )}
          <span className="truncate max-w-[140px] sm:max-w-[180px]">{current}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 p-1.5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl"
      >
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-zinc-100 dark:border-zinc-800 mb-1 flex items-center justify-between">
          <span>Audience Access</span>
          <span className="text-[9px] font-normal lowercase opacity-75">who can view</span>
        </div>
        {choices.map((c) => {
          const selected = describeAudience(c.audience) === current;
          const isRestricted = c.audience.kind !== "everyone";
          return (
            <DropdownMenuItem
              key={c.key}
              onClick={() => onChange(c.audience)}
              className={cn(
                "flex items-start justify-between gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors",
                selected
                  ? "bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 font-medium"
                  : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <div className="flex items-start gap-2 min-w-0">
                {isRestricted ? (
                  <Lock className="h-3.5 w-3.5 mt-0.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                ) : (
                  <Globe className="h-3.5 w-3.5 mt-0.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                    {c.hint}
                  </span>
                </div>
              </div>
              {selected && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0 ml-1 mt-0.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AudiencePicker({
  value,
  onChange,
  options = {},
  variant = "bar",
  className,
}: {
  value: Audience;
  onChange: (a: Audience) => void;
  options?: AudienceOptions;
  variant?: "bar" | "pill";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (variant === "pill") {
    return <AudienceDropdown value={value} onChange={onChange} options={options} className={className} />;
  }

  const choices = choicesFor(options);
  const restricted = value.kind !== "everyone";
  const current = describeAudience(value);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        // min-h-11 is 44px: the smallest thing a thumb reliably hits.
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {restricted ? <Lock className="h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-400" /> : <Globe className="h-4 w-4 flex-shrink-0" />}
        <span className="flex-1 truncate">
          {restricted ? <span className="font-medium text-foreground">{current}</span> : "Anyone can read this"}
        </span>
        <span className="flex-shrink-0 text-xs underline">{open ? "done" : "change"}</span>
      </button>

      {open && (
        <ul className="mt-1 space-y-1">
          {choices.map((c) => {
            const selected = describeAudience(c.audience) === current;
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.audience);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition-colors",
                    selected
                      ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/40"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The line under a thread or post saying who can read it. Absent when it is open to anyone. */
export function AudienceTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
        className
      )}
    >
      <Lock className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * What a reader sees where a withheld post would be.
 *
 * It says what would open it and stops there — no author, no time, no
 * length, no count of who is already inside. The paper asks that a refused
 * reader be told which credential is required; it does not ask that they be
 * told anything about the people who hold it.
 */
export function WithheldPost({ requirement }: { requirement: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-sm text-muted-foreground dark:border-zinc-700">
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span>{requirement}</span>
    </div>
  );
}
