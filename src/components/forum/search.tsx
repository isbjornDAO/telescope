"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Collapses to an icon button on mobile, where a persistent input would crowd
 * out the sort tabs and the new-topic button on a 390px row.
 */
export function ForumSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [expanded, setExpanded] = useState(defaultValue.length > 0);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  }

  return (
    <>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Search topics"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
      ) : null}

      <form
          role="search"
          onSubmit={submit}
          className={`relative flex-1 sm:flex-none ${expanded ? "" : "hidden sm:block"}`}
        >
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search"
          aria-label="Search topics"
          autoFocus={defaultValue.length === 0}
          className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm outline-none transition-colors focus:border-foreground/30 sm:w-48"
        />
        <button
          type="button"
          onClick={() => {
            setValue("");
            setExpanded(false);
            if (defaultValue) router.push("/");
          }}
          aria-label="Close search"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </form>
    </>
  );
}
