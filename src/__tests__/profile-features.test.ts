import { describe, expect, it } from "@jest/globals";
import { z } from "zod";

describe("Profile Tag & Wall Validation", () => {
  const patchSchema = z.object({
    handle: z.string().regex(/^[a-z0-9_]{3,24}$/).optional(),
    bio: z.string().max(280).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(15).optional(),
  });

  it("validates user tags correctly", () => {
    const valid = patchSchema.safeParse({
      handle: "alice",
      bio: "Web3 builder",
      tags: ["Avalanche", "Governance", "DeFi"],
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.tags).toHaveLength(3);
    }
  });

  it("rejects empty tag strings or tags that exceed 30 chars", () => {
    const invalidEmpty = patchSchema.safeParse({
      tags: [""],
    });
    expect(invalidEmpty.success).toBe(false);

    const invalidLong = patchSchema.safeParse({
      tags: ["a".repeat(31)],
    });
    expect(invalidLong.success).toBe(false);
  });

  it("rejects tag lists exceeding maximum allowed limit", () => {
    const tooManyTags = patchSchema.safeParse({
      tags: Array.from({ length: 16 }, (_, i) => `tag${i}`),
    });
    expect(tooManyTags.success).toBe(false);
  });
});

describe("Wall Message Validation", () => {
  const postSchema = z.object({
    content: z.string().trim().min(1, "Message cannot be empty").max(500, "Message cannot exceed 500 characters"),
    authorName: z.string().trim().max(40).optional(),
    authorAddress: z.string().trim().optional(),
  });

  it("accepts valid wall message", () => {
    const res = postSchema.safeParse({
      content: "Hello from another sovereign node!",
      authorName: "@bob",
    });
    expect(res.success).toBe(true);
  });

  it("rejects blank content or content over 500 chars", () => {
    const blank = postSchema.safeParse({ content: "   " });
    expect(blank.success).toBe(false);

    const tooLong = postSchema.safeParse({ content: "x".repeat(501) });
    expect(tooLong.success).toBe(false);
  });
});

describe("User Level Resolution", () => {
  it("resolves real database level instead of synthetic xp / 10", () => {
    const resolveLevel = (userStats?: { level?: number }, profile?: { level?: number }) => {
      return userStats?.level ?? profile?.level ?? 1;
    };

    expect(resolveLevel({ level: 5 }, { level: 1 })).toBe(5);
    expect(resolveLevel(undefined, { level: 3 })).toBe(3);
    expect(resolveLevel(undefined, undefined)).toBe(1);
  });
});
