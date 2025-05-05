import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { findOrCreateUser } from "@/lib/user";
import { calculateLevel } from "@/lib/xp";

const voteSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  type: z.enum(["like", "dislike"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  console.log("🔵 Vote request received", { projectId: params.projectId });

  // === Voting Lock Start ===
  const votingLocked = false; // Set to true to lock voting. Comment out or set to false to unlock.

  if (votingLocked) {
    return NextResponse.json(
      { error: "Voting is currently locked. Please try again later." },
      { status: 403 }
    );
  }
  // === Voting Lock End ===

  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const body = await req.json();
      const { walletAddress, type } = voteSchema.parse(body);

      const user = await findOrCreateUser(walletAddress);
      console.log("🔵 User found/created:", { userId: user.id });

      // Verify user has Discord connected
      if (!user.discordId) {
        return NextResponse.json(
          { error: "Discord account not connected" },
          { status: 400 }
        );
      }

      const project = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: {
          id: true,
          metadata: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
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
        // If the vote type is the same, return error
        if (existingVote.type === type) {
          return NextResponse.json(
            {
              error: `You have already ${type}d this project in the last 24 hours.`,
            },
            { status: 400 }
          );
        }

        // If the vote type is different, update the existing vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });

        // Update project metadata
        const currentMetadata = (project.metadata as {
          likes: number;
          dislikes: number;
          voters: number;
        }) || { likes: 0, dislikes: 0, voters: 0 };

        await prisma.project.update({
          where: { id: project.id },
          data: {
            metadata: {
              likes: type === "like" ? currentMetadata.likes + 1 : currentMetadata.likes - 1,
              dislikes: type === "dislike" ? currentMetadata.dislikes + 1 : currentMetadata.dislikes - 1,
              voters: currentMetadata.voters,
            },
          },
        });

        return NextResponse.json(
          { message: `Vote updated to ${type}.` },
          { status: 200 }
        );
      }

      // Determine if this is the user's first vote for the project
      const isFirstVote = !(await prisma.vote.findFirst({
        where: {
          userId: user.id,
          projectId: project.id,
        },
      }));

      // Create a new vote record and update user XP
      await Promise.all([
        prisma.vote.create({
          data: {
            userId: user.id,
            projectId: project.id,
            votedDate: now,
            type,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: 1 },
            level: { set: calculateLevel(user.xp + 1) },
          },
        }),
      ]);

      // Parse current metadata or initialize with default values
      const currentMetadata = (project.metadata as {
        likes: number;
        dislikes: number;
        voters: number;
      }) || { likes: 0, dislikes: 0, voters: 0 };

      // Update the project's metadata
      await prisma.project.update({
        where: { id: project.id },
        data: {
          metadata: {
            likes: type === "like" ? (currentMetadata.likes || 0) + 1 : (currentMetadata.likes || 0),
            dislikes: type === "dislike" ? (currentMetadata.dislikes || 0) + 1 : (currentMetadata.dislikes || 0),
            voters: isFirstVote
              ? (currentMetadata.voters || 0) + 1
              : currentMetadata.voters,
          },
        },
      });

      console.log("✅ Vote successfully recorded", {
        userId: user.id,
        projectId: params.projectId,
        type,
      });

      return NextResponse.json(
        { message: `${type.charAt(0).toUpperCase() + type.slice(1)} successfully recorded.` },
        {
          status: 201,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    } catch (error) {
      console.error("❌ Error processing vote:", error);
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

export const revalidate = 0;
