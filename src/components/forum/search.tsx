"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Submits to the same route as a query param, so results stay linkable. */
export function ForumSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        router.push(trimmed ? `/forum?q=${encodeURIComponent(trimmed)}` : "/forum");
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search questions"
        aria-label="Search questions"
        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-foreground/30 sm:w-64"
      />
    </form>
  );
}
