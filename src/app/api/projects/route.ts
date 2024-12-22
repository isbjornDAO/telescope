import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaderboardItem } from "@/types";
import { isItemMetadata } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const querySchema = z.object({
  tag: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    // Validate query parameters - make tag optional
    const validatedParams = querySchema.parse({ tag });
    const validatedTag = validatedParams.tag;

    // Use Prisma's ProjectWhereInput type for better type safety
    const filter: Prisma.ProjectWhereInput = {};
    if (validatedTag) {
      // Use the 'has' operator to filter projects that include the specified tag
      filter.tags = { has: validatedTag };
    }

    const projects = await prisma.project.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        social: true,
        metadata: true,
        tags: true,
      },
    });

    const sortedProjects: LeaderboardItem[] = projects
      .map((project) => {
        const metadata = project.metadata;

        const itemMetadata = isItemMetadata(metadata)
          ? {
              votes: metadata.votes,
              voters: metadata.voters,
            }
          : {
              votes: 0,
              voters: 0,
            };

        return {
          id: project.id,
          rank: 0, // Placeholder
          name: project.name,
          description: project.description || undefined,
          avatar: project.avatar || undefined,
          social: project.social
            ? {
                twitter: project.social.twitter || undefined,
                discord: project.social.discord || undefined,
                telegram: project.social.telegram || undefined,
                website: project.social.website || undefined,
              }
            : undefined,
          metadata: itemMetadata,
          tags: project.tags,
        };
      })
      .sort((a, b) => (b.metadata?.votes ?? 0) - (a.metadata?.votes ?? 0))
      .map((project, index) => ({
        ...project,
        rank: index + 1,
      }));

    return NextResponse.json(sortedProjects, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
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

export const revalidate = 0;
