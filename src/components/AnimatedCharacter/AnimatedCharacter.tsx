"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  CharacterAnimation,
  ANIMATIONS,
  SPRITE_CANVAS_WIDTH,
  SPRITE_CANVAS_HEIGHT,
  AnimationConfig,
} from "./spriteData";
import { loadImage, extractNormalizedFrame } from "./spriteUtils";

export interface AnimatedCharacterRef {
  /** Programmatically play an animation state */
  play: (anim?: CharacterAnimation) => void;
  /** Convenience shortcut to trigger a jump and return to walk */
  jump: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume playing */
  resume: () => void;
  /** Current active animation */
  getCurrentAnimation: () => CharacterAnimation;
  /** Current frame index */
  getCurrentFrame: () => number;
}

export interface AnimatedCharacterProps {
  /** Active animation state: "walk" | "jump" */
  animation?: CharacterAnimation;
  /** Render height in pixels. Width scales proportionally preserving 140:220 aspect ratio */
  size?: number;
  width?: number;
  height?: number;
  /** Custom FPS override. If omitted, uses the animation's recommended speed */
  fps?: number;
  /** Loop override. Walk loops by default; Jump plays once by default */
  loop?: boolean;
  /** Whether the animation automatically plays */
  autoPlay?: boolean;
  /** Facing direction: 1 = right, -1 = left */
  direction?: 1 | -1;
  /** Callback fired when a non-looping animation finishes and returns to walk */
  onAnimationComplete?: (animation: CharacterAnimation) => void;
  /** Callback fired on every frame tick */
  onFrameChange?: (frameIndex: number, totalFrames: number) => void;
  /** Click handler */
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedCharacter = forwardRef<AnimatedCharacterRef, AnimatedCharacterProps>(
  (
    {
      animation = "walk",
      size = 180,
      width,
      height,
      fps,
      loop,
      autoPlay = true,
      direction = 1,
      onAnimationComplete,
      onFrameChange,
      onClick,
      className = "",
      style,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [currentAnim, setCurrentAnim] = useState<CharacterAnimation>(animation);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    const targetH = height ?? size;
    const targetW = width ?? Math.round((targetH * SPRITE_CANVAS_WIDTH) / SPRITE_CANVAS_HEIGHT);

    // Maintain stable refs for callbacks and dynamic props to prevent re-triggering animation loops
    const onAnimationCompleteRef = useRef(onAnimationComplete);
    const onFrameChangeRef = useRef(onFrameChange);
    const fpsRef = useRef(fps);
    const loopRef = useRef(loop);
    const directionRef = useRef(direction);
    const targetWRef = useRef(targetW);
    const targetHRef = useRef(targetH);

    onAnimationCompleteRef.current = onAnimationComplete;
    onFrameChangeRef.current = onFrameChange;
    fpsRef.current = fps;
    loopRef.current = loop;
    directionRef.current = direction;
    targetWRef.current = targetW;
    targetHRef.current = targetH;

    const currentFrameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);
    const animFrameIdRef = useRef<number | null>(null);
    const currentAnimRef = useRef<CharacterAnimation>(currentAnim);
    const framesMapRef = useRef<Map<CharacterAnimation, HTMLCanvasElement[]>>(new Map());

    currentAnimRef.current = currentAnim;

    // Load and extract both walk and jump frames on mount
    useEffect(() => {
      let isMounted = true;

      const prepareAnimations = async () => {
        try {
          const map = new Map<CharacterAnimation, HTMLCanvasElement[]>();
          const animKeys = Object.keys(ANIMATIONS) as CharacterAnimation[];

          await Promise.all(
            animKeys.map(async (key) => {
              const config: AnimationConfig = ANIMATIONS[key];
              const img = await loadImage(config.spritesheetSrc);
              const frames: HTMLCanvasElement[] = config.frames.map((f) =>
                extractNormalizedFrame(
                  img,
                  f,
                  SPRITE_CANVAS_WIDTH,
                  SPRITE_CANVAS_HEIGHT
                )
              );
              map.set(key, frames);
            })
          );

          if (!isMounted) return;
          framesMapRef.current = map;
          setIsLoaded(true);
        } catch (err) {
          console.error("Failed to load character animations:", err);
        }
      };

      prepareAnimations();

      return () => {
        isMounted = false;
      };
    }, []);

    // Draw frame to canvas with Retina / HiDPI support
    const renderFrame = useCallback(
      (animKey: CharacterAnimation, frameIdx: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animFrames = framesMapRef.current.get(animKey);
        if (!animFrames || animFrames.length === 0) return;

        const safeIdx = Math.min(Math.max(0, frameIdx), animFrames.length - 1);
        const sourceCanvas = animFrames[safeIdx];
        if (!sourceCanvas) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const curW = targetWRef.current;
        const curH = targetHRef.current;

        const pixelW = Math.round(curW * dpr);
        const pixelH = Math.round(curH * dpr);

        if (canvas.width !== pixelW || canvas.height !== pixelH) {
          canvas.width = pixelW;
          canvas.height = pixelH;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);

        if (directionRef.current === -1) {
          ctx.translate(curW, 0);
          ctx.scale(-1, 1);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          SPRITE_CANVAS_WIDTH,
          SPRITE_CANVAS_HEIGHT,
          0,
          0,
          curW,
          curH
        );
        ctx.restore();
      },
      []
    );

    // Initial render when loaded
    useEffect(() => {
      if (isLoaded) {
        renderFrame(currentAnimRef.current, currentFrameRef.current);
      }
    }, [isLoaded, renderFrame]);

    // Redraw when direction or dimensions change without restarting the animation loop
    useEffect(() => {
      if (isLoaded) {
        renderFrame(currentAnimRef.current, currentFrameRef.current);
      }
    }, [direction, targetW, targetH, isLoaded, renderFrame]);

    // Update animation state when animation prop changes
    useEffect(() => {
      setCurrentAnim(animation);
      currentAnimRef.current = animation;
      currentFrameRef.current = 0;
      lastFrameTimeRef.current = performance.now();
      if (isLoaded) {
        renderFrame(animation, 0);
      }
    }, [animation, isLoaded, renderFrame]);

    // Animation tick loop: depends only on isLoaded and isPlaying
    useEffect(() => {
      if (!isLoaded || !isPlaying) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
        return;
      }

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      lastFrameTimeRef.current = performance.now();

      const tick = (now: number) => {
        const animKey = currentAnimRef.current;
        const animConfig = ANIMATIONS[animKey];
        if (!animConfig) return;

        const effectiveFps = fpsRef.current ?? animConfig.fps;
        const frameDurationMs = 1000 / effectiveFps;

        const elapsed = now - lastFrameTimeRef.current;

        if (elapsed >= frameDurationMs) {
          lastFrameTimeRef.current = now - (elapsed % frameDurationMs);

          const totalFrames = animConfig.frameCount;
          const nextFrame = currentFrameRef.current + 1;
          const isLooping = loopRef.current !== undefined ? loopRef.current : animConfig.loop;

          if (nextFrame >= totalFrames) {
            if (isLooping) {
              currentFrameRef.current = 0;
            } else {
              // Non-looping animation (e.g. jump) finished -> reset and return to walk
              currentFrameRef.current = 0;
              setCurrentAnim("walk");
              currentAnimRef.current = "walk";
              if (onAnimationCompleteRef.current) {
                onAnimationCompleteRef.current(animKey);
              }
            }
          } else {
            currentFrameRef.current = nextFrame;
          }

          renderFrame(currentAnimRef.current, currentFrameRef.current);

          if (onFrameChangeRef.current) {
            onFrameChangeRef.current(currentFrameRef.current, totalFrames);
          }
        }

        animFrameIdRef.current = requestAnimationFrame(tick);
      };

      animFrameIdRef.current = requestAnimationFrame(tick);

      return () => {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      };
    }, [isLoaded, isPlaying, renderFrame]);

    // Imperative ref methods
    useImperativeHandle(
      ref,
      () => ({
        play: (anim: CharacterAnimation = "walk") => {
          currentFrameRef.current = 0;
          lastFrameTimeRef.current = performance.now();
          setCurrentAnim(anim);
          currentAnimRef.current = anim;
          setIsPlaying(true);
        },
        jump: () => {
          currentFrameRef.current = 0;
          lastFrameTimeRef.current = performance.now();
          setCurrentAnim("jump");
          currentAnimRef.current = "jump";
          setIsPlaying(true);
        },
        pause: () => setIsPlaying(false),
        resume: () => {
          lastFrameTimeRef.current = performance.now();
          setIsPlaying(true);
        },
        getCurrentAnimation: () => currentAnimRef.current,
        getCurrentFrame: () => currentFrameRef.current,
      }),
      []
    );

    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{
          width: targetW,
          height: targetH,
          ...style,
        }}
        onClick={onClick}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: targetW,
            height: targetH,
            display: "block",
          }}
        />
      </div>
    );
  }
);

AnimatedCharacter.displayName = "AnimatedCharacter";
