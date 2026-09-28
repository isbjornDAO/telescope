import {
  assertSingleLive,
  meetsMinWordCount,
  nextLiveAfterClose,
  wordCount,
} from "@/lib/world/research";
import {
  groupByColumn,
  isBuilderCategory,
  isBuilderColumn,
} from "@/lib/world/builder-board";

describe("research event succession", () => {
  const events = [
    {
      id: "a",
      status: "LIVE" as const,
      nextEventId: "b",
      deadline: "2026-10-01",
    },
    {
      id: "b",
      status: "QUEUED" as const,
      nextEventId: "c",
      deadline: "2026-11-01",
    },
    {
      id: "c",
      status: "QUEUED" as const,
      nextEventId: null,
      deadline: "2026-12-01",
    },
  ];

  it("promotes nextEventId when closing the live event", () => {
    expect(nextLiveAfterClose(events, "a")).toBe("b");
  });

  it("falls back to earliest queued by deadline", () => {
    const noLink = events.map((e) =>
      e.id === "a" ? { ...e, nextEventId: null } : e
    );
    expect(nextLiveAfterClose(noLink, "a")).toBe("b");
  });

  it("returns null when nothing is queued", () => {
    expect(
      nextLiveAfterClose(
        [{ id: "a", status: "LIVE", nextEventId: null, deadline: "2026-10-01" }],
        "a"
      )
    ).toBeNull();
  });

  it("asserts at most one live", () => {
    expect(assertSingleLive(events)).toBe(true);
    expect(
      assertSingleLive([
        ...events,
        { id: "x", status: "LIVE", nextEventId: null, deadline: "2026-09-01" },
      ])
    ).toBe(false);
  });
});

describe("research word count", () => {
  it("counts whitespace-separated tokens", () => {
    expect(wordCount("one two three")).toBe(3);
    expect(wordCount("  spaced   out  ")).toBe(2);
    expect(wordCount("")).toBe(0);
  });

  it("enforces minimum word count", () => {
    expect(meetsMinWordCount("a b c", 3)).toBe(true);
    expect(meetsMinWordCount("a b", 3)).toBe(false);
  });
});

describe("builder board", () => {
  it("validates category and column enums", () => {
    expect(isBuilderCategory("GOVERNANCE")).toBe(true);
    expect(isBuilderCategory("nope")).toBe(false);
    expect(isBuilderColumn("BUILDING")).toBe(true);
    expect(isBuilderColumn("DONE")).toBe(false);
  });

  it("groups cards by column with category filter", () => {
    const cards = [
      { id: "1", category: "GOVERNANCE" as const, column: "BUILDING" as const },
      { id: "2", category: "FINANCE" as const, column: "BUILDING" as const },
      { id: "3", category: "GOVERNANCE" as const, column: "LIVE" as const },
    ];
    const all = groupByColumn(cards);
    expect(all.BUILDING).toHaveLength(2);
    expect(all.LIVE).toHaveLength(1);
    expect(all.EXPLORING).toHaveLength(0);

    const gov = groupByColumn(cards, "GOVERNANCE");
    expect(gov.BUILDING).toHaveLength(1);
    expect(gov.BUILDING[0].id).toBe("1");
    expect(gov.LIVE).toHaveLength(1);
  });
});
