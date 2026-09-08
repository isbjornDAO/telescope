import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession, requireWorldUser } from "@/lib/world/session";
import { isCrewLead } from "@/lib/world/queries";
import { displayName, publicEntry } from "@/lib/world/privacy";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const crew = await prisma.crew.findUnique({
    where: { slug: params.slug },
    include: {
      region: { select: { name: true, slug: true } },
      faction: { select: { name: true, slug: true, vision: true } },
      members: { where: { leftAt: null }, include: { user: { select: { id: true, handle: true, address: true, nodeType: true } } }, orderBy: { joinedAt: "asc" } },
      entries: { include: { season: { select: { number: true, name: true, status: true } } }, orderBy: { createdAt: "desc" } },
      proofs: { where: { verified: true }, select: { id: true, title: true, kind: true, shippedAt: true, proofHash: true } },
    },
  });
  if (!crew) throw new WorldError("No such crew.", 404);
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } } }) : null;
  const myMembership = me ? crew.members.find((m) => m.userId === me.id) : null;
  return ok(
    {
      name: crew.name,
      slug: crew.slug,
      description: crew.description,
      avatar: crew.avatar,
      standing: crew.standing,
      region: crew.region,
      faction: crew.faction,
      createdAt: crew.createdAt,
      members: crew.members.map((m) => ({ id: m.user.id, name: displayName(m.user), handle: m.user.handle, nodeType: m.user.nodeType, role: m.role, isLead: m.isLead })),
      record: crew.entries.map((e) => {
        const closed = e.season.status === "CLOSED" || e.season.status === "VESTED";
        const p = publicEntry(e, closed);
        return { id: p.id, title: p.blind ? "Research paper (private)" : p.title, tournament: p.tournament, status: p.status, isVictor: p.isVictor, season: e.season };
      }),
      shipped: crew.proofs,
      viewer: { isMember: !!myMembership, isLead: !!myMembership?.isLead },
    },
    noStore
  );
});

const patch = z.object({ description: z.string().max(400).optional(), avatar: z.string().url().optional() });

export const PATCH = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const crew = await prisma.crew.findUnique({ where: { slug: params.slug } });
  if (!crew) throw new WorldError("No such crew.", 404);
  if (!(await isCrewLead(user.id, crew.id))) throw new WorldError("Crew leads only.", 403);
  const body = await parseBody(req, patch);
  const updated = await prisma.crew.update({ where: { id: crew.id }, data: body });
  return ok({ slug: updated.slug, description: updated.description, avatar: updated.avatar });
});
