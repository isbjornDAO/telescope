import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import projects from "@/lib/output.json";

export async function POST() {
  try {
    const createdProjects = await prisma.$transaction(
      projects.map((project) => 
        prisma.project.create({
          data: {
            name: project.name,
            description: project.description,
            avatar: project.avatar,
            social: {
              twitter: project.social.twitter,
              discord: project.social.discord,
              telegram: project.social.telegram,
              website: project.social.website,
            },
            metadata: {
              votes: project.metadata.votes,
              voters: project.metadata.voters,
            },
          },
        })
      )
    );

    return NextResponse.json({ 
      message: `Successfully imported ${createdProjects.length} projects`,
      count: createdProjects.length 
    }, { status: 201 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import projects" }, { status: 500 });
  }
} 