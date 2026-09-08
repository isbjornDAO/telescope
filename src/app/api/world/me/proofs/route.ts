import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { sha256Hex } from "@/lib/world/crypto";
import { currentSeasonNumber, isCrewMember } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const proofs = await prisma.proof.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { crew: { select: { name: true, slug: true } } } });
  return ok(proofs, noStore);
});

const schema = z.object({
  kind: z.enum(["SHIPPED", "HACKATHON", "ACTIVITY"]),
  title: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
  externalRef: z.string().max(200).optional(),
  shippedAt: z.string().datetime().optional(),
  crewSlug: z.string().optional(),
});

/** Manual proof. Unverified until an admin or Builder's Hub confirms it; shown as such. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  let crewId: string | undefined;
  if (body.crewSlug) {
    const crew = await prisma.crew.findUnique({ where: { slug: body.crewSlug } });
    if (!crew) throw new WorldError("No such crew.", 404);
    if (!(await isCrewMember(user.id, crew.id))) throw new WorldError("You are not in that crew.", 403);
    crewId = crew.id;
  }
  const proof = await prisma.proof.create({
    data: {
      userId: user.id,
      source: "MANUAL",
      kind: body.kind,
      title: body.title,
      description: body.description,
      externalRef: body.externalRef,
      proofHash: sha256Hex("manual", user.id, body.title, body.externalRef ?? "", Date.now()),
      shippedAt: body.shippedAt ? new Date(body.shippedAt) : undefined,
      crewId,
      seasonNumber: await currentSeasonNumber(),
    },
  });
  return ok(proof, { status: 201 });
});
