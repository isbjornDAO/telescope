import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";
import { requirePlatformAdmin } from "@/lib/world/session";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// GET /api/admin/claims - Fetch all claims for admin
export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const claims = await prisma.claim.findMany({
      orderBy: {
        claimedAt: 'desc',
      },
      include: {
        user: {
          select: {
            address: true,
            username: true,
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
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
