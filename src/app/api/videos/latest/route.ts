import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";

export interface YouTubeVideoItem {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string;
  channelTitle: string;
}

// Official Avalanche YouTube Channel ID: UC7e0ikD023YgU9n2a4rX_aA (@Avalancheavax)
const AVALANCHE_CHANNEL_ID = "UC7e0ikD023YgU9n2a4rX_aA";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${AVALANCHE_CHANNEL_ID}`;

// Curated fallbacks in case external network / RSS is slow or unavailable
const FALLBACK_VIDEOS: YouTubeVideoItem[] = [
  {
    id: "x_8lqC89v3Q",
    title: "Avalanche 9000: The Largest Upgrade Since Mainnet Launch",
    link: "https://www.youtube.com/watch?v=x_8lqC89v3Q",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "https://img.youtube.com/vi/x_8lqC89v3Q/mqdefault.jpg",
    channelTitle: "Avalanche",
  },
  {
    id: "6lZ3y_r4d5w",
    title: "Building Custom Layer 1s with Avalanche Consensus",
    link: "https://www.youtube.com/watch?v=6lZ3y_r4d5w",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "https://img.youtube.com/vi/6lZ3y_r4d5w/mqdefault.jpg",
    channelTitle: "Avalanche",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Avalanche Summit: Ecosystem Highlights & Keynotes",
    link: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
    channelTitle: "Avalanche",
  },
];

const parser = new Parser({
  customFields: {
    item: [
      ["yt:videoId", "videoId"],
      ["media:group", "mediaGroup"],
    ],
  },
});

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(YOUTUBE_RSS_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TelescopeBot/1.0)",
      },
      next: { revalidate: 3600 }, // Cache up to 1 hour
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ videos: FALLBACK_VIDEOS, isFallback: true });
    }

    const xmlText = await res.text();
    const feed = await parser.parseString(xmlText);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ videos: FALLBACK_VIDEOS, isFallback: true });
    }

    const videos: YouTubeVideoItem[] = feed.items.slice(0, 4).map((item: any) => {
      // yt:videoId is preferred, otherwise extract from id or link
      let videoId = item.videoId;
      if (!videoId && item.id) {
        videoId = item.id.replace("yt:video:", "");
      }
      if (!videoId && item.link) {
        const match = item.link.match(/[?&]v=([^&]+)/);
        if (match) videoId = match[1];
      }
      if (!videoId) {
        videoId = "x_8lqC89v3Q";
      }

      return {
        id: videoId,
        title: item.title || "Avalanche Video Update",
        link: item.link || `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        channelTitle: feed.title || "Avalanche",
      };
    });

    return NextResponse.json({ videos, isFallback: false });
  } catch (error) {
    console.warn("Could not fetch YouTube RSS, using fallback:", error);
    return NextResponse.json({ videos: FALLBACK_VIDEOS, isFallback: true });
  }
}
