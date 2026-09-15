"use client";

import { Compass, ExternalLink, Globe, Code, Shield, MessageSquare, Terminal } from "lucide-react";
import { XIcon } from "@/components/icons/x";
import { DiscordIcon } from "@/components/icons/discord";
import { TelegramIcon } from "@/components/icons/telegram";

interface SocialLink {
  name: string;
  category: "official" | "tools" | "community";
  handle: string;
  url: string;
  icon: any;
  badge: string;
}

const RADAR_LINKS: SocialLink[] = [
  {
    name: "Avalanche",
    category: "official",
    handle: "@Avax",
    url: "https://x.com/Avax",
    icon: XIcon,
    badge: "Official",
  },
  {
    name: "Avalanche Discord",
    category: "official",
    handle: "discord.gg/avalancheavax",
    url: "https://discord.gg/avalancheavax",
    icon: DiscordIcon,
    badge: "Community",
  },
  {
    name: "Avax Developers",
    category: "official",
    handle: "@AvaxDevelopers",
    url: "https://x.com/AvaxDevelopers",
    icon: Terminal,
    badge: "Devs",
  },
  {
    name: "Avalanche Forum",
    category: "official",
    handle: "forum.avax.network",
    url: "https://forum.avax.network",
    icon: MessageSquare,
    badge: "Gov",
  },
  {
    name: "Core App & Wallet",
    category: "tools",
    handle: "core.app",
    url: "https://core.app",
    icon: Globe,
    badge: "Core",
  },
  {
    name: "Snowtrace Explorer",
    category: "tools",
    handle: "snowtrace.io",
    url: "https://snowtrace.io",
    icon: Shield,
    badge: "Explorer",
  },
  {
    name: "Isbjorn DAO",
    category: "community",
    handle: "@IsbjornDAO",
    url: "https://x.com/IsbjornDAO",
    icon: XIcon,
    badge: "DAO",
  },
  {
    name: "Iggy Community",
    category: "community",
    handle: "t.me/iggyavax",
    url: "https://t.me/iggyavax",
    icon: TelegramIcon,
    badge: "Chat",
  },
];

export function EcosystemRadarWidget() {
  return (
    <div className="retro-box">
      <div className="retro-box-title justify-between px-3.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            Avalanche Radar
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">
          Socials & Hubs
        </span>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-[11px] text-muted-foreground leading-normal">
          Essential Avalanche ecosystem channels, developer resources, and community hubs:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 pt-1">
          {RADAR_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#2689BF]/40 dark:hover:border-[#52aae0]/40 transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] transition-colors leading-none mb-0.5">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {item.handle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                    {item.badge}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
