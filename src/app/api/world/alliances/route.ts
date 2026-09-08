import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { getCurrentSeason, seasonPhase } from "@/lib/world/seasons";
import { PROPOSALS } from "@/lib/world/config";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const seasonParam = req.nextUrl.searchParams.get("season");
  const season = seasonParam ? Number(seasonParam) : (await getCurrentSeason())?.number;
  const alliances = await prisma.alliance.findMany({ where: season ? { seasonNumber: season } : undefined, orderBy: { createdAt: "desc" } });
  const factions = await prisma.faction.findMany({ where: { id: { in: alliances.flatMap((a) => a.factionIds) } }, select: { id: true, name: true, slug: true } });
  const byId = new Map(factions.map((f) => [f.id, f]));
  return ok(alliances.map((a) => ({ ...a, factions: a.factionIds.map((id) => byId.get(id) ?? { id, name: "?", slug: "" }) })));
});

const schema = z.object({
  name: z.string().min(2).max(60),
  factionSlugs: z.array(z.string()).min(1),
  terms: z.string().min(10).max(1200),
  shareSplit: z.record(z.number().min(0).max(1)).optional(),
});

/**
 * Alliances register before voting opens and share standing by terms set
 * in advance. Proposer's faction accepts by proposing; the others accept.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  if (!user.factionId) throw new WorldError("Join a faction first.", 409);
  const season = await getCurrentSeason();
  if (!season) throw new WorldError("No season to ally in.", 409);
  const phase = seasonPhase(season);
  if (phase !== "building" && phase !== "upcoming") throw new WorldError("Alliances register before voting opens.", 409);
  const body = await parseBody(req, schema);
  const others = await prisma.faction.findMany({ where: { slug: { in: body.factionSlugs } } });
  if (others.length !== body.factionSlugs.length) throw new WorldError("Unknown faction in the list.", 404);
  const ids = Array.from(new Set([user.factionId, ...others.map((f) => f.id)]));
  if (ids.length < 2) throw new WorldError("An alliance needs at least two factions.", 422);
  if (ids.length > 2 && !PROPOSALS.alliancesBeyondTwo) throw new WorldError("Alliances are limited to two factions this season.", 422);

  const split: Record<string, number> = {};
  if (body.shareSplit) {
    const bySlug = new Map(others.map((f) => [f.slug, f.id]));
    const mine = await prisma.faction.findUnique({ where: { id: user.factionId }, select: { slug: true } });
    if (mine) bySlug.set(mine.slug, user.factionId);
    for (const [slug, v] of Object.entries(body.shareSplit)) {
      const id = bySlug.get(slug);
      if (id) split[id] = v;
    }
    const total = Object.values(split).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 1) > 0.01) throw new WorldError("Share split must add up to 1.", 422);
  } else {
    for (const id of ids) split[id] = 1 / ids.length;
  }

  const alliance = await prisma.alliance.create({
    data: { seasonNumber: season.number, name: body.name, factionIds: ids, acceptedIds: [user.factionId], terms: body.terms, shareSplit: split, proposedById: user.id },
  });
  return ok(alliance, { status: 201 });
});
