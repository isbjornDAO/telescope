import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { VouchStatus, VouchType } from "@prisma/client";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { canAffordVouch, linkWeight, vouchBudget, vouchCost } from "@/lib/world/trust";
import { promoteAnchorIfAttested, recomputeTrustScores, spentVouchBudget } from "@/lib/world/trust-db";
import { commitment } from "@/lib/world/crypto";
import { currentSeasonNumber, isCrewMember, isRegionAdmin, requireNode } from "@/lib/world/queries";
import { displayName } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

/** My vouches. Both parties always see each other; nobody else does. */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const seasonNumber = await currentSeasonNumber();
  const [given, received, spent] = await Promise.all([
    prisma.vouch.findMany({
      where: { fromUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { to: { select: { handle: true, address: true, nodeType: true } }, region: { select: { name: true, slug: true } } },
    }),
    prisma.vouch.findMany({
      where: { toUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { handle: true, address: true, nodeType: true } }, region: { select: { name: true, slug: true } } },
    }),
    spentVouchBudget(user.id, seasonNumber),
  ]);
  const total = vouchBudget(user.trustScore);
  return ok(
    {
      budget: { total, spent, remaining: Math.max(0, total - spent), seasonNumber, costs: { IN_PERSON: 1, SHIPPED_TOGETHER: 0.8, SHARED_VISION: 0.3 } },
      given: given.map((v) => ({ ...v, counterpart: { name: displayName(v.to), handle: v.to.handle, nodeType: v.to.nodeType }, to: undefined })),
      received: received.map((v) => ({ ...v, counterpart: { name: displayName(v.from), handle: v.from.handle, nodeType: v.from.nodeType }, from: undefined })),
    },
    noStore
  );
});

const schema = z.object({
  to: z.string().min(3),
  type: z.enum(["IN_PERSON", "SHIPPED_TOGETHER", "SHARED_VISION"]),
  note: z.string().max(400).optional(),
  eventId: z.string().optional(),
  crewSlug: z.string().optional(),
  visible: z.boolean().optional(),
});

/**
 * A vouch is a stake. In-person needs a shared room (both checked in) and a
 * region's attestation before it counts. Shipped-together needs a shared
 * crew with a verified shipped proof. Shared-vision is light and online.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  const to = await requireNode(body.to);
  if (to.id === user.id) throw new WorldError("You cannot vouch for yourself.", 422);

  const type = body.type as VouchType;
  const seasonNumber = await currentSeasonNumber();
  const spent = await spentVouchBudget(user.id, seasonNumber);
  if (!canAffordVouch(user.trustScore, spent, type)) {
    throw new WorldError(
      `Not enough vouch budget. Budget is your score × 5 (${vouchBudget(user.trustScore)}), spent ${spent}, this vouch costs ${vouchCost(type)}.`,
      402
    );
  }
  const dupe = await prisma.vouch.findUnique({ where: { fromUserId_toUserId_type: { fromUserId: user.id, toUserId: to.id, type } } });
  if (dupe && dupe.status !== VouchStatus.REVOKED) throw new WorldError("You already hold this vouch.", 409);

  let status: VouchStatus = VouchStatus.ACTIVE;
  let regionId: string | undefined;
  let eventId: string | undefined;
  let crewId: string | undefined;
  let proofId: string | undefined;
  let attestedBy: string | undefined;
  let attestedAt: Date | undefined;

  if (type === "IN_PERSON") {
    if (!body.eventId) throw new WorldError("An in-person vouch needs the room: pick the event you both checked in to.", 422);
    const event = await prisma.regionEvent.findUnique({ where: { id: body.eventId }, include: { region: true } });
    if (!event) throw new WorldError("No such event.", 404);
    const [mine, theirs] = await Promise.all([
      prisma.eventCheckIn.findUnique({ where: { eventId_userId: { eventId: event.id, userId: user.id } } }),
      prisma.eventCheckIn.findUnique({ where: { eventId_userId: { eventId: event.id, userId: to.id } } }),
    ]);
    if (!mine || !theirs) throw new WorldError("Both of you must have checked in to that event.", 422);
    regionId = event.regionId;
    eventId = event.id;
    if (isRegionAdmin(user, event.region)) {
      attestedBy = user.address;
      attestedAt = new Date();
    } else {
      status = VouchStatus.PENDING;
    }
  } else if (type === "SHIPPED_TOGETHER") {
    if (!body.crewSlug) throw new WorldError("Name the crew you shipped with.", 422);
    const crew = await prisma.crew.findUnique({ where: { slug: body.crewSlug } });
    if (!crew) throw new WorldError("No such crew.", 404);
    const [a, b] = await Promise.all([isCrewMember(user.id, crew.id), isCrewMember(to.id, crew.id)]);
    if (!a || !b) throw new WorldError("Both of you must be in that crew.", 422);
    const proof = await prisma.proof.findFirst({ where: { crewId: crew.id, kind: "SHIPPED", verified: true } });
    if (!proof) throw new WorldError("That crew has no verified shipped proof yet.", 422);
    crewId = crew.id;
    proofId = proof.id;
  }

  const createdAt = new Date();
  const data = {
    type,
    weight: linkWeight(type),
    budgetCost: vouchCost(type),
    status,
    fromUserId: user.id,
    toUserId: to.id,
    seasonNumber,
    regionId,
    eventId,
    crewId,
    proofId,
    attestedBy,
    attestedAt,
    note: body.note,
    fromVisible: body.visible ?? false,
    commitment: commitment("vouch", user.address, to.address, type, createdAt.toISOString()),
    createdAt,
  };
  const vouch = dupe
    ? await prisma.vouch.update({ where: { id: dupe.id }, data: { ...data, toVisible: false, onchainTx: null } })
    : await prisma.vouch.create({ data });

  if (status === VouchStatus.ACTIVE) {
    await promoteAnchorIfAttested(vouch.id);
    await recomputeTrustScores();
  }
  return ok({ ...vouch, counterpart: { name: displayName(to), handle: to.handle } }, { status: 201 });
});
