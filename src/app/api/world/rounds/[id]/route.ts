import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession } from "@/lib/world/session";
import { voterKey } from "@/lib/world/crypto";
import { voterBaseWeight } from "@/lib/world/voting";
import { displayName } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const round = await prisma.round.findUnique({ where: { id: params.id }, include: { season: { select: { number: true, name: true } } } });
  if (!round) throw new WorldError("No such round.", 404);
  const entries = await prisma.entry.findMany({
    where: { seasonId: round.seasonId, tournament: round.tournament, status: { in: ["ACTIVE", "FINALIST", "WINNER", "ELIMINATED"] } },
    include: { crew: { select: { name: true, slug: true } }, faction: { select: { name: true, slug: true } }, author: { select: { handle: true, address: true } } },
    orderBy: { createdAt: "asc" },
  });
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } }) : null;
  let viewer: { canVote: boolean; weight: number; voted: boolean; reason: string | null } = { canVote: false, weight: 0, voted: false, reason: null };
  if (me) {
    const weight = voterBaseWeight(me.trustScore, me.nodeType);
    const voted = !!(await prisma.ballot.findUnique({ where: { roundId_voterKey: { roundId: round.id, voterKey: voterKey(round.id, me.id) } } }));
    viewer = {
      canVote: round.tournament === "GTM" && round.status === "OPEN" && weight > 0,
      weight,
      voted,
      reason: weight > 0 ? null : "Votes from nodes with no path to an Anchor carry no weight.",
    };
  }
  const live = round.status === "OPEN";
  const inRound = round.index === 0 ? entries.filter((e) => e.status !== "ELIMINATED" || (e.eliminatedRound ?? -1) >= round.index) : entries.filter((e) => (e.eliminatedRound ?? Infinity) >= round.index);
  const tally = (round.tally ?? {}) as Record<string, number>;
  return ok(
    {
      id: round.id,
      season: round.season,
      tournament: round.tournament,
      index: round.index,
      name: round.name,
      threshold: round.threshold,
      opensAt: round.opensAt,
      closesAt: round.closesAt,
      status: round.status,
      ballotCount: round.ballotCount,
      totalWeight: live ? null : round.totalWeight,
      tallyHash: round.tallyHash,
      entries: inRound.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        url: e.url,
        crew: e.crew,
        faction: e.faction,
        author: e.tournament === "RESEARCH_PAPERS" ? null : displayName(e.author),
        status: e.status,
        weight: live ? null : tally[e.id] ?? 0,
        share: live || !round.totalWeight ? null : (tally[e.id] ?? 0) / round.totalWeight,
        advanced: round.advancedIds.includes(e.id),
      })),
      viewer,
    },
    noStore
  );
});
