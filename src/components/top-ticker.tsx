"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { RetroPixelAvatar } from "@/components/retro-pixel-avatar";
import { useTrendingThreads } from "@/hooks/use-forum";

export function TopTicker() {
  const { data: threads = [], isLoading: loading } = useTrendingThreads();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const timer = setTimeout(checkScroll, 120);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [threads, checkScroll]);

  const scrollPrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto px-2.5 sm:px-4">
      <nav className="retro-ticker w-full select-none" aria-label="Latest topics">
        <div className="content flex items-center justify-between h-full px-2.5 sm:px-3">
        {/* First section: speech bubble icon + Latest Topics */}
        <div className="first">
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          <b>Latest Topics</b>
        </div>

        {/* Carousel section: left button + quickforum track + right button */}
        <div className="last-topics-top flex items-center flex-1 overflow-hidden">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={loading || !canScrollLeft}
            className={loading || !canScrollLeft ? "disabled" : ""}
            aria-label="Previous topics"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            id="quickforum"
            ref={scrollRef}
            tabIndex={0}
            aria-label="Trending topics carousel"
          >
            <div id="contentquickforum">
              <div className="grupo">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`ticker-skeleton-${idx}`}
                      className="msg animate-pulse pointer-events-none select-none"
                      aria-hidden="true"
                    >
                      <div className="msg-avatar flex items-center justify-center">
                        <div className="w-6 h-6 rounded-[4px] bg-zinc-300 dark:bg-zinc-700/80" />
                      </div>
                      <div className="txt flex items-center pl-2">
                        <div
                          className="h-2.5 rounded bg-zinc-200 dark:bg-zinc-700"
                          style={{ width: `${70 + ((idx * 19) % 45)}px` }}
                        />
                      </div>
                      <div className="comments opacity-50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      </div>
                    </div>
                  ))
                ) : threads.length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic pl-3">
                    No active discussions yet
                  </div>
                ) : (
                  threads.map((t) => {
                    const firstPost = t.posts[0];
                    const title = t.subject || firstPost?.comment || "Untitled";

                    return (
                      <Link
                        key={t.id}
                        href={`/forum/thread/${t.id}`}
                        className="msg"
                        title={title}
                      >
                        <div className="msg-avatar">
                          <RetroPixelAvatar
                            avatarUrl={firstPost?.user?.discordAvatar || firstPost?.authorAvatar || null}
                            seed={firstPost?.walletAddress || firstPost?.posterId || t.id}
                            size={24}
                            alt={firstPost?.authorName ? `Avatar of ${firstPost.authorName}` : "Topic author avatar"}
                          />
                        </div>
                        <div className="txt">{title}</div>
                        <div className="comments">{t.replyCount}</div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={scrollNext}
            disabled={loading || !canScrollRight}
            className={loading || !canScrollRight ? "disabled" : ""}
            aria-label="Next topics"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
    </div>
  );
}


