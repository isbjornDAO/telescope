import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { projects } = await req.json();

    const updates = await prisma.$transaction(
      projects.map((project: any) =>
        prisma.project.update({
          where: { id: project.id },
          data: { avatar: project.avatar }
        })
      )
    );

    return NextResponse.json({ 
      message: "Successfully updated avatars",
      count: updates.length 
    }, { status: 200 });
  } catch (error) {
    console.error("Update avatars error:", error);
    return NextResponse.json({ error: "Failed to update avatars" }, { status: 500 });
  }
} 