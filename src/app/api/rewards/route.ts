import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// GET /api/rewards - Fetch all active rewards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    const rewards = await prisma.reward.findMany({
      where: {
        active: true,
      },
      orderBy: {
        xpRequired: 'asc',
      },
      include: {
        claims: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    // Get user if wallet address provided
    let user = null;
    if (walletAddress) {
      user = await prisma.user.findUnique({
        where: { address: walletAddress },
        select: { id: true },
      });
    }

    // Transform to include available count and claimed status
    const rewardsWithAvailability = rewards.map((reward) => {
      const hasClaimed = user
        ? reward.claims.some(claim => claim.userId === user.id)
        : false;

      return {
        ...reward,
        available: reward.totalAvailable - reward.claimed,
        claimCount: reward.claims.length,
        hasClaimed,
      };
    });

    return NextResponse.json(rewardsWithAvailability);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}
