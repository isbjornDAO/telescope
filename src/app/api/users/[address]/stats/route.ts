import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const user = await prisma.user.findFirst({
      where: { wallets: { some: { address: params.address } } },
      select: { xp: true, coins: true, discordId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ xp: 0, coins: 0 }, { status: 200 });
    }

    return NextResponse.json(
      { xp: user.xp, coins: user.coins, discordId: user.discordId, name: user.name },
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
