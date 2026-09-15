import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { viewerFromRequest } from "@/lib/world/viewer";
import { canReadThread } from "@/lib/world/forum-access";
import { describeAudience, isRestricted, parseAudience } from "@/lib/world/audience";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// In-memory cache for Discord user avatars (15 min TTL)
const discordAvatarCache = new Map<string, { avatarUrl: string | null; expiresAt: number }>();

async function getDiscordAvatar(discordId: string): Promise<string | null> {
  const cached = discordAvatarCache.get(discordId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.avatarUrl;
  }

  const token = process.env.DISCORD_BOT_TOKEN;

  if (token) {
    try {
      const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
        headers: {
          Authorization: `Bot ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        let avatarUrl: string | null = null;
        if (data.avatar) {
          const format = data.avatar.startsWith("a_") ? "gif" : "png";
          avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.${format}`;
        } else {
          const defaultNumber =
            data.discriminator && data.discriminator !== "0"
              ? parseInt(data.discriminator) % 5
              : Number((BigInt(discordId) >> BigInt(22)) % BigInt(6));
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultNumber}.png`;
        }
        discordAvatarCache.set(discordId, { avatarUrl, expiresAt: now + 15 * 60 * 1000 });
        return avatarUrl;
      }
    } catch (err) {
      console.error(`Error fetching Discord avatar for ${discordId}:`, err);
    }
  }

  try {
    const defaultNumber = Number((BigInt(discordId) >> BigInt(22)) % BigInt(6));
    const fallback = `https://cdn.discordapp.com/embed/avatars/${defaultNumber}.png`;
    discordAvatarCache.set(discordId, { avatarUrl: fallback, expiresAt: now + 5 * 60 * 1000 });
    return fallback;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "8", 10) || 8));
    const boardFilter = searchParams.get("board");

    const whereClause: Record<string, unknown> = {
      NOT: {
        deleted: true,
      },
    };

    if (boardFilter && boardFilter !== "all") {
      whereClause.board = { name: boardFilter };
    }

    const totalThreads = await prisma.thread.count({
      where: whereClause,
    });

    const skip = (page - 1) * limit;

    const threads = await prisma.thread.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        board: {
          select: {
            id: true,
            name: true,
            title: true,
            audience: true,
          },
        },
        posts: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1, // Opening post (OP)
          select: {
            id: true,
            comment: true,
            imageHash: true,
            walletAddress: true,
            anonymous: true,
            posterId: true,
            createdAt: true,
            isOp: true,
          },
        },
      },
    });

    const viewer = await viewerFromRequest(request);

    // Filter threads that this viewer can read
    const visibleThreads = threads.filter(
      (thread) => canReadThread(thread, thread.board.audience, viewer).allowed
    );

    // Fetch preview replies for threads that have replies
    const threadIdsWithReplies = visibleThreads
      .filter((t) => t.replyCount > 0)
      .map((t) => t.id);

    type ReplyPost = {
      id: string;
      threadId: string;
      comment: string;
      imageHash: string | null;
      walletAddress: string;
      anonymous: boolean;
      posterId: string;
      createdAt: Date;
      isOp: boolean;
    };

    const repliesByThread = new Map<string, ReplyPost[]>();

    if (threadIdsWithReplies.length > 0) {
      await Promise.all(
        threadIdsWithReplies.map(async (threadId) => {
          const replies = await prisma.post.findMany({
            where: {
              threadId,
              isOp: false,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 2, // Preview up to 2 most recent replies
            select: {
              id: true,
              threadId: true,
              comment: true,
              imageHash: true,
              walletAddress: true,
              anonymous: true,
              posterId: true,
              createdAt: true,
              isOp: true,
            },
          });
          // Order them chronologically (older reply first, newer second)
          repliesByThread.set(threadId, replies.reverse());
        })
      );
    }

    // Collect all non-anonymous wallet addresses from OP posts and preview replies
    const allPosts = [
      ...visibleThreads.flatMap((t) => t.posts),
      ...Array.from(repliesByThread.values()).flat(),
    ];

    const nonAnonAddresses = Array.from(
      new Set(
        allPosts
          .filter((p) => !p.anonymous && p.walletAddress)
          .flatMap((p) => [
            p.walletAddress as string,
            (p.walletAddress as string).toLowerCase(),
          ])
      )
    );

    const users =
      nonAnonAddresses.length > 0
        ? await prisma.user.findMany({
            where: { address: { in: nonAnonAddresses } },
            select: { address: true, username: true, handle: true, discordId: true },
          })
        : [];

    const userByAddress = new Map<string, (typeof users)[0]>();
    for (const u of users) {
      userByAddress.set(u.address.toLowerCase(), u);
    }

    // Fetch Discord avatars for non-anonymous users
    const uniqueDiscordIds = Array.from(
      new Set(
        users
          .map((u) => u.discordId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const discordAvatars = new Map<string, string | null>();
    await Promise.all(
      uniqueDiscordIds.map(async (dId) => {
        const avatarUrl = await getDiscordAvatar(dId);
        discordAvatars.set(dId, avatarUrl);
      })
    );

    const formatPost = (p: {
      id: string;
      comment: string;
      imageHash: string | null;
      walletAddress: string;
      anonymous: boolean;
      posterId: string;
      createdAt: Date;
      isOp: boolean;
    }) => {
      const user =
        !p.anonymous && p.walletAddress
          ? userByAddress.get(p.walletAddress.toLowerCase())
          : null;
      const discordAvatar = user?.discordId
        ? discordAvatars.get(user.discordId) || null
        : null;

      const authorName = p.anonymous
        ? "Anonymous"
        : user?.handle ||
          user?.username ||
          (p.walletAddress
            ? `${p.walletAddress.slice(0, 6)}...${p.walletAddress.slice(-4)}`
            : "Anonymous");

      return {
        id: p.id,
        comment: p.comment,
        imageHash: p.imageHash,
        walletAddress: p.anonymous ? null : p.walletAddress,
        posterId: p.posterId,
        anonymous: p.anonymous,
        createdAt: p.createdAt.toISOString(),
        isOp: p.isOp,
        authorName,
        authorAvatar: discordAvatar,
        user: user
          ? {
              username: user.username,
              handle: user.handle,
              discordAvatar,
            }
          : undefined,
      };
    };

    const formattedThreads = visibleThreads.map((thread) => {
      const audience = parseAudience(thread.audience);
      const op = thread.posts[0] ? formatPost(thread.posts[0]) : null;
      const replies = (repliesByThread.get(thread.id) || []).map(formatPost);

      return {
        id: thread.id,
        subject: thread.subject,
        bumpedAt: thread.bumpedAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
        replyCount: thread.replyCount,
        board: {
          id: thread.board.id,
          name: thread.board.name,
          title: thread.board.title,
        },
        opPost: op,
        previewReplies: replies,
        audienceLabel: describeAudience(audience),
        restricted: isRestricted(audience),
      };
    });

    const totalPages = Math.max(1, Math.ceil(totalThreads / limit));

    const cacheControl = viewer.address
      ? "private, no-cache"
      : "public, s-maxage=10, stale-while-revalidate=30";

    return NextResponse.json(
      {
        threads: formattedThreads,
        pagination: {
          page,
          limit,
          totalThreads,
          totalPages,
        },
      },
      {
        headers: {
          "Cache-Control": cacheControl,
        },
      }
    );
  } catch (error) {
    console.error("Error fetching forum feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum feed" },
      { status: 500 }
    );
  }
}
