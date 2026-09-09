"use client";

import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/page-navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, RefreshCw, Calendar, AlertCircle } from "lucide-react";

interface DiscordEvent {
  id: string;
  name: string;
  scheduledStartTime: string;
  guildId: string;
  guildName: string;
  guildIcon: string | null;
}

interface DebugData {
  guildsCount?: number;
  events?: DiscordEvent[];
  error?: string;
  timestamp?: number;
}

export default function DebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching debug data from API...");
      const response = await fetch('/api/discord/events');

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Debug data received:", data);

      setDebugData({
        guildsCount: data.guildsCount,
        events: data.events,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error fetching debug data:", error);
      setDebugData({
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const upcomingEvents = debugData?.events?.filter(
    event => new Date(event.scheduledStartTime) >= new Date()
  ) || [];

  const todaysEvents = upcomingEvents.filter(event => {
    const today = new Date();
    const eventDate = new Date(event.scheduledStartTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  const guildBreakdown = upcomingEvents.reduce((acc: Record<string, number>, event) => {
    acc[event.guildName] = (acc[event.guildName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>

      <div className="w-full max-w-screen-lg mx-auto px-8 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar Debug Info</h1>
            <p className="text-muted-foreground">
              Discord bot status and event information
            </p>
          </div>
          <Button
            onClick={fetchDebugData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading debug data...</span>
            </div>
          </Card>
        ) : debugData?.error ? (
          <Card className="p-8 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-900 dark:text-red-100 mb-2">Error</div>
                <div className="text-red-700 dark:text-red-300 text-sm">{debugData.error}</div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">Discord Servers</div>
                </div>
                <div className="text-3xl font-bold">{debugData?.guildsCount || 0}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
                <div className="text-3xl font-bold">{debugData?.events?.length || 0}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming Events</div>
                </div>
                <div className="text-3xl font-bold">{upcomingEvents.length}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-sm text-muted-foreground">Today's Events</div>
                </div>
                <div className="text-3xl font-bold">{todaysEvents.length}</div>
              </Card>
            </div>

            {/* Guild Breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" />
                Events Per Server
              </h2>
              {Object.keys(guildBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground">No servers with upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(guildBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([guildName, count]) => (
                      <div key={guildName} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium">{guildName}</div>
                        <div className="text-sm">
                          <span className="font-bold">{count}</span>
                          <span className="text-muted-foreground ml-1">
                            {count === 1 ? 'event' : 'events'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Raw Data */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Raw API Response</h2>
              <div className="bg-zinc-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(
                    {
                      guildsCount: debugData?.guildsCount,
                      totalEvents: debugData?.events?.length,
                      upcomingEvents: upcomingEvents.length,
                      todaysEvents: todaysEvents.length,
                      timestamp: debugData?.timestamp ? new Date(debugData.timestamp).toISOString() : null,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </Card>

            {/* Console Tip */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Tip:</strong> Open your browser console (F12) for more detailed logging information
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
