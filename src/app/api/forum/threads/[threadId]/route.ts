import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { awardPostXP } from "@/lib/xp-system";
import { notifyNewReply } from "@/lib/discord/notify";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// Generate unique poster ID (same wallet = same ID per board)
function generatePosterId(walletAddress: string, boardName: string): string {
  const hash = createHash("md5")
    .update(walletAddress + boardName + process.env.POSTER_SALT || "telescope-salt")
    .digest("hex");
  return hash.substring(0, 8);
}

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: true,
        posts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Enrich posts with user data
    const postsWithUserData = await Promise.all(
      thread.posts.map(async (post) => {
        const user = await prisma.user.findUnique({
          where: { address: post.walletAddress },
          select: { createdAt: true, discordId: true, username: true }
        });

        const postCount = await prisma.post.count({
          where: { walletAddress: post.walletAddress }
        });

        // Fetch Discord data if discordId exists
        let discordAvatar = null;
        let discordUsername = user?.username; // Start with DB username
        if (user?.discordId) {
          try {
            const discordResponse = await fetch(`https://discord.com/api/v10/users/${user.discordId}`, {
              headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
              }
            });
            if (discordResponse.ok) {
              const discordData = await discordResponse.json();
              if (discordData.avatar) {
                discordAvatar = `https://cdn.discordapp.com/avatars/${user.discordId}/${discordData.avatar}.png`;
              }
              // Get username from Discord if not in DB
              if (!discordUsername && discordData.username) {
                discordUsername = discordData.username;
              }
            }
          } catch (error) {
            console.error("Error fetching Discord data:", error);
          }
        }

        return {
          ...post,
          user: user ? {
            createdAt: user.createdAt,
            postCount,
            discordId: user.discordId,
            username: discordUsername,
            discordAvatar
          } : undefined
        };
      })
    );

    return NextResponse.json({
      ...thread,
      posts: postsWithUserData
    });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const { comment, imageHash, walletAddress, boardName, anonymous } = await request.json();

    if (!comment || !walletAddress || !boardName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        posts: {
          where: { isOp: true },
          take: 1
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    const posterId = generatePosterId(walletAddress, boardName);
    
    // Check if this wallet is the OP
    const isOpPost = thread.posts.length > 0 && thread.posts[0].walletAddress === walletAddress;

    // Ensure user exists
    await prisma.user.upsert({
      where: { address: walletAddress },
      create: { address: walletAddress },
      update: {}
    });

    // Check and award XP BEFORE creating the post
    const xpResult = await awardPostXP(walletAddress);

    // Create post and update thread in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          threadId: thread.id,
          comment,
          imageHash: imageHash || null,
          walletAddress,
          posterId,
          isOp: isOpPost,
          anonymous: anonymous !== undefined ? anonymous : true
        }
      });

      // Update thread bump time and reply count (only increment for actual replies, not OP)
      const updatedThread = await tx.thread.update({
        where: { id: threadId },
        data: {
          bumpedAt: new Date(),
          ...(isOpPost ? {} : { replyCount: { increment: 1 } })
        }
      });

      return { post, thread: updatedThread };
    });


    // Get user data for notification
    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
      select: { username: true }
    });

    // Send Discord notification (async, don't wait) - only for actual replies, not OP edits
    if (!isOpPost) {
      notifyNewReply({
        threadTitle: result.thread.subject || 'Untitled Thread',
        threadId: result.thread.id,
        boardName: boardName,
        username: user?.username || undefined,
        anonymous: anonymous !== undefined ? anonymous : true,
        preview: comment,
        imageUrl: imageHash || null,
      }).catch(err => console.error('Discord notification error:', err));
    }

    return NextResponse.json({
      success: true,
      postId: result.post.id,
      xpAwarded: xpResult.xpAwarded,
      newXp: xpResult.newXp,
      newLevel: xpResult.newLevel
    });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
