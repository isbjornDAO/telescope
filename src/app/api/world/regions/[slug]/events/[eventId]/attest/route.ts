import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { isWorldAdmin, requireWorldUser } from "@/lib/world/session";
import { isRegionAdmin } from "@/lib/world/queries";
import { promoteAnchorIfAttested, recomputeTrustScores } from "@/lib/world/trust-db";

export const dynamic = "force-dynamic";

const schema = z.object({ vouchIds: z.array(z.string()).optional() });

/**
 * The region attests the room: pending in-person vouches between people
 * who checked in become active. Receivers vouched by an Anchor, Elder or
 * region admin become Anchors. This is the only link that creates one.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string; eventId: string } }) => {
  const user = await requireWorldUser(req);
  const event = await prisma.regionEvent.findUnique({ where: { id: params.eventId }, include: { region: true } });
  if (!event || event.region.slug !== params.slug) throw new WorldError("No such event.", 404);
  if (!isWorldAdmin(user) && !isRegionAdmin(user, event.region)) throw new WorldError("Region admins only.", 403);
  const body = await parseBody(req, schema).catch(() => ({ vouchIds: undefined }));

  const pending = await prisma.vouch.findMany({
    where: { eventId: event.id, status: "PENDING", ...(body.vouchIds ? { id: { in: body.vouchIds } } : {}) },
  });
  const now = new Date();
  for (const v of pending) {
    await prisma.vouch.update({ where: { id: v.id }, data: { status: "ACTIVE", attestedBy: user.address, attestedAt: now } });
    await promoteAnchorIfAttested(v.id);
  }
  const trust = await recomputeTrustScores();
  return ok({ attested: pending.length, trust });
});
