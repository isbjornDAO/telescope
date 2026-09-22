"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Footprints,
  MoveHorizontal,
  FastForward,
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnimatedCharacter,
  AnimatedCharacterRef,
  CharacterAnimation,
  ANIMATIONS,
} from "@/components/AnimatedCharacter";

export interface BearWalkProps {
  className?: string;
  defaultSize?: number;
  initialPatrol?: boolean;
}

const BEAR_MESSAGES = [
  "🐾 *BOING!*",
  "❄️ Woohoo! High jump!",
  "🐻 Arctic leap!",
  "🧊 Watch me hop!",
  "🐾 Nice jump!",
];

export function BearWalk({
  className,
  defaultSize = 140,
  initialPatrol = true,
}: BearWalkProps) {
  const characterRef = useRef<AnimatedCharacterRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentAnim, setCurrentAnim] = useState<CharacterAnimation>("walk");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [patrolMode, setPatrolMode] = useState<boolean>(initialPatrol);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [size, setSize] = useState<number>(defaultSize);
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  // Position and direction for patrol mode
  const [posX, setPosX] = useState<number>(20);
  const [direction, setDirection] = useState<1 | -1>(1);
  const directionRef = useRef<1 | -1>(1);

  // Keep directionRef in sync
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Patrol movement loop
  useEffect(() => {
    if (!isPlaying || !patrolMode || currentAnim !== "walk") return;

    let animId: number;
    let lastTime = performance.now();

    const moveStep = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const container = containerRef.current;
      if (container) {
        const containerWidth = container.clientWidth;
        const bearWidth = Math.round((size * 140) / 220);
        const padding = 20;
        const minX = padding;
        const maxX = Math.max(minX, containerWidth - bearWidth - padding);

        const moveSpeedPxPerSec = 70 * speedMultiplier;

        setPosX((prevX) => {
          const dir = directionRef.current;
          let nextX = prevX + dir * moveSpeedPxPerSec * dt;
          if (nextX >= maxX) {
            nextX = maxX;
            directionRef.current = -1;
            setDirection(-1);
          } else if (nextX <= minX) {
            nextX = minX;
            directionRef.current = 1;
            setDirection(1);
          }
          return nextX;
        });
      }

      animId = requestAnimationFrame(moveStep);
    };

    animId = requestAnimationFrame(moveStep);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, patrolMode, currentAnim, speedMultiplier, size]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      characterRef.current?.pause();
      setIsPlaying(false);
    } else {
      characterRef.current?.resume();
      setIsPlaying(true);
    }
  };

  const triggerJump = () => {
    setCurrentAnim("jump");
    characterRef.current?.jump();
    setIsPlaying(true);

    const msg = BEAR_MESSAGES[Math.floor(Math.random() * BEAR_MESSAGES.length)];
    setSpeechBubble(msg);

    setTimeout(() => {
      setSpeechBubble((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  const handleAnimationComplete = useCallback(() => {
    setCurrentAnim("walk");
  }, []);

  const handleFrameChange = useCallback((frameIdx: number) => {
    setCurrentFrame(frameIdx + 1);
  }, []);

  const currentConfig = ANIMATIONS[currentAnim];
  const effectiveFps = Math.round(currentConfig.fps * speedMultiplier);
  const bearWidth = Math.round((size * 140) / 220);

  // Shadow styling: scales down and fades when airborne in frame 4 (index 3) of jump
  const isAirborne = currentAnim === "jump" && currentFrame === 4;
  const isCrouched =
    currentAnim === "jump" && (currentFrame === 2 || currentFrame === 3 || currentFrame === 6);

  return (
    <div
      className={cn(
        "retro-box overflow-hidden select-none transition-all shadow-sm",
        className
      )}
    >
      {/* Title Bar */}
      <div className="retro-box-title px-3.5 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            Isbjörn Character
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold uppercase tracking-wider border border-sky-200 dark:border-sky-800">
            {currentAnim}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
            Frame {currentFrame} / {currentConfig.frameCount}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Jump Trigger Button */}
          <button
            onClick={triggerJump}
            className="retro-btn retro-btn-primary h-7 px-3 text-xs flex items-center gap-1 font-bold shadow-sm"
            title="Make the bear jump!"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Jump!</span>
          </button>

          <button
            onClick={handleTogglePlay}
            className="retro-btn retro-btn-gray h-7 px-2.5 text-xs flex items-center gap-1 font-semibold"
            title={isPlaying ? "Pause animation" : "Resume animation"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => setPatrolMode(!patrolMode)}
            className={cn(
              "retro-btn h-7 px-2.5 text-xs flex items-center gap-1 font-semibold",
              patrolMode ? "retro-btn-primary" : "retro-btn-gray"
            )}
            title={patrolMode ? "Switch to walking in place" : "Switch to patrolling across"}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>{patrolMode ? "Patrolling" : "In-Place"}</span>
          </button>

          <button
            onClick={() => {
              setSpeedMultiplier((curr) => {
                if (curr === 0.5) return 1;
                if (curr === 1) return 1.5;
                if (curr === 1.5) return 2;
                return 0.5;
              });
            }}
            className="retro-btn retro-btn-gray h-7 px-2 text-xs flex items-center gap-1 font-semibold tabular-nums"
            title="Adjust animation speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{speedMultiplier}x</span>
          </button>

          <button
            onClick={() => {
              setSize((s) => (s === 120 ? 150 : s === 150 ? 190 : 120));
            }}
            className="retro-btn retro-btn-gray h-7 px-2 text-xs flex items-center gap-1 font-semibold tabular-nums"
            title="Adjust character size"
          >
            <span>{size}px</span>
          </button>
        </div>
      </div>

      {/* Walking / Jumping Stage */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-gradient-to-b from-sky-50/60 to-zinc-100/80 dark:from-zinc-900/60 dark:to-zinc-950/80 border-t border-zinc-200/80 dark:border-zinc-800"
        style={{ height: size + 45 }}
      >
        {/* Subtle Arctic Terrain Ground Line */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/90 to-transparent dark:from-zinc-900/90 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-3 border-b-2 border-dashed border-sky-200/60 dark:border-zinc-700/60 pointer-events-none" />

        {/* Ambient snowflakes */}
        <div className="absolute top-2 left-8 text-sky-200 dark:text-zinc-700 text-xs pointer-events-none">
          ❄
        </div>
        <div className="absolute top-4 right-14 text-sky-200 dark:text-zinc-700 text-[10px] pointer-events-none">
          ❄
        </div>

        {/* Bear Character */}
        <div
          className="absolute bottom-3 select-none cursor-pointer"
          style={{
            transform: patrolMode
              ? `translateX(${posX}px)`
              : `translateX(calc(50% - ${bearWidth / 2}px))`,
            transformOrigin: "bottom center",
            height: size,
            width: bearWidth,
          }}
          onClick={triggerJump}
          title="Click the bear to make him jump!"
        >
          {/* Speech Bubble */}
          {speechBubble && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xs font-semibold shadow-md border border-zinc-200 dark:border-zinc-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-30">
              {speechBubble}
            </div>
          )}

          {/* Dynamic Ground Shadow */}
          <div
            className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 bg-zinc-900/20 dark:bg-black/40 rounded-full blur-[1.5px] transition-all duration-100",
              isAirborne ? "w-1/2 opacity-30 scale-75" : isCrouched ? "w-4/5 opacity-80" : "w-3/4 opacity-60"
            )}
          />

          <AnimatedCharacter
            ref={characterRef}
            animation={currentAnim}
            size={size}
            fps={effectiveFps}
            autoPlay={isPlaying}
            direction={patrolMode ? direction : 1}
            onAnimationComplete={handleAnimationComplete}
            onFrameChange={handleFrameChange}
          />
        </div>

        {/* Helper text */}
        <div className="absolute right-3 bottom-1 text-[10px] text-muted-foreground/70 pointer-events-none">
          Click bear or press Jump 🐾
        </div>
      </div>
    </div>
  );
}
