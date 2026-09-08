import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isElder, requireNode } from "@/lib/world/queries";
import { displayName } from "@/lib/world/privacy";
import { TRUST } from "@/lib/world/config";

export const dynamic = "force-dynamic";

/** Findings are published with their rationale. The record is permanent. */
export const GET = handle(async () => {
  const findings = await prisma.slashingFinding.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const users = await prisma.user.findMany({ where: { id: { in: findings.map((f) => f.targetUserId) } }, select: { id: true, handle: true, address: true } });
  const regions = await prisma.region.findMany({ where: { id: { in: findings.map((f) => f.regionId).filter(Boolean) as string[] } }, select: { id: true, name: true, slug: true } });
  const u = new Map(users.map((x) => [x.id, x]));
  const r = new Map(regions.map((x) => [x.id, x]));
  return ok(
    findings.map((f) => ({
      id: f.id,
      target: u.get(f.targetUserId) ? displayName(u.get(f.targetUserId)!) : "?",
      region: f.regionId ? r.get(f.regionId) ?? null : null,
      rationale: f.rationale,
      status: f.status,
      elderApprovals: f.elderApprovals.length,
      anchorApprovals: f.anchorApprovals.length,
      needed: { elders: TRUST.slashMinElders, anchors: f.regionId ? 1 : 0 },
      appealText: f.appealText,
      createdAt: f.createdAt,
      resolvedAt: f.resolvedAt,
    })),
    noStore
  );
});

const schema = z.object({ handle: z.string().min(3), rationale: z.string().min(40).max(4000), regionSlug: z.string().optional() });

/** An Elder proposes a finding: confirmed fraud, stolen treasury, fabricated submission. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  if (!isElder(user)) throw new WorldError("Elders propose findings.", 403);
  const body = await parseBody(req, schema);
  const target = await requireNode(body.handle);
  if (target.id === user.id) throw new WorldError("No.", 422);
  let regionId: string | undefined;
  if (body.regionSlug) {
    const region = await prisma.region.findUnique({ where: { slug: body.regionSlug } });
    if (!region) throw new WorldError("No such region.", 404);
    regionId = region.id;
  } else if (target.regionId) {
    regionId = target.regionId;
  }
  const finding = await prisma.slashingFinding.create({
    data: { targetUserId: target.id, proposedById: user.id, regionId, rationale: body.rationale, elderApprovals: [user.id] },
  });
  return ok({ id: finding.id }, { status: 201 });
});
