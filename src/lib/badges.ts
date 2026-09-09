/**
 * Badges are the visible half of a record the world already keeps.
 *
 * Nothing here reads private state: every badge is derived from something the
 * profile already shows in public (node type, ice band, level, streak, a
 * claimed collectable, a first transaction on the C-Chain). Locked badges say
 * how they are earned, never who else holds them.
 */

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  name: string;
  /** What holding it means. */
  description: string;
  /** How it is earned. Shown while it is still locked. */
  how: string;
  rarity: Rarity;
  group: "World" | "Forum" | "Chain" | "Collectables";
  /** Image for collectables; world badges draw a glyph instead. */
  imageUrl?: string | null;
  /** Lucide glyph name the UI maps to an icon. */
  glyph?: "anchor" | "crown" | "snowflake" | "flame" | "sparkles" | "package" | "link" | "message" | "calendar";
  earned: boolean;
  earnedAt?: string | null;
  /** 0–1 toward earning it, when progress is measurable. */
  progress?: number;
}

export interface BadgeInputs {
  nodeType?: "NODE" | "ANCHOR" | "ELDER" | string | null;
  band?: string | null;
  level?: number;
  xp?: number;
  streak?: number;
  longestStreak?: number;
  shippedCount?: number;
  vouchesAtLeast?: number;
  classOf?: string | null;
  since?: string | Date | null;
  collectables?: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rarity: string;
    hasClaimed: boolean;
    acquiredAt?: string | null;
  }[];
}

const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

function asRarity(value: string | undefined): Rarity {
  return value === "legendary" || value === "epic" || value === "rare" ? value : "common";
}

/** Progress toward a numeric threshold, clamped to 0–1. */
function toward(value: number | undefined, target: number): number {
  return Math.max(0, Math.min(1, (value ?? 0) / target));
}

export function buildBadges(input: BadgeInputs): Badge[] {
  const {
    nodeType,
    band,
    level = 1,
    streak = 0,
    longestStreak = 0,
    shippedCount = 0,
    vouchesAtLeast = 0,
    classOf,
    collectables = [],
  } = input;

  const badges: Badge[] = [
    // ── The world ───────────────────────────────────────────────────
    {
      id: "anchor",
      name: "Anchor",
      description: "A region verified this node in person. Trust flows through you.",
      how: "Meet a region in person and have it verify you.",
      rarity: "epic",
      group: "World",
      glyph: "anchor",
      earned: nodeType === "ANCHOR" || nodeType === "ELDER",
    },
    {
      id: "elder",
      name: "Elder",
      description: "Chosen to hold the world's hardest calls.",
      how: "Earned, never requested. Elders are named by the world.",
      rarity: "legendary",
      group: "World",
      glyph: "crown",
      earned: nodeType === "ELDER",
    },
    {
      id: "ice-firm",
      name: "Firm ice",
      description: "Enough trust behind you to hold weight.",
      how: "Collect vouches from nodes with a path to an Anchor.",
      rarity: "rare",
      group: "World",
      glyph: "snowflake",
      earned: band === "firm" || band === "thick",
    },
    {
      id: "ice-thick",
      name: "Thick ice",
      description: "The deepest trust the world measures.",
      how: "Keep earning vouches across regions and seasons.",
      rarity: "epic",
      group: "World",
      glyph: "snowflake",
      earned: band === "thick",
    },
    {
      id: "vouched",
      name: "Vouched for",
      description: "Someone staked their own weight on you.",
      how: "Get one vouch from any node.",
      rarity: "common",
      group: "World",
      glyph: "link",
      earned: vouchesAtLeast >= 1,
    },
    {
      id: "shipper",
      name: "Shipper",
      description: "Three proofs of something you actually built.",
      how: "Add three proofs, or import them from Builder's Hub.",
      rarity: "rare",
      group: "World",
      glyph: "package",
      earned: shippedCount >= 3,
      progress: toward(shippedCount, 3),
    },

    // ── The forum ───────────────────────────────────────────────────
    {
      id: "level-5",
      name: "Regular",
      description: "Level 5. You show up.",
      how: "Reach level 5 by posting on the forum.",
      rarity: "common",
      group: "Forum",
      glyph: "message",
      earned: level >= 5,
      progress: toward(level, 5),
    },
    {
      id: "level-15",
      name: "Voice",
      description: "Level 15. People know your name in the rooms.",
      how: "Reach level 15.",
      rarity: "rare",
      group: "Forum",
      glyph: "message",
      earned: level >= 15,
      progress: toward(level, 15),
    },
    {
      id: "level-30",
      name: "Landmark",
      description: "Level 30. You are part of the furniture.",
      how: "Reach level 30.",
      rarity: "epic",
      group: "Forum",
      glyph: "message",
      earned: level >= 30,
      progress: toward(level, 30),
    },
    {
      id: "streak-7",
      name: "Week of weather",
      description: "Seven days without missing one.",
      how: "Keep a 7-day streak.",
      rarity: "common",
      group: "Forum",
      glyph: "flame",
      earned: Math.max(streak, longestStreak) >= 7,
      progress: toward(Math.max(streak, longestStreak), 7),
    },
    {
      id: "streak-30",
      name: "Overwinter",
      description: "Thirty days straight. Most nodes do not last the winter.",
      how: "Keep a 30-day streak.",
      rarity: "epic",
      group: "Forum",
      glyph: "flame",
      earned: Math.max(streak, longestStreak) >= 30,
      progress: toward(Math.max(streak, longestStreak), 30),
    },
  ];

  // ── The chain ─────────────────────────────────────────────────────
  if (classOf) {
    badges.push({
      id: "class-of",
      name: `Class of ${classOf}`,
      description: `Your first transaction on the C-Chain was in ${classOf}.`,
      how: "Written by the chain the day you arrived. It cannot be earned twice.",
      rarity: Number(classOf) <= 2021 ? "legendary" : Number(classOf) <= 2022 ? "epic" : "rare",
      group: "Chain",
      glyph: "calendar",
      earned: true,
    });
  }

  // ── Collectables ──────────────────────────────────────────────────
  for (const c of collectables) {
    badges.push({
      id: `collectable:${c.id}`,
      name: c.name,
      description: c.description,
      how: "Claimed from the world. Watch the rooms for the next drop.",
      rarity: asRarity(c.rarity),
      group: "Collectables",
      imageUrl: c.imageUrl,
      earned: c.hasClaimed,
      earnedAt: c.acquiredAt ?? null,
    });
  }

  return badges;
}

/** Earned first, then rarest, then closest to being earned. */
export function sortBadges(badges: Badge[]): Badge[] {
  return [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned) return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    return (b.progress ?? 0) - (a.progress ?? 0) || RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
  });
}

export const RARITY_TONE: Record<Rarity, string> = {
  legendary: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5",
  epic: "text-violet-600 dark:text-violet-400 border-violet-500/40 bg-violet-500/5",
  rare: "text-sky-600 dark:text-sky-400 border-sky-500/40 bg-sky-500/5",
  common: "text-muted-foreground border-[var(--surface-border)]",
};
