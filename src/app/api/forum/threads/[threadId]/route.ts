import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { awardPostXP } from "@/lib/xp-system";
import { notifyNewReply } from "@/lib/discord/notify";
import { viewerFromRequest } from "@/lib/world/viewer";
import { audienceFromBody, canReadThread, distinctPosterCount, ownerOf, readablePosts } from "@/lib/world/forum-access";
import { describeMissing, isOwner, serializeAudience } from "@/lib/world/audience";

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
  request: NextRequest,
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

    const viewer = await viewerFromRequest(request);
    const verdict = canReadThread(thread, thread.board.audience, viewer);
    if (!verdict.allowed) {
      // 404, not 403: a reader who may not open this thread should not be
      // able to confirm it exists, and the requirement tells them what
      // would open a thread like it without confirming this one does.
      return NextResponse.json({ error: "Thread not found", requirement: describeMissing(verdict.missing) }, { status: 404 });
    }

    const posterCount = distinctPosterCount(thread.posts);

    // Enrich posts with user data.
    //
    // Only for posts whose author chose to be named. An anonymous post used
    // to be shipped with its author's Discord id, username and avatar and
    // hidden in the client, which is not anonymity — it is a payload the
    // browser was asked not to look at. Skipping the lookup also spares an
    // outbound Discord call per anonymous post.
    const postsWithUserData = await Promise.all(
      thread.posts.map(async (post) => {
        if (post.anonymous !== false) return { ...post, user: undefined };

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

    // Withhold the posts inside this thread that the reader may not open,
    // and drop the wallet of every author who asked to stay anonymous.
    const posts = readablePosts(postsWithUserData, thread.board.audience, thread.audience, viewer);
    const { ownerAddress: _owner, ...threadRest } = thread;
    void _owner;

    return NextResponse.json({
      ...threadRest,
      posts,
      posterCount,
      mine: isOwner(viewer, ownerOf(thread))
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
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const body = await request.json();
    const { comment, imageHash, walletAddress, boardName, anonymous } = body;
    const audience = audienceFromBody(body);

    if (!comment || !walletAddress || !boardName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: { select: { audience: true } },
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

    // You cannot write into a thread you may not read. Checked against the
    // session, never against the wallet the body claims to be.
    const viewer = await viewerFromRequest(request);
    if (!canReadThread(thread, thread.board.audience, viewer).allowed) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
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
          anonymous: anonymous !== undefined ? anonymous : true,
          audience: serializeAudience(audience) as never
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
