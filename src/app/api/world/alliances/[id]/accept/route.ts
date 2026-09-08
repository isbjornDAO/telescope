import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { getCurrentSeason, seasonPhase } from "@/lib/world/seasons";

export const dynamic = "force-dynamic";

/** Any member of a listed faction accepts for it. All accepted → ACTIVE. */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const alliance = await prisma.alliance.findUnique({ where: { id: params.id } });
  if (!alliance) throw new WorldError("No such alliance.", 404);
  if (!user.factionId || !alliance.factionIds.includes(user.factionId)) throw new WorldError("Your faction is not part of this alliance.", 403);
  if (alliance.status !== "PROPOSED") throw new WorldError("This alliance is settled.", 409);
  const season = await getCurrentSeason();
  if (!season || season.number !== alliance.seasonNumber || !["building", "upcoming"].includes(seasonPhase(season))) {
    throw new WorldError("Alliances register before voting opens.", 409);
  }
  const accepted = Array.from(new Set([...alliance.acceptedIds, user.factionId]));
  const all = alliance.factionIds.every((id) => accepted.includes(id));
  const updated = await prisma.alliance.update({ where: { id: alliance.id }, data: { acceptedIds: accepted, status: all ? "ACTIVE" : "PROPOSED" } });
  return ok(updated);
});
