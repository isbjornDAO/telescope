"use client";

import Link from "next/link";
import { ArrowUp, Code2, Compass, Shield, Heart } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full mt-16 text-xs text-muted-foreground select-none">
      {/* Upper Silver Bar */}
      <div className="retro-footer-bar py-2.5 px-4 md:px-8">
        <div className="max-w-screen-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <ul className="flex items-center gap-4 text-[11px] font-semibold flex-wrap justify-center sm:justify-start">
            <li className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Isbjorn DAO</span>
            </li>
            <li className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              <Code2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Telescope Protocol</span>
            </li>
            <li className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Avalanche C-Chain</span>
            </li>
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold"
            >
              Discord
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold"
            >
              Twitter
            </a>
            <a
              href="https://github.com/isbjornDAO/telescope"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn retro-btn-gray h-7 px-2.5 text-[10px] font-bold"
            >
              GitHub
            </a>
            <button
              onClick={scrollToTop}
              className="retro-btn retro-btn-blue w-7 h-7 rounded"
              title="Back to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Disclaimer & Community Seal */}
      <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <p className="text-[11px] leading-relaxed max-w-xl text-zinc-600 dark:text-zinc-400">
          Copyright © <b>Telescope</b> · Powered by Isbjorn DAO.
          <br />
          Built for autonomous community discussion, season tournaments, and decentralized governance.
        </p>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 shadow-inner shrink-0 text-[10px] font-bold">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Telescope Retro Edition</span>
        </div>
      </div>
    </footer>
  );
}
