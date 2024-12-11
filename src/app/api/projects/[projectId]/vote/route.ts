import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { findOrCreateUser } from "@/lib/user";

const voteSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const { walletAddress } = voteSchema.parse(body);

    // Fetch or create the user using the shared function
    const user = await findOrCreateUser(walletAddress);

    // Find the project by ID, selecting only necessary fields
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if the user has already voted for this project
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_votedDate: {
          userId: user.id,
          votedDate: new Date(),
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted for this project." },
        { status: 400 }
      );
    }

    // Create a new vote record
    const vote = await prisma.vote.create({
      data: {
        userId: user.id,
        projectId: project.id,
        // votedDate is no longer present due to schema changes
      },
    });

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
