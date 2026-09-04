import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserCollectables, getAllCollectables } from "@/lib/collectables";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    // Get all available collectables
    const allCollectables = await getAllCollectables();

    if (!address) {
      // Return all collectables without claim status
      return NextResponse.json(
        allCollectables.map((c) => ({
          id: c.collectableId,
          name: c.name,
          description: c.description,
          imageUrl: c.imageUrl,
          rarity: c.rarity,
          category: c.category,
          hasClaimed: false,
        }))
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { wallets: { some: { address: address.toLowerCase() } } },
    });

    if (!user) {
      // User doesn't exist yet, return all collectables as unclaimed
      return NextResponse.json(
        allCollectables.map((c) => ({
          id: c.collectableId,
          name: c.name,
          description: c.description,
          imageUrl: c.imageUrl,
          rarity: c.rarity,
          category: c.category,
          hasClaimed: false,
        }))
      );
    }

    // Get user's collectables
    const userCollectables = await getUserCollectables(user.id);
    const userCollectableIds = new Set(
      userCollectables.map((uc) => uc.collectable.collectableId)
    );

    // Return all collectables with claim status
    return NextResponse.json(
      allCollectables.map((c) => ({
        id: c.collectableId,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        rarity: c.rarity,
        category: c.category,
        hasClaimed: userCollectableIds.has(c.collectableId),
        acquiredAt: userCollectables.find(
          (uc) => uc.collectable.collectableId === c.collectableId
        )?.acquiredAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching collectables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
