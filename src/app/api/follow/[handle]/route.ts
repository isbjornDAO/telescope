import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/session";
import { respondToError } from "@/lib/api";

/**
 * POST /api/follow/[handle] — follow, or unfollow when already following.
 *
 * Lives here rather than under /api/users/[handle] because the legacy
 * wallet-keyed routes already claim /api/users/[address], and Next.js refuses
 * two different slug names at the same path segment.
 *
 * The two follower counters are denormalised, so they are updated in the same
 * transaction as the edge itself; letting them drift would show wrong numbers
 * on every profile and feed card.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const viewer = await requireUser();

    const target = await prisma.user.findUnique({
      where: { handle: params.handle },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.id === viewer.id) {
      throw new HttpError(400, "You cannot follow yourself");
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewer.id, followingId: target.id },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.follow.delete({ where: { id: existing.id } }),
        prisma.user.update({
          where: { id: viewer.id },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: target.id },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ following: false });
    }

    await prisma.$transaction([
      prisma.follow.create({
        data: { followerId: viewer.id, followingId: target.id },
      }),
      prisma.user.update({
        where: { id: viewer.id },
        data: { followingCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: target.id },
        data: { followerCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ following: true });
  } catch (error) {
    return respondToError(error);
  }
}
