import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateByAddress, getWorldSession } from "@/lib/world/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = getWorldSession(request);
    if (!session) return NextResponse.json({ success: true });

    const body = await request.json().catch(() => ({}));
    const user = await findOrCreateByAddress(session.address);

    if (body && typeof body === "object" && "clear" in body && body.clear) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: null },
      });
      return NextResponse.json({ success: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.user.updateMany({
      where: { lastActive: { lt: fifteenMinutesAgo } },
      data: { lastActive: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}
