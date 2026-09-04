"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type DiscordEvent = {
  id: string;
  name: string;
  scheduledStartTime: string;
  guildName: string;
};

/**
 * The next few community events, pulled from the Discord calendar.
 *
 * Events used to be a tab of their own; they belong beside the projects and
 * news in Discover. The full month view still lives at /calendar. The endpoint
 * needs a bot token, so a failure here renders nothing rather than an error.
 */
export function EventsStrip() {
  const [events, setEvents] = useState<DiscordEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discord/events")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list: DiscordEvent[] = Array.isArray(data) ? data : data?.events ?? [];
        const upcoming = list
          .filter((event) => new Date(event.scheduledStartTime) > new Date())
          .sort(
            (a, b) =>
              new Date(a.scheduledStartTime).getTime() -
              new Date(b.scheduledStartTime).getTime()
          )
          .slice(0, 4);
        setEvents(upcoming);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (events !== null && events.length === 0) return null;

  return (
    <section className="rounded-xl bg-white p-4 shadow-md dark:bg-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
        Coming up
      </h2>

      {events === null ? (
        <ul className="mt-3 space-y-2.5">
          {[0, 1].map((i) => (
            <li key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </ul>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-700/60">
            {events.map((event) => (
              <li key={event.id} className="py-2.5">
                <p className="text-sm leading-snug">{event.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(event.scheduledStartTime), "EEE d MMM, HH:mm")}
                  {event.guildName ? ` · ${event.guildName}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/calendar"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Full calendar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </section>
  );
}
