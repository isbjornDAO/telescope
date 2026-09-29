import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import {
  BUILDER_CATEGORIES,
  BUILDER_COLUMNS,
  CATEGORY_LABELS,
  COLUMN_LABELS,
  isBuilderCategory,
  isBuilderColumn,
  type BuilderCategory,
  type BuilderColumn,
} from "@/lib/world/builder-board";

export const dynamic = "force-dynamic";

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
    owner: {
      handle: p.owner.handle,
      address: p.owner.address,
    },
    crew: p.crew,
  };
}

/** Public kanban of what people are building. */
export const GET = handle(async (_req: NextRequest) => {
  const projects = await prisma.builderProject.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { handle: true, address: true } },
      crew: { select: { name: true, slug: true } },
    },
  });
  return ok({
    projects: projects.map(serialize),
    categories: BUILDER_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
    columns: BUILDER_COLUMNS.map((c) => ({ id: c, label: COLUMN_LABELS[c] })),
  });
});

const createSchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().min(10).max(800),
  category: z.string().refine(isBuilderCategory, "Invalid category"),
  column: z.string().refine(isBuilderColumn, "Invalid column").optional(),
  repoUrl: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  researchEntryId: z.string().optional(),
  tournamentEntryId: z.string().optional(),
  crewSlug: z.string().optional(),
});

/** Pin a card to the board. Wallet session required; no other onboarding. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, createSchema);

  let crewId: string | undefined;
  if (body.crewSlug) {
    const crew = await prisma.crew.findUnique({ where: { slug: body.crewSlug } });
    if (!crew) throw new WorldError("No such crew.", 404);
    crewId = crew.id;
  }

  const project = await prisma.builderProject.create({
    data: {
      ownerId: user.id,
      title: body.title,
      summary: body.summary,
      category: body.category as BuilderCategory,
      column: (body.column as BuilderColumn | undefined) ?? "EXPLORING",
      repoUrl: body.repoUrl || null,
      liveUrl: body.liveUrl || null,
      researchEntryId: body.researchEntryId,
      tournamentEntryId: body.tournamentEntryId,
      crewId,
    },
    include: {
      owner: { select: { handle: true, address: true } },
      crew: { select: { name: true, slug: true } },
    },
  });

  return ok(serialize(project), { status: 201 });
});
