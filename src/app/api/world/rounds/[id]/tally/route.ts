import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { sha256Hex } from "@/lib/world/crypto";

export const dynamic = "force-dynamic";

/** The public, verifiable tally. Recompute the hash yourself: sha256(JSON{roundId, tally, totalWeight}). */
export const GET = handle(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) throw new WorldError("No such round.", 404);
  if (round.status !== "CLOSED") return ok({ status: round.status, ballotCount: round.ballotCount, tally: null });
  const payload = { roundId: round.id, tally: round.tally, totalWeight: round.totalWeight };
  return ok({
    status: round.status,
    ballotCount: round.ballotCount,
    totalWeight: round.totalWeight,
    tally: round.tally,
    advancedIds: round.advancedIds,
    tallyHash: round.tallyHash,
    verifies: sha256Hex(JSON.stringify(payload)) === round.tallyHash,
    closedAt: round.closedAt,
  });
});
