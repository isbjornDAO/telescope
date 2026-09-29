import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";
import { requirePlatformAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    await prisma.board.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All forum data deleted. Visit /api/forum/seed to recreate boards.",
    });
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error resetting forum:", error);
    return NextResponse.json({ error: "Failed to reset forum" }, { status: 500 });
  }
}
