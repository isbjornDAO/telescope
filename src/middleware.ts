import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdmin } from "@/lib/auth";
import { getWalletAddressCookie } from "@/lib/cookies";
import { NextRequest } from "next/server";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  accent_color: number;
  global_name: string;
}

interface Token {
  discordUser?: DiscordUser;
}

export async function middleware(request: Request) {
  try {
    const token = await getToken({ 
      req: request as NextRequest,
      secret: process.env.NEXTAUTH_SECRET 
    }) as Token | null;

    // Get wallet address from cookie
    const walletAddress = getWalletAddressCookie(request);
    let discordId: string | undefined;
    
    if (walletAddress) {
      try {
        const response = await fetch(`${new URL(request.url).origin}/api/users/${walletAddress}/stats`);
        if (response.ok) {
          const { discordId: userDiscordId } = await response.json();
          discordId = userDiscordId;
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    }

    console.log("🔒 Middleware check:", {
      url: request.url,
      hasToken: !!token,
      walletAddress,
      discordId,
      isAdmin: discordId ? isAdmin(discordId) : false
    });

    const isAdminRoute = request.url.includes("/admin") || request.url.includes("/api/admin");

    if (isAdminRoute) {
      // If we have a Discord ID and can confirm they're not admin, redirect
      if (discordId && !isAdmin(discordId)) {
        console.log("❌ User is not admin, redirecting to home");
        return NextResponse.redirect(new URL("/", request.url));
      }

      // If we don't have a Discord ID yet, let the client-side check handle it
      if (!discordId) {
        console.log("⚠️ No Discord ID yet, letting client handle auth");
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}; 