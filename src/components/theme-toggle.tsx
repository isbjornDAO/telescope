"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--surface-border)]">
        <SunMedium className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--surface-border)] hover:bg-accent/60 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      ) : (
        <SunMedium className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      )}
    </button>
  );
}
