import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { hashCheckInCode, safeEqualHex } from "@/lib/world/crypto";

export const dynamic = "force-dynamic";

/** Scan the QR, enter the code, you were in the room. */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string; eventId: string } }) => {
  const user = await requireWorldUser(req);
  const { code } = await parseBody(req, z.object({ code: z.string().min(4).max(32) }));
  const event = await prisma.regionEvent.findUnique({ where: { id: params.eventId }, include: { region: { select: { slug: true, id: true } } } });
  if (!event || event.region.slug !== params.slug) throw new WorldError("No such event.", 404);
  const now = new Date();
  const grace = 6 * 60 * 60 * 1000;
  if (now < new Date(event.startsAt.getTime() - grace) || now > new Date(event.endsAt.getTime() + grace)) {
    throw new WorldError("Check-in is only open around the event.", 409);
  }
  if (!safeEqualHex(hashCheckInCode(code), event.codeHash)) throw new WorldError("Wrong code.", 401);
  const checkIn = await prisma.eventCheckIn.upsert({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    create: { eventId: event.id, userId: user.id },
    update: {},
  });
  if (!user.regionId) await prisma.user.update({ where: { id: user.id }, data: { regionId: event.region.id } });
  return ok({ checkedInAt: checkIn.checkedInAt });
});
