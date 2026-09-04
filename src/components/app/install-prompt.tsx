"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "telescope:install-dismissed";

/**
 * A single, dismissible invitation to install, shown only once the browser says
 * the app is actually installable.
 *
 * Chromium fires `beforeinstallprompt`; iOS Safari does not support it at all,
 * so this simply never appears there and users install through Share → Add to
 * Home Screen. Dismissal is remembered so it is never nagging.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Private mode can throw on access; treat it as not dismissed.
    }

    const onPrompt = (raw: Event) => {
      raw.preventDefault();
      setEvent(raw as InstallEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not being able to remember the dismissal is not worth an error.
    }
    setEvent(null);
  };

  return (
    <div className="bottom-safe fixed inset-x-3 z-40 flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-lg md:hidden">
      <Download className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        Add Telescope to your home screen.
      </p>
      <Button
        size="sm"
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          dismiss();
        }}
      >
        Install
      </Button>
      <button
        onClick={dismiss}
        aria-label="Not now"
        className="rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
