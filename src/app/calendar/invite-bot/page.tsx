"use client";

import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, CheckCircle } from "lucide-react";

export default function InviteBotPage() {
  const [botInviteUrl, setBotInviteUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch the bot client ID from the API
    fetch('/api/discord/bot-info')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          // Generate OAuth2 URL with minimal permissions
          // Permissions needed: View Channels (1024) + Read Messages/View Channels (68608)
          const permissions = "68608"; // Read messages and view channels
          const url = `https://discord.com/api/oauth2/authorize?client_id=${data.clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
          setBotInviteUrl(url);
        }
      })
      .catch(err => console.error("Error fetching bot info:", err));
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(botInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto pt-5 px-4 md:px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-16">
        <h1 className="text-2xl md:text-4xl font-bold mb-8">
          Invite Telescope Bot
        </h1>

        <Card className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">What does the Telescope Bot do?</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Reads Discord scheduled events from your servers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Displays events on Telescope Calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Only requires read permissions - no admin access needed</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">How to Invite the Bot</h2>
            <ol className="space-y-3 text-muted-foreground mb-6">
              <li className="flex gap-3">
                <span className="font-bold text-foreground">1.</span>
                <span>Click the "Invite Bot" button below or copy the invite link</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-foreground">2.</span>
                <span>Select the Discord server(s) you want to add the bot to</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-foreground">3.</span>
                <span>Authorize the bot (it only needs read permissions)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-foreground">4.</span>
                <span>Go back to the Calendar page to see your Discord events!</span>
              </li>
            </ol>

            {botInviteUrl ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open(botInviteUrl, '_blank')}
                    className="flex-1"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Invite Bot to Your Servers
                  </Button>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="sm:w-auto"
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View full invite URL
                  </summary>
                  <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg break-all font-mono text-xs">
                    {botInviteUrl}
                  </div>
                </details>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading bot invite link...</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">Need help?</h3>
            <p className="text-sm text-muted-foreground">
              If you're a server admin, you can invite the bot to your server.
              If you're not an admin, ask a server moderator to use this invite link to add the bot.
              Once the bot is in servers you're a member of, you'll see their events on your calendar.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
