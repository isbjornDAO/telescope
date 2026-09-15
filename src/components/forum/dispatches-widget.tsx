"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, Feather } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DispatchPost {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  source: string;
  description: string | null;
}

export function DispatchesWidget() {
  const [posts, setPosts] = useState<DispatchPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="retro-box">
      <div className="retro-box-title justify-between px-3.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            Avalanche Dispatches
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <Feather className="w-3 h-3 text-[#2689BF]" />
          <span>Substack Alpha</span>
        </span>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-2 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/40 dark:bg-zinc-800/30 space-y-1.5"
              >
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground italic">
            No recent dispatches found.
          </div>
        ) : (
          <ul className="space-y-2">
            {posts.map((post, idx) => {
              const dateObj = new Date(post.pubDate);
              const isValidDate = !isNaN(dateObj.getTime());

              return (
                <li key={post.link || idx}>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#2689BF]/40 dark:hover:border-[#52aae0]/40 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-[#2689BF] dark:text-[#52aae0] border border-sky-200 dark:border-sky-900/60 truncate max-w-[120px]">
                        {post.source || post.creator || "Avalore"}
                      </span>
                      {isValidDate && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(dateObj, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-[#2689BF] dark:group-hover:text-[#52aae0] transition-colors leading-snug">
                      {post.title}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
