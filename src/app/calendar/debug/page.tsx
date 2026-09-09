"use client";

import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discord/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Error fetching debug info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full max-w-screen-lg mx-auto pt-5 px-4 md:px-8 relative z-10 mb-4">
          <PageNavigation />
        </div>
        <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-16">
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading debug information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto pt-5 px-4 md:px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-4xl font-bold">
            Discord Bot Debug Info
          </h1>
          <Button onClick={fetchDebugInfo} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          {/* Bot Status */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Bot Configuration</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {debugInfo?.botTokenConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Bot Token: {debugInfo?.botTokenConfigured ? 'Configured' : 'Missing'}</span>
              </div>
              {debugInfo?.botTokenConfigured && (
                <div className="text-sm text-muted-foreground ml-7">
                  Token length: {debugInfo?.botTokenLength} characters
                </div>
              )}
            </div>
          </Card>

          {/* Guilds */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              Bot Servers ({debugInfo?.totalGuilds || 0})
            </h2>

            {debugInfo?.errors?.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Errors:</h3>
                <div className="space-y-2">
                  {debugInfo.errors.map((error: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="font-semibold">{error.type}</div>
                      <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo?.guilds && debugInfo.guilds.length > 0 ? (
              <div className="space-y-4">
                {debugInfo.guilds.map((guild: any) => (
                  <div key={guild.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {guild.icon && (
                          <img
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                            alt={guild.name}
                            className="w-10 h-10 rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{guild.name}</h3>
                          <p className="text-xs text-muted-foreground">ID: {guild.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {guild.eventsCount > 0 ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">{guild.eventsCount} event{guild.eventsCount !== 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">No events</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {guild.eventsError && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                        <strong>Error fetching events:</strong> {guild.eventsError}
                      </div>
                    )}

                    {guild.events && guild.events.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-semibold">Events:</h4>
                        {guild.events.map((event: any) => (
                          <div key={event.id} className="pl-4 border-l-2 border-blue-500 text-sm">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.scheduledStartTime).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {event.status === 1 ? 'Scheduled' : event.status === 2 ? 'Active' : event.status === 3 ? 'Completed' : 'Cancelled'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        View raw data
                      </summary>
                      <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto">
                        {JSON.stringify(guild, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Bot is not in any servers yet
              </p>
            )}
          </Card>

          {/* Raw Debug Data */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Raw Debug Data</h2>
            <pre className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
