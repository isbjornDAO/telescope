import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { respondToError } from "@/lib/api";

/** GET /api/forum/categories — the board list, with live topic counts. */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { archived: false },
      orderBy: { position: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        icon: true,
        _count: { select: { topics: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return respondToError(error);
  }
}
