"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tv, Play, ExternalLink, Youtube, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { YouTubeVideoItem } from "@/app/api/videos/latest/route";

export function SnowTvWidget() {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideoItem | null>(null);

  useEffect(() => {
    fetch("/api/videos/latest")
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data) => {
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = videos[0];
  const moreVideos = videos.slice(1, 3);

  return (
    <>
      <div className="retro-box">
        <div className="retro-box-title justify-between px-3.5 sm:px-4">
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-[#E84142] shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              SnowTV · Avalanche Watch
            </span>
          </div>
          <a
            href="https://www.youtube.com/@Avalancheavax"
            target="_blank"
            rel="noopener noreferrer"
            className="retro-btn retro-btn-gray text-[10px] px-2 py-1 flex items-center gap-1 text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <Youtube className="w-3 h-3 text-[#E84142]" />
            <span>Channel</span>
          </a>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="aspect-video w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          ) : featured ? (
            <div className="space-y-2.5">
              {/* Featured Hero Video Card */}
              <button
                type="button"
                onClick={() => setActiveVideo(featured)}
                className="w-full text-left group cursor-pointer block rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40 hover:border-[#E84142]/50 transition-all shadow-sm"
              >
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={featured.thumbnail}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#E84142] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-bold tracking-wider uppercase">
                    Latest
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <h4 className="font-bold text-xs line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-[#E84142] transition-colors leading-snug">
                    {featured.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span className="font-medium truncate">{featured.channelTitle}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(featured.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </button>

              {/* Secondary Video Items */}
              {moreVideos.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                  {moreVideos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setActiveVideo(video)}
                      className="w-full text-left p-1.5 rounded-md hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors flex items-center gap-2 group cursor-pointer"
                    >
                      <div className="relative w-16 aspect-video rounded overflow-hidden bg-zinc-800 shrink-0">
                        <img
                          src={video.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-[#E84142] transition-colors">
                          {video.title}
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {formatDistanceToNow(new Date(video.publishedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground italic">
              No videos available.
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal Dialog */}
      <Dialog
        open={!!activeVideo}
        onOpenChange={(open) => !open && setActiveVideo(null)}
      >
        <DialogContent className="max-w-2xl retro-box p-0 border-0 overflow-hidden shadow-2xl">
          {activeVideo && (
            <div>
              <DialogHeader className="retro-box-title justify-between px-4 py-3 bg-gradient-to-r from-[#E84142] to-[#B02A2B] text-white">
                <DialogTitle className="flex items-center gap-2 min-w-0 text-white font-bold text-sm">
                  <Youtube className="h-4 w-4 shrink-0 fill-current" />
                  <span className="truncate">{activeVideo.title}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 space-y-4 bg-background">
                {/* 16:9 Embedded Player with zero trackers */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {activeVideo.channelTitle}
                    </span>{" "}
                    · Published{" "}
                    {formatDistanceToNow(new Date(activeVideo.publishedAt), {
                      addSuffix: true,
                    })}
                  </div>
                  <a
                    href={activeVideo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-btn retro-btn-blue text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
