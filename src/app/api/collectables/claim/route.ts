import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { awardCollectableByAddress, hasCollectable } from "@/lib/collectables";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, collectableId } = body;

    if (!walletAddress || !collectableId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: walletAddress.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: walletAddress.toLowerCase(),
          username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        },
      });
    }

    // Find the collectable
    const collectable = await prisma.collectable.findUnique({
      where: { collectableId },
    });

    if (!collectable) {
      return NextResponse.json(
        { error: "Collectable not found" },
        { status: 404 }
      );
    }

    // Check if user already has it
    const alreadyHas = await hasCollectable(user.id, collectableId);
    if (alreadyHas) {
      return NextResponse.json(
        { error: "You already have this collectable" },
        { status: 400 }
      );
    }

    // Award the collectable
    const result = await awardCollectableByAddress(walletAddress, collectableId);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to claim collectable" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collectable: result,
    });
  } catch (error) {
    console.error("Error claiming collectable:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
