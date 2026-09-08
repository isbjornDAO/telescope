import { NextRequest } from "next/server";
import { handle, ok, noStore } from "@/lib/world/api";
import { getWorldSession, isWorldAdmin, findOrCreateByAddress } from "@/lib/world/session";
import { budgetFor } from "@/lib/world/scout";
import { currentSeasonNumber } from "@/lib/world/queries";
import { displayName } from "@/lib/world/privacy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const session = getWorldSession(req);
  if (!session) return ok({ signedIn: false }, noStore);
  const user = await findOrCreateByAddress(session.address);
  const seasonNumber = await currentSeasonNumber();
  const [faction, region, offers, reviews] = await Promise.all([
    user.factionId ? prisma.faction.findUnique({ where: { id: user.factionId }, select: { name: true, slug: true } }) : null,
    user.regionId ? prisma.region.findUnique({ where: { id: user.regionId }, select: { name: true, slug: true } }) : null,
    prisma.scoutMatch.count({
      where: {
        OR: [
          { userAId: user.id, status: { in: ["OFFERED", "ACCEPTED_B"] } },
          { userBId: user.id, status: { in: ["OFFERED", "ACCEPTED_A"] } },
        ],
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.review.count({ where: { reviewerId: user.id, submittedAt: null } }),
  ]);
  return ok(
    {
      signedIn: true,
      address: user.address,
      handle: user.handle,
      name: displayName(user),
      nodeType: user.nodeType,
      trustScore: user.trustScore,
      standing: user.standing,
      faction,
      region,
      isAdmin: isWorldAdmin(user),
      isElder: user.nodeType === "ELDER",
      scoutBudget: budgetFor(user, seasonNumber),
      pendingOffers: offers,
      pendingReviews: reviews,
      seasonNumber,
    },
    noStore
  );
});
