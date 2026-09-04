"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  source: string;
  image: string | null;
};

/**
 * Team1 and community writing, from the same RSS sources the old News tab used.
 * Client-side so a slow or failing upstream feed cannot hold up the page — the
 * strip simply does not render if nothing comes back.
 */
export function NewsStrip() {
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!cancelled) setArticles(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (articles !== null && articles.length === 0) return null;

  return (
    <section className="rounded-xl bg-white p-4 shadow-md dark:bg-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Newspaper className="h-4 w-4 text-muted-foreground" aria-hidden />
        Latest writing
      </h2>

      {articles === null ? (
        <ul className="mt-3 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </ul>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-700/60">
          {articles.map((article) => (
            <li key={article.link}>
              <a
                href={article.link}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-2 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug group-hover:underline">
                    {article.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {article.source}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
