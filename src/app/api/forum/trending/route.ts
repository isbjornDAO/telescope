import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { viewerFromRequest } from "@/lib/world/viewer";
import { canReadThread } from "@/lib/world/forum-access";
import { describeAudience, isRestricted, parseAudience } from "@/lib/world/audience";

const WANTED = 20;

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

  // Fallback to default Discord embed avatar by discordId
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
    // Over-fetch, because threads this reader may not open are dropped below
    // and the list still needs to fill. Trending crosses every board, so each
    // thread is judged against its own board's policy.
    const threads = await prisma.thread.findMany({
      where: {
        NOT: {
          deleted: true
        }
      },
      take: WANTED * 5,
      orderBy: {
        bumpedAt: 'desc'
      },
      include: {
        posts: {
          take: 1,
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            comment: true,
            imageHash: true,
            walletAddress: true,
            anonymous: true,
            posterId: true
          }
        },
        board: {
          select: {
            name: true,
            audience: true
          }
        }
      }
    });

    const viewer = await viewerFromRequest(request);

    const filteredThreads = threads
      .filter((thread) => canReadThread(thread, thread.board.audience, viewer).allowed)
      .slice(0, WANTED);

    const nonAnonAddresses = Array.from(
      new Set(
        filteredThreads
          .flatMap((t) => t.posts)
          .filter((p) => !p.anonymous && p.walletAddress)
          .flatMap((p) => [
            p.walletAddress as string,
            (p.walletAddress as string).toLowerCase(),
          ])
      )
    );

    const users = nonAnonAddresses.length > 0
      ? await prisma.user.findMany({
          where: { address: { in: nonAnonAddresses } },
          select: { address: true, username: true, handle: true, discordId: true }
        })
      : [];

    const userByAddress = new Map<string, (typeof users)[0]>();
    for (const u of users) {
      userByAddress.set(u.address.toLowerCase(), u);
    }

    // Pre-fetch Discord avatars for all unique discordIds
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

    const formattedThreads = filteredThreads.map(thread => {
      const audience = parseAudience(thread.audience);
      const posts = thread.posts.map(p => {
        const user = (!p.anonymous && p.walletAddress)
          ? userByAddress.get(p.walletAddress.toLowerCase())
          : null;
        const discordAvatar = user?.discordId
          ? discordAvatars.get(user.discordId) || null
          : null;
        return {
          ...p,
          authorName: p.anonymous
            ? "Anonymous"
            : user?.handle || user?.username || (p.walletAddress ? `${p.walletAddress.slice(0, 6)}...` : "Anonymous"),
          authorAvatar: discordAvatar,
          user: user
            ? {
                username: user.username,
                handle: user.handle,
                discordAvatar,
              }
            : undefined,
        };
      });

      return {
        id: thread.id,
        subject: thread.subject,
        bumpedAt: thread.bumpedAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
        replyCount: thread.replyCount,
        boardName: thread.board.name,
        posts,
        audienceLabel: describeAudience(audience),
        restricted: isRestricted(audience)
      };
    });

    const cacheControl = viewer.address
      ? "private, no-cache"
      : "public, s-maxage=15, stale-while-revalidate=45";

    return NextResponse.json(formattedThreads, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Error fetching trending threads:", error);
    return NextResponse.json({ error: "Failed to fetch trending threads" }, { status: 500 });
  }
}

