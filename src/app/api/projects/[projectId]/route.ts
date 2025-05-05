import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        ...(includeDeleted ? {} : { deleted: false }),
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const data = await request.json();

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        tags: data.tags,
        social: data.social,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    // First check if the project exists
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Soft delete the project
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Project soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting project:", error);
    return NextResponse.json(
      { error: "Failed to soft delete project" },
      { status: 500 }
    );
  }
} 