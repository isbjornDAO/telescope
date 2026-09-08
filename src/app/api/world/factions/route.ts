import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, slugify } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { assertCanMoveFaction, currentSeasonNumber } from "@/lib/world/queries";
import { getCurrentSeason } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const factions = await prisma.faction.findMany({
    orderBy: [{ standing: "desc" }, { createdAt: "asc" }],
    include: {
      crews: { select: { regionId: true } },
      _count: { select: { members: true, crews: true, entries: true } },
    },
  });
  const victors = await prisma.entry.findMany({ where: { isVictor: true, factionId: { in: factions.map((f) => f.id) } }, select: { factionId: true, season: { select: { name: true } } } });
  const victorByFaction = new Map(victors.map((v) => [v.factionId, v.season.name]));
  return ok(
    factions.map((f) => ({
      name: f.name,
      slug: f.slug,
      vision: f.vision,
      avatar: f.avatar,
      standing: f.standing,
      members: f._count.members,
      crews: f._count.crews,
      entries: f._count.entries,
      regions: new Set(f.crews.map((c) => c.regionId).filter(Boolean)).size,
      victor: victorByFaction.get(f.id) ?? null,
    }))
  );
});

const schema = z.object({
  name: z.string().min(2).max(40),
  vision: z.string().min(10).max(600),
  description: z.string().max(1200).optional(),
  crewSlug: z.string(),
});

/**
 * Factions form around visions, not tokens. The founder brings a crew they
 * lead; a faction with one crew in one region is a crew with ambitions
 * until more join. Founding requirements are an open question.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  const season = await getCurrentSeason();
  await assertCanMoveFaction(user, season);
  const crew = await prisma.crew.findUnique({ where: { slug: body.crewSlug }, include: { members: { where: { leftAt: null } } } });
  if (!crew) throw new WorldError("No such crew.", 404);
  const lead = crew.members.find((m) => m.userId === user.id && m.isLead);
  if (!lead) throw new WorldError("Bring a crew you lead.", 403);
  if (crew.factionId) throw new WorldError("That crew already belongs to a faction.", 409);
  const slug = slugify(body.name);
  if (!slug) throw new WorldError("Name must contain letters or digits.", 422);
  const exists = await prisma.faction.findFirst({ where: { OR: [{ slug }, { name: body.name }] } });
  if (exists) throw new WorldError("A faction with that name exists.", 409);

  const seasonNumber = await currentSeasonNumber();
  const faction = await prisma.faction.create({ data: { name: body.name, slug, vision: body.vision, description: body.description, founderId: user.id } });
  await prisma.crew.update({ where: { id: crew.id }, data: { factionId: faction.id } });
  // members with no faction join; members with another faction keep theirs (they can move between seasons)
  await prisma.user.updateMany({
    where: { id: { in: crew.members.map((m) => m.userId) }, factionId: null },
    data: { factionId: faction.id, factionJoinedSeasonNumber: seasonNumber },
  });
  await prisma.user.update({ where: { id: user.id }, data: { factionId: faction.id, factionJoinedSeasonNumber: seasonNumber } });
  return ok({ slug: faction.slug, name: faction.name }, { status: 201 });
});
