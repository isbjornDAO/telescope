import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, slugify } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin, findOrCreateByAddress } from "@/lib/world/session";
import { ADDRESS_RE } from "@/lib/world/queries";
import { PROPOSALS } from "@/lib/world/config";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, crews: true } } },
  });
  const anchors = await prisma.user.groupBy({ by: ["regionId"], where: { nodeType: { in: ["ANCHOR", "ELDER"] } }, _count: { _all: true } });
  const anchorsByRegion = new Map(anchors.map((a) => [a.regionId, a._count._all]));
  return ok(
    regions.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      country: r.country,
      lat: r.lat,
      lng: r.lng,
      isChapter: r.isChapter,
      runsNode: PROPOSALS.regionsRunNodes && r.runsNode,
      standing: r.standing,
      nodes: r._count.users,
      crews: r._count.crews,
      anchors: anchorsByRegion.get(r.id) ?? 0,
    }))
  );
});

const schema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(600).optional(),
  country: z.string().max(60).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isChapter: z.boolean().optional(),
  adminAddresses: z.array(z.string().regex(ADDRESS_RE)).default([]),
});

/** World admin creates a region. Region admins are seeded as Anchors: they are the room. */
export const POST = handle(async (req: NextRequest) => {
  await requireWorldAdmin(req);
  const body = await parseBody(req, schema);
  const slug = slugify(body.name);
  if (!slug) throw new WorldError("Name must contain letters or digits.", 422);
  const exists = await prisma.region.findFirst({ where: { OR: [{ slug }, { name: body.name }] } });
  if (exists) throw new WorldError("A region with that name exists.", 409);
  const admins = (body.adminAddresses ?? []).map((a) => a.toLowerCase());
  const region = await prisma.region.create({ data: { ...body, slug, adminAddresses: admins } });
  for (const address of admins) {
    const u = await findOrCreateByAddress(address);
    await prisma.user.update({
      where: { id: u.id },
      data: { regionId: u.regionId ?? region.id, nodeType: u.nodeType === "NODE" ? "ANCHOR" : u.nodeType, anchoredAt: u.anchoredAt ?? new Date() },
    });
  }
  return ok(region, { status: 201 });
});
