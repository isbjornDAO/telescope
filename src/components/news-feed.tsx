"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
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
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const ITEMS_PER_PAGE = 10;

export function NewsFeed({
  sources,
  slugs,
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
  }, [sources, slugs]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded w-full mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-16 bg-muted rounded w-full mt-2"></div>
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

  return (
    <div className="space-y-8">
      {currentPosts.map((post) => (
        <article key={post.link} className="space-y-4 bg-white rounded-lg">
          <div className="space-y-2">
            {post.image && (
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative w-full h-48 rounded-t-lg overflow-hidden bg-muted">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </a>
            )}
            <div className="px-4 pt-2 pb-4">
              <h3 className="text-xl font-semibold hover:text-sky-500 transition-colors duration-200">
                <a href={post.link} target="_blank" rel="noopener noreferrer">
                  {post.title}
                </a>
              </h3>
              <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                <span>{new Date(post.pubDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>{post.source}</span>
              </div>
              {post.description && (
                <p className="text-muted-foreground line-clamp-3">
                  {post.description}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}

      {totalPages > 1 && (
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
