"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Users, Clock, ExternalLink, Download, Server, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectDiscordAlert } from "@/components/connect-discord-alert";
import { useAccount } from "wagmi";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address } from "viem";

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
  userCount?: number;
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
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscordEvents();
  }, []);

  const fetchDiscordEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching Discord events from API...");
      const response = await fetch('/api/discord/events', {
        // Add cache control for faster subsequent loads
        next: { revalidate: 300 } // Cache for 5 minutes
      });

      if (!response.ok) {
        console.error("❌ API response not OK:", response.status, response.statusText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 API Response:", {
        guildsCount: data.guildsCount,
        eventsCount: data.events?.length || 0,
        firstEvent: data.events?.[0]?.guildName
      });

      if (data.events) {
        setEvents(data.events);
        console.log(`✅ Loaded ${data.events.length} events from ${data.guildsCount} guilds`);

        // Log guild breakdown
        const guildBreakdown = data.events.reduce((acc: any, event: DiscordEvent) => {
          acc[event.guildName] = (acc[event.guildName] || 0) + 1;
          return acc;
        }, {});
        console.log("🏰 Events per guild:", guildBreakdown);
      } else {
        console.warn("⚠️ No events array in response");
      }
    } catch (error) {
      console.error("❌ Error fetching Discord events:", error);
      console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize expensive calculations
  const upcomingEvents = useMemo(() =>
    events
      .filter(event => new Date(event.scheduledStartTime) >= new Date())
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()),
    [events]
  );

  const todaysEvents = useMemo(() => {
    const today = new Date();
    return upcomingEvents.filter(event => {
      const eventDate = new Date(event.scheduledStartTime);
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    });
  }, [upcomingEvents]);

  const { servers, serverMap } = useMemo(() => {
    const map = new Map<string, {
      guildId: string;
      guildName: string;
      guildIcon: string | null;
      guildInvite?: string;
      events: DiscordEvent[];
    }>();

    upcomingEvents.forEach(event => {
      if (!map.has(event.guildId)) {
        map.set(event.guildId, {
          guildId: event.guildId,
          guildName: event.guildName,
          guildIcon: event.guildIcon,
          guildInvite: event.guildInvite,
          events: []
        });
      }
      map.get(event.guildId)?.events.push(event);
    });

    const serversList = Array.from(map.values()).sort((a, b) => b.events.length - a.events.length);
    return { servers: serversList, serverMap: map };
  }, [upcomingEvents]);

  const selectedServer = selectedGuildId ? serverMap.get(selectedGuildId) : null;

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  }, []);

  const getEventsForDay = useCallback((day: number) => {
    return upcomingEvents.filter(event => {
      const eventDate = new Date(event.scheduledStartTime);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  }, [upcomingEvents, currentMonth]);

  const previousMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }, [currentMonth]);

  const { daysInMonth, startingDayOfWeek } = useMemo(() =>
    getDaysInMonth(currentMonth),
    [currentMonth, getDaysInMonth]
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-4 mobile-content-align">
          <PageNavigation />
        </div>
        <div className="w-full max-w-screen-lg mx-auto px-8 pb-8">
          <div className="h-12 w-64 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded mb-8" />
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
        <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-4 mobile-content-align">
          <PageNavigation />

          {isConnected && !isUserStatsLoading && !userStats?.discordId && (
            <div className="mb-6">
              <ConnectDiscordAlert />
            </div>
          )}
        </div>

      <div className="w-full max-w-screen-lg mx-auto px-8 pb-8">
        {/* Today's Events Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Today</h2>
            {todaysEvents.length > 0 && (
              <div className="px-2 py-0.5 bg-primary/10 rounded-md">
                <span className="text-xs font-semibold text-primary">{todaysEvents.length}</span>
              </div>
            )}
          </div>
          <Card className="p-6 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 shadow-lg">
            {todaysEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground font-semibold mb-1">No events today</p>
                <p className="text-xs text-muted-foreground">Check the calendar below for upcoming events</p>
              </div>
            ) : (
              <div className="space-y-5">
                {todaysEvents.map((event, idx) => (
                  <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-5 last:pb-0 border-b last:border-b-0 border-zinc-200 dark:border-zinc-700">
                    {/* Column 1: Icon & Title (4 cols) */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      {event.guildIcon && (
                        <img loading="lazy" src={event.guildIcon} alt="" className="w-12 h-12 rounded-lg shadow-md flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm mb-1 line-clamp-2">{event.name}</div>
                        <div className="text-xs text-muted-foreground">{event.guildName}</div>
                      </div>
                    </div>

                    {/* Column 2: Event Info (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <div className="text-sm font-semibold">
                        {format(new Date(event.scheduledStartTime), 'h:mm a')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.scheduledStartTime), 'EEEE, MMMM d')}
                      </div>
                    </div>

                    {/* Column 3: Time Until & Interested + More Info (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">
                          in {formatDistanceToNow(new Date(event.scheduledStartTime)).replace('about ', '')}
                        </span>
                      </div>
                      {event.userCount !== undefined && event.userCount > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span><strong>{event.userCount}</strong> interested</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-1 group"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsModalOpen(true);
                        }}
                      >
                        More info
                        <ChevronRight className="h-3 w-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Calendar and Servers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Calendar - Left Side (2 columns) */}
          <div className="lg:col-span-2">
            <Card className="p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button onClick={previousMonth} variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-bold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button onClick={nextMonth} variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center font-semibold text-xs py-1.5 text-muted-foreground">
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dayEvents = getEventsForDay(day);
                  const isToday = day === new Date().getDate() &&
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      className="aspect-square p-1 flex items-center justify-center"
                    >
                      <div
                        className={`w-full h-full rounded-lg p-1.5 flex flex-col transition-all cursor-pointer ${
                          isToday ? 'bg-primary/10 font-bold border-2 border-primary/30' :
                          dayEvents.length > 0 ? 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-sm' :
                          'bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-xs font-semibold">{day}</div>
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="flex-1 flex flex-wrap gap-0.5 content-start">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              event.guildIcon && (
                                <div key={idx} className="relative group">
                                  <img
                                    src={event.guildIcon}
                                    alt={event.name}
                                    className="w-4 h-4 rounded shadow-sm cursor-pointer hover:scale-125 hover:shadow-md transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                      setIsModalOpen(true);
                                    }}
                                  />
                                  {/* Hover tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                                    <div className="font-semibold mb-1">{event.name}</div>
                                    <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                                      <Clock className="h-2.5 w-2.5" />
                                      {format(new Date(event.scheduledStartTime), 'h:mm a')}
                                    </div>
                                    {event.userCount !== undefined && event.userCount > 0 && (
                                      <div className="flex items-center gap-1.5 text-[10px] opacity-90 mt-0.5">
                                        <Users className="h-2.5 w-2.5" />
                                        {event.userCount} interested
                                      </div>
                                    )}
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                      <div className="border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[0.5rem] font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                                +{dayEvents.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Servers List - Right Side (1 column) */}
          <div>
            <Card className="p-4 shadow-lg flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Servers</h2>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1 styled-scrollbar">
                {servers.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground">No servers with events</p>
                  </div>
                ) : (
                  <>
                    {servers.map(server => {
                      const isExpanded = expandedServerId === server.guildId;
                      return (
                        <div key={server.guildId} className="rounded-lg overflow-hidden transition-all">
                          <div
                            className="p-3 cursor-pointer bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 hover:shadow-md transition-all"
                            onClick={() => setExpandedServerId(isExpanded ? null : server.guildId)}
                          >
                            <div className="flex items-center gap-2.5">
                              {server.guildIcon && (
                                <img loading="lazy" src={server.guildIcon} alt="" className="w-8 h-8 rounded-lg shadow-md flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs line-clamp-1">{server.guildName}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {server.events.length} {server.events.length === 1 ? 'event' : 'events'}
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </div>

                          {/* Dropdown Events List */}
                          {isExpanded && (
                            <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                              {server.events.slice(0, 5).map((event) => (
                                <div
                                  key={event.id}
                                  className="p-2 rounded bg-white dark:bg-zinc-800 hover:shadow-sm transition-all cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    {event.guildIcon && (
                                      <img loading="lazy" src={event.guildIcon} alt="" className="w-6 h-6 rounded flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold line-clamp-1 mb-0.5">{event.name}</div>
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {format(new Date(event.scheduledStartTime), 'MMM d · h:mm a')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {server.events.length > 5 && (
                                <button
                                  className="w-full text-xs text-primary hover:underline py-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGuildId(server.guildId);
                                    setIsServerModalOpen(true);
                                  }}
                                >
                                  View all {server.events.length} events →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Add Server Button */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link href="/calendar/invite-bot">
                  <button className="w-full p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50">
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      <span className="font-bold text-xs text-primary">Add a server</span>
                    </div>
                  </button>
                </Link>
              </div>
            </Card>
          </div>
        </div>



        {events.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
            <p className="text-muted-foreground mb-6">
              No upcoming events at this time. Check back later!
            </p>
          </Card>
        )}

        {/* Event Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-start gap-3 pb-4 border-b">
                    {selectedEvent.guildIcon && (
                      <img loading="lazy" src={selectedEvent.guildIcon} alt="" className="w-14 h-14 rounded-xl shadow-md flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xl line-clamp-2 mb-1">{selectedEvent.name}</div>
                      <div className="text-sm text-muted-foreground font-normal">{selectedEvent.guildName}</div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground">Date & Time</div>
                    </div>
                    <div className="font-semibold">
                      {format(new Date(selectedEvent.scheduledStartTime), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.scheduledStartTime), 'h:mm a')}
                      {selectedEvent.scheduledEndTime && ` - ${format(new Date(selectedEvent.scheduledEndTime), 'h:mm a')}`}
                    </div>
                  </div>

                  {selectedEvent.userCount !== undefined && selectedEvent.userCount > 0 && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-xs text-muted-foreground">Interest</div>
                      </div>
                      <div className="font-semibold"><strong>{selectedEvent.userCount}</strong> people interested</div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Description</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    {selectedEvent.guildInvite && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => window.open(selectedEvent.guildInvite, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Discord Server
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const params = new URLSearchParams({
                          eventId: selectedEvent.id,
                          name: selectedEvent.name,
                          description: selectedEvent.description || "",
                          startTime: selectedEvent.scheduledStartTime,
                          ...(selectedEvent.scheduledEndTime && { endTime: selectedEvent.scheduledEndTime }),
                          location: `Discord - ${selectedEvent.guildName}`,
                        });
                        window.open(`/api/discord/events/export?${params.toString()}`, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Add to Calendar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Server Details Modal */}
        <Dialog open={isServerModalOpen} onOpenChange={setIsServerModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedServer && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-start gap-3 pb-4 border-b">
                    {selectedServer.guildIcon && (
                      <img loading="lazy" src={selectedServer.guildIcon} alt="" className="w-14 h-14 rounded-xl shadow-md flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xl line-clamp-2 mb-1">{selectedServer.guildName}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {selectedServer.events.length} upcoming {selectedServer.events.length === 1 ? 'event' : 'events'}
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Event Host</div>
                    <div className="font-semibold">{selectedServer.guildName}</div>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-3">Upcoming Events</div>
                    <div className="space-y-2">
                      {selectedServer.events.map(event => (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg cursor-pointer bg-white dark:bg-zinc-800 hover:border-primary transition-all"
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="font-semibold text-sm mb-2 line-clamp-2">{event.name}</div>
                          <div className="flex items-center gap-4 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-primary" />
                              <span>{format(new Date(event.scheduledStartTime), 'MMM d · h:mm a')}</span>
                            </div>
                            {event.userCount !== undefined && event.userCount > 0 && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{event.userCount} interested</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedServer.guildInvite && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => window.open(selectedServer.guildInvite, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Discord Server
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          .styled-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .styled-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .styled-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--primary) / 0.3);
            border-radius: 3px;
          }
          .styled-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--primary) / 0.5);
          }
        `}</style>
      </div>
    </div>
  );
}
