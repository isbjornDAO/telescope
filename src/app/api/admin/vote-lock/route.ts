import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorldError } from "@/lib/world/errors";
import { requirePlatformAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

async function readLock() {
  const settings = await prisma.adminSettings.findFirst();
  if (settings) return settings;
  return prisma.adminSettings.create({ data: { voteLock: false } });
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    return NextResponse.json(await readLock());
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching vote lock status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const { voteLock } = await request.json();
    if (typeof voteLock !== "boolean") {
      return NextResponse.json({ error: "voteLock must be a boolean" }, { status: 400 });
    }

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      const created = await prisma.adminSettings.create({ data: { voteLock } });
      return NextResponse.json(created);
    }

    const updated = await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { voteLock },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error updating vote lock status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
