import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = 'force-dynamic';

const SUBSTACKS = [
  {
    name: "The Cook",
    url: "https://cookoutclub.substack.com/feed",
    baseUrl: "https://cookoutclub.substack.com/",
    slug: "the-cook",
  },
  {
    name: "Tactical Retreat",
    url: "https://tactical.deepwaterstudios.xyz/feed",
    baseUrl: "https://tactical.deepwaterstudios.xyz/",
    slug: "tactical-retreat",
  },
  {
    name: "Joe Content",
    url: "https://joecontent.substack.com/feed",
    baseUrl: "https://joecontent.substack.com/",
    slug: "joe-content",
  },
  {
    name: "Team1 Blog",
    url: "https://www.team1.blog/feed",
    baseUrl: "https://www.team1.blog/",
    slug: "team1-blog",
  },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  content: string;
  description?: string;
  media?: { $: { url: string } };
  enclosure?: { url: string };
}

interface RSSFeed {
  items: RSSItem[];
}

// Custom parser to include image field
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
      ['description', 'description'],
    ],
  },
});

function extractImageUrl(item: RSSItem): string | null {
  // Try to find image in different possible locations
  if (item.media?.$.url) {
    return item.media.$.url;
  }
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  // Try to extract first image from content if exists
  const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }
  return null;
}

function cleanDescription(description: string): string {
  // Remove HTML tags
  const withoutTags = description.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  const decoded = withoutTags.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Trim and limit length
  return decoded.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sources = searchParams.get("sources")?.split(",") || [];
    const slugs = searchParams.get("slugs")?.split(",") || [];
    const author = searchParams.get("author");

    const feedsToFetch = slugs.length
      ? SUBSTACKS.filter((stack) => slugs.includes(stack.slug))
      : sources.length
      ? SUBSTACKS.filter((stack) => sources.includes(stack.baseUrl))
      : SUBSTACKS;

    const feedPromises = feedsToFetch.map(async (stack) => {
      try {
        const feed = await parser.parseURL(stack.url) as RSSFeed;
        return feed.items.map((item: RSSItem) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          creator: item.creator,
          content: item.content,
          description: item.description ? cleanDescription(item.description) : null,
          source: stack.name,
          image: extractImageUrl(item),
        }));
      } catch (error) {
        console.error(`Error fetching ${stack.name}:`, error);
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    let allPosts = feedResults
      .flat()
      .sort((a, b) => new Date(b.pubDate!).getTime() - new Date(a.pubDate!).getTime());

    // Filter by author if specified
    if (author) {
      allPosts = allPosts.filter((post) => post.creator === author);
    }

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Error in /api/news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}