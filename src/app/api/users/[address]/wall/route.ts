import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWorldSession, isWorldAdmin } from "@/lib/world/session";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(500, "Message cannot exceed 500 characters"),
  authorName: z.string().trim().max(40).optional(),
  authorAddress: z.string().trim().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const rawKey = decodeURIComponent(params.address).toLowerCase();
    const messages = await prisma.wallMessage.findMany({
      where: { profileAddress: rawKey },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch wall messages:", error);
    return NextResponse.json({ error: "Failed to fetch wall messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const rawKey = decodeURIComponent(params.address).toLowerCase();
    const json = await req.json();
    const body = postSchema.parse(json);

    const session = getWorldSession(req);
    let authorAddress: string | null = null;
    let authorName = body.authorName || "Guest Visitor";

    if (session) {
      authorAddress = session.address.toLowerCase();
      const user = await prisma.user.findFirst({
        where: { address: { equals: session.address, mode: "insensitive" } },
        select: { handle: true },
      });
      authorName = user?.handle ? `@${user.handle}` : `${authorAddress.slice(0, 6)}...${authorAddress.slice(-4)}`;
    } else if (body.authorAddress && body.authorAddress.startsWith("0x")) {
      authorAddress = body.authorAddress.toLowerCase();
      if (!body.authorName) {
        authorName = `${authorAddress.slice(0, 6)}...${authorAddress.slice(-4)}`;
      }
    }

    const message = await prisma.wallMessage.create({
      data: {
        profileAddress: rawKey,
        authorAddress,
        authorName,
        content: body.content,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Failed to post wall message:", error);
    return NextResponse.json({ error: "Failed to post wall message" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const session = getWorldSession(req);
    if (!session) {
      return NextResponse.json({ error: "Sign in required to delete messages" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("id");
    if (!messageId) {
      return NextResponse.json({ error: "Message id required" }, { status: 400 });
    }

    const message = await prisma.wallMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const rawKey = decodeURIComponent(params.address).toLowerCase();
    const callerAddress = session.address.toLowerCase();
    const callerUser = await prisma.user.findFirst({
      where: { address: { equals: session.address, mode: "insensitive" } },
      select: { address: true, discordId: true, handle: true },
    });

    const isOwner = callerAddress === rawKey || callerUser?.handle?.toLowerCase() === rawKey;
    const isAuthor = message.authorAddress?.toLowerCase() === callerAddress;
    const isAdmin = callerUser ? isWorldAdmin(callerUser) : false;

    if (!isOwner && !isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to delete this message" }, { status: 403 });
    }

    await prisma.wallMessage.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete wall message:", error);
    return NextResponse.json({ error: "Failed to delete wall message" }, { status: 500 });
  }
}
