import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { sha256Hex } from "@/lib/world/crypto";

export const dynamic = "force-dynamic";

interface HubProject {
  id: string;
  name: string;
  description?: string;
  kind?: "shipped" | "hackathon" | "activity";
  shippedAt?: string;
}

/**
 * Builder's Hub → Telescope. The proof says "this node shipped this"; the
 * Builder's Hub account id stays in externalRef and is never returned to
 * anyone but the owner. Requires BUILDERS_HUB_API_URL and _API_KEY.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const base = process.env.BUILDERS_HUB_API_URL;
  const key = process.env.BUILDERS_HUB_API_KEY;
  if (!base || !key) throw new WorldError("Builder's Hub import is not configured yet. Add a manual proof for now.", 503);

  const res = await fetch(`${base.replace(/\/$/, "")}/wallets/${user.address}/projects`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new WorldError(`Builder's Hub answered ${res.status}.`, 502);
  const projects = (await res.json()) as HubProject[];

  let created = 0;
  for (const p of projects) {
    const proofHash = sha256Hex("builders-hub", p.id, user.id);
    const exists = await prisma.proof.findFirst({ where: { userId: user.id, proofHash } });
    if (exists) continue;
    await prisma.proof.create({
      data: {
        userId: user.id,
        source: "BUILDERS_HUB",
        kind: p.kind === "hackathon" ? "HACKATHON" : p.kind === "activity" ? "ACTIVITY" : "SHIPPED",
        title: p.name,
        description: p.description,
        externalRef: p.id,
        proofHash,
        verified: true,
        verifiedBy: "builders-hub",
        shippedAt: p.shippedAt ? new Date(p.shippedAt) : undefined,
      },
    });
    created++;
  }
  return ok({ imported: created, total: projects.length });
});
