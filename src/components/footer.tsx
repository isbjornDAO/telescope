"use client";

import Link from "next/link";
import { DiscordIcon } from "@/components/icons/discord";
import { XIcon } from "@/components/icons/x";
import { TelegramIcon } from "@/components/icons/telegram";
import { GithubIcon } from "@/components/icons/github";

export function Footer() {
  return (
    <footer className="w-full text-xs text-muted-foreground select-none">
      {/* Upper Silver Bar attached to page container */}
      <div className="retro-footer-bar py-2.5 px-3 sm:px-4 md:px-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center text-[11px] text-zinc-600 dark:text-zinc-400 font-medium text-center sm:text-left">
            <span>
              Copyright © <b>Telescope</b> · Built with 🐻‍❄️ by Isbjorn
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <a
              href="https://discord.gg/tyFug3Pz8G"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold flex items-center gap-1.5"
            >
              <DiscordIcon className="w-3.5 h-3.5" />
              <span>Discord</span>
            </a>
            <a
              href="https://x.com/IsbjornDAO"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold flex items-center gap-1.5"
            >
              <XIcon className="w-3 h-3" />
              <span>X</span>
            </a>
            <a
              href="https://t.me/iggyavax"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold flex items-center gap-1.5"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
            <a
              href="https://github.com/isbjornDAO/telescope"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold flex items-center gap-1.5"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function FooterDisclaimer() {
  return null;
}
