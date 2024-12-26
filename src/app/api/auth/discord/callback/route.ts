import { NextRequest } from "next/server";
import { verifyMessage } from "viem";
import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/route";

export async function GET(req: NextRequest) {
  console.log("\n=== DISCORD CALLBACK API ROUTE ===");
  console.log("📍 Route: /api/auth/discord/callback [GET]");
  console.log("⏰ Timestamp:", new Date().toISOString());
  
  try {
    console.log("🔵 Starting Discord callback process...");
    
    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state");
    console.log("🔍 URL Parameters:", {
      hasState: !!state,
      stateLength: state?.length,
      rawUrl: req.url,
      timestamp: new Date().toISOString()
    });

    if (!state) {
      console.error("❌ Missing state parameter");
      return new Response("Missing state parameter", { status: 400 });
    }

    // Parse the state to get signature, address, and message
    const { signature, address, message } = JSON.parse(state);
    console.log("📝 Parsed state data:", {
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
      return new Response("Invalid signature", { status: 400 });
    }
    console.log("✅ Signature verified successfully");

    // Get the Discord user ID from the session
    const session = await getServerSession(authOptions);
    console.log("🎮 Session data:", {
      hasSession: !!session,
      discordId: session?.discordUser?.id,
      discordUsername: session?.discordUser?.username
    });

    const discordId = session?.discordUser?.id;

    if (!discordId) {
      console.error("❌ No Discord ID found in session");
      return new Response("No Discord ID found in session", { status: 400 });
    }

    console.log("✅ Discord authentication successful:", {
      walletAddress: address,
      discordId: discordId
    });

    return new Response("Discord authentication successful", { status: 200 });
  } catch (error) {
    console.error("\n❌ ERROR IN DISCORD CALLBACK API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
} 