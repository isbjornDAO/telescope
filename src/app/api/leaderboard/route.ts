import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// GET /api/leaderboard - Fetch top users by XP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const topUsers = await prisma.user.findMany({
      orderBy: {
        xp: 'desc', // Sort by permanent XP (for ranking/prestige)
      },
      take: limit,
      select: {
        id: true,
        address: true,
        username: true,
        xp: true,
        coins: true,
        level: true,
        discordId: true,
      },
    });

    return NextResponse.json(topUsers);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
