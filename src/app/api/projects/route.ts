import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaderboardItem } from "@/types";
import { isItemMetadata } from "@/lib/utils";

// const projectSchema = z.object({
//   name: z.string().min(1),
//   description: z.string().optional(),
//   avatar: z.string().optional(),
//   social: z
//     .object({
//       twitter: z.string().url().optional(),
//       discord: z.string().url().optional(),
//       telegram: z.string().url().optional(),
//       website: z.string().url().optional(),
//     })
//     .optional(),
//   metadata: z
//     .object({
//       votes: z.number(),
//       voters: z.number(),
//     })
//     .optional(),
// });

export async function GET() {
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

        // Use the type guard instead of casting
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
        };
      })
      .sort((a, b) => (b.metadata?.votes ?? 0) - (a.metadata?.votes ?? 0))
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
