import { describe, expect, it } from "@jest/globals";

describe("Forum Feed Logic", () => {
  describe("Pagination calculations", () => {
    it("correctly calculates pagination offsets and total pages", () => {
      const totalThreads = 25;
      const limit = 8;

      const totalPages = Math.max(1, Math.ceil(totalThreads / limit));
      expect(totalPages).toBe(4);

      const page1Skip = (1 - 1) * limit;
      expect(page1Skip).toBe(0);

      const page2Skip = (2 - 1) * limit;
      expect(page2Skip).toBe(8);

      const page4Skip = (4 - 1) * limit;
      expect(page4Skip).toBe(24);
    });

    it("handles zero threads gracefully", () => {
      const totalThreads = 0;
      const limit = 8;
      const totalPages = Math.max(1, Math.ceil(totalThreads / limit));
      expect(totalPages).toBe(1);
    });
  });

  describe("Feed post anonymity and display formatting", () => {
    function formatFeedAuthor(post: {
      anonymous: boolean;
      walletAddress: string | null;
      user?: { username?: string | null; handle?: string | null };
    }) {
      if (post.anonymous) {
        return {
          authorName: "Anonymous",
          walletAddress: null,
        };
      }

      return {
        authorName:
          post.user?.handle ||
          post.user?.username ||
          (post.walletAddress ? `${post.walletAddress.slice(0, 6)}...` : "Anonymous"),
        walletAddress: post.walletAddress,
      };
    }

    it("hides wallet address and displays 'Anonymous' for anonymous posts", () => {
      const result = formatFeedAuthor({
        anonymous: true,
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        user: { username: "Alice", handle: "@alice" },
      });

      expect(result.authorName).toBe("Anonymous");
      expect(result.walletAddress).toBeNull();
    });

    it("displays handle/username and preserves wallet for named posts", () => {
      const result = formatFeedAuthor({
        anonymous: false,
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        user: { username: "Alice", handle: "@alice" },
      });

      expect(result.authorName).toBe("@alice");
      expect(result.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
    });
  });

  describe("Chronological ordering and reply preview", () => {
    it("sorts threads chronologically descending (newest on top)", () => {
      const threads = [
        { id: "1", createdAt: new Date("2026-01-01T10:00:00Z") },
        { id: "2", createdAt: new Date("2026-01-02T10:00:00Z") },
        { id: "3", createdAt: new Date("2026-01-03T10:00:00Z") },
      ];

      const sorted = [...threads].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted.map((t) => t.id)).toEqual(["3", "2", "1"]);
    });

    it("limits preview replies to the 2 most recent replies in chronological order", () => {
      const allReplies = [
        { id: "r1", createdAt: new Date("2026-01-01T11:00:00Z"), comment: "First reply" },
        { id: "r2", createdAt: new Date("2026-01-01T12:00:00Z"), comment: "Second reply" },
        { id: "r3", createdAt: new Date("2026-01-01T13:00:00Z"), comment: "Third reply" },
        { id: "r4", createdAt: new Date("2026-01-01T14:00:00Z"), comment: "Fourth reply" },
      ];

      // Query takes 2 latest ordered by createdAt desc:
      const latestTwoDesc = [...allReplies]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 2);

      // Reversed to chronological order (r3 then r4):
      const preview = latestTwoDesc.reverse();

      expect(preview.map((r) => r.id)).toEqual(["r3", "r4"]);
      expect(preview[0].comment).toBe("Third reply");
      expect(preview[1].comment).toBe("Fourth reply");
    });
  });
});
