import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // First, clean up stale activity
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.user.updateMany({
      where: {
        lastActive: {
          lt: fiveMinutesAgo
        }
      },
      data: {
        lastActive: null
      }
    });

    // Count users active in the last 5 minutes
    const activeCount = await prisma.user.count({
      where: {
        lastActive: {
          gte: fiveMinutesAgo
        }
      }
    });

    return NextResponse.json({ activeCount });
  } catch (error) {
    console.error("Error fetching active users:", error);
    return NextResponse.json(
      { error: "Failed to fetch active users" },
      { status: 500 }
    );
  }
}

