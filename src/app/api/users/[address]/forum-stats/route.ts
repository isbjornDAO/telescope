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

    // Get user info for join date
    const user = await prisma.user.findUnique({
      where: { address },
      select: { createdAt: true },
    });

    // Get total posts count
    const totalPosts = await prisma.post.count({
      where: { walletAddress: address },
    });

    // Get total threads created
    const totalThreads = await prisma.thread.count({
      where: {
        posts: {
          some: {
            walletAddress: address,
            isOp: true,
          }
        }
      },
    });

    // Get total replies (posts that are not OP)
    const totalReplies = await prisma.post.count({
      where: {
        walletAddress: address,
        isOp: false,
      },
    });

    // Get boards posted in with post counts
    const boardsPostedIn = await prisma.post.findMany({
      where: { walletAddress: address },
      select: {
        thread: {
          select: {
            boardId: true,
            board: {
              select: {
                name: true,
                title: true,
              }
            }
          }
        }
      },
    });

    // Count posts per board and sort by activity
    const boardCountMap = new Map<string, { name: string; title: string; count: number }>();

    boardsPostedIn
      .filter(p => p.thread?.board)
      .forEach(p => {
        const boardName = p.thread.board.name;
        if (boardCountMap.has(boardName)) {
          boardCountMap.get(boardName)!.count++;
        } else {
          boardCountMap.set(boardName, {
            name: p.thread.board.name,
            title: p.thread.board.title,
            count: 1,
          });
        }
      });

    const uniqueBoards = Array.from(boardCountMap.values())
      .sort((a, b) => b.count - a.count); // Sort by post count descending

    // Check badge eligibility based on forum post order
    let isSuperOG = false;

    if (totalPosts > 0) {
      // Get the user's first post
      const firstPost = await prisma.post.findFirst({
        where: { walletAddress: address },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });

      if (firstPost) {
        // Count how many unique users posted before this user's first post
        const usersBeforeCount = await prisma.post.groupBy({
          by: ['walletAddress'],
          where: {
            createdAt: {
              lt: firstPost.createdAt
            }
          },
          _count: {
            walletAddress: true
          }
        });

        // Super OG: First 100 users to post on the forum
        if (usersBeforeCount.length < 100) {
          isSuperOG = true;
        }
      }
    }

    // Calculate forum posting streak
    const posts = await prisma.post.findMany({
      where: { walletAddress: address },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    let currentPostStreak = 0;
    let longestPostStreak = 0;

    if (posts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDays = new Set<string>();
      posts.forEach(post => {
        const date = new Date(post.createdAt);
        date.setHours(0, 0, 0, 0);
        uniqueDays.add(date.toISOString().split('T')[0]);
      });

      const sortedDays = Array.from(uniqueDays).sort().reverse();

      // Calculate current streak
      for (let i = 0; i < sortedDays.length; i++) {
        const dayDate = new Date(sortedDays[i]);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (dayDate.getTime() === expectedDate.getTime()) {
          currentPostStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      let tempStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const currentDay = new Date(sortedDays[i]);
        const previousDay = new Date(sortedDays[i - 1]);
        const diffDays = Math.floor((previousDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
          longestPostStreak = Math.max(longestPostStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestPostStreak = Math.max(longestPostStreak, tempStreak, currentPostStreak);
    }

    return NextResponse.json({
      totalPosts,
      totalThreads,
      totalReplies,
      boardsPostedIn: uniqueBoards,
      boardCount: uniqueBoards.length,
      joinedDate: user?.createdAt,
      isSuperOG,
      currentPostStreak,
      longestPostStreak,
    });
  } catch (error) {
    console.error("Failed to fetch forum stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum stats" },
      { status: 500 }
    );
  }
}
