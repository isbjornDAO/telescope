import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, noStore } from "@/lib/world/api";
import { getWorldSession } from "@/lib/world/session";
import { displayName } from "@/lib/world/privacy";
import { TRUST } from "@/lib/world/config";

export const dynamic = "force-dynamic";

/** Elders are public by role. Pending admissions are visible to Anchors and Elders, who vote on them. */
export const GET = handle(async (req: NextRequest) => {
  const elders = await prisma.user.findMany({
    where: { nodeType: "ELDER" },
    select: { handle: true, address: true, bio: true, elderSince: true, region: { select: { name: true, slug: true } } },
    orderBy: { elderSince: "asc" },
  });
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } }) : null;
  let admissions: unknown[] = [];
  if (me && me.nodeType !== "NODE") {
    const rows = await prisma.elderAdmission.findMany({ where: { status: "PROPOSED" }, orderBy: { createdAt: "desc" } });
    const users = await prisma.user.findMany({ where: { id: { in: rows.flatMap((r) => [r.candidateId, r.nominatedById]) } }, select: { id: true, handle: true, address: true } });
    const byId = new Map(users.map((u) => [u.id, u]));
    admissions = rows.map((r) => ({
      id: r.id,
      candidate: byId.get(r.candidateId) ? displayName(byId.get(r.candidateId)!) : "?",
      nominatedBy: byId.get(r.nominatedById) ? displayName(byId.get(r.nominatedById)!) : "?",
      statement: r.statement,
      approvals: r.approvals.length,
      needed: TRUST.elderAdmissionApprovals,
      approvedByMe: r.approvals.includes(me.id),
      createdAt: r.createdAt,
    }));
  }
  return ok({ elders: elders.map((e) => ({ name: displayName(e), handle: e.handle, bio: e.bio, since: e.elderSince, region: e.region })), admissions, canNominate: !!me && me.nodeType !== "NODE" }, noStore);
});
