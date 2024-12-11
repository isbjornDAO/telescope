import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      walletAddress: searchParams.get("walletAddress"),
    };

    // Validate query parameters
    const { walletAddress } = querySchema.parse(query);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { hasVoted: false },
        { status: 200 }
      );
    }

    // Check if a vote exists
    const voteExists = await prisma.vote.findUnique({
      where: {
        userId_votedDate: {
          userId: user.id,
          votedDate: new Date(),
        },
      },
    });

    return NextResponse.json(
      { hasVoted: !!voteExists },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 