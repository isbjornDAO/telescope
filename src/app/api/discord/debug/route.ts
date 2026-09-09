import { NextResponse } from "next/server";
import { env } from "@/env";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

const DISCORD_API_URL = "https://discord.com/api/v10";

export async function GET() {
  console.log("\n=== DISCORD DEBUG API ROUTE ===");

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    botTokenConfigured: !!env.DISCORD_BOT_TOKEN,
    botTokenLength: env.DISCORD_BOT_TOKEN?.length || 0,
    guilds: [],
    errors: [],
  };

  try {
    // First, get bot user info
    console.log("🤖 Fetching bot user info...");
    const botUserResponse = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (botUserResponse.ok) {
      debugInfo.botUser = await botUserResponse.json();
    } else {
      debugInfo.botUserError = {
        status: botUserResponse.status,
        error: await botUserResponse.text(),
      };
    }

    // Fetch bot's guilds
    console.log("🤖 Fetching bot guilds...");
    const botGuildsResponse = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
    });

    debugInfo.botGuildsStatus = botGuildsResponse.status;

    if (!botGuildsResponse.ok) {
      const errorData = await botGuildsResponse.text();
      debugInfo.errors.push({
        type: "bot_guilds_fetch_failed",
        status: botGuildsResponse.status,
        error: errorData,
      });
      console.error("❌ Bot guilds fetch failed:", errorData);
    } else {
      const guilds = await botGuildsResponse.json();
      debugInfo.totalGuilds = guilds.length;

      // For each guild, try to fetch events (with rate limit handling)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        const guildInfo: any = {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          eventsCount: 0,
          events: [],
        };

        try {
          const eventsResponse = await fetch(
            `${DISCORD_API_URL}/guilds/${guild.id}/scheduled-events?with_user_count=true`,
            {
              headers: {
                Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
              },
            }
          );

          guildInfo.eventsStatus = eventsResponse.status;
          guildInfo.eventsStatusText = eventsResponse.statusText;

          if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            guildInfo.eventsCount = events.length;
            guildInfo.rawEventsResponse = events; // Include full response for debugging
            guildInfo.events = events.map((e: any) => ({
              id: e.id,
              name: e.name,
              scheduledStartTime: e.scheduled_start_time,
              status: e.status,
              entityType: e.entity_type,
            }));
          } else if (eventsResponse.status === 429) {
            const errorData = await eventsResponse.json();
            guildInfo.eventsError = errorData;
            guildInfo.rateLimited = true;
          } else {
            // Try to parse as JSON first, fallback to text
            try {
              const errorData = await eventsResponse.json();
              guildInfo.eventsError = errorData;
              guildInfo.eventsErrorType = 'json';
            } catch {
              const errorData = await eventsResponse.text();
              guildInfo.eventsError = errorData;
              guildInfo.eventsErrorType = 'text';
            }
          }

          // Add delay between requests to avoid rate limiting
          if (i < guilds.length - 1) {
            await delay(500);
          }
        } catch (error) {
          guildInfo.eventsError = error instanceof Error ? error.message : String(error);
        }

        debugInfo.guilds.push(guildInfo);
      }
    }

  } catch (error) {
    debugInfo.errors.push({
      type: "general_error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
