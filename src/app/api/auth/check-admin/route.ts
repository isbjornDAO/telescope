import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { isAdmin: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    console.log("🔒 Admin check for user:", {
      walletAddress,
      hasUser: !!user,
      discordId: user?.discordId,
    });

    if (!user?.discordId) {
      return NextResponse.json(
        { isAdmin: false, error: "No Discord account connected" },
        { status: 200 }
      );
    }

    // Check if user is admin
    const adminStatus = isAdmin(user.discordId);
    console.log("🔒 Admin status:", { discordId: user.discordId, isAdmin: adminStatus });

    return NextResponse.json({ 
      isAdmin: adminStatus,
      discordId: user.discordId 
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Failed to check admin status" },
      { status: 500 }
    );
  }
} 