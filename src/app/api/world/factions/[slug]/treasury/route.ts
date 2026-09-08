import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** Season One treasuries are ledger entries, paid out manually. Members see the ledger. */
export const GET = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const faction = await prisma.faction.findUnique({ where: { slug: params.slug } });
  if (!faction) throw new WorldError("No such faction.", 404);
  if (user.factionId !== faction.id) throw new WorldError("Members only.", 403);
  const entries = await prisma.treasuryEntry.findMany({ where: { factionId: faction.id }, orderBy: { createdAt: "desc" } });
  return ok({ balance: faction.treasury, entries }, noStore);
});
