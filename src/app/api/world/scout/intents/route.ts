import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { requireWorldUser } from "@/lib/world/session";
import { getCurrentSeason } from "@/lib/world/seasons";
import { sha256Hex } from "@/lib/world/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["ROLE", "PARTNER_PROJECT", "REGION_ADOPT", "RESEARCH_QUESTION"]),
  text: z.string().min(10).max(1000),
  tags: z.array(z.string().min(1).max(30)).max(12).default([]),
  constraints: z.object({ minTrust: z.number().min(0).max(1.5).optional(), regionSlug: z.string().optional() }).optional(),
});

/** INTENT: what I am looking for. Season-scoped; it goes stale on purpose. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  const season = await getCurrentSeason();
  const expiresAt = season && season.endsAt > new Date() ? season.endsAt : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const intent = await prisma.scoutIntent.create({
    data: {
      userId: user.id,
      seasonId: season?.id,
      type: body.type,
      text: body.text,
      tags: (body.tags ?? []).map((t) => t.toLowerCase().trim()),
      constraints: body.constraints ?? undefined,
      expiresAt,
    },
  });
  await prisma.scoutLog.create({ data: { type: "INTENT", fromUserId: user.id, payloadHash: sha256Hex(intent.id, body.type, body.text) } });
  return ok(intent, { status: 201 });
});
