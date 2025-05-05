import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return new NextResponse("Wallet address is required", { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    if (!user?.discordId || !isAdmin(user.discordId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      // Create default settings if none exist
      const newSettings = await prisma.adminSettings.create({
        data: {
          voteLock: false,
        },
      });
      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching vote lock status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return new NextResponse("Wallet address is required", { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    if (!user?.discordId || !isAdmin(user.discordId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { voteLock } = await request.json();

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      const newSettings = await prisma.adminSettings.create({
        data: {
          voteLock,
        },
      });
      return NextResponse.json(newSettings);
    }

    const updatedSettings = await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { voteLock },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating vote lock status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 