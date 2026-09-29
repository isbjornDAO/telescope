import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// POST /api/rewards/claim - Claim a reward
export async function POST(request: NextRequest) {
  try {
    const user = await requireWorldUser(request);
    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find reward
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    // Check if reward is still available
    if (reward.claimed >= reward.totalAvailable) {
      return NextResponse.json(
        { error: "Reward is no longer available" },
        { status: 400 }
      );
    }

    // Check if user has enough coins
    if (user.coins < reward.xpRequired) {
      return NextResponse.json(
        { error: "Insufficient coins" },
        { status: 400 }
      );
    }

    // Check if user already claimed this reward
    const existingClaim = await prisma.claim.findFirst({
      where: {
        userId: user.id,
        rewardId: reward.id,
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already claimed this reward" },
        { status: 400 }
      );
    }

    // Create claim and update user coins in a transaction (XP stays the same!)
    const result = await prisma.$transaction([
      prisma.claim.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          coinsSpent: reward.xpRequired,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          coins: user.coins - reward.xpRequired,
        },
      }),
      prisma.reward.update({
        where: { id: reward.id },
        data: {
          claimed: reward.claimed + 1,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      claim: result[0],
      newCoins: user.coins - reward.xpRequired,
    });
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error claiming reward:", error);
    return NextResponse.json(
      { error: "Failed to claim reward" },
      { status: 500 }
    );
  }
}
