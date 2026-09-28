/**
 * Continuous research bounty succession.
 * Exactly one event should be LIVE at a time; closing it promotes the next QUEUED.
 */

export type ResearchEventStatus = "QUEUED" | "LIVE" | "CLOSED";

export interface ResearchEventLike {
  id: string;
  status: ResearchEventStatus;
  nextEventId?: string | null;
  deadline: Date | string;
}

/** After closing `closingId`, return which event id becomes LIVE (if any). */
export function nextLiveAfterClose(
  events: ResearchEventLike[],
  closingId: string
): string | null {
  const closing = events.find((e) => e.id === closingId);
  if (!closing) return null;
  if (closing.nextEventId) {
    const next = events.find((e) => e.id === closing.nextEventId);
    if (next && next.status === "QUEUED") return next.id;
  }
  // Fallback: earliest QUEUED by deadline
  const queued = events
    .filter((e) => e.status === "QUEUED" && e.id !== closingId)
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  return queued[0]?.id ?? null;
}

/** Word count for essay submissions (whitespace-separated tokens). */
export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function meetsMinWordCount(text: string, min: number): boolean {
  return wordCount(text) >= min;
}

/** Invariant: at most one LIVE event. */
export function assertSingleLive(events: ResearchEventLike[]): boolean {
  return events.filter((e) => e.status === "LIVE").length <= 1;
}
