import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/claims - Fetch all claims for admin
export async function GET(request: NextRequest) {
  try {
    const claims = await prisma.claim.findMany({
      orderBy: {
        claimedAt: 'desc',
      },
      include: {
        user: {
          select: {
            wallets: { select: { address: true }, where: { primary: true }, take: 1 },
            name: true,
        handle: true,
            xp: true,
            coins: true,
            level: true,
            discordId: true,
          },
        },
        reward: {
          select: {
            name: true,
            description: true,
            xpRequired: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
