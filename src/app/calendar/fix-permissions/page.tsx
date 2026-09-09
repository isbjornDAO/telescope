"use client";

import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";

export default function FixPermissionsPage() {
  const [botInviteUrl, setBotInviteUrl] = useState<string>("");

  useEffect(() => {
    // Fetch the bot client ID
    fetch('/api/discord/bot-info')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          // Permission bits needed:
          // 1024 = View Channels
          // 68608 = View Channels + Read Message History
          // For events specifically, we don't need special perms beyond View Channels
          // The issue might be intent-based, not permission-based
          const permissions = "1024"; // Just View Channels
          const url = `https://discord.com/api/oauth2/authorize?client_id=${data.clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
          setBotInviteUrl(url);
        }
      })
      .catch(err => console.error("Error fetching bot info:", err));
  }, []);

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto pt-5 px-4 md:px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-16">
        <h1 className="text-2xl md:text-4xl font-bold mb-8 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          Fix Bot Permissions
        </h1>

        <Card className="p-6 md:p-8 space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Bot Can't Read Events
            </h2>
            <p className="text-sm text-muted-foreground">
              The bot is in your Discord servers but can't read scheduled events. This is likely because:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">1.</span>
                <span>The bot token needs to have the correct <strong>Gateway Intents</strong> enabled in Discord Developer Portal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">2.</span>
                <span>The bot needs <strong>View Channels</strong> permission in the servers</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Fix #1: Enable Gateway Intents</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Go to Discord Developer Portal and enable the required intents:
            </p>
            <ol className="space-y-3 text-sm mb-4">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <div>
                  <span>Go to </span>
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline inline-flex items-center gap-1"
                  >
                    Discord Developer Portal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>Select your <strong>Telescope</strong> application</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>Go to <strong>Bot</strong> section in the left sidebar</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>Scroll down to <strong>"Privileged Gateway Intents"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">5.</span>
                <div>
                  <span>Enable these intents:</span>
                  <ul className="mt-2 ml-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span><strong>GUILD_MEMBERS</strong> - Allows reading server member info</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span><strong>GUILD_SCHEDULED_EVENTS</strong> - Not in privileged intents but enabled by default</span>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">6.</span>
                <span>Click <strong>"Save Changes"</strong></span>
              </li>
            </ol>
            <Button
              onClick={() => window.open('https://discord.com/developers/applications', '_blank')}
              variant="default"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Discord Developer Portal
            </Button>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">Fix #2: Re-invite Bot (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              If the intents don't work, try kicking and re-inviting the bot with updated permissions:
            </p>
            {botInviteUrl && (
              <Button
                onClick={() => window.open(botInviteUrl, '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Re-invite Bot with Correct Permissions
              </Button>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">After Fixing</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                After enabling the intents and/or re-inviting the bot:
              </p>
              <ol className="space-y-2 text-sm">
                <li>1. Wait 1-2 minutes for changes to take effect</li>
                <li>2. Restart your development server</li>
                <li>3. Check the <a href="/calendar/debug" className="text-blue-500 hover:underline">debug page</a> to see if events appear</li>
                <li>4. Visit the <a href="/calendar" className="text-blue-500 hover:underline">calendar</a> to see your Discord events!</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
