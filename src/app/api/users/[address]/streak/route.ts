import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { address: params.address },
      include: {
        votes: {
          orderBy: { votedDate: "desc" },
          take: 30, // Get last 30 days of votes
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          currentStreak: 0,
          longestStreak: 0,
          lastVoteDate: null,
        },
        { status: 200 }
      );
    }

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = user.streak || 0;
    const now = new Date();
    const yesterday = new Date(now.setDate(now.getDate() - 1));

    // Sort votes by date
    const sortedVotes = user.votes.sort(
      (a, b) => b.votedDate.getTime() - a.votedDate.getTime()
    );

    // Calculate current streak
    if (sortedVotes.length > 0) {
      let lastVoteDate = sortedVotes[0].votedDate;
      currentStreak = 1;

      for (let i = 1; i < sortedVotes.length; i++) {
        const currentVoteDate = sortedVotes[i].votedDate;
        const dayDifference = Math.floor(
          (lastVoteDate.getTime() - currentVoteDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (dayDifference === 1) {
          currentStreak++;
          lastVoteDate = currentVoteDate;
        } else {
          break;
        }
      }

      // Update longest streak if current streak is longer
      if (currentStreak > longestStreak) {
        await prisma.user.update({
          where: { id: user.id },
          data: { longestStreak: currentStreak },
        });
        longestStreak = currentStreak;
      }
    }

    return NextResponse.json(
      {
        currentStreak,
        longestStreak,
        lastVoteDate: sortedVotes[0]?.votedDate || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch streak data:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak data" },
      { status: 500 }
    );
  }
}
