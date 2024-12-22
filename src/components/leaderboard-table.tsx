"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe } from "lucide-react";
import { LeaderboardProps } from "@/types";
import { XIcon } from "./icons/x";
import { TelegramIcon } from "./icons/telegram";
import { DiscordIcon } from "./icons/discord";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getTextColorClass } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export const LeaderboardTable = React.memo(
  ({
    items,
    renderMetadata,
    renderActions,
    showSocial = true,
    isLoading = false,
    isError = false,
  }: LeaderboardProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const skeletonCount = 10;

    useEffect(() => {
      const page = Number(searchParams.get("page")) || 1;
      setCurrentPage(page);
    }, [searchParams]);

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = items.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.push(`?${params.toString()}`);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    console.log(currentItems);

    const getVisiblePages = (currentPage: number, totalPages: number) => {
      if (totalPages <= 5)
        return Array.from({ length: totalPages }, (_, i) => i + 1);

      if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
      if (currentPage >= totalPages - 2)
        return [
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];

      return [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
      ];
    };

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
          : currentItems.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col md:flex-row items-center gap-4 rounded-lg dark:bg-zinc-800 pl-4 pr-4 md:pr-8 py-4 shadow transition-all hover:shadow-md border ${
                  item.rank === 1
                    ? "border-yellow-400"
                    : item.rank === 2
                    ? "border-gray-300"
                    : item.rank === 3
                    ? "border-amber-600"
                    : "border-zinc-200 dark:border-zinc-700"
                }
                ${
                  item.rank === 1
                    ? "bg-[#FFD451]"
                    : item.rank === 2
                    ? "bg-[#CACACA]"
                    : item.rank === 3
                    ? "bg-[#E1A253]"
                    : "bg-white dark:bg-zinc-800"
                }`}
              >
                <div className="flex flex-row items-center justify-between gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-row items-center gap-4">
                      <div
                        className={`text-sm font-medium ${
                          [1, 2, 3].includes(item.rank)
                            ? getTextColorClass(item.rank)
                            : "text-zinc-500 dark:text-zinc-200"
                        }`}
                      >
                        #{item.rank}
                      </div>

                      <Avatar
                        className={`h-10 w-10 border-2 ${
                          item.rank === 1
                            ? "border-yellow-400"
                            : item.rank === 2
                            ? "border-gray-300"
                            : item.rank === 3
                            ? "border-amber-600"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <AvatarImage src={item.avatar} alt={item.name} />
                        <AvatarFallback>
                          {item.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex md:min-w-[300px] md:max-w-[300px] flex-col">
                      <div
                        className={`font-bold ${
                          [1, 2, 3].includes(item.rank)
                            ? "text-zinc-800"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {item.name}
                      </div>
                      {item.description && (
                        <div
                          className={`text-sm truncate dark:text-zinc-400 hidden md:flex ${
                            [1, 2, 3].includes(item.rank)
                              ? "text-zinc-700"
                              : "text-zinc-500"
                          }`}
                        >
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
                              <Globe
                                className={`h-4 w-4 ${
                                  [1, 2, 3].includes(item.rank)
                                    ? "text-zinc-700 hover:text-green-400"
                                    : "text-zinc-400 hover:text-green-400"
                                }`}
                              />
                            </a>
                          )}
                          {item.social.twitter && (
                            <a
                              href={item.social.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <XIcon
                                className={`w-[0.85rem] h-4 ${
                                  [1, 2, 3].includes(item.rank)
                                    ? "fill-zinc-700 hover:fill-blue-400"
                                    : "fill-zinc-500 hover:fill-blue-400"
                                }`}
                              />
                            </a>
                          )}
                          {item.social.telegram && (
                            <a
                              href={item.social.telegram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className=""
                            >
                              <TelegramIcon
                                className={`h-4 w-4 ${
                                  [1, 2, 3].includes(item.rank)
                                    ? "fill-zinc-700 hover:fill-blue-400"
                                    : "fill-zinc-400 hover:fill-blue-400"
                                }`}
                              />
                            </a>
                          )}
                          {item.social.discord && (
                            <a
                              href={item.social.discord}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DiscordIcon
                                className={`h-4 w-4 ${
                                  [1, 2, 3].includes(item.rank)
                                    ? "fill-zinc-700 hover:fill-indigo-400"
                                    : "fill-zinc-400 hover:fill-indigo-400"
                                }`}
                              />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex md:hidden">
                    {renderMetadata && renderMetadata(item)}
                  </div>
                </div>
                <div className="flex-1 items-center justify-end gap-4 hidden md:flex">
                  {renderMetadata && renderMetadata(item)}
                  {renderActions && renderActions(item)}
                </div>
                {item.description && (
                  <div
                    className={`text-sm truncate dark:text-zinc-400 flex md:hidden w-full text-wrap ${
                      [1, 2, 3].includes(item.rank)
                        ? "text-zinc-700"
                        : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </div>
                )}
                <div className="flex w-full md:hidden">
                  {renderActions && renderActions(item)}
                </div>
              </div>
            ))}
        {isError && (
          <div className="text-red-500">Failed to load leaderboard.</div>
        )}

        {!isLoading && !isError && items.length > ITEMS_PER_PAGE && (
          <Pagination className="mt-16">
            <PaginationContent className="flex flex-wrap gap-2 justify-center">
              <PaginationItem className="hidden sm:inline-block">
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:shadow"
                  }
                />
              </PaginationItem>

              {getVisiblePages(currentPage, totalPages).map(
                (pageNum, index) => (
                  <PaginationItem key={index}>
                    {pageNum === "..." ? (
                      <span className="px-4 py-2">...</span>
                    ) : (
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => handlePageChange(pageNum as number)}
                        className={
                          currentPage === pageNum
                            ? "shadow"
                            : "cursor-pointer hover:shadow"
                        }
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                )
              )}

              <PaginationItem className="hidden sm:inline-block">
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:shadow"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  }
);

LeaderboardTable.displayName = "LeaderboardTable";
