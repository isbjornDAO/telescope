import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateUserByWallet, findUserByWallet } from "@/lib/user";

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
      const existing = await findUserByWallet(address);
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastActive: null }
        });
      }
      return NextResponse.json({ success: true });
    }

    const user = await findOrCreateUserByWallet(address);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
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

