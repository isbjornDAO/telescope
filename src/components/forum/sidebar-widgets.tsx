"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar as CalendarIcon,
  Trophy,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";

interface DiscordEvent {
  id: string;
  name: string;
  description: string;
  scheduledStartTime: string;
  guildName: string;
}

interface SeasonRow {
  number: number;
  name: string;
  theme: string;
  phase: string;
  week: number;
  entries: number;
  victor: { id: string; title: string; crew: { name: string; slug: string } | null } | null;
}


export function SidebarWidgets() {
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const { data: seasons } = useWorldQuery<SeasonRow[]>(
    ["seasons"],
    "/api/world/seasons"
  );

  const activeSeason = seasons?.find(
    (s) => s.phase === "building" || s.phase === "voting"
  ) || seasons?.[0];

  useEffect(() => {
    fetch("/api/discord/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (Array.isArray(data.events)) {
          setEvents(data.events.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  return (
    <aside className="space-y-6">
      {/* Widget 1: Upcoming Events Box (Roxo / Purple) */}
      <div className="retro-box">
        <div className="retro-box-title justify-between">
          <div className="flex items-center">
            <div className="retro-box-icon purple">
              <CalendarIcon className="h-5 w-5 drop-shadow-sm" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
              Upcoming Events
            </span>
          </div>
          <Link
            href="/calendar"
            className="retro-btn retro-btn-gray text-[10px] px-2 py-1 mr-2"
          >
            View All
          </Link>
        </div>

        <div className="p-3">
          {eventsLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 italic">
              No upcoming events scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 transition text-xs flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold truncate text-zinc-800 dark:text-zinc-100">
                      {event.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(event.scheduledStartTime), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {event.guildName || "Telescope Discord"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Widget 2: Tournament Standings Box (Amarelo / Gold) */}
      <div className="retro-box">
        <div className="retro-box-title justify-between">
          <div className="flex items-center">
            <div className="retro-box-icon gold">
              <Trophy className="h-5 w-5 drop-shadow-sm" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
              Tournaments
            </span>
          </div>
          <Link
            href="/tournaments"
            className="retro-btn retro-btn-gray text-[10px] px-2 py-1 mr-2"
          >
            Bracket
          </Link>
        </div>

        <div className="p-3">
          <div className="retro-subtitle-bar mb-3">
            <div className="retro-subtitle-icon bg-[#E5AC00]">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
              Season {activeSeason?.number ?? 1} · {activeSeason?.phase ?? "Building"}
            </span>
          </div>

          <div className="p-3 rounded border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 text-xs space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
                Theme / Challenge
              </span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                {activeSeason?.theme || "Autonomous Agents & Consensus"}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-amber-200/60 dark:border-amber-900/40">
              <span>Week {activeSeason?.week ?? 1}</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {activeSeason?.entries ?? 0} Bracket Entries
              </span>
            </div>

            {activeSeason?.victor && (
              <div className="mt-2 p-2 rounded bg-white/80 dark:bg-zinc-800/80 border border-amber-300/60 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground block">Current Victor</span>
                  <span className="font-bold truncate block">{activeSeason.victor.title}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
