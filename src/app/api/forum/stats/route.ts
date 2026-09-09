import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get board count and total threads created (all-time)
    const boards = await prisma.board.findMany({
      select: {
        totalThreadsCreated: true
      }
    });

    const totalThreadsCreated = boards.reduce((sum, board) => sum + (board.totalThreadsCreated || 0), 0);

    return NextResponse.json({
      totalBoards: boards.length,
      totalThreads: totalThreadsCreated
    });
  } catch (error) {
    console.error("Error fetching forum stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

