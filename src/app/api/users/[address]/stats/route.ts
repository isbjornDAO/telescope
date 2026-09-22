import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const addr = params.address.toLowerCase();
    const user =
      (await prisma.user.findUnique({
        where: { address: addr },
        select: { xp: true, coins: true, level: true, discordId: true, username: true },
      })) ??
      (await prisma.user.findFirst({
        where: { address: { equals: addr, mode: "insensitive" } },
        select: { xp: true, coins: true, level: true, discordId: true, username: true },
      }));

    if (!user) {
      return NextResponse.json({ xp: 0, coins: 0, level: 1 }, { status: 200 });
    }

    return NextResponse.json(
      { xp: user.xp, coins: user.coins, level: user.level ?? 1, discordId: user.discordId, username: user.username },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
