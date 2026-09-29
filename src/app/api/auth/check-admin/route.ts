import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminWallet } from "@/lib/auth";
import { getWorldSession, isPlatformAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = getWorldSession(request);
    if (!session) return NextResponse.json({ isAdmin: false });

    const user = await prisma.user.findFirst({
      where: { address: { equals: session.address, mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ isAdmin: isAdminWallet(session.address) });
    }

    return NextResponse.json({ isAdmin: isPlatformAdmin(user) });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
