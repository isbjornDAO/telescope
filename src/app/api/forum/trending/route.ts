import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { viewerFromRequest } from "@/lib/world/viewer";
import { canReadThread } from "@/lib/world/forum-access";
import { describeAudience, isRestricted, parseAudience } from "@/lib/world/audience";

const WANTED = 10;

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Over-fetch, because threads this reader may not open are dropped below
    // and the list still needs to fill. Trending crosses every board, so each
    // thread is judged against its own board's policy.
    const threads = await prisma.thread.findMany({
      where: {
        NOT: {
          deleted: true
        }
      },
      take: WANTED * 5,
      orderBy: {
        bumpedAt: 'desc'
      },
      include: {
        posts: {
          take: 1,
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            comment: true,
            imageHash: true
          }
        },
        board: {
          select: {
            name: true,
            audience: true
          }
        }
      }
    });

    const viewer = await viewerFromRequest(request);

    const formattedThreads = threads
      .filter((thread) => canReadThread(thread, thread.board.audience, viewer).allowed)
      .slice(0, WANTED)
      .map(thread => {
        const audience = parseAudience(thread.audience);
        return {
          id: thread.id,
          subject: thread.subject,
          bumpedAt: thread.bumpedAt.toISOString(),
          createdAt: thread.createdAt.toISOString(),
          replyCount: thread.replyCount,
          boardName: thread.board.name,
          posts: thread.posts,
          audienceLabel: describeAudience(audience),
          restricted: isRestricted(audience)
        };
      });

    return NextResponse.json(formattedThreads);
  } catch (error) {
    console.error("Error fetching trending threads:", error);
    return NextResponse.json({ error: "Failed to fetch trending threads" }, { status: 500 });
  }
}

