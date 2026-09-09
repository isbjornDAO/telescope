import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Fetch user's forum posts with thread and board information
    const posts = await prisma.post.findMany({
      where: { walletAddress: address },
      include: {
        thread: {
          include: {
            board: {
              select: {
                name: true,
                title: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to most recent 50 posts
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      comment: post.comment,
      threadId: post.threadId,
      threadSubject: post.thread.subject,
      boardName: post.thread.board.name,
      boardTitle: post.thread.board.title,
      isOp: post.isOp,
      createdAt: post.createdAt,
      imageHash: post.imageHash,
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("Failed to fetch forum posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum posts" },
      { status: 500 }
    );
  }
}
