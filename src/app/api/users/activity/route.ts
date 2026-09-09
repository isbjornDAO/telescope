import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { address, clear } = await request.json();
    
    if (!address) {
      return NextResponse.json(
        { error: "Address required" },
        { status: 400 }
      );
    }

    // If clear flag is set, just clear this user's activity
    if (clear) {
      await prisma.user.updateMany({
        where: { address },
        data: { lastActive: null }
      });
      return NextResponse.json({ success: true });
    }

    // Update or create user with lastActive timestamp
    await prisma.user.upsert({
      where: { address },
      create: {
        address,
        lastActive: new Date()
      },
      update: {
        lastActive: new Date()
      }
    });

    // Also clean up old activity (remove users inactive for >15 minutes to keep counts accurate)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.user.updateMany({
      where: {
        lastActive: {
          lt: fifteenMinutesAgo
        }
      },
      data: {
        lastActive: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

