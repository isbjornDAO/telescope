import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Delete all posts first (due to foreign key)
    await prisma.post.deleteMany({});
    
    // Then delete all threads
    await prisma.thread.deleteMany({});
    
    // Reset totalThreadsCreated for all boards to 0
    await prisma.board.updateMany({
      data: { totalThreadsCreated: 0 }
    });

    return NextResponse.json({ 
      success: true, 
      message: "All threads and posts deleted, counters reset" 
    });
  } catch (error) {
    console.error("Error cleaning up forum:", error);
    return NextResponse.json(
      { error: "Failed to cleanup forum" },
      { status: 500 }
    );
  }
}


