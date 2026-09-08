import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

const patch = z.object({
  text: z.string().min(10).max(1000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(12).optional(),
  active: z.boolean().optional(),
  constraints: z.object({ minTrust: z.number().min(0).max(1.5).optional(), regionSlug: z.string().optional() }).nullable().optional(),
});

export const PATCH = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const intent = await prisma.scoutIntent.findUnique({ where: { id: params.id } });
  if (!intent || intent.userId !== user.id) throw new WorldError("Not your intent.", 403);
  const body = await parseBody(req, patch);
  const updated = await prisma.scoutIntent.update({
    where: { id: intent.id },
    data: { ...body, tags: body.tags?.map((t) => t.toLowerCase().trim()), constraints: body.constraints === null ? undefined : body.constraints },
  });
  return ok(updated);
});

export const DELETE = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const intent = await prisma.scoutIntent.findUnique({ where: { id: params.id } });
  if (!intent || intent.userId !== user.id) throw new WorldError("Not your intent.", 403);
  await prisma.scoutIntent.update({ where: { id: intent.id }, data: { active: false } });
  return ok({ ok: true });
});
