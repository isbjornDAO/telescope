"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Host {
  name: string;
  image: string;
}

interface RadioPlayerProps {
  src: string;
  title: string;
  episode: string;
  date: string;
  hosts: Host[];
  guests?: Host[];
  description?: string;
}

export function RadioPlayer({ src, title, episode, date, hosts, guests, description }: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const togglePlay = () => {
    if (audioRef.current) {
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-visible">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="p-5">
        {/* Row 1: Title, Episode, Date, and Hosts */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {episode}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{date}</span>
          </div>

          {/* Hosts and Guests */}
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">HOSTED BY</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {hosts.map((host, index) => (
                  <div
                    key={index}
                    className="group relative hover:z-10"
                  >
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 transition-transform group-hover:scale-105">
                      <Image
                        src={host.image}
                        alt={host.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {host.name}
                    </div>
                  </div>
                ))}
              </div>
              {guests && guests.length > 0 && (
                <>
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
                  <div className="flex -space-x-2">
                    {guests.map((guest, index) => (
                      <div
                        key={index}
                        className="group relative hover:z-10"
                      >
                        <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 transition-transform group-hover:scale-105">
                          <Image
                            src={guest.image}
                            alt={guest.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {guest.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Player Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlay}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 p-0 flex items-center justify-center flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={toggleMute} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
