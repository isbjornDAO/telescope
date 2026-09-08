import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { getWorldSession, requireWorldUser } from "@/lib/world/session";
import { isCrewMember } from "@/lib/world/queries";
import { displayName, publicEntry } from "@/lib/world/privacy";
import { tallyBlind, tallyPanel } from "@/lib/world/voting";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const entry = await prisma.entry.findUnique({
    where: { id: params.id },
    include: {
      season: { select: { number: true, name: true, status: true, endsAt: true } },
      crew: { select: { name: true, slug: true, region: { select: { name: true, slug: true } }, members: { where: { leftAt: null }, select: { user: { select: { handle: true, address: true } } } } } },
      faction: { select: { name: true, slug: true } },
      region: { select: { name: true, slug: true } },
      author: { select: { handle: true, address: true } },
      feedback: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { handle: true, address: true } } } },
      reviews: { where: { submittedAt: { not: null } } },
      retentionReports: { orderBy: { reportedAt: "desc" }, take: 12, select: { activeCount: true, walletCount: true, reportedAt: true } },
    },
  });
  if (!entry || entry.status === "DRAFT") throw new WorldError("No such entry.", 404);
  const closed = entry.season.status === "CLOSED" || entry.season.status === "VESTED";
  const session = getWorldSession(req);
  const me = session ? await prisma.user.findFirst({ where: { address: { equals: session.address, mode: "insensitive" } }, select: { id: true } }) : null;
  const mine = !!me && (me.id === entry.authorId || (entry.crewId ? await isCrewMember(me.id, entry.crewId) : false));

  const { crew, faction, region, author, feedback, reviews, retentionReports, season, ...raw } = entry;
  const p = publicEntry(raw, closed);
  if (p.blind && !mine) {
    return ok({ id: p.id, tournament: p.tournament, status: p.status, season, blind: true, title: "Research paper (private until the season closes)" }, noStore);
  }
  const reviewSummary =
    entry.tournament === "LOCAL_SYSTEMS"
      ? tallyPanel(reviews.map((r) => ({ approve: r.approve, score: r.score })))
      : entry.tournament === "RESEARCH_PAPERS"
      ? tallyBlind(reviews)
      : null;

  return ok(
    {
      ...p,
      season,
      crew: crew ? { name: crew.name, slug: crew.slug, region: crew.region, members: crew.members.map((m) => displayName(m.user)) } : null,
      faction,
      region,
      author: displayName(author),
      feedback: feedback.map((f) => ({ id: f.id, body: f.body, by: displayName(f.user), at: f.createdAt })),
      reviewSummary: closed || entry.status !== "ACTIVE" ? reviewSummary : reviewSummary ? { submitted: "submitted" in reviewSummary ? reviewSummary.submitted : reviewSummary.reviews } : null,
      retention: { day0: entry.retentionDay0, day90: entry.retentionDay90, ratio: entry.retentionRatio, vested: entry.vestedFraction, reports: retentionReports },
      mine,
    },
    noStore
  );
});

const patch = z.object({
  summary: z.string().min(10).max(600).optional(),
  body: z.string().max(60000).optional(),
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  roadmap: z.array(z.object({ milestone: z.string().max(120), due: z.string().optional(), done: z.boolean().optional() })).max(30).optional(),
  metricsAppend: z.array(z.object({ label: z.string().max(60), value: z.union([z.number(), z.string().max(60)]) })).max(10).optional(),
  ethicsStatement: z.string().max(4000).optional(),
});

/** Roadmap and metrics stay public and updatable through the season: visible building. */
export const PATCH = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const entry = await prisma.entry.findUnique({ where: { id: params.id }, include: { season: true } });
  if (!entry) throw new WorldError("No such entry.", 404);
  const mine = user.id === entry.authorId || (entry.crewId ? await isCrewMember(user.id, entry.crewId) : false);
  if (!mine) throw new WorldError("Not your entry.", 403);
  if (entry.season.status === "CLOSED" || entry.season.status === "VESTED") throw new WorldError("The season is closed. The record is permanent.", 409);
  const body = await parseBody(req, patch);
  const now = new Date().toISOString();
  const metrics = [...((entry.metrics as { label: string; value: number | string; at: string }[]) ?? []), ...(body.metricsAppend ?? []).map((m) => ({ ...m, at: now }))];
  const updated = await prisma.entry.update({
    where: { id: entry.id },
    data: {
      summary: body.summary,
      body: body.body,
      url: body.url,
      repoUrl: body.repoUrl,
      roadmap: body.roadmap,
      ethicsStatement: body.ethicsStatement,
      metrics,
    },
  });
  return ok({ id: updated.id, roadmap: updated.roadmap, metrics: updated.metrics });
});
