import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { isWorldAdmin, requireWorldUser } from "@/lib/world/session";
import { isRegionAdmin } from "@/lib/world/queries";
import { hashCheckInCode, randomToken } from "@/lib/world/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

/**
 * A region admin opens a room. The check-in code is returned exactly once
 * (put it on a QR at the door); only its hash is stored.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const region = await prisma.region.findUnique({ where: { slug: params.slug } });
  if (!region) throw new WorldError("No such region.", 404);
  if (!isWorldAdmin(user) && !isRegionAdmin(user, region)) throw new WorldError("Region admins only.", 403);
  const body = await parseBody(req, schema);
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (endsAt <= startsAt) throw new WorldError("The event must end after it starts.", 422);
  const code = randomToken(4).toUpperCase();
  const event = await prisma.regionEvent.create({
    data: { regionId: region.id, name: body.name, startsAt, endsAt, codeHash: hashCheckInCode(code), createdBy: user.address },
  });
  return ok({ id: event.id, name: event.name, startsAt, endsAt, code, checkInUrl: `/regions/${region.slug}/events/${event.id}?code=${code}` }, { status: 201 });
});
