import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tagsSchema = z.object({
  tags: z.array(z.string()),
});

export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await request.json();
    const { tags } = tagsSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.projectId },
      data: { tags },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project tags:", error);
    return NextResponse.json(
      { error: "Failed to update project tags" },
      { status: 500 }
    );
  }
} 