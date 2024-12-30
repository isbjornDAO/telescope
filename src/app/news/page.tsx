"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsFeed } from "@/components/news-feed";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { AuthorTags } from "@/components/author-tags";

const SUBSTACKS = [
  {
    name: "The Cook",
    url: "https://cookoutclub.substack.com/",
    slug: "the-cook",
  },
  {
    name: "Team1 Blog",
    url: "https://www.team1.blog/",
    slug: "team1-blog",
  },
  {
    name: "Tactical Retreat",
    url: "https://tactical.deepwaterstudios.xyz/",
    slug: "tactical-retreat",
  },
  {
    name: "Joe Content",
    url: "https://joecontent.substack.com/",
    slug: "joe-content",
  },
];

export default function NewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("tab") || "all";
  const selectedAuthor = searchParams.get("author");
  const currentPage = Number(searchParams.get("page")) || 1;

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams();

      // Add tab first if it exists
      if (params.tab) {
        newSearchParams.set("tab", params.tab);
      }

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

  const handleTabChange = (value: string) => {
    // Reset page when changing tabs and remove author filter
    router.push(
      `/news?${createQueryString({
        tab: value === "all" ? null : value,
        author: null,
        page: null // Don't add page=1 when changing tabs
      })}`
    );
  };

  const handlePageChange = (page: number) => {
    router.push(
      `/news?${createQueryString({
        tab: selectedTab === "all" ? null : selectedTab,
        author: selectedAuthor,
        page: page === 1 ? null : page.toString() // Only add page if not 1
      })}`
    );
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-16">
      <Tabs value={selectedTab as string} onValueChange={handleTabChange} className="w-full">
        <div className="space-y-8">
          <TabsList className="gap-2 bg-transparent m-0 p-0 mb-32 md:mb-8 flex-wrap relative z-20 justify-start">
            <TabsTrigger
              value="all"
              className="px-4 py-2 font-bold text-md bg-white border-white border-2"
            >
              All News
            </TabsTrigger>
            {SUBSTACKS.map((substack) => (
              <TabsTrigger
                key={substack.slug}
                value={substack.slug}
                className="px-4 py-2 font-bold text-md bg-white border-white border-2"
              >
                {substack.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <AuthorTags selectedTab={selectedTab} />

          <TabsContent value="all" className="relative z-10">
            <NewsFeed 
              currentPage={currentPage} 
              onPageChange={handlePageChange}
              author={selectedAuthor || undefined}
            />
          </TabsContent>

          {SUBSTACKS.map((substack) => (
            <TabsContent key={substack.slug} value={substack.slug} className="relative z-10">
              <NewsFeed 
                slugs={[substack.slug]}
                currentPage={currentPage} 
                onPageChange={handlePageChange}
                author={selectedAuthor || undefined}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
