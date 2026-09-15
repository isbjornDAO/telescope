"use client";

import { useState, useMemo } from "react";
import { Server, ExternalLink, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AddDiscordServerDialog } from "@/components/add-discord-server-dialog";

export interface DiscordServerSummary {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildInvite?: string;
  eventsCount: number;
}

interface CommunityServersWidgetProps {
  servers?: DiscordServerSummary[];
  className?: string;
}

interface RawDiscordEvent {
  id: string;
  name: string;
  scheduledStartTime: string;
  scheduledEndTime: string | null;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  guildInvite?: string;
  status?: number;
}

export function CommunityServersWidget({
  servers: initialServers,
  className = "",
}: CommunityServersWidgetProps) {
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);

  // If servers not provided as prop, fetch from /api/discord/events
  const { data: fetchedEvents = [], isLoading } = useQuery<RawDiscordEvent[]>({
    queryKey: ["discord-events-upcoming"],
    queryFn: async () => {
      const res = await fetch("/api/discord/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      return data.events || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !initialServers,
  });

  const servers = useMemo(() => {
    if (initialServers) return initialServers;

    const map = new Map<string, DiscordServerSummary>();
    fetchedEvents.forEach((event) => {
      if (!map.has(event.guildId)) {
        map.set(event.guildId, {
          guildId: event.guildId,
          guildName: event.guildName,
          guildIcon: event.guildIcon,
          guildInvite: event.guildInvite,
          eventsCount: 0,
        });
      }
      const s = map.get(event.guildId)!;
      s.eventsCount += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.eventsCount - a.eventsCount,
    );
  }, [initialServers, fetchedEvents]);

  return (
    <>
      <div className={`retro-box ${className}`}>
        <div className="retro-box-title justify-between px-3.5 sm:px-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              Community Servers
            </span>
          </div>
          <span className="retro-comments-badge text-zinc-700 dark:text-zinc-300">
            {servers.length}
          </span>
        </div>

        <div className="p-3 space-y-2">
          {isLoading && !initialServers ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 flex items-center gap-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-md bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-700 w-3/4" />
                    <div className="h-2.5 rounded bg-zinc-100 dark:bg-zinc-800 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Server className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground italic mb-1">
                No servers connected yet
              </p>
            </div>
          ) : (
            servers.map((server) => {
              const inviteUrl =
                server.guildInvite ||
                (server.guildId
                  ? `https://discord.com/channels/${server.guildId}`
                  : "https://discord.com/app");

              return (
                <div
                  key={server.guildId}
                  className="p-3 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#2689BF]/40 dark:hover:border-[#52aae0]/40 hover:shadow-xs transition-all flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {server.guildIcon ? (
                      <img
                        loading="lazy"
                        src={server.guildIcon}
                        alt=""
                        className="w-9 h-9 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                        <Server className="h-4 w-4 text-zinc-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-800 dark:text-zinc-100 truncate">
                        {server.guildName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {server.eventsCount}{" "}
                        {server.eventsCount === 1 ? "event" : "events"}
                      </div>
                    </div>
                  </div>

                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-btn retro-btn-blue text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
                    title={`Join ${server.guildName}`}>
                    <span>Join</span>
                  </a>
                </div>
              );
            })
          )}

          {/* Add Server Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAddServerOpen(true)}
              className="w-full py-2.5 px-3 rounded border border-dashed border-[#2689BF]/40 hover:border-[#2689BF] bg-[#2689BF]/5 hover:bg-[#2689BF]/10 text-[#2689BF] dark:text-[#52aae0] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              <span>Add a Discord Server</span>
            </button>
          </div>
        </div>
      </div>

      <AddDiscordServerDialog
        open={isAddServerOpen}
        onOpenChange={setIsAddServerOpen}
      />
    </>
  );
}
