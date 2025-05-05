import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          tag ? {
            tags: {
              has: tag
            }
          } : {},
          includeDeleted ? {} : { deleted: false }
        ]
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, avatar, tags, social } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Check if there's a soft-deleted project with the same name
    const existingDeletedProject = await prisma.project.findFirst({
      where: {
        name,
        deleted: true,
      },
    });

    let project;
    if (existingDeletedProject) {
      // Update the soft-deleted project
      project = await prisma.project.update({
        where: {
          id: existingDeletedProject.id,
        },
        data: {
          name,
          description,
          avatar,
          tags,
          social,
          deleted: false,
          deletedAt: null,
        },
      });
    } else {
      // Create a new project
      project = await prisma.project.create({
        data: {
          name,
          description,
          avatar,
          tags,
          social,
        },
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
