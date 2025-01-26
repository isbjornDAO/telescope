import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { VotesChart } from "@/components/votes-chart";
import { LevelDistributionChart } from "@/components/level-distribution-chart";
import { VoteTimeDistributionChart } from "@/components/vote-time-distribution-chart";
import { DailyTopProjectsChart } from "@/components/daily-top-projects-chart";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConnectButton } from "@/components/connect-button";

interface VoteTimeDistribution {
  hour: number;
  count: number;
}

interface TopVoter {
  address: string | null;
  discordId: string | null;
  xp: number;
  level: number;
  voteCount: number;
}

interface TopProject {
  id: string;
  name: string;
  voteCount: number;
}

interface DailyProjectVotes {
  date: Date;
  projectId: string;
  projectName: string;
  voteCount: number;
}

interface StatsData {
  totalVotes: number;
  uniqueVoters: number;
  discordConnectedUsers: number;
  totalUsers: number;
  avgVotesPerDay: number;
  votesPerDay: Array<{
    votedDate: Date;
    _count: number;
  }>;
  topVoters: TopVoter[];
  topProjects: TopProject[];
  dailyTopProjects: DailyProjectVotes[];
  levelDistribution: Array<{
    level: number;
    _count: {
      _all: number;
    };
  }>;
  voteTimeDistribution: VoteTimeDistribution[];
}

