import { env } from "@/env";
import { NextRequest, NextResponse } from "next/server";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  avatar_url: string;
  banner: string | null;
  banner_url: string | null;
  accent_color?: number | null;
  global_name?: string | null;
}

const DISCORD_API_URL = "https://discord.com/api/v10";

function getAvatarUrl(userId: string, avatarId: string | null): string {
  if (!avatarId) {
    const defaultAvatarNumber = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
  }
  const format = avatarId.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${format}`;
}

function getBannerUrl(userId: string, bannerId: string | null): string | null {
  if (!bannerId) return null;
  const format = bannerId.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${userId}/${bannerId}.${format}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing Discord user ID" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${DISCORD_API_URL}/users/${id}`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Discord API Error:", errorData);
      return NextResponse.json(
        { error: `Discord API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: DiscordUser = await response.json();

    // Add formatted URLs to the response
    const enrichedData = {
      ...data,
      avatar_url: getAvatarUrl(data.id, data.avatar),
      banner_url: getBannerUrl(data.id, data.banner),
    };

    return NextResponse.json(enrichedData, { status: 200 });
  } catch (error) {
    console.error("Fetch Discord User Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
