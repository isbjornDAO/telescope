"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVERYONE, describeAudience, type Audience, type NodeType } from "@/lib/world/audience";

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

export function AudiencePicker({
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
  const [open, setOpen] = useState(false);
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
