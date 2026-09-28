import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";
import { requirePlatformAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    await prisma.post.deleteMany({});
    await prisma.thread.deleteMany({});
    await prisma.board.updateMany({
      data: { totalThreadsCreated: 0 },
    });

    return NextResponse.json({
      success: true,
      message: "All threads and posts deleted, counters reset",
    });
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error cleaning up forum:", error);
    return NextResponse.json({ error: "Failed to cleanup forum" }, { status: 500 });
  }
}
