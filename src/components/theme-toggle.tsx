"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`retro-btn-secondary ${className}`}
        aria-label="Toggle theme"
      >
        <SunMedium className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`retro-btn-secondary ${className}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
    </button>
  );
}
