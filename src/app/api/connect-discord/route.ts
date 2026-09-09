import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMessage } from "viem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("\n=== DISCORD CONNECT API ROUTE ===");
  console.log("📍 Route: /api/connect-discord [POST]");
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  try {
    console.log("🔵 Starting Discord connection process...");
    
    // Get the current session to access Discord user ID
    const session = await getServerSession(authOptions);
    console.log("🎮 Session data:", {
      hasSession: !!session,
      discordId: session?.discordUser?.id,
      discordUsername: session?.discordUser?.username,
      timestamp: new Date().toISOString()
    });

    const discordId = session?.discordUser?.id;
    const username = session?.discordUser?.username;

    if (!discordId) {
      console.error("❌ No Discord ID found in session");
      return NextResponse.json(
        { error: "No Discord ID found in session" },
        { status: 400 }
      );
    }

    // Check if Discord ID is already linked to another wallet
    const existingUser = await prisma.user.findFirst({
      where: { discordId },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "This Discord account is already connected to another wallet",
          connectedWallet: existingUser.address 
        },
        { status: 400 }
      );
    }

    const { signature, address, message } = await req.json();
    console.log("📝 Received connection request:", {
      walletAddress: address,
      messageLength: message.length,
      signatureLength: signature.length
    });

    // Verify the signature
    console.log("🔐 Verifying wallet signature...");
    const isValid = await verifyMessage({
      address,
      message,
      signature,
    });

    if (!isValid) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.log("✅ Signature verified successfully");

    // Update the user record
    console.log("💾 Updating user record in database...", {
      walletAddress: address,
      discordId: discordId
    });

    // Add more detailed logging for the database operation
    console.log("💾 Starting database upsert operation...");
    const user = await prisma.user.upsert({
      where: { address },
      create: {
        address,
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        discordId,
        username,
      },
      update: {
        discordId,
        username,
      },
    });
    console.log("✅ Database operation completed:", {
      userId: user.id,
      address: user.address,
      discordId: user.discordId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      user,
      message: "Discord account connected successfully" 
    });
  } catch (error) {
    console.error("\n❌ ERROR IN DISCORD CONNECT API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
} 