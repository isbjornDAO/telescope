import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { awardPostXP } from "@/lib/xp-system";
import { notifyNewThread } from "@/lib/discord/notify";
import { viewerFromRequest } from "@/lib/world/viewer";
import { audienceFromBody, readableThreads } from "@/lib/world/forum-access";
import { serializeAudience } from "@/lib/world/audience";

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
  { params }: { params: { boardName: string } }
) {
  try {
    const { boardName } = params;

    const board = await prisma.board.findUnique({
      where: { name: boardName }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    const threads = await prisma.thread.findMany({
      where: {
        boardId: board.id,
        NOT: {
          deleted: true
        }
      },
      include: {
        posts: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Get only the first post (OP)
        }
      },
      orderBy: { bumpedAt: 'desc' },
      take: 150 // Max 150 threads per board
    });

    // Threads this reader cannot open never reach the client. The filter
    // runs here and nowhere else — see lib/world/forum-access.ts.
    const viewer = await viewerFromRequest(request);
    const visible = readableThreads(threads, board.audience, viewer);

    return NextResponse.json(visible);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { boardName: string } }
) {
  try {
    const { boardName } = params;
    const body = await request.json();
    const { comment, imageHash, walletAddress, subject, anonymous } = body;
    // The author's choice of audience, re-parsed from the untrusted body.
    const audience = audienceFromBody(body);

    if (!comment || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const board = await prisma.board.findUnique({
      where: { name: boardName }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    const posterId = generatePosterId(walletAddress, boardName);

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { address: walletAddress },
      create: { address: walletAddress },
      update: {},
      select: { username: true }
    });

    // Check and award XP BEFORE creating the post
    const xpResult = await awardPostXP(walletAddress);

    // Create thread and first post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if board is at max threads (90) - only count non-deleted threads
      const threadCount = await tx.thread.count({
        where: {
          boardId: board.id,
          NOT: {
            deleted: true
          }
        }
      });

      // If at max, soft delete the oldest (least recently bumped) thread
      if (threadCount >= 90) {
        const oldestThread = await tx.thread.findFirst({
          where: {
            boardId: board.id,
            NOT: {
              deleted: true
            }
          },
          orderBy: { bumpedAt: 'asc' }
        });

        if (oldestThread) {
          // Soft delete the thread instead of hard deleting
          await tx.thread.update({
            where: { id: oldestThread.id },
            data: {
              deleted: true,
              deletedAt: new Date()
            }
          });
        }
      }

      const thread = await tx.thread.create({
        data: {
          boardId: board.id,
          subject: subject || null,
          bumpedAt: new Date(),
          replyCount: 0,
          audience: serializeAudience(audience) as never,
          ownerAddress: walletAddress
        }
      });

      const post = await tx.post.create({
        data: {
          threadId: thread.id,
          comment,
          imageHash: imageHash || null,
          walletAddress,
          posterId,
          isOp: true,
          anonymous: anonymous !== undefined ? anonymous : true
        }
      });

      // Increment all-time thread count for unlock tracking
      await tx.board.update({
        where: { id: board.id },
        data: { totalThreadsCreated: { increment: 1 } }
      });

      return { thread, post };
    });

    // Send Discord notification (async, don't wait)
    notifyNewThread({
      title: subject || 'Untitled Thread',
      boardName: board.name,
      username: user.username || undefined,
      anonymous: anonymous !== undefined ? anonymous : true,
      preview: comment,
      threadId: result.thread.id,
      imageUrl: imageHash || null,
    }).catch(err => console.error('Discord notification error:', err));

    return NextResponse.json({
      success: true,
      threadId: result.thread.id,
      imageUrl: imageHash || null,
      postId: result.post.id,
      xpAwarded: xpResult.xpAwarded,
      newXp: xpResult.newXp,
      newLevel: xpResult.newLevel
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
