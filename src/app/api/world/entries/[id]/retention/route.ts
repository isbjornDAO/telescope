import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isCrewMember } from "@/lib/world/queries";
import { countActiveWallets } from "@/lib/world/retention";

export const dynamic = "force-dynamic";

const schema = z.object({ wallets: z.array(z.string()).max(50000) });

/**
 * A GTM product reports the wallets that made a meaningful transaction in
 * the trailing 30 days. Only trust-graph wallets count, so sybil users do
 * not move the number. Day 0 is frozen at season close; day 90 vests.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const entry = await prisma.entry.findUnique({ where: { id: params.id } });
  if (!entry || entry.tournament !== "GTM") throw new WorldError("Retention is reported by GTM entries.", 404);
  const mine = user.id === entry.authorId || (entry.crewId ? await isCrewMember(user.id, entry.crewId) : false);
  if (!mine) throw new WorldError("Not your entry.", 403);
  const { wallets } = await parseBody(req, schema);
  const lowered = Array.from(new Set(wallets.map((w) => w.trim().toLowerCase())));
  const users = await prisma.user.findMany({ where: { address: { in: lowered }, trustScore: { gt: 0 } }, select: { address: true, trustScore: true } });
  const scores = new Map(users.map((u) => [u.address.toLowerCase(), u.trustScore]));
  const active = countActiveWallets(lowered, scores);
  const report = await prisma.retentionReport.create({ data: { entryId: entry.id, reportedById: user.id, walletCount: lowered.length, activeCount: active } });
  return ok({ id: report.id, walletCount: report.walletCount, activeCount: report.activeCount, reportedAt: report.reportedAt }, { status: 201 });
});
