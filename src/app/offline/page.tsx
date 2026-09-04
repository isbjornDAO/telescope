import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Offline" };

/** Served by the service worker when a navigation fails with no network. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col items-center justify-center px-6 text-center">
      <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-5 text-lg font-semibold">You are offline</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Telescope needs a connection to load the timeline. This page will work
        again as soon as you are back.
      </p>
    </div>
  );
}
