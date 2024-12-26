import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = addressSchema.parse(params.address);

    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        votes: {
          include: {
            project: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            votedDate: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ 
        votes: [],
        currentStreak: 0,
        longestStreak: 0
      }, { status: 200 });
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const sortedVotes = user.votes.sort(
      (a, b) => b.votedDate.getTime() - a.votedDate.getTime()
    );

    if (sortedVotes.length > 0) {
      let lastVoteDate = new Date(sortedVotes[0].votedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastVoteDate.setHours(0, 0, 0, 0);

      // Check if the streak is still active (voted today or yesterday)
      const daysSinceLastVote = Math.floor(
        (today.getTime() - lastVoteDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastVote <= 1) {
        currentStreak = 1;
        tempStreak = 1;

        // Calculate consecutive days
        for (let i = 1; i < sortedVotes.length; i++) {
          const currentVoteDate = new Date(sortedVotes[i].votedDate);
          currentVoteDate.setHours(0, 0, 0, 0);
          
          const dayDifference = Math.floor(
            (lastVoteDate.getTime() - currentVoteDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          );

          if (dayDifference === 1) {
            currentStreak++;
            tempStreak++;
            lastVoteDate = currentVoteDate;
          } else {
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
            lastVoteDate = currentVoteDate;
          }
        }
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    const voteHistory = user.votes.map((vote) => ({
      projectId: vote.projectId,
      projectName: vote.project.name,
      votedDate: vote.votedDate.toISOString(),
    }));

    return NextResponse.json({
      votes: voteHistory,
      currentStreak,
      longestStreak,
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
