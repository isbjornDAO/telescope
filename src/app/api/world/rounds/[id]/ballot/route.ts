import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { activeEntriesForRound } from "@/lib/world/seasons";
import { encryptJson, voterKey } from "@/lib/world/crypto";
import { normalizeAllocations, voterBaseWeight, type BallotPayload } from "@/lib/world/voting";
import { alliedFactionIds } from "@/lib/world/queries";
import { VOTING } from "@/lib/world/config";

export const dynamic = "force-dynamic";

const schema = z.object({
  allocations: z.array(z.object({ entryId: z.string(), share: z.number().positive() })).min(1).max(VOTING.maxAllocationsPerBallot),
});

/**
 * Cast or replace your ballot for an open GTM round. Stored encrypted; the
 * only plaintext is an HMAC of (round, voter) so you can change your mind
 * until the round closes. Never shown to entrants. Tally is public at close.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const round = await prisma.round.findUnique({ where: { id: params.id }, include: { season: true } });
  if (!round) throw new WorldError("No such round.", 404);
  if (round.tournament !== "GTM") throw new WorldError("Only GTM is decided by community vote.", 409);
  if (round.status !== "OPEN") throw new WorldError("This round is not open.", 409);
  const baseWeight = voterBaseWeight(user.trustScore, user.nodeType);
  if (baseWeight <= 0) throw new WorldError("Votes from nodes with no path to an Anchor carry no weight. Get vouched first.", 403);

  const { allocations } = await parseBody(req, schema);
  const entries = await activeEntriesForRound(round);
  const ids = new Set(entries.map((e) => e.id));
  for (const a of allocations) if (!ids.has(a.entryId)) throw new WorldError("An allocation points at an entry not in this round.", 422);
  const normalized = normalizeAllocations(allocations);
  if (normalized.length === 0) throw new WorldError("Spread some weight.", 422);

  const payload: BallotPayload = {
    voterId: user.id,
    nodeType: user.nodeType,
    factionId: user.factionId,
    allianceFactionIds: await alliedFactionIds(user.factionId, round.season.number),
    baseWeight,
    allocations: normalized,
  };
  const key = voterKey(round.id, user.id);
  const existing = await prisma.ballot.findUnique({ where: { roundId_voterKey: { roundId: round.id, voterKey: key } } });
  if (existing) {
    await prisma.ballot.update({ where: { id: existing.id }, data: { ciphertext: encryptJson(payload) } });
  } else {
    await prisma.ballot.create({ data: { roundId: round.id, voterKey: key, ciphertext: encryptJson(payload) } });
    await prisma.round.update({ where: { id: round.id }, data: { ballotCount: { increment: 1 } } });
  }
  return ok({ cast: true, weight: baseWeight, replaced: !!existing }, { status: existing ? 200 : 201 });
});
