import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch trending threads with posts in one query - exclude deleted threads
    const threads = await prisma.thread.findMany({
      where: {
        NOT: {
          deleted: true
        }
      },
      take: 10,
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
            imageHash: true
          }
        },
        board: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedThreads = threads.map(thread => ({
      id: thread.id,
      subject: thread.subject,
      bumpedAt: thread.bumpedAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      replyCount: thread.replyCount,
      boardName: thread.board.name,
      posts: thread.posts
    }));

    return NextResponse.json(formattedThreads);
  } catch (error) {
    console.error("Error fetching trending threads:", error);
    return NextResponse.json({ error: "Failed to fetch trending threads" }, { status: 500 });
  }
}

