"use client";

import { TrendingUp, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { ThreadList } from "@/components/forum/thread-list";
import { BoardList } from "@/components/forum/board-list";
import { useForumData, useActiveUsers, useDailyXp } from "@/components/forum/use-forum";
import { SectionTitle, Stat } from "@/components/world/primitives";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useAccount } from "wagmi";

/** The whole forum: what is moving, then every room. */
export function ForumOverview() {
  useActivityTracker();
  const { isConnected } = useAccount();
  const { boards, threads, loading, stats } = useForumData();
  const activeUsers = useActiveUsers();
  const { earnedToday, timeUntilReset } = useDailyXp();

  if (loading) {
    return (
      <div className="space-y-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2.5">
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-20">
      <section>
        <SectionTitle
          icon={<TrendingUp className="h-4 w-4 ink-accent" strokeWidth={1.75} />}
          right={
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              {isConnected && earnedToday ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />}
              {isConnected ? (earnedToday ? "XP earned today" : "1 XP available") : "Daily XP resets"} · {timeUntilReset}
            </span>
          }
        >
          Moving now
        </SectionTitle>
        <ThreadList threads={threads.slice(0, 9)} />
      </section>

      <section>
        <SectionTitle icon={<MessageSquare className="h-4 w-4 ink-accent" strokeWidth={1.75} />}>Rooms</SectionTitle>
        <BoardList boards={boards} />
      </section>

      <section className="grid grid-cols-3 gap-8 py-10 border-t border-[var(--hairline)]">
        <Stat label="Rooms" value={stats.totalBoards} />
        <Stat label="Live threads" value={stats.totalThreads} />
        <Stat label="In the world now" value={activeUsers} />
      </section>
    </div>
  );
}
