import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorldAdmin } from "@/lib/world/session";
import { findNode } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

const DEFAULT_BADGES = [
  {
    name: "Pioneer Node",
    description: "Among the first pioneer nodes to explore Telescope",
    icon: "🌟",
    rarity: "Legendary",
    bg: "from-amber-400 to-amber-600",
  },
  {
    name: "Core Contributor",
    description: "Made substantial contributions to the core Telescope protocol",
    icon: "⚡",
    rarity: "Epic",
    bg: "from-sky-500 to-blue-600",
  },
  {
    name: "Summit Speaker",
    description: "Presented technical sessions or workshops at Avalanche summits",
    icon: "🎤",
    rarity: "Rare",
    bg: "from-purple-500 to-indigo-600",
  },
  {
    name: "Security Guardian",
    description: "Disclosed security findings and hardened smart contract safety",
    icon: "🛡️",
    rarity: "Epic",
    bg: "from-emerald-400 to-teal-600",
  },
  {
    name: "Community Champion",
    description: "Demonstrated outstanding leadership and assistance in the community",
    icon: "🤝",
    rarity: "Rare",
    bg: "from-pink-500 to-rose-600",
  },
  {
    name: "Master Builder",
    description: "Shipped verified critical infrastructure for decentralized networks",
    icon: "📦",
    rarity: "Legendary",
    bg: "from-blue-500 to-cyan-600",
  },
  {
    name: "Elder Council",
    description: "Recognized sovereign Elder of the Telescope network",
    icon: "👑",
    rarity: "Epic",
    bg: "from-purple-500 to-indigo-600",
  },
];

export async function GET() {
  try {
    let badges = await prisma.badge.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (badges.length === 0) {
      for (const b of DEFAULT_BADGES) {
        await prisma.badge.upsert({
          where: { name: b.name },
          update: {},
          create: b,
        });
      }
      badges = await prisma.badge.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(badges, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch badges:", error);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

const awardSchema = z.object({
  target: z.string().trim().min(1, "Target address or handle is required"),
  badgeId: z.string().optional(),
  badgeName: z.string().optional(),
  reason: z.string().trim().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireWorldAdmin(req);
    const json = await req.json();
    const body = awardSchema.parse(json);

    const user = await findNode(body.target);
    if (!user) {
      return NextResponse.json({ error: "No such user or node found." }, { status: 404 });
    }

    let badge = null;
    if (body.badgeId) {
      badge = await prisma.badge.findUnique({ where: { id: body.badgeId } });
    } else if (body.badgeName) {
      badge = await prisma.badge.findUnique({ where: { name: body.badgeName } });
    }

    if (!badge) {
      return NextResponse.json({ error: "Badge not found." }, { status: 404 });
    }

    // Check if already awarded
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: user.id,
          badgeId: badge.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "This badge has already been awarded to this user." }, { status: 409 });
    }

    const userBadge = await prisma.userBadge.create({
      data: {
        userId: user.id,
        badgeId: badge.id,
        awardedBy: admin.address,
        reason: body.reason || undefined,
      },
      include: {
        badge: true,
      },
    });

    return NextResponse.json(userBadge, { status: 201 });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Failed to award badge:", error);
    return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
  }
}
