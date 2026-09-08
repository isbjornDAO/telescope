"use client";

import Link from "next/link";
import { useMemo } from "react";

export interface MapRegion {
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  nodes: number;
  crews: number;
  anchors: number;
  standing: number;
}

const SIZE = 640;
const C = SIZE / 2;
const R = SIZE / 2 - 24;

/** Azimuthal projection centred on the pole: the world map is the Arctic. */
function project(lat: number, lng: number) {
  const r = ((90 - lat) / 150) * R;
  const a = (lng * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function ArcticMap({ regions, roaming = 6, className }: { regions: MapRegion[]; roaming?: number; className?: string }) {
  const placed = useMemo(() => {
    const rnd = seeded(regions.length + 7);
    return regions.map((r, i) => {
      const lat = r.lat ?? 30 + rnd() * 40;
      const lng = r.lng ?? rnd() * 360 - 180;
      const p = project(lat, lng);
      const size = 4 + Math.min(14, Math.sqrt(r.nodes + r.crews * 2) * 2);
      return { ...r, ...p, size, i };
    });
  }, [regions]);

  const routes = useMemo(() => {
    if (placed.length < 2) return [] as { d: string; dur: number; key: string }[];
    const rnd = seeded(placed.length * 13);
    return Array.from({ length: roaming }).map((_, k) => {
      const a = placed[Math.floor(rnd() * placed.length)];
      let b = placed[Math.floor(rnd() * placed.length)];
      if (b === a) b = placed[(a.i + 1) % placed.length];
      const mx = (a.x + b.x) / 2 + (C - (a.x + b.x) / 2) * 0.35;
      const my = (a.y + b.y) / 2 + (C - (a.y + b.y) / 2) * 0.35;
      return { d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`, dur: 9 + rnd() * 10, key: `${k}-${a.slug}-${b.slug}` };
    });
  }, [placed, roaming]);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto arctic-map" role="img" aria-label="The Arctic: regions of the Avalanche network">
        <defs>
          <radialGradient id="icecap" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ice-cap-0)" />
            <stop offset="55%" stopColor="var(--ice-cap-1)" />
            <stop offset="100%" stopColor="var(--ice-cap-2)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={C} cy={C} r={R} fill="url(#icecap)" stroke="var(--ice-line)" strokeWidth="1" />
        {[75, 60, 45, 30, 15, 0].map((lat) => (
          <circle key={lat} cx={C} cy={C} r={((90 - lat) / 150) * R} fill="none" stroke="var(--ice-line)" strokeWidth="0.6" strokeDasharray={lat === 0 ? "4 4" : undefined} opacity={0.6} />
        ))}
        {[0, 45, 90, 135].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <line key={deg} x1={C - R * Math.sin(a)} y1={C + R * Math.cos(a)} x2={C + R * Math.sin(a)} y2={C - R * Math.cos(a)} stroke="var(--ice-line)" strokeWidth="0.5" opacity={0.4} />;
        })}
        <circle cx={C} cy={C} r={3} fill="var(--ice-pole)" />
        <text x={C + 8} y={C - 6} className="map-label" opacity={0.7}>Iggy</text>

        {routes.map((r) => (
          <g key={r.key}>
            <path d={r.d} fill="none" stroke="var(--ice-route)" strokeWidth="0.8" strokeDasharray="2 5" opacity={0.5} />
            <circle r="2.6" fill="var(--ice-scout)" filter="url(#glow)">
              <animateMotion dur={`${r.dur}s`} repeatCount="indefinite" path={r.d} />
            </circle>
          </g>
        ))}

        {placed.map((p) => (
          <Link key={p.slug} href={`/regions/${p.slug}`}>
            <g className="map-region">
              <circle cx={p.x} cy={p.y} r={p.size + 6} fill="var(--ice-floe-halo)" opacity={0.5} />
              <circle cx={p.x} cy={p.y} r={p.size} fill="var(--ice-floe)" stroke="var(--ice-floe-stroke)" strokeWidth="1.5" />
              {p.anchors > 0 && <circle cx={p.x} cy={p.y} r={Math.max(2, p.size * 0.35)} fill="var(--ice-pole)" />}
              <text x={p.x} y={p.y - p.size - 6} textAnchor="middle" className="map-label">{p.name}</text>
              <title>{`${p.name} · ${p.nodes} nodes · ${p.anchors} anchors · ${p.crews} crews`}</title>
            </g>
          </Link>
        ))}
      </svg>
    </div>
  );
}
