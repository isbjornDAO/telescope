import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get("tag");

    console.log("Fetching Season 1 projects...");

    const projects = await prisma.projectS1.findMany({
      where: {
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${projects.length} Season 1 projects`);

    // Transform projects to include metadata and rank
    const projectsWithMetadata = await Promise.all(
      projects.map(async (project, index) => {
        const votes = await prisma.voteS1.findMany({
          where: {
            projectId: project.id,
          },
        });

        const likes = votes.filter((vote) => vote.type === "like").length;
        const dislikes = votes.filter((vote) => vote.type === "dislike").length;
        const voters = new Set(votes.map((vote) => vote.userId)).size;

        return {
          ...project,
          rank: index + 1,
          metadata: {
            likes,
            dislikes,
            voters,
          },
        };
      })
    );

    // Sort by total votes (likes + dislikes) in descending order
    const sortedProjects = projectsWithMetadata.sort((a, b) => {
      const aVotes = a.metadata.likes + a.metadata.dislikes;
      const bVotes = b.metadata.likes + b.metadata.dislikes;
      return bVotes - aVotes;
    });

    // Update ranks after sorting
    const finalProjects = sortedProjects.map((project, index) => ({
      ...project,
      rank: index + 1,
    }));

    console.log("Returning Season 1 projects:", finalProjects.length);
    return NextResponse.json(finalProjects);
  } catch (error) {
    console.error("Error fetching season 1 projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch season 1 projects" },
      { status: 500 }
    );
  }
} 