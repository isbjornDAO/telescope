/**
 * Builder project kanban invariants — pure helpers with tests.
 */

export const BUILDER_CATEGORIES = [
  "COMMUNICATION",
  "DATA_INFRASTRUCTURE",
  "PRIVACY_SECURITY",
  "LOCAL_INFRASTRUCTURE",
  "GOVERNANCE",
  "FINANCE",
  "CONSERVATION",
  "OTHER",
] as const;

export const BUILDER_COLUMNS = [
  "EXPLORING",
  "BUILDING",
  "SHIPPING",
  "LIVE",
  "PAUSED",
] as const;

export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number];
export type BuilderColumn = (typeof BUILDER_COLUMNS)[number];

export const CATEGORY_LABELS: Record<BuilderCategory, string> = {
  COMMUNICATION: "Communication",
  DATA_INFRASTRUCTURE: "Data infrastructure",
  PRIVACY_SECURITY: "Privacy and security",
  LOCAL_INFRASTRUCTURE: "Local infrastructure",
  GOVERNANCE: "Governance",
  FINANCE: "Finance",
  CONSERVATION: "Conservation",
  OTHER: "Other",
};

export const COLUMN_LABELS: Record<BuilderColumn, string> = {
  EXPLORING: "Exploring",
  BUILDING: "Building",
  SHIPPING: "Shipping",
  LIVE: "Live",
  PAUSED: "Paused",
};

export function isBuilderCategory(v: string): v is BuilderCategory {
  return (BUILDER_CATEGORIES as readonly string[]).includes(v);
}

export function isBuilderColumn(v: string): v is BuilderColumn {
  return (BUILDER_COLUMNS as readonly string[]).includes(v);
}

export interface BoardCard {
  id: string;
  category: BuilderCategory;
  column: BuilderColumn;
}

/** Group cards into column → cards, optionally filtered by category. */
export function groupByColumn(
  cards: BoardCard[],
  categoryFilter?: BuilderCategory | "ALL"
): Record<BuilderColumn, BoardCard[]> {
  const filtered =
    !categoryFilter || categoryFilter === "ALL"
      ? cards
      : cards.filter((c) => c.category === categoryFilter);
  const out = Object.fromEntries(
    BUILDER_COLUMNS.map((col) => [col, [] as BoardCard[]])
  ) as Record<BuilderColumn, BoardCard[]>;
  for (const card of filtered) {
    out[card.column].push(card);
  }
  return out;
}
