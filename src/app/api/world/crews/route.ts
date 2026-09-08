import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, slugify } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const crews = await prisma.crew.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: [{ standing: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      region: { select: { name: true, slug: true } },
      faction: { select: { name: true, slug: true } },
      _count: { select: { members: { where: { leftAt: null } }, entries: true } },
    },
  });
  const victors = await prisma.entry.findMany({ where: { isVictor: true, crewId: { in: crews.map((c) => c.id) } }, select: { crewId: true, season: { select: { name: true } } } });
  const victorByCrew = new Map(victors.map((v) => [v.crewId, v.season.name]));
  return ok(
    crews.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      avatar: c.avatar,
      standing: c.standing,
      region: c.region,
      faction: c.faction,
      members: c._count.members,
      entries: c._count.entries,
      victor: victorByCrew.get(c.id) ?? null,
    }))
  );
});

const schema = z.object({
  name: z.string().min(2).max(40),
  description: z.string().max(400).optional(),
  regionSlug: z.string().optional(),
});

/** Crews form through scouts, at events, or by invitation. Creator leads. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  const slug = slugify(body.name);
  if (!slug) throw new WorldError("Name must contain letters or digits.", 422);
  const exists = await prisma.crew.findFirst({ where: { OR: [{ slug }, { name: body.name }] } });
  if (exists) throw new WorldError("A crew with that name exists.", 409);
  let regionId = user.regionId ?? undefined;
  if (body.regionSlug) {
    const r = await prisma.region.findUnique({ where: { slug: body.regionSlug } });
    if (!r) throw new WorldError("No such region.", 404);
    regionId = r.id;
  }
  const crew = await prisma.crew.create({
    data: {
      name: body.name,
      slug,
      description: body.description,
      regionId,
      factionId: user.factionId ?? undefined,
      createdById: user.id,
      members: { create: { userId: user.id, isLead: true, role: "lead" } },
    },
  });
  return ok({ slug: crew.slug, name: crew.name }, { status: 201 });
});
