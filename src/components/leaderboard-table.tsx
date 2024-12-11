"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe } from "lucide-react";
import { LeaderboardProps } from "@/types";
import { XIcon } from "./icons/x";
import { TelegramIcon } from "./icons/telegram";
import { DiscordIcon } from "./icons/discord";

export const LeaderboardTable = ({
  items,
  renderMetadata,
  renderActions,
  showSocial = true,
  isLoading = false,
  isError = false,
}: LeaderboardProps) => {
  const skeletonCount = 5;

  return (
    <div className="space-y-4">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg bg-white dark:bg-zinc-800 p-4 shadow animate-pulse"
            >
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-200 w-10 h-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>

              <div className="h-10 w-10 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>

              <div className="flex min-w-[300px] max-w-[300px] flex-col space-y-2">
                <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-600 rounded w-1/2"></div>
                {showSocial && (
                  <div className="mt-1 flex space-x-2">
                    <div className="h-4 w-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-4 w-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-4 w-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-4 w-4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                  </div>
                )}
              </div>

              <div className="flex flex-1 items-center justify-end gap-4">
                <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/4"></div>
                <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/4"></div>
              </div>
            </div>
          ))
        : items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg bg-white dark:bg-zinc-800 p-4 shadow transition-all hover:shadow-md"
            >
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-200">
                #{item.rank}
              </div>

              <Avatar className="h-10 w-10 border-2 border-zinc-200">
                <AvatarImage src={item.avatar} alt={item.name} />
                <AvatarFallback>{item.name.substring(0, 2)}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-[300px] max-w-[300px] flex-col">
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-zinc-500 truncate dark:text-zinc-400">
                    {item.description}
                  </div>
                )}
                {showSocial && item.social && (
                  <div className="mt-1 flex space-x-2">
                    {item.social.website && (
                      <a
                        href={item.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-4 w-4 text-zinc-400 hover:text-green-400" />
                      </a>
                    )}
                    {item.social.twitter && (
                      <a
                        href={item.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <XIcon className="w-[0.85rem] h-4 fill-zinc-500 hover:fill-blue-400" />
                      </a>
                    )}
                    {item.social.discord && (
                      <a
                        href={item.social.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DiscordIcon className="h-4 w-4 fill-zinc-400 hover:fill-indigo-400" />
                      </a>
                    )}
                    {item.social.telegram && (
                      <a
                        href={item.social.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className=""
                      >
                        <TelegramIcon className="h-4 w-4 fill-zinc-400 hover:fill-blue-400" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-1 items-center justify-end gap-4">
                {renderMetadata && renderMetadata(item)}
                {renderActions && renderActions(item)}
              </div>
            </div>
          ))}
      {isError && (
        <div className="text-red-500">Failed to load leaderboard.</div>
      )}
    </div>
  );
};