async function getStats(): Promise<StatsData> {
  // Get total votes
  const totalVotes = await prisma.vote.count();

  // Get unique voters count
  const uniqueVoters = await prisma.vote.groupBy({
    by: ["userId"],
    _count: true,
  });

  // Get count of users with Discord connected
  const discordConnectedUsers = await prisma.user.count({
    where: {
      discordId: {
        not: null,
      },
    },
  });

  // Get total users count
  const totalUsers = await prisma.user.count();

  // Get level distribution
  const levelDistribution = await prisma.user.groupBy({
    by: ["level"],
    _count: {
      _all: true,
    },
    orderBy: {
      level: "asc",
    },
    where: {
      level: {
        gt: 0,
      },
    },
  });

  // Get votes by hour of day using Prisma's native date functions
  const voteTimeDistribution: VoteTimeDistribution[] = await prisma.vote
    .groupBy({
      by: ["votedDate"],
      _count: {
        _all: true,
      },
      where: {
        votedDate: {
          not: undefined,
        },
      },
    })
    .then((results) => {
      const hourCounts = new Array(24).fill(0);
      results.forEach((result) => {
        const hour = new Date(result.votedDate).getHours();
        hourCounts[hour] += result._count._all || 0;
      });
      return hourCounts.map((count, hour) => ({
        hour,
        count,
      }));
    });

  // Get votes per day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const votesPerDayRaw = await prisma.vote.groupBy({
    by: ["votedDate"],
    where: {
      votedDate: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      votedDate: "asc",
    },
  });

  // Aggregate votes by date only (ignore time)
  const votesPerDayMap: Record<string, number> = {};

  votesPerDayRaw.forEach((vote) => {
    const dateStr = vote.votedDate.toISOString().split("T")[0];
    votesPerDayMap[dateStr] =
      (votesPerDayMap[dateStr] || 0) + (vote._count._all || 0);
  });

  // Create an array representing the last 30 days with accurate vote counts
  const votesPerDay = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    return {
      votedDate: new Date(dateStr),
      _count: votesPerDayMap[dateStr] || 0,
    };
  });

  // Get top 5 voters
  const topVoters = await prisma.vote.groupBy({
    by: ["userId"],
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: "desc",
      },
    },
    take: 5,
  });

  // Get user details for top voters
  const topVotersWithDetails = await Promise.all(
    topVoters.map(async (voter) => {
      const user = await prisma.user.findUnique({
        where: { id: voter.userId },
        select: {
          address: true,
          discordId: true,
          xp: true,
          level: true,
        },
      });
      return {
        ...user,
        voteCount: voter._count.userId,
      } as TopVoter;
    })
  );

  // Get top 5 projects by total votes
  const topProjects = await prisma.vote.groupBy({
    by: ["projectId"],
    _count: {
      projectId: true,
    },
    orderBy: {
      _count: {
        projectId: "desc",
      },
    },
    take: 5,
  });

  // Get project details for top projects
  const topProjectsWithDetails = await Promise.all(
    topProjects.map(async (project) => {
      const projectDetails = await prisma.project.findUnique({
        where: { id: project.projectId },
        select: {
          id: true,
          name: true,
        },
      });
      return {
        id: projectDetails?.id || "",
        name: projectDetails?.name || "Unknown Project",
        voteCount: project._count.projectId,
      } as TopProject;
    })
  );

  // Get daily top projects for the last 30 days
  const dailyVotesPerProject = await prisma.vote.groupBy({
    by: ["projectId", "votedDate"],
    where: {
      votedDate: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: [
      {
        votedDate: "asc",
      },
    ],
  });

  // Get all unique project IDs from the votes
  const uniqueProjectIds = Array.from(
    new Set(dailyVotesPerProject.map((v) => v.projectId))
  );

  // Fetch all project details in one query
  const projects = await prisma.project.findMany({
    where: {
      id: {
        in: uniqueProjectIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Create a map for quick project name lookups
  const projectNamesMap = new Map(projects.map((p) => [p.id, p.name]));

  // Group votes by date first
  const votesByDate = new Map();

  // Process all votes and group them by date and project
  dailyVotesPerProject.forEach((vote) => {
    const dateStr = vote.votedDate.toISOString().split("T")[0];
    if (!votesByDate.has(dateStr)) {
      votesByDate.set(dateStr, new Map());
    }

    const projectVotes = votesByDate.get(dateStr);
    const currentVotes = projectVotes.get(vote.projectId) || 0;
    projectVotes.set(vote.projectId, currentVotes + vote._count._all);
  });

  // Format and find top project for each day
  const formattedDailyTopProjects = Array.from(votesByDate.entries()).map(
    ([dateStr, projectVotes]) => {
      // Convert the project votes Map to array and sort to find the top project
      const projectVotesArray = Array.from(projectVotes.entries()) as [
        string,
        number
      ][];
      const topProject = projectVotesArray.reduce((max, current) => {
        return current[1] > max[1] ? current : max;
      }, projectVotesArray[0]);

      return {
        date: new Date(dateStr),
        projectId: topProject[0],
        projectName: projectNamesMap.get(topProject[0]) || "Unknown Project",
        voteCount: topProject[1],
      };
    }
  );

  const avgVotesPerDay = totalVotes / 30;

  return {
    totalVotes,
    uniqueVoters: uniqueVoters.length,
    discordConnectedUsers,
    totalUsers,
    avgVotesPerDay,
    votesPerDay,
    topVoters: topVotersWithDetails,
    topProjects: topProjectsWithDetails,
    dailyTopProjects: formattedDailyTopProjects,
    levelDistribution,
    voteTimeDistribution,
  };
}

export default async function StatsPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has the correct Discord ID
  if (
    !session?.discordUser ||
    (session.discordUser.id !== "808694504726724628" &&
      session.discordUser.id !== "1078316901953966132")
  ) {
    return (
      <div className="container py-8 max-w-screen-lg mx-auto w-full px-4 md:px-0 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-semibold mb-4">Connect your wallet</h2>
        <ConnectButton />
      </div>
    );
  }

  const stats = await getStats();

  return (
    <div className="container py-8 max-w-screen-lg mx-auto w-full px-4 md:px-0">
      <h1 className="text-4xl font-bold mb-8">Platform Statistics</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalVotes}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ~{Math.round(stats.avgVotesPerDay)} votes/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Voters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.uniqueVoters}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round((stats.uniqueVoters / stats.totalUsers) * 100)}% of
              users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Votes per Voter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(stats.totalVotes / stats.uniqueVoters).toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discord Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.discordConnectedUsers}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(
                (stats.discordConnectedUsers / stats.totalUsers) * 100
              )}
              % of users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Votes Over Time (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <VotesChart data={stats.votesPerDay} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LevelDistributionChart data={stats.levelDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vote Time Distribution (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <VoteTimeDistributionChart data={stats.voteTimeDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Voters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topVoters.map((voter, index) => (
                <div
                  key={voter.address || index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">#{index + 1}</span>
                    <Link
                      href={`/profile/${voter.address}`}
                      className="font-mono hover:text-blue-500 transition-colors"
                    >
                      {voter.address?.slice(0, 6)}...{voter.address?.slice(-4)}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Level {voter.level}
                    </span>
                    <span className="font-bold">{voter.voteCount} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">#{index + 1}</span>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <span className="font-bold">{project.voteCount} votes</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Top Projects</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <DailyTopProjectsChart data={stats.dailyTopProjects} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
