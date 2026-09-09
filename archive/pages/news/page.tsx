"use client";

import { NewsFeed } from "@/components/news-feed";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { AuthorTags } from "@/components/author-tags";

export default function NewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAuthor = searchParams.get("author");
  const currentPage = Number(searchParams.get("page")) || 1;

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams();

      // Add author if it exists
      if (params.author) {
        newSearchParams.set("author", params.author);
      }

      // Only add page if it's greater than 1
      if (params.page && params.page !== "1") {
        newSearchParams.set("page", params.page);
      }

      return newSearchParams.toString();
    },
    []
  );

  const handlePageChange = (page: number) => {
    router.push(
      `/news?${createQueryString({
        author: selectedAuthor,
        page: page === 1 ? null : page.toString() // Only add page if not 1
      })}`
    );
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-16">
      <PageNavigation />

      <div className="space-y-8">
        <AuthorTags selectedTab="all" />

        <NewsFeed
          currentPage={currentPage}
          onPageChange={handlePageChange}
          author={selectedAuthor || undefined}
        />
      </div>
    </div>
  );
}
