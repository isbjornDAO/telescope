"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { XIcon, PlusIcon, UserIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Author {
  name: string;
  count: number;
}

interface AuthorTagsProps {
  selectedTab: string;
}

interface Post {
  creator: string;
}

export const AuthorTags = ({ selectedTab }: AuthorTagsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAuthor = searchParams.get("author");
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setIsLoading(true);
        // If a specific tab is selected (not "all"), include it in the query
        const queryParams = new URLSearchParams();
        if (selectedTab !== "all") {
          queryParams.set("slugs", selectedTab);
        }

        const response = await fetch("/api/news" + (queryParams.toString() ? `?${queryParams.toString()}` : ""));
        if (!response.ok) throw new Error("Failed to fetch news");
        const posts = await response.json() as Post[];
        
        // Count posts by author, handling multiple authors
        const authorCounts = posts.reduce((acc: Record<string, number>, post: Post) => {
          if (post.creator) {
            // Split creators by "and" or comma and trim whitespace
            const authors = post.creator.split(/(?:,|\sand\s)/).map((author: string) => author.trim());
            authors.forEach((author: string) => {
              if (author) {
                acc[author] = (acc[author] || 0) + 1;
              }
            });
          }
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by count
        const sortedAuthors = Object.entries(authorCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setAuthors(sortedAuthors);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching authors:", error);
        setIsLoading(false);
      }
    };

    fetchAuthors();
  }, [selectedTab]);

  const handleAuthorClick = (authorName: string) => {
    const params = new URLSearchParams(searchParams);
    const currentTab = params.get("tab");

    if (authorName === selectedAuthor) {
      params.delete("author");
    } else {
      params.set("author", authorName);
    }

    // Reset to page 1
    params.set("page", "1");

    // Create new URLSearchParams with desired order
    const orderedParams = new URLSearchParams();

    // Set tab first if it exists
    if (currentTab) {
      orderedParams.set("tab", currentTab);
    }

    // Set author second if it exists
    if (params.has("author")) {
      orderedParams.set("author", params.get("author")!);
    }

    // Set page last
    orderedParams.set("page", "1");

    router.push(`/news?${orderedParams.toString()}`);
  };

  const visibleAuthors = isDesktop || isExpanded ? authors : authors.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-zinc-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (authors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-bold">Authors</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {visibleAuthors.map((author) => {
          const isActive = author.name === selectedAuthor;
          return (
            <Button
              key={author.name}
              variant={isActive ? "default" : "outline"}
              className="flex items-center gap-1 px-3 py-1 text-sm"
              onClick={() => handleAuthorClick(author.name)}
            >
              <UserIcon size={16} />
              <span>{author.name}</span>
              <span className="text-xs text-muted-foreground">({author.count})</span>
              {isActive && <XIcon size={12} />}
            </Button>
          );
        })}
        {!isDesktop && !isExpanded && authors.length > 3 && (
          <Button
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 text-sm"
            onClick={() => setIsExpanded(true)}
          >
            <PlusIcon size={16} />
            <span>{authors.length - 3} more</span>
          </Button>
        )}
      </div>
    </div>
  );
}; 