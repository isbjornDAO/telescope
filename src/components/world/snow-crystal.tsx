"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * A deterministic snow crystal, grown from a wallet address or handle.
 *
 * No two seeds grow the same crystal, and no crystal reveals anything the
 * address does not already say in public. That is the point: an icon you can
 * recognise across the world without ever uploading a face.
 */

const SIZES = { xs: 24, sm: 32, md: 44, lg: 72, xl: 112 } as const;
export type CrystalSize = keyof typeof SIZES;

/** FNV-1a. Small, stable, and identical on server and client. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A tiny deterministic generator, so one seed always grows one crystal. */
function makeRng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

interface Branch {
  at: number;
  len: number;
  angle: number;
}

function growArm(rng: () => number) {
  const branchCount = 2 + Math.floor(rng() * 3); // 2–4 pairs
  const branches: Branch[] = [];
  for (let i = 0; i < branchCount; i++) {
    branches.push({
      at: 0.26 + (i / branchCount) * 0.56 + rng() * 0.06,
      len: 0.16 + rng() * 0.22,
      angle: 28 + rng() * 30,
    });
  }
  return {
    branches,
    tip: Math.floor(rng() * 3) as 0 | 1 | 2, // dot · diamond · fork
    core: 0.1 + rng() * 0.07,
  };
}

export function SnowCrystal({
  seed,
  size = "md",
  nodeType,
  className,
  title,
}: {
  seed: string;
  size?: CrystalSize;
  nodeType?: "NODE" | "ANCHOR" | "ELDER" | string | null;
  className?: string;
  title?: string;
}) {
  const px = SIZES[size];

  const crystal = useMemo(() => {
    const h = hashSeed((seed || "unclaimed").toLowerCase());
    const rng = makeRng(h);
    // Every crystal is cold. The world has one weather.
    const hue = 186 + (h % 54); // 186–240: ice blue through to deep polar blue
    return { ...growArm(rng), hue, h };
  }, [seed]);

  const R = 50;
  const armLen = 38;
  const stroke = crystal.hue;
  const ink =
    nodeType === "ELDER" ? "hsl(41 88% 52%)" : nodeType === "ANCHOR" ? `hsl(${stroke} 82% 46%)` : `hsl(${stroke} 62% 52%)`;
  const faint = `hsl(${stroke} 60% 62%)`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={cn("shrink-0 rounded-full", className)}
      role="img"
      aria-label={title ?? "Your snow crystal"}
      style={{ background: `hsl(${stroke} 55% 96%)` }}
    >
      <title>{title ?? "Snow crystal"}</title>
      <g
        stroke={ink}
        strokeWidth={size === "xs" || size === "sm" ? 3.4 : 2.6}
        strokeLinecap="round"
        fill="none"
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg} ${R} ${R})`}>
            <line x1={R} y1={R} x2={R} y2={R - armLen} />
            {crystal.branches.map((b, i) => {
              const y = R - armLen * b.at;
              const len = armLen * b.len;
              const rad = (b.angle * Math.PI) / 180;
              const dx = Math.sin(rad) * len;
              const dy = Math.cos(rad) * len;
              return (
                <g key={i} stroke={i % 2 ? faint : ink}>
                  <line x1={R} y1={y} x2={R + dx} y2={y - dy} />
                  <line x1={R} y1={y} x2={R - dx} y2={y - dy} />
                </g>
              );
            })}
            {crystal.tip === 0 && <circle cx={R} cy={R - armLen} r={2.6} fill={ink} stroke="none" />}
            {crystal.tip === 1 && (
              <path d={`M${R} ${R - armLen - 4} L${R + 3.4} ${R - armLen} L${R} ${R - armLen + 4} L${R - 3.4} ${R - armLen} Z`} fill={ink} stroke="none" />
            )}
            {crystal.tip === 2 && (
              <>
                <line x1={R} y1={R - armLen} x2={R + 4.6} y2={R - armLen - 4.6} />
                <line x1={R} y1={R - armLen} x2={R - 4.6} y2={R - armLen - 4.6} />
              </>
            )}
          </g>
        ))}
        <circle cx={R} cy={R} r={R * crystal.core} fill={ink} stroke="none" />
      </g>
    </svg>
  );
}

/** The crystal in a ring, with an optional level dial around it. */
export function CrystalAvatar({
  seed,
  size = "md",
  nodeType,
  ring,
  className,
  title,
}: {
  seed: string;
  size?: CrystalSize;
  nodeType?: "NODE" | "ANCHOR" | "ELDER" | string | null;
  /** 0–1. Draws a progress dial around the crystal (level progress, say). */
  ring?: number;
  className?: string;
  title?: string;
}) {
  const px = SIZES[size];
  const ringColor = nodeType === "ELDER" ? "hsl(41 88% 52%)" : "var(--accent-ink)";

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)} style={{ width: px, height: px }}>
      {ring !== undefined && (
        <svg width={px} height={px} viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="none" stroke="var(--surface-border)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, Math.min(1, ring)) * 295.3} 295.3`}
          />
        </svg>
      )}
      <SnowCrystal
        seed={seed}
        size={size}
        nodeType={nodeType}
        title={title}
        className={cn("ring-1 ring-[var(--surface-border)]", ring !== undefined && "scale-[0.84]")}
      />
    </span>
  );
}
