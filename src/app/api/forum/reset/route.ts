import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Delete all boards (this will cascade delete threads and posts)
    await prisma.board.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All forum data deleted. Visit /api/forum/seed to recreate boards."
    });
  } catch (error) {
    console.error("Error resetting forum:", error);
    return NextResponse.json(
      {
        error: "Failed to reset forum",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
