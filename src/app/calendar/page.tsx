"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  ExternalLink,
  Download,
  Server,
  ChevronRight,
  ChevronLeft,
  Plus,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { CalendarSkeleton } from "@/components/ui/retro-skeletons";
import { CommunityServersWidget } from "@/components/community-servers-widget";
import { AddDiscordServerDialog } from "@/components/add-discord-server-dialog";
import { useAccount } from "wagmi";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address } from "viem";

interface DiscordEvent {
  id: string;
  name: string;
  description: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string | null;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildInvite?: string;
  userCount?: number;
  status?: number;
  location?: string;
}

export default function CalendarPage() {
  const { address, isConnected } = useAccount();
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
    address as Address,
    isConnected
  );

  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<DiscordEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);

  useEffect(() => {
    fetchDiscordEvents();
  }, []);

  const fetchDiscordEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/discord/events", {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching Discord events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isEventLive = useCallback((event: DiscordEvent) => {
    if (event.status === 2) return true;
    const now = Date.now();
    const start = new Date(event.scheduledStartTime).getTime();
    const end = event.scheduledEndTime
      ? new Date(event.scheduledEndTime).getTime()
      : start + 2 * 60 * 60 * 1000;
    return now >= start && now <= end;
  }, []);

  // Filter upcoming events for event counter
  const upcomingEventsCount = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => {
      const start = new Date(event.scheduledStartTime).getTime();
      const end = event.scheduledEndTime
        ? new Date(event.scheduledEndTime).getTime()
        : start + 2 * 60 * 60 * 1000;
      return end >= now || event.status === 2;
    }).length;
  }, [events]);

  const serversSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        guildId: string;
        guildName: string;
        guildIcon: string | null;
        guildInvite?: string;
        eventsCount: number;
      }
    >();

    events.forEach((event) => {
      if (!map.has(event.guildId)) {
        map.set(event.guildId, {
          guildId: event.guildId,
          guildName: event.guildName,
          guildIcon: event.guildIcon,
          guildInvite: event.guildInvite,
          eventsCount: 0,
        });
      }
      map.get(event.guildId)!.eventsCount += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.eventsCount - a.eventsCount
    );
  }, [events]);

  const calendarGridDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNumber: number;
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: DiscordEvent[];
    }> = [];

    const today = new Date();

    // 1. Days from previous month to fill the first week
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDate - i;
      const date = new Date(year, month - 1, dayNumber);
      const dayEvents = events.filter((e) => {
        const d = new Date(e.scheduledStartTime);
        return (
          d.getDate() === dayNumber &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });
      days.push({
        dayNumber,
        date,
        isCurrentMonth: false,
        isToday:
          today.getDate() === dayNumber &&
          today.getMonth() === date.getMonth() &&
          today.getFullYear() === date.getFullYear(),
        events: dayEvents,
      });
    }

    // 2. Days from current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayEvents = events.filter((e) => {
        const eventDate = new Date(e.scheduledStartTime);
        return (
          eventDate.getDate() === d &&
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });
      days.push({
        dayNumber: d,
        date,
        isCurrentMonth: true,
        isToday:
          today.getDate() === d &&
          today.getMonth() === month &&
          today.getFullYear() === year,
        events: dayEvents,
      });
    }

    // 3. Days from next month to complete the last week
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingDays; n++) {
      const date = new Date(year, month + 1, n);
      const dayEvents = events.filter((e) => {
        const d = new Date(e.scheduledStartTime);
        return (
          d.getDate() === n &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });
      days.push({
        dayNumber: n,
        date,
        isCurrentMonth: false,
        isToday:
          today.getDate() === n &&
          today.getMonth() === date.getMonth() &&
          today.getFullYear() === date.getFullYear(),
        events: dayEvents,
      });
    }

    return days;
  }, [currentMonth, events]);

  const eventsInMonthCount = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.scheduledStartTime);
      return (
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [events, currentMonth]);

  const previousMonth = useCallback(() => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  }, [currentMonth]);

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Discord link reminder if wallet connected */}
      {isConnected && !isUserStatsLoading && !userStats?.discordId && (
        <div className="w-full">
          <ConnectDiscordAlert />
        </div>
      )}

      {/* Retro Topic Header Breadcrumbs & Controls */}
      <div className="retro-topic-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/"
            className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
          >
            Home
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Community Calendar
          </span>
          <span className="text-zinc-400 dark:text-zinc-600 hidden sm:inline">·</span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {upcomingEventsCount} {upcomingEventsCount === 1 ? "Event" : "Events"} Scheduled
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          <button
            type="button"
            onClick={previousMonth}
            className="retro-btn retro-btn-gray h-7 w-7 p-0"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="retro-btn retro-btn-gray h-7 px-2.5 text-xs font-semibold"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="retro-btn retro-btn-gray h-7 w-7 p-0"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsAddServerOpen(true)}
            className="retro-btn retro-btn-blue h-7 px-2.5 text-xs font-bold inline-flex items-center gap-1 ml-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Server</span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Grid matching CalendarSkeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid - 8 cols */}
        <div className="lg:col-span-8">
          <div className="retro-box">
            {/* Calendar Title Bar */}
            <div className="retro-box-title justify-between px-3.5 sm:px-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
                <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {eventsInMonthCount} {eventsInMonthCount === 1 ? "event" : "events"} this month
              </span>
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="font-bold text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>

              {/* Day cells - square aspect ratio with preceding & succeeding month days (no gaps) */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                {calendarGridDays.map((cell, idx) => {
                  return (
                    <div
                      key={`${cell.isCurrentMonth ? "cur" : "ext"}-${cell.dayNumber}-${idx}`}
                      onClick={() => {
                        if (cell.events.length > 0) {
                          setSelectedEvent(cell.events[0]);
                          setIsModalOpen(true);
                        } else if (!cell.isCurrentMonth) {
                          setCurrentMonth(
                            new Date(cell.date.getFullYear(), cell.date.getMonth(), 1)
                          );
                        }
                      }}
                      className={`aspect-square p-2 sm:p-2.5 rounded-[5px] border transition-all flex flex-col justify-between select-none ${
                        cell.events.length > 0 || !cell.isCurrentMonth ? "cursor-pointer" : ""
                      } ${
                        !cell.isCurrentMonth
                          ? "border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/40 dark:bg-zinc-900/20 opacity-45 hover:opacity-75"
                          : cell.isToday
                          ? "border-[#2689BF] bg-[#2689BF]/5 dark:bg-[#2689BF]/10 ring-1 ring-[#2689BF]/30 shadow-xs"
                          : cell.events.length > 0
                          ? "border-zinc-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
                          : "border-zinc-200/60 dark:border-zinc-800/70 bg-white/30 dark:bg-zinc-900/20 hover:bg-white/60 dark:hover:bg-zinc-900/40"
                      }`}
                    >
                      {/* Top: Day Number & Indicator */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs sm:text-sm ${
                            !cell.isCurrentMonth
                              ? "font-medium text-zinc-400 dark:text-zinc-500"
                              : cell.isToday
                              ? "font-extrabold text-[#2689BF] dark:text-[#52aae0]"
                              : "font-bold text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {cell.isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#2689BF] dark:text-[#52aae0] hidden sm:inline">
                            Today
                          </span>
                        )}
                        {cell.events.length > 0 && !cell.isToday && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cell.isCurrentMonth
                                ? "bg-[#2689BF] dark:bg-[#52aae0]"
                                : "bg-zinc-400"
                            } shrink-0 sm:hidden`}
                          />
                        )}
                      </div>

                      {/* Day Event Pills */}
                      <div className="space-y-1 flex-1 flex flex-col justify-end overflow-hidden mt-1">
                        {cell.events.slice(0, 2).map((event) => {
                          const isLive = isEventLive(event);
                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsModalOpen(true);
                              }}
                              className={`w-full text-left p-1 rounded text-[10px] sm:text-[11px] font-semibold truncate flex items-center gap-1.5 border transition-all cursor-pointer ${
                                isLive
                                  ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100"
                                  : "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/70 text-[#1e6b99] dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60"
                              }`}
                              title={`${event.name} (${format(
                                new Date(event.scheduledStartTime),
                                "h:mm a"
                              )})`}
                            >
                              {isLive ? (
                                <span className="relative flex h-1.5 w-1.5 shrink-0 ml-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                </span>
                              ) : event.guildIcon ? (
                                <img
                                  src={event.guildIcon}
                                  alt=""
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0"
                                />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2689BF] shrink-0 ml-0.5" />
                              )}
                              <span className="truncate flex-1 leading-tight">
                                {event.name}
                              </span>
                            </button>
                          );
                        })}

                        {cell.events.length > 2 && (
                          <div
                            className="text-[9px] sm:text-[10px] font-bold text-[#2689BF] dark:text-[#52aae0] truncate hover:underline cursor-pointer pl-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(cell.events[0]);
                              setIsModalOpen(true);
                            }}
                          >
                            +{cell.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - 4 cols (Community Servers widget without accordion, directly opening invites) */}
        <div className="lg:col-span-4 space-y-4">
          <CommunityServersWidget servers={serversSummary} />
        </div>
      </div>

      {/* Retro Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md retro-box p-0 border-0 overflow-hidden shadow-2xl">
          {selectedEvent && (
            <div>
              {/* Header */}
              <DialogHeader className="retro-box-title justify-between px-4 py-3 bg-gradient-to-r from-[#2495D4] to-[#126391] text-white">
                <DialogTitle className="flex items-center gap-2 min-w-0 text-white font-bold text-sm">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">Event Details</span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 space-y-4 bg-background">
                {/* Guild & Event Title */}
                <div className="flex items-start gap-3">
                  {selectedEvent.guildIcon ? (
                    <img
                      src={selectedEvent.guildIcon}
                      alt=""
                      className="w-12 h-12 rounded-xl shadow-xs flex-shrink-0"
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
                      <span className="font-medium">
                        {selectedEvent.guildName}
                      </span>
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
                      {format(
                        new Date(selectedEvent.scheduledStartTime),
                        "h:mm a"
                      )}
                      {selectedEvent.scheduledEndTime &&
                        ` - ${format(
                          new Date(selectedEvent.scheduledEndTime),
                          "h:mm a"
                        )}`}
                      {" "}
                      <span className="text-zinc-400">
                        (
                        {formatDistanceToNow(
                          new Date(selectedEvent.scheduledStartTime),
                          { addSuffix: true }
                        )}
                        )
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

                  {/* Community Interest */}
                  {selectedEvent.userCount !== undefined &&
                    selectedEvent.userCount > 0 && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-[#2689BF] dark:text-[#52aae0]" />
                          <span className="font-semibold text-[11px] uppercase tracking-wider">
                            Community Interest
                          </span>
                        </div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">
                          {selectedEvent.userCount}{" "}
                          {selectedEvent.userCount === 1
                            ? "person interested"
                            : "people interested"}
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
                  <button
                    type="button"
                    className="retro-btn retro-btn-gray w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold"
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Discord Server Dialog */}
      <AddDiscordServerDialog
        open={isAddServerOpen}
        onOpenChange={setIsAddServerOpen}
      />
    </div>
  );
}

