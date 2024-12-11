import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { LeaderboardItem } from "@/types";

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  avatar: z.string().optional(),
  social: z
    .object({
      twitter: z.string().url().optional(),
      discord: z.string().url().optional(),
      telegram: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
  metadata: z
    .object({
      votes: z.number(),
      voters: z.number(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        // Add any necessary filters here
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        social: true,
        metadata: true,
      },
    });

    const sortedProjects: LeaderboardItem[] = projects
      .map((project) => {
        const metadata = project.metadata;

        // Ensure metadata conforms to ItemMetadata
        const itemMetadata = metadata && typeof metadata === "object" && "votes" in metadata && "voters" in metadata
          ? {
              votes: (metadata as any).votes,
              voters: (metadata as any).voters,
            }
          : undefined;

        return {
          id: project.id,
          rank: 0, // Placeholder, will be set after sorting
          name: project.name,
          description: project.description || undefined,
          avatar: project.avatar || undefined,
          social: project.social
            ? {
                twitter: project.social.twitter || undefined,
                discord: project.social.discord || undefined,
                website: project.social.website || undefined,
              }
            : undefined,
          metadata: itemMetadata,
        };
      })
      .sort((a, b) => {
        const aVotes = a.metadata?.votes ?? 0;
        const bVotes = b.metadata?.votes ?? 0;
        return bVotes - aVotes;
      })
      .map((project, index) => ({
        ...project,
        rank: index + 1,
      }));

    console.log(sortedProjects);

    return NextResponse.json(sortedProjects, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Optional: Uncomment and use POST if needed
/*
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = projectSchema.parse(body);

    const newProject = await prisma.project.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        avatar: parsed.avatar,
        social: parsed.social ? parsed.social : undefined,
        metadata: parsed.metadata ? parsed.metadata : undefined,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.errors, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
*/
