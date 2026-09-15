import {
  FrameData,
  SPRITE_CANVAS_WIDTH,
  SPRITE_CANVAS_HEIGHT,
  SPRITE_BASELINE_Y,
} from "./spriteData";

const frameCache = new Map<string, HTMLCanvasElement>();
const sheetPromiseCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cannot load image outside browser environment"));
  }
  if (sheetPromiseCache.has(src)) {
    return sheetPromiseCache.get(src)!;
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image at ${src}: ${err}`));
    img.src = src;
  });
  sheetPromiseCache.set(src, promise);
  return promise;
}

export function extractNormalizedFrame(
  source: HTMLImageElement | HTMLCanvasElement,
  frame: FrameData,
  targetWidth: number = SPRITE_CANVAS_WIDTH,
  targetHeight: number = SPRITE_CANVAS_HEIGHT,
  baselineY: number = SPRITE_BASELINE_Y
): HTMLCanvasElement {
  const cacheKey = `${frame.x}_${frame.y}_${frame.w}_${frame.h}_${frame.groundY}_${targetWidth}_${targetHeight}`;
  const cached = frameCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;

  const destX = Math.round((targetWidth - frame.w) / 2);
  const destY = baselineY - (frame.groundY - frame.y);

  ctx.drawImage(
    source,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    destX,
    destY,
    frame.w,
    frame.h
  );

  frameCache.set(cacheKey, canvas);
  return canvas;
}
