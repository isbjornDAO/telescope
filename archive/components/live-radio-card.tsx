"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LiveRadioCardProps {
  isLive: boolean;
  currentShow?: string;
  station: string;
  streamUrl?: string;
}

export function LiveRadioCard({ isLive, currentShow, station, streamUrl }: LiveRadioCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const togglePlay = () => {
    if (audioRef.current && streamUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // If not live, show compact alert style
  if (!isLive) {
    return (
      <Alert
        variant="default"
        className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 py-4"
      >
        <div className="flex flex-row gap-2 items-center">
          <Radio className="h-4 w-4 stroke-zinc-500 dark:stroke-zinc-400" />
          <div className="flex flex-col">
            <AlertTitle className="font-bold text-zinc-900 dark:text-zinc-100">
              {station}
            </AlertTitle>
            <AlertDescription className="text-zinc-500 dark:text-zinc-400">
              Off air
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }

  // If live, show full player
  return (
    <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-red-950 dark:to-slate-900 rounded-xl border border-red-300 dark:border-red-900 shadow-xl overflow-hidden">
      {/* Animated background for live indicator */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 animate-pulse"></div>
      </div>

      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      <div className="relative p-6">
        {/* Live badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-md">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">LIVE</span>
            </div>
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{station}</span>
        </div>

        {/* Current show */}
        <div className="mb-6">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentShow}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlay}
            size="lg"
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-1" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <button onClick={toggleMute} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
