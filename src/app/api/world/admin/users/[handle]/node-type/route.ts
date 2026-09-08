import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldAdmin } from "@/lib/world/session";
import { requireNode } from "@/lib/world/queries";
import { recomputeTrustScores } from "@/lib/world/trust-db";
import { PROPOSALS } from "@/lib/world/config";

export const dynamic = "force-dynamic";

/** (proposal) Isbjorn seeds the first Elders with Team1. Seeding Anchors bootstraps a region before its first room. */
export const POST = handle(async (req: NextRequest, { params }: { params: { handle: string } }) => {
  await requireWorldAdmin(req);
  if (!PROPOSALS.isbjornSeedsElders) throw new WorldError("Seeding is switched off.", 409);
  const { nodeType } = await parseBody(req, z.object({ nodeType: z.enum(["NODE", "ANCHOR", "ELDER"]) }));
  const node = await requireNode(decodeURIComponent(params.handle));
  const updated = await prisma.user.update({
    where: { id: node.id },
    data: {
      nodeType,
      anchoredAt: nodeType !== "NODE" ? node.anchoredAt ?? new Date() : node.anchoredAt,
      elderSince: nodeType === "ELDER" ? node.elderSince ?? new Date() : null,
    },
  });
  const trust = await recomputeTrustScores();
  return ok({ handle: updated.handle, nodeType: updated.nodeType, trust });
});
