import { prisma } from "@/lib/prisma";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { AdminDashboard, type AdminDashboardProps } from "@/components/admin/admin-dashboard";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

async function getAdminData(): Promise<AdminDashboardProps> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalVotes,
    totalUsers,
    discordUsers,
    eldersCount,
    anchorsCount,
    totalBoards,
    totalThreads,
    totalPosts,
    totalClaims,
    projectsCount,
    entriesCount,
    rawTopUsers,
    rawSeasons,
    rawRounds,
    rawEntries,
    rawBoards,
    rawThreads,
    rawClaims,
    topProjectsRaw,
    votesPerDayRaw,
    levelDistributionRaw,
    voteTimeDistributionRaw,
    dailyVotesPerProject,
  ] = await Promise.all([
    prisma.vote.count(),
    prisma.user.count(),
    prisma.user.count({ where: { discordId: { not: null } } }),
    prisma.user.count({ where: { nodeType: "ELDER" } }),
    prisma.user.count({ where: { nodeType: "ANCHOR" } }),
    prisma.board.count(),
    prisma.thread.count(),
    prisma.post.count(),
    prisma.claim.count(),
    prisma.project.count({ where: { deleted: false } }),
    prisma.entry.count(),
    prisma.user.findMany({
      take: 25,
      orderBy: [{ xp: "desc" }, { level: "desc" }],
      select: {
        id: true,
        address: true,
        username: true,
        handle: true,
        xp: true,
        level: true,
        coins: true,
        discordId: true,
        nodeType: true,
        createdAt: true,
      },
    }),
    prisma.season.findMany({
      orderBy: { number: "desc" },
      include: { _count: { select: { entries: true } } },
    }),
    prisma.round.findMany({
      orderBy: [{ seasonId: "desc" }, { tournament: "asc" }, { index: "asc" }],
    }),
    prisma.entry.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        tournament: true,
        status: true,
        createdAt: true,
        author: { select: { handle: true, address: true } },
      },
    }),
    prisma.board.findMany({
      orderBy: { totalThreadsCreated: "desc" },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        totalThreadsCreated: true,
      },
    }),
    prisma.thread.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        replyCount: true,
        ownerAddress: true,
        board: { select: { name: true, title: true } },
      },
    }),
    prisma.claim.findMany({
      take: 10,
      orderBy: { claimedAt: "desc" },
      select: {
        id: true,
        claimedAt: true,
        user: { select: { address: true, discordId: true, username: true } },
        reward: { select: { name: true, xpRequired: true, imageUrl: true } },
      },
    }),
    prisma.vote.groupBy({
      by: ["projectId"],
      _count: { projectId: true },
      orderBy: { _count: { projectId: "desc" } },
      take: 5,
    }),
    prisma.vote.groupBy({
      by: ["votedDate"],
      where: { votedDate: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { votedDate: "asc" },
    }),
    prisma.user.groupBy({
      by: ["level"],
      _count: { _all: true },
      orderBy: { level: "asc" },
      where: { level: { gt: 0 } },
    }),
    prisma.vote.groupBy({
      by: ["votedDate"],
      _count: { _all: true },
      where: { votedDate: { not: undefined } },
    }),
    prisma.vote.groupBy({
      by: ["projectId", "votedDate"],
      where: { votedDate: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { votedDate: "asc" },
    }),
  ]);

  // Aggregate votes by day (30-day window)
  const votesPerDayMap: Record<string, number> = {};
  votesPerDayRaw.forEach((vote) => {
    const dateStr = vote.votedDate.toISOString().split("T")[0];
    votesPerDayMap[dateStr] = (votesPerDayMap[dateStr] || 0) + (vote._count._all || 0);
  });

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

  // Hourly vote distribution
  const hourCounts = new Array(24).fill(0);
  voteTimeDistributionRaw.forEach((result) => {
    const hour = new Date(result.votedDate).getHours();
    hourCounts[hour] += result._count._all || 0;
  });
  const voteTimeDistribution = hourCounts.map((count, hour) => ({ hour, count }));

  // Top projects details
  const topProjects = await Promise.all(
    topProjectsRaw.map(async (p) => {
      const projectDetails = await prisma.project.findUnique({
        where: { id: p.projectId },
        select: { id: true, name: true },
      });
      return {
        id: projectDetails?.id || p.projectId,
        name: projectDetails?.name || "Unknown Project",
        voteCount: p._count.projectId,
      };
    })
  );

  // Daily top projects
  const uniqueProjectIds = Array.from(new Set(dailyVotesPerProject.map((v) => v.projectId)));
  const projectNames = await prisma.project.findMany({
    where: { id: { in: uniqueProjectIds } },
    select: { id: true, name: true },
  });
  const projectNameMap = new Map(projectNames.map((p) => [p.id, p.name]));
  const dailyTopProjects = dailyVotesPerProject.map((vote) => ({
    date: vote.votedDate,
    projectId: vote.projectId,
    projectName: projectNameMap.get(vote.projectId) || "Unknown Project",
    voteCount: vote._count._all || 0,
  }));

  return {
    vitals: {
      totalUsers,
      discordUsers,
      eldersCount,
      anchorsCount,
      totalBoards,
      totalThreads,
      totalPosts,
      totalClaims,
      totalVotes,
      projectsCount,
      entriesCount,
    },
    topUsers: rawTopUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    seasons: rawSeasons.map((s) => ({
      id: s.id,
      number: s.number,
      name: s.name,
      theme: s.theme,
      status: s.status,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      entries: s._count.entries,
    })),
    rounds: rawRounds.map((r) => ({
      id: r.id,
      seasonId: r.seasonId,
      tournament: r.tournament,
      index: r.index,
      name: r.name,
      status: r.status,
      opensAt: r.opensAt.toISOString(),
      closesAt: r.closesAt.toISOString(),
      ballotCount: r.ballotCount,
    })),
    recentEntries: rawEntries.map((e) => ({
      id: e.id,
      title: e.title,
      tournament: e.tournament,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      author: e.author,
    })),
    boards: rawBoards,
    recentThreads: rawThreads.map((t) => ({
      id: t.id,
      title: t.subject || "Untitled Thread",
      createdAt: t.createdAt.toISOString(),
      replyCount: t.replyCount,
      ownerAddress: t.ownerAddress || "",
      board: t.board,
    })),
    recentClaims: rawClaims.map((c) => ({
      id: c.id,
      claimedAt: c.claimedAt.toISOString(),
      user: c.user,
      reward: c.reward,
    })),
    projects: topProjects,
    chartData: {
      votesPerDay,
      levelDistribution: levelDistributionRaw,
      voteTimeDistribution,
      dailyTopProjects,
    },
  };
}

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <AdminWrapper>
      <AdminDashboard {...data} />
    </AdminWrapper>
  );
}
