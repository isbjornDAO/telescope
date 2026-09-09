import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

// GET user's favorite games and movies
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { address },
      select: {
        favoriteGames: true,
        favoriteMovies: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      favoriteGames: user.favoriteGames || [],
      favoriteMovies: user.favoriteMovies || [],
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST/PUT to update user's favorite games and movies
export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  try {
    const body = await request.json();
    const { favoriteGames, favoriteMovies } = body;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { address },
      update: {
        ...(favoriteGames !== undefined && { favoriteGames }),
        ...(favoriteMovies !== undefined && { favoriteMovies }),
      },
      create: {
        address,
        favoriteGames: favoriteGames || [],
        favoriteMovies: favoriteMovies || [],
      },
    });

    return NextResponse.json({
      success: true,
      favoriteGames: user.favoriteGames,
      favoriteMovies: user.favoriteMovies,
    });
  } catch (error) {
    console.error("Error updating favorites:", error);
    return NextResponse.json(
      { error: "Failed to update favorites" },
      { status: 500 }
    );
  }
}
