import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession, isWorldAdmin, requireWorldUser } from "@/lib/world/session";
import { ADDRESS_RE, isRegionAdmin } from "@/lib/world/queries";
import { displayName } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
    include: {
      crews: { select: { name: true, slug: true, standing: true, faction: { select: { name: true, slug: true } } } },
      events: { orderBy: { startsAt: "desc" }, take: 20, select: { id: true, name: true, startsAt: true, endsAt: true, _count: { select: { checkIns: true } } } },
      _count: { select: { users: true } },
    },
  });
  if (!region) throw new WorldError("No such region.", 404);
  const [anchors, elders, entries, factions] = await Promise.all([
    prisma.user.count({ where: { regionId: region.id, nodeType: "ANCHOR" } }),
    prisma.user.count({ where: { regionId: region.id, nodeType: "ELDER" } }),
    prisma.entry.findMany({
      where: { regionId: region.id, status: { notIn: ["DRAFT", "WITHDRAWN"] } },
      select: { id: true, title: true, tournament: true, status: true, season: { select: { number: true, name: true } } },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.faction.findMany({ where: { crews: { some: { regionId: region.id } } }, select: { name: true, slug: true, standing: true } }),
  ]);
  const session = getWorldSession(req);
  let viewer: { isAdmin: boolean; isMember: boolean; isRegionAdmin: boolean } = { isAdmin: false, isMember: false, isRegionAdmin: false };
  if (session) {
    const me = await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } });
    if (me) viewer = { isAdmin: isWorldAdmin(me), isMember: me.regionId === region.id, isRegionAdmin: isRegionAdmin(me, region) };
  }
  const { adminAddresses, ...pub } = region;
  return ok(
    {
      ...pub,
      admins: viewer.isAdmin || viewer.isRegionAdmin ? adminAddresses : adminAddresses.length,
      nodes: region._count.users,
      anchors,
      elders,
      localSystems: entries,
      factions,
      viewer,
    },
    noStore
  );
});

const patch = z.object({
  description: z.string().max(600).optional(),
  country: z.string().max(60).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  runsNode: z.boolean().optional(),
  adminAddresses: z.array(z.string().regex(ADDRESS_RE)).optional(),
});

export const PATCH = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const region = await prisma.region.findUnique({ where: { slug: params.slug } });
  if (!region) throw new WorldError("No such region.", 404);
  if (!isWorldAdmin(user) && !isRegionAdmin(user, region)) throw new WorldError("Region admins only.", 403);
  const body = await parseBody(req, patch);
  if (body.adminAddresses && !isWorldAdmin(user)) delete body.adminAddresses;
  const updated = await prisma.region.update({
    where: { id: region.id },
    data: { ...body, adminAddresses: body.adminAddresses?.map((a) => a.toLowerCase()) },
  });
  return ok({ ...updated, adminAddresses: undefined, by: displayName(user) });
});
