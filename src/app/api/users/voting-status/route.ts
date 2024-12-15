import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      walletAddress: searchParams.get("walletAddress"),
    };

    const { walletAddress } = querySchema.parse(query);

    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    if (!user) {
      return NextResponse.json({ isLocked: false }, { status: 200 });
    }

    // Check for any votes in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentVote = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        votedDate: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    const nextVoteTime = recentVote 
      ? new Date(recentVote.votedDate.getTime() + 24 * 60 * 60 * 1000)
      : null;

    return NextResponse.json({ 
      isLocked: !!recentVote,
      nextVoteTime: recentVote ? nextVoteTime : null 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
} 