import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { findOrCreateUser } from "@/lib/user";
import { Address, verifyMessage } from "viem";
import { calculateLevel } from "@/lib/xp";

const voteSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string(),
  message: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  console.log("🔵 Vote request received", { projectId: params.projectId });
  
  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const body = await req.json();
      console.log("🔵 Request body received:", { 
        walletAddress: body.walletAddress,
        signatureLength: body.signature?.length,
        messageLength: body.message?.length 
      });

      const { walletAddress, signature, message } = voteSchema.parse(body);
      console.log("🔵 Request validation passed");

      // Verify the signature
      console.log("🔵 Verifying signature...");
      const isValid = await verifyMessage({
        address: walletAddress as Address,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        console.error("❌ Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ Signature verified successfully");

      const user = await findOrCreateUser(walletAddress);
      console.log("🔵 User found/created:", { userId: user.id });

      // Find the project by ID, selecting metadata
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
        return NextResponse.json(
          {
            error:
              "You have already voted for this project in the last 24 hours.",
          },
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

      // Create a new vote record and update user XP
      await Promise.all([
        prisma.vote.create({
          data: {
            userId: user.id,
            projectId: project.id,
            votedDate: now,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: 1 },
            level: { set: calculateLevel(user.xp + 1) }
          },
        })
      ]);

      // Parse current metadata or initialize with default values
      const currentMetadata = (project.metadata as {
        votes: number;
        voters: number;
      }) || { votes: 0, voters: 0 };

      console.log("Current metadata:", project.metadata);

      // Update the project's metadata
      await prisma.project.update({
        where: { id: project.id },
        data: {
          metadata: {
            votes: (currentMetadata.votes || 0) + 1,
            voters: isFirstVote
              ? (currentMetadata.voters || 0) + 1
              : currentMetadata.voters,
          },
        },
      });

      console.log("Updated metadata:", {
        votes: (currentMetadata.votes || 0) + 1,
        voters: isFirstVote ? (currentMetadata.voters || 0) + 1 : currentMetadata.voters,
      });

      console.log("✅ Vote successfully recorded", {
        userId: user.id,
        projectId: params.projectId,
      });

      return NextResponse.json(
        { message: "Vote successfully recorded." },
        { 
          status: 201,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
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
