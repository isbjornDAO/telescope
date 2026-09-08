import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession, requireWorldUser } from "@/lib/world/session";
import { displayName, publicEntry } from "@/lib/world/privacy";
import { trustBand } from "@/lib/world/trust";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const faction = await prisma.faction.findUnique({
    where: { slug: params.slug },
    include: {
      crews: { include: { region: { select: { name: true, slug: true } }, _count: { select: { members: { where: { leftAt: null } } } } } },
      entries: { include: { season: { select: { number: true, name: true, status: true } }, crew: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { members: true } },
    },
  });
  if (!faction) throw new WorldError("No such faction.", 404);
  const [founder, alliances, standingEvents, memberRegions] = await Promise.all([
    prisma.user.findUnique({ where: { id: faction.founderId }, select: { handle: true, address: true } }),
    prisma.alliance.findMany({ where: { factionIds: { has: faction.id }, status: { in: ["PROPOSED", "ACTIVE"] } }, orderBy: { seasonNumber: "desc" } }),
    prisma.standingEvent.findMany({ where: { targetType: "FACTION", targetId: faction.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findMany({ where: { factionId: faction.id, regionId: { not: null } }, select: { region: { select: { name: true, slug: true } } } }),
  ]);
  const regionMap = new Map<string, { name: string; slug: string }>();
  for (const c of faction.crews) if (c.region) regionMap.set(c.region.slug, c.region);
  for (const m of memberRegions) if (m.region) regionMap.set(m.region.slug, m.region);
  const allianceFactions = await prisma.faction.findMany({
    where: { id: { in: alliances.flatMap((a) => a.factionIds) } },
    select: { id: true, name: true, slug: true },
  });
  const nameById = new Map(allianceFactions.map((f) => [f.id, f]));

  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } }) : null;

  return ok(
    {
      name: faction.name,
      slug: faction.slug,
      vision: faction.vision,
      description: faction.description,
      avatar: faction.avatar,
      standing: faction.standing,
      standingBand: trustBand(faction.standing),
      treasury: faction.treasury,
      founder: founder ? displayName(founder) : null,
      members: faction._count.members,
      regions: Array.from(regionMap.values()),
      lasting: regionMap.size > 1 && faction.crews.length > 1,
      crews: faction.crews.map((c) => ({ name: c.name, slug: c.slug, standing: c.standing, region: c.region, members: c._count.members })),
      record: faction.entries.map((e) => {
        const closed = e.season.status === "CLOSED" || e.season.status === "VESTED";
        const p = publicEntry(e, closed);
        return { id: p.id, title: p.blind ? "Research paper (private)" : p.title, tournament: p.tournament, status: p.status, isVictor: p.isVictor, season: e.season, crew: p.blind ? null : e.crew };
      }),
      alliances: alliances.map((a) => ({ id: a.id, name: a.name, seasonNumber: a.seasonNumber, status: a.status, terms: a.terms, factions: a.factionIds.map((id) => nameById.get(id) ?? { id, name: "?", slug: "" }), accepted: a.acceptedIds })),
      standingHistory: standingEvents,
      viewer: { isMember: me?.factionId === faction.id, isFounder: me?.id === faction.founderId },
      createdAt: faction.createdAt,
    },
    noStore
  );
});

const patch = z.object({ vision: z.string().min(10).max(600).optional(), description: z.string().max(1200).optional(), avatar: z.string().url().optional() });

export const PATCH = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const faction = await prisma.faction.findUnique({ where: { slug: params.slug } });
  if (!faction) throw new WorldError("No such faction.", 404);
  if (faction.founderId !== user.id) throw new WorldError("Founder only, for now.", 403);
  const body = await parseBody(req, patch);
  const updated = await prisma.faction.update({ where: { id: faction.id }, data: body });
  return ok({ slug: updated.slug, vision: updated.vision, description: updated.description });
});
