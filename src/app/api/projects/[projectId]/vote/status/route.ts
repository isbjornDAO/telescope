import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  projectId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid project ID"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    // Validate query parameters
    const { walletAddress: validatedWalletAddress, projectId } =
      querySchema.parse({
        walletAddress,
        projectId: params.projectId,
      });

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { address: validatedWalletAddress },
    });

    if (!user) {
      return NextResponse.json({ hasVoted: false }, { status: 200 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if a vote exists within the last 24 hours
    const voteExists = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        projectId: projectId,
        votedDate: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    return NextResponse.json(
      {
        hasVoted: !!voteExists,
        projectName: project?.name,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export const revalidate = 0;
