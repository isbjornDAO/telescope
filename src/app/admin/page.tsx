import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { VotesChart } from "@/components/votes-chart";
import { LevelDistributionChart } from "@/components/level-distribution-chart";
import { VoteTimeDistributionChart } from "@/components/vote-time-distribution-chart";
import { DailyTopProjectsChart } from "@/components/daily-top-projects-chart";
import Link from "next/link";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { VoteLockSwitch } from "@/components/admin/vote-lock-switch";

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

  // Get project names for all unique projects
  const projectNames = await prisma.project.findMany({
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

  // Create a map of project IDs to names
  const projectNameMap = new Map(
    projectNames.map((project) => [project.id, project.name])
  );

  // Create daily top projects data
  const dailyTopProjects = dailyVotesPerProject.map((vote) => ({
    date: vote.votedDate,
    projectId: vote.projectId,
    projectName: projectNameMap.get(vote.projectId) || "Unknown Project",
    voteCount: vote._count._all || 0,
  }));

  // Calculate average votes per day
  const avgVotesPerDay =
    votesPerDay.reduce((sum, day) => sum + day._count, 0) / votesPerDay.length;

  return {
    totalVotes,
    uniqueVoters: uniqueVoters.length,
    discordConnectedUsers,
    totalUsers,
    avgVotesPerDay,
    votesPerDay,
    topVoters: topVotersWithDetails,
    topProjects: topProjectsWithDetails,
    dailyTopProjects,
    levelDistribution,
    voteTimeDistribution,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <AdminWrapper>
      <div className="container mx-auto py-8 max-w-screen-lg gap-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button asChild>
            <Link href="/admin/projects">Projects</Link>
          </Button>
        </div>
        <div className="my-4">
          <VoteLockSwitch />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalVotes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unique Voters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.uniqueVoters}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discord Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.discordConnectedUsers}
              </p>
              <p className="text-sm text-muted-foreground">
                {(
                  (stats.discordConnectedUsers / stats.totalUsers) *
                  100
                ).toFixed(1)}
                % of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg. Votes/Day</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.avgVotesPerDay.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Votes Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <VotesChart data={stats.votesPerDay} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <LevelDistributionChart data={stats.levelDistribution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vote Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteTimeDistributionChart data={stats.voteTimeDistribution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Top Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTopProjectsChart data={stats.dailyTopProjects} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Voters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topVoters.map((voter, index) => (
                  <div
                    key={voter.discordId || voter.address}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">#{index + 1}</span>
                      <span>
                        {voter.discordId ? (
                          <Link
                            href={`/users/${voter.discordId}`}
                            className="hover:underline"
                          >
                            {voter.discordId}
                          </Link>
                        ) : (
                          voter.address
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Level {voter.level} • {voter.voteCount} votes
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
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">#{index + 1}</span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.voteCount} votes
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminWrapper>
  );
}
