import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession, isWorldAdmin } from "@/lib/world/session";
import { isRegionAdmin } from "@/lib/world/queries";
import { displayName } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

/** Event view. Attendee list is for the room's admins; everyone else sees counts and their own check-in. */
export const GET = handle(async (req: NextRequest, { params }: { params: { slug: string; eventId: string } }) => {
  const event = await prisma.regionEvent.findUnique({ where: { id: params.eventId }, include: { region: true, _count: { select: { checkIns: true } } } });
  if (!event || event.region.slug !== params.slug) throw new WorldError("No such event.", 404);
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } }) : null;
  const admin = !!me && (isWorldAdmin(me) || isRegionAdmin(me, event.region));
  const myCheckIn = me ? await prisma.eventCheckIn.findUnique({ where: { eventId_userId: { eventId: event.id, userId: me.id } } }) : null;

  let attendees: { id: string; name: string; handle: string | null; nodeType: string; checkedInAt: Date }[] | undefined;
  let pendingVouches = 0;
  if (admin) {
    const rows = await prisma.eventCheckIn.findMany({ where: { eventId: event.id }, include: { user: true }, orderBy: { checkedInAt: "asc" } });
    attendees = rows.map((r) => ({ id: r.user.id, name: displayName(r.user), handle: r.user.handle, nodeType: r.user.nodeType, checkedInAt: r.checkedInAt }));
    pendingVouches = await prisma.vouch.count({ where: { eventId: event.id, status: "PENDING" } });
  } else if (myCheckIn) {
    // Attendees who checked in can see each other's chosen names, to vouch. That is what a room is.
    const rows = await prisma.eventCheckIn.findMany({ where: { eventId: event.id }, include: { user: true } });
    attendees = rows.map((r) => ({ id: r.user.id, name: displayName(r.user), handle: r.user.handle, nodeType: r.user.nodeType, checkedInAt: r.checkedInAt }));
  }
  return ok(
    {
      id: event.id,
      name: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      region: { name: event.region.name, slug: event.region.slug },
      checkIns: event._count.checkIns,
      checkedIn: !!myCheckIn,
      isAdmin: admin,
      attendees,
      pendingVouches,
    },
    noStore
  );
});
