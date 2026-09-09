"use client";

import { useMemo } from "react";

export interface IceLink {
  id: string;
  type: "IN_PERSON" | "SHIPPED_TOGETHER" | "SHARED_VISION" | string;
  status: "PENDING" | "ACTIVE" | "REVOKED" | "SLASHED" | string;
  weight: number;
  direction: "given" | "received";
  name: string;
  handle?: string | null;
  nodeType?: string;
}

const W = 560;
const H = 360;

/** The trust graph as ice: thick links are thick ice, thin links thin, a slashing is a crack. */
export function IceGraph({ me, links, band }: { me: string; links: IceLink[]; band: string }) {
  const nodes = useMemo(() => {
    const byName = new Map<string, IceLink[]>();
    for (const l of links) {
      if (l.status === "REVOKED") continue;
      const arr = byName.get(l.name) ?? [];
      arr.push(l);
      byName.set(l.name, arr);
    }
    const names = Array.from(byName.keys());
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 48;
    return names.map((name, i) => {
      const a = (i / Math.max(1, names.length)) * Math.PI * 2 - Math.PI / 2;
      const ls = byName.get(name)!;
      return { name, handle: ls[0].handle, nodeType: ls[0].nodeType, x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a), links: ls };
    });
  }, [links]);

  const cx = W / 2;
  const cy = H / 2;
  const meR = band === "thick" ? 22 : band === "firm" ? 18 : band === "thin" ? 14 : 11;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto ice-graph" role="img" aria-label="Your trust graph">
      <defs>
        <radialGradient id="me-ice" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ice-cap-0)" />
          <stop offset="100%" stopColor="var(--ice-floe)" />
        </radialGradient>
      </defs>
      {nodes.map((n) =>
        n.links.map((l, j) => {
          const stroke = l.type === "IN_PERSON" ? "var(--ice-in-person)" : l.type === "SHIPPED_TOGETHER" ? "var(--ice-shipped)" : "var(--ice-vision)";
          const width = l.type === "IN_PERSON" ? 6 : l.type === "SHIPPED_TOGETHER" ? 4.5 : 2;
          const dash = l.status === "PENDING" ? "3 5" : l.status === "SLASHED" ? "8 4" : undefined;
          const offset = (j - (n.links.length - 1) / 2) * 5;
          const dx = n.y - cy;
          const dy = cx - n.x;
          const len = Math.hypot(dx, dy) || 1;
          const ox = (dx / len) * offset;
          const oy = (dy / len) * offset;
          return (
            <g key={l.id}>
              <line x1={cx + ox} y1={cy + oy} x2={n.x + ox} y2={n.y + oy} stroke={l.status === "SLASHED" ? "var(--ice-crack)" : stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} opacity={l.status === "PENDING" ? 0.6 : 0.9} />
              {l.direction === "given" && (
                <circle cx={cx + (n.x - cx) * 0.72 + ox} cy={cy + (n.y - cy) * 0.72 + oy} r={2.4} fill={stroke} />
              )}
            </g>
          );
        })
      )}
      {nodes.map((n) => (
        <g key={n.name}>
          <circle cx={n.x} cy={n.y} r={n.nodeType === "ELDER" ? 12 : n.nodeType === "ANCHOR" ? 11 : 9} fill="var(--ice-floe)" stroke="var(--ice-floe-stroke)" strokeWidth="1.5" />
          {n.nodeType !== "NODE" && <circle cx={n.x} cy={n.y} r={3.5} fill="var(--ice-pole)" />}
          <text x={n.x} y={n.y + (n.y > cy ? 24 : -16)} textAnchor="middle" className="map-label">{n.name}</text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={meR + 8} fill="var(--ice-floe-halo)" opacity={0.5} />
      <circle cx={cx} cy={cy} r={meR} fill="url(#me-ice)" stroke="var(--ice-floe-stroke)" strokeWidth="2" />
      <text x={cx} y={cy + meR + 16} textAnchor="middle" className="map-label font-semibold">{me}</text>
      {nodes.length === 0 && (
        <text x={cx} y={cy + meR + 40} textAnchor="middle" className="map-label" opacity={0.7}>No ice yet. Trust is earned in rooms.</text>
      )}
    </svg>
  );
}
