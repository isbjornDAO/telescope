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
      <button className="flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg w-11 h-11 md:w-9 md:h-9 shadow">
        <SunMedium className="h-5 w-5 md:h-4 md:w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg w-11 h-11 md:w-9 md:h-9 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 md:h-4 md:w-4" />
      ) : (
        <SunMedium className="h-5 w-5 md:h-4 md:w-4" />
      )}
    </button>
  );
}
