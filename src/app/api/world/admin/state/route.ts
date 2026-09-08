import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { requireWorldAdmin } from "@/lib/world/session";
import { seasonPhase } from "@/lib/world/seasons";
import { displayName } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  await requireWorldAdmin(req);
  const [seasons, rounds, pendingProofs, elders, anchors, regions, findings] = await Promise.all([
    prisma.season.findMany({ orderBy: { number: "desc" }, include: { _count: { select: { entries: true } } } }),
    prisma.round.findMany({ orderBy: [{ seasonId: "desc" }, { tournament: "asc" }, { index: "asc" }] }),
    prisma.proof.findMany({ where: { verified: false }, include: { user: { select: { handle: true, address: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.findMany({ where: { nodeType: "ELDER" }, select: { handle: true, address: true } }),
    prisma.user.count({ where: { nodeType: "ANCHOR" } }),
    prisma.region.findMany({ select: { name: true, slug: true, adminAddresses: true } }),
    prisma.slashingFinding.findMany({ where: { status: { in: ["PROPOSED", "APPEALED"] } } }),
  ]);
  return ok(
    {
      seasons: seasons.map((s) => ({ ...s, phase: seasonPhase(s), entries: s._count.entries })),
      rounds,
      pendingProofs: pendingProofs.map((p) => ({ id: p.id, title: p.title, kind: p.kind, source: p.source, by: displayName(p.user), createdAt: p.createdAt })),
      elders: elders.map(displayName),
      anchors,
      regions,
      openFindings: findings.length,
    },
    noStore
  );
});
