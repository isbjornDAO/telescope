import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  ExternalLink,
  Download,
  Server,
  ChevronRight,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SnowTvWidget } from "@/components/forum/snow-tv-widget";
import { DispatchesWidget } from "@/components/forum/dispatches-widget";
import { EcosystemRadarWidget } from "@/components/forum/ecosystem-radar-widget";
import { CommunityServersWidget } from "@/components/community-servers-widget";

interface DiscordEvent {
  id: string;
  name: string;
  description: string;
  scheduledStartTime: string;
  scheduledEndTime: string | null;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildInvite?: string;
  location?: string;
  userCount?: number;
  status?: number;
}

function isEventLive(event: DiscordEvent): boolean {
  if (event.status === 2) return true;
  const now = Date.now();
  const start = new Date(event.scheduledStartTime).getTime();
  const end = event.scheduledEndTime
    ? new Date(event.scheduledEndTime).getTime()
    : start + 2 * 60 * 60 * 1000;
  return now >= start && now <= end;
}

function formatEventTimeBadge(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, "h:mm a")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d · h:mm a");
}

export function SidebarWidgets() {
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DiscordEvent | null>(null);

  useEffect(() => {
    fetch("/api/discord/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  // Filter out ended events and ensure chronological sort
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => {
        const start = new Date(event.scheduledStartTime).getTime();
        const end = event.scheduledEndTime
          ? new Date(event.scheduledEndTime).getTime()
          : start + 2 * 60 * 60 * 1000;
        return end >= now || event.status === 2;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledStartTime).getTime() -
          new Date(b.scheduledStartTime).getTime()
      )
      .slice(0, 4);
  }, [events]);

  return (
    <aside className="space-y-6">
      {/* Widget: Upcoming Events Box */}
      <div className="retro-box">
        <div className="retro-box-title justify-between px-3.5 sm:px-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              Upcoming Events
            </span>
          </div>
          <Link
            href="/calendar"
            className="retro-btn retro-btn-gray text-[10px] px-2 py-1 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-3">
          {eventsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-800/30 flex items-center gap-2.5 animate-pulse"
                >
                  <div className="w-9 h-10 rounded bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-2.5 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-5 px-3">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground italic mb-2">
                No upcoming events scheduled.
              </p>
              <Link
                href="/calendar"
                className="text-[11px] text-[#2689BF] dark:text-[#52aae0] hover:underline"
              >
                Browse community calendar →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map((event) => {
                const isLive = isEventLive(event);
                const startDate = new Date(event.scheduledStartTime);

                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#2689BF]/40 dark:hover:border-[#52aae0]/40 hover:shadow-sm transition-all group flex items-center gap-2.5 cursor-pointer"
                    >
                      {/* Left: Mini Date / Live Chip */}
                      {isLive ? (
                        <div className="w-10 h-10 rounded-md bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex flex-col items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                          <span className="relative flex h-2 w-2 mb-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                          <span className="text-[8px] font-black tracking-wider uppercase">
                            LIVE
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">
                            {format(startDate, "MMM")}
                          </span>
                          <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 leading-tight">
                            {format(startDate, "d")}
                          </span>
                        </div>
                      )}

                      {/* Middle: Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs truncate text-zinc-800 dark:text-zinc-100 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] transition-colors">
                            {event.name}
                          </span>
                          {isLive ? (
                            <span className="text-[10px] font-bold text-red-500 shrink-0">
                              Now
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDistanceToNow(startDate, { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Guild & Attendee row */}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                          {event.guildIcon ? (
                            <img
                              src={event.guildIcon}
                              alt=""
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                            />
                          ) : (
                            <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">
                            {event.guildName || "Telescope Community"}
                          </span>
                        </div>

                        {/* Event time & attendees */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <Clock className="w-3 h-3 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
                            {formatEventTimeBadge(event.scheduledStartTime)}
                          </span>
                          {event.userCount !== undefined && event.userCount > 0 && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Users className="w-3 h-3 text-[#2689BF] dark:text-[#52aae0]" />
                              {event.userCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Chevron */}
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] group-hover:translate-x-0.5 transition-all shrink-0 self-center opacity-70 group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Widget: Community Discord Servers */}
      <CommunityServersWidget />

      {/* Widget: SnowTV / Avalanche Watch */}
      <SnowTvWidget />

      {/* Widget: Avalanche Dispatches (Substack Alpha) */}
      <DispatchesWidget />

      {/* Widget: Avalanche Ecosystem Radar (Socials & Directory) */}
      <EcosystemRadarWidget />

      {/* Event Details Dialog Modal */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-md retro-box p-0 border-0 overflow-hidden shadow-2xl">
          {selectedEvent && (
            <div>
              {/* Retro Title Header */}
              <DialogHeader className="retro-box-title justify-between px-4 py-3 bg-gradient-to-r from-[#2495D4] to-[#126391] text-white">
                <DialogTitle className="flex items-center gap-2 min-w-0 text-white font-bold text-sm">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">Event Details</span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 space-y-4 bg-background">
                {/* Header: Guild & Event Title */}
                <div className="flex items-start gap-3">
                  {selectedEvent.guildIcon ? (
                    <img
                      src={selectedEvent.guildIcon}
                      alt=""
                      className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#2689BF]/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-6 h-6 text-[#2689BF]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
                      {selectedEvent.name}
                    </h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{selectedEvent.guildName}</span>
                    </div>
                  </div>
                </div>

                {/* Live Banner */}
                {isEventLive(selectedEvent) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-xs border border-red-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span>Happening right now!</span>
                  </div>
                )}

                {/* Details list */}
                <div className="space-y-2 text-xs">
                  {/* Date and Time */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Clock className="h-3.5 w-3.5 text-[#2689BF] dark:text-[#52aae0]" />
                      <span className="font-semibold text-[11px] uppercase tracking-wider">
                        Date & Time
                      </span>
                    </div>
                    <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                      {format(
                        new Date(selectedEvent.scheduledStartTime),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(selectedEvent.scheduledStartTime), "h:mm a")}
                      {selectedEvent.scheduledEndTime &&
                        ` - ${format(new Date(selectedEvent.scheduledEndTime), "h:mm a")}`}
                      {" "}
                      <span className="text-zinc-400">
                        ({formatDistanceToNow(
                          new Date(selectedEvent.scheduledStartTime),
                          { addSuffix: true }
                        )})
                      </span>
                    </div>
                  </div>

                  {/* Location if present */}
                  {selectedEvent.location && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <MapPin className="h-3.5 w-3.5 text-[#2689BF] dark:text-[#52aae0]" />
                        <span className="font-semibold text-[11px] uppercase tracking-wider">
                          Location
                        </span>
                      </div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                        {selectedEvent.location}
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {selectedEvent.userCount !== undefined && selectedEvent.userCount > 0 && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 text-[#2689BF] dark:text-[#52aae0]" />
                        <span className="font-semibold text-[11px] uppercase tracking-wider">
                          Community Interest
                        </span>
                      </div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-100">
                        {selectedEvent.userCount}{" "}
                        {selectedEvent.userCount === 1 ? "person interested" : "people interested"}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800 max-h-36 overflow-y-auto">
                      <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                        Description
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {selectedEvent.guildInvite && (
                    <a
                      href={selectedEvent.guildInvite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn retro-btn-blue w-full py-2 flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join Discord Server
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="retro-btn retro-btn-gray py-2 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      onClick={() => {
                        const params = new URLSearchParams({
                          eventId: selectedEvent.id,
                          name: selectedEvent.name,
                          description: selectedEvent.description || "",
                          startTime: selectedEvent.scheduledStartTime,
                          ...(selectedEvent.scheduledEndTime && {
                            endTime: selectedEvent.scheduledEndTime,
                          }),
                          location:
                            selectedEvent.location ||
                            `Discord - ${selectedEvent.guildName}`,
                        });
                        window.open(
                          `/api/discord/events/export?${params.toString()}`,
                          "_blank"
                        );
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Add to Calendar
                    </button>
                    <Link
                      href="/calendar"
                      className="retro-btn retro-btn-gray py-2 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      onClick={() => setSelectedEvent(null)}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      View Calendar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}
