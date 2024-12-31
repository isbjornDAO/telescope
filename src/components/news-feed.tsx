"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Post {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  content: string;
  description: string | null;
  source: string;
  image: string | null;
}

interface NewsFeedProps {
  sources?: string[];
  slugs?: string[];
  author?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const ITEMS_PER_PAGE = 9;

export function NewsFeed({
  sources,
  slugs,
  author,
  currentPage = 1,
  onPageChange,
}: NewsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (sources?.length) queryParams.set("sources", sources.join(","));
        if (slugs?.length) queryParams.set("slugs", slugs.join(","));
        if (author) queryParams.set("author", author);

        const response = await fetch(
          "/api/news" +
            (queryParams.toString() ? `?${queryParams.toString()}` : "")
        );
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load news");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [sources, slugs, author]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  // Helper function to format the date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-lg overflow-hidden ${
              i % 3 === 0
                ? "sm:col-span-4 lg:col-span-6 aspect-[16/5]"
                : "sm:col-span-2 aspect-[4/3]"
            }`}
          >
            <div className="w-full h-full bg-muted">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Error loading news: {error}</div>;
  }

  if (posts.length === 0) {
    return <div className="text-muted-foreground">No news articles found.</div>;
  }

  console.log(posts);

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {currentPosts.map((post) => (
          <article
            key={post.link}
            className={`relative group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg ${
              post.image
                ? "sm:col-span-2 aspect-[4/3]"
                : "sm:col-span-4 lg:col-span-6 aspect-[16/5]"
            }`}
          >
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col justify-between items-start h-full">
                <span className="text-xs text-white py-1 px-2 bg-black/40 rounded-md w-auto">{post.source}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white transition-colors duration-200 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex gap-2 text-xs text-white/80 mt-2">
                    <span>
                      {post.creator} - {formatDate(post.pubDate)}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="col-span-full">
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

            {getVisiblePages(currentPage, totalPages).map((pageNum, index) => (
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
            ))}

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
