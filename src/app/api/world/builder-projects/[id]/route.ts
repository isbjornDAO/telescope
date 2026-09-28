import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import {
  CATEGORY_LABELS,
  COLUMN_LABELS,
  isBuilderCategory,
  isBuilderColumn,
  type BuilderCategory,
  type BuilderColumn,
} from "@/lib/world/builder-board";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function serialize(p: {
  id: string;
  title: string;
  summary: string;
  category: string;
  column: string;
  repoUrl: string | null;
  liveUrl: string | null;
  researchEntryId: string | null;
  tournamentEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { handle: string | null; address: string };
  crew: { name: string; slug: string } | null;
}) {
  return {
    id: p.id,
    title: p.title,
    summary: p.summary,
    category: p.category,
    categoryLabel: CATEGORY_LABELS[p.category as BuilderCategory] ?? p.category,
    column: p.column,
    columnLabel: COLUMN_LABELS[p.column as BuilderColumn] ?? p.column,
    repoUrl: p.repoUrl,
    liveUrl: p.liveUrl,
    researchEntryId: p.researchEntryId,
    tournamentEntryId: p.tournamentEntryId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    owner: { handle: p.owner.handle, address: p.owner.address },
    crew: p.crew,
  };
}

const updateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  summary: z.string().min(10).max(800).optional(),
  category: z.string().refine(isBuilderCategory, "Invalid category").optional(),
  column: z.string().refine(isBuilderColumn, "Invalid column").optional(),
  repoUrl: z.string().url().optional().nullable().or(z.literal("")),
  liveUrl: z.string().url().optional().nullable().or(z.literal("")),
});

/** Owner updates their own card. */
export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, updateSchema);
  const existing = await prisma.builderProject.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw new WorldError("No such project.", 404);
  if (existing.ownerId !== user.id) throw new WorldError("Only the owner can edit this card.", 403);

  const project = await prisma.builderProject.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      summary: body.summary,
      category: body.category as BuilderCategory | undefined,
      column: body.column as BuilderColumn | undefined,
      repoUrl: body.repoUrl === "" ? null : body.repoUrl === undefined ? undefined : body.repoUrl,
      liveUrl: body.liveUrl === "" ? null : body.liveUrl === undefined ? undefined : body.liveUrl,
    },
    include: {
      owner: { select: { handle: true, address: true } },
      crew: { select: { name: true, slug: true } },
    },
  });

  return ok(serialize(project));
});

/** Owner removes their card. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireWorldUser(req);
  const existing = await prisma.builderProject.findUnique({ where: { id: ctx.params.id } });
  if (!existing) throw new WorldError("No such project.", 404);
  if (existing.ownerId !== user.id) throw new WorldError("Only the owner can remove this card.", 403);
  await prisma.builderProject.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
});
