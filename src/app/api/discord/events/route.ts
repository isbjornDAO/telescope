import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/env";

const DISCORD_API_URL = "https://discord.com/api/v10";

// In-memory cache
let cachedEvents: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordScheduledEvent {
  id: string;
  guild_id: string;
  channel_id: string | null;
  creator_id: string;
  name: string;
  description: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  privacy_level: number;
  status: number;
  entity_type: number;
  entity_id: string | null;
  entity_metadata: {
    location?: string;
  } | null;
  creator?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  user_count?: number;
  image?: string | null;
}

export async function GET() {
  console.log("\n=== DISCORD EVENTS API ROUTE ===");
  console.log("📍 Route: /api/discord/events [GET]");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    // Check cache first
    const now = Date.now();
    if (cachedEvents && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("✅ Returning cached events (age: " + Math.round((now - cacheTimestamp) / 1000) + "s)");
      return NextResponse.json(cachedEvents);
    }
    console.log("🔄 Cache miss or expired, fetching fresh data...");
    // Get the current session (optional for this endpoint now)
    const session = await getServerSession(authOptions);
    console.log("🎮 Session data:", {
      hasSession: !!session,
      userId: session?.user?.id,
    });

    // Fetch ALL guilds where the bot is present
    console.log("🤖 Fetching all bot guilds...");
    const botGuildsResponse = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (!botGuildsResponse.ok) {
      console.error("❌ Failed to fetch bot guilds:", botGuildsResponse.status);
      return NextResponse.json(
        { error: "Failed to fetch bot guilds" },
        { status: botGuildsResponse.status }
      );
    }

    const botGuilds: DiscordGuild[] = await botGuildsResponse.json();
    console.log(`🤖 Bot is in ${botGuilds.length} guilds`);

    // Fetch events from ALL guilds where the bot is present
    // Add delay helper to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const allEvents: Array<DiscordScheduledEvent & { guildName: string; guildIcon: string | null }> = [];

    for (let i = 0; i < botGuilds.length; i++) {
      const guild = botGuilds[i];

      try {
        console.log(`📅 Fetching events from ${guild.name}...`);
        const eventsResponse = await fetch(
          `${DISCORD_API_URL}/guilds/${guild.id}/scheduled-events?with_user_count=true`,
          {
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (eventsResponse.ok) {
          const guildEvents: DiscordScheduledEvent[] = await eventsResponse.json();
          console.log(`✅ Found ${guildEvents.length} events in ${guild.name}`);

          // Add guild info to each event
          allEvents.push(
            ...guildEvents.map(event => ({
              ...event,
              guildName: guild.name,
              guildIcon: guild.icon,
            }))
          );
        } else if (eventsResponse.status === 429) {
          // Rate limited - get retry after time
          const retryAfter = eventsResponse.headers.get('Retry-After');
          const waitTime = retryAfter ? parseFloat(retryAfter) * 1000 : 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms...`);
          await delay(waitTime);
          // Retry this guild
          i--;
          continue;
        }

        // Add a small delay between requests to avoid rate limiting
        if (i < botGuilds.length - 1) {
          await delay(500); // 500ms delay between guilds
        }
      } catch (error) {
        console.error(`❌ Error fetching events from ${guild.name}:`, error);
      }
    }

    console.log(`✅ Total events found: ${allEvents.length}`);

    // Fetch invite links for each guild (with rate limit handling)
    const guildInvites = new Map<string, string>();
    for (let i = 0; i < botGuilds.length; i++) {
      const guild = botGuilds[i];

      try {
        // Try to get guild invites
        const invitesResponse = await fetch(
          `${DISCORD_API_URL}/guilds/${guild.id}/invites`,
          {
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (invitesResponse.ok) {
          const invites: any[] = await invitesResponse.json();
          if (invites.length > 0) {
            // Use the first permanent invite, or any invite
            const permanentInvite = invites.find(inv => inv.max_age === 0) || invites[0];
            guildInvites.set(guild.id, `https://discord.gg/${permanentInvite.code}`);
          }
        } else if (invitesResponse.status === 429) {
          // Rate limited
          const retryAfter = invitesResponse.headers.get('Retry-After');
          const waitTime = retryAfter ? parseFloat(retryAfter) * 1000 : 1000;
          console.log(`⏳ Rate limited on invites, waiting ${waitTime}ms...`);
          await delay(waitTime);
          i--;
          continue;
        }

        // Add delay between invite requests
        if (i < botGuilds.length - 1) {
          await delay(300);
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch invites for ${guild.name}`);
      }
    }

    // Transform to frontend-friendly format
    const transformedEvents = allEvents.map(event => {
      const guildIconUrl = event.guildIcon
        ? `https://cdn.discordapp.com/icons/${event.guild_id}/${event.guildIcon}.png`
        : null;

      return {
        id: event.id,
        name: event.name,
        description: event.description || "",
        scheduledStartTime: event.scheduled_start_time,
        scheduledEndTime: event.scheduled_end_time,
        guildId: event.guild_id,
        guildName: event.guildName,
        guildIcon: guildIconUrl,
        guildInvite: guildInvites.get(event.guild_id),
        creator: event.creator,
        location: event.entity_metadata?.location,
        userCount: event.user_count,
      };
    });

    const response = {
      events: transformedEvents,
      guildsCount: botGuilds.length,
    };

    // Update cache
    cachedEvents = response;
    cacheTimestamp = Date.now();
    console.log("💾 Events cached successfully");

    return NextResponse.json(response);

  } catch (error) {
    console.error("\n❌ ERROR IN DISCORD EVENTS API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
