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
  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const body = await req.json();
      const { walletAddress } = voteSchema.parse(body);
      const user = await findOrCreateUser(walletAddress);

      // Find the project by ID, selecting metadata
      const project = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: { 
          id: true,
          metadata: true 
        },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          projectId: project.id,
          votedDate: {
            gte: twentyFourHoursAgo,
          },
        },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: "You have already voted for this project in the last 24 hours." },
          { status: 400 }
        );
      }

      // Determine if this is the user's first vote for the project
      const isFirstVote = !(await prisma.vote.findFirst({
        where: {
          userId: user.id,
          projectId: project.id,
        },
      }));

      // Create a new vote record
      await prisma.vote.create({
        data: {
          userId: user.id,
          projectId: project.id,
          votedDate: now,
        },
      });

      // Parse current metadata or initialize with default values
      const currentMetadata = project.metadata as { votes: number; voters: number } || { votes: 0, voters: 0 };

      // Update the project's metadata
      await prisma.project.update({
        where: { id: project.id },
        data: {
          metadata: {
            votes: (currentMetadata.votes || 0) + 1,
            voters: isFirstVote ? (currentMetadata.voters || 0) + 1 : currentMetadata.voters,
          },
        },
      });

      return NextResponse.json(
        { message: "Vote successfully recorded." },
        { status: 201 }
      );
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  });

  return transaction;
}
