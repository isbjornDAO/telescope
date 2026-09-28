import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Tournament } from "@prisma/client";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { isCrewMember } from "@/lib/world/queries";
import { getCurrentSeason, submissionsOpen } from "@/lib/world/seasons";
import { PROPOSALS } from "@/lib/world/config";

export const dynamic = "force-dynamic";

const roadmapItem = z.object({ milestone: z.string().max(120), due: z.string().optional(), done: z.boolean().optional() });

const schema = z.object({
  tournament: z.enum(["GTM", "LOCAL_SYSTEMS", "RESEARCH_PAPERS"]),
  title: z.string().min(3).max(120),
  summary: z.string().min(10).max(600),
  body: z.string().max(60000).optional(),
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  deployedOn: z.enum(["Avalanche", "C-Chain", "L1", "Iggy", "Chainlink", "Midnight", "Other"]).optional(),
  researchEventId: z.string().optional(),
  crewSlug: z.string().optional(),
  regionSlug: z.string().optional(),
  ethicsStatement: z.string().max(4000).optional(),
  roadmap: z.array(roadmapItem).max(30).optional(),
  meaningfulTxDefinition: z.string().max(400).optional(),
  revealAuthorship: z.boolean().optional(),
  allianceId: z.string().optional(),
});

/**
 * Enter a tournament. GTM: a working product (default Avalanche; Chainlink,
 * Midnight, and other destinations allowed) with a link. Local Systems: a
 * design with an ethics statement. Research Papers: private; reviewers never
 * see who wrote it. When researchEventId is set, the entry joins that bounty.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, schema);
  const season = await getCurrentSeason();
  if (!season) throw new WorldError("No season is open.", 409);
  if (!submissionsOpen(season)) throw new WorldError("Submissions are closed for this season.", 409);
  const tournament = body.tournament as Tournament;

  let crewId: string | undefined;
  let factionId: string | undefined = user.factionId ?? undefined;
  if (body.crewSlug) {
    const crew = await prisma.crew.findUnique({ where: { slug: body.crewSlug } });
    if (!crew) throw new WorldError("No such crew.", 404);
    if (!(await isCrewMember(user.id, crew.id))) throw new WorldError("You are not in that crew.", 403);
    crewId = crew.id;
    factionId = crew.factionId ?? factionId;
  }

  // Entering is deliberately easy: a name, a line about it, and a link for
  // built things. Everything else can be filled in while the season runs.
  if (tournament === "GTM") {
    if (!body.url) throw new WorldError("Add a link to what you built.", 422);
    if (body.allianceId && PROPOSALS.alliancesCannotPoolGtm) throw new WorldError("Teams enter this one separately.", 422);
  }
  if (tournament === "RESEARCH_PAPERS" && !body.body) throw new WorldError("Paste the text of your paper.", 422);

  let researchEventId: string | undefined;
  if (body.researchEventId) {
    const event = await prisma.researchEvent.findUnique({ where: { id: body.researchEventId } });
    if (!event) throw new WorldError("No such research event.", 404);
    if (event.status !== "LIVE") throw new WorldError("That research bounty is not open.", 409);
    researchEventId = event.id;
  }

  let regionId: string | undefined;
  if (body.regionSlug) {
    const region = await prisma.region.findUnique({ where: { slug: body.regionSlug } });
    if (!region) throw new WorldError("No such region.", 404);
    regionId = region.id;
  }
  let allianceId: string | undefined;
  if (body.allianceId) {
    const alliance = await prisma.alliance.findUnique({ where: { id: body.allianceId } });
    if (!alliance || alliance.status !== "ACTIVE" || alliance.seasonNumber !== season.number) throw new WorldError("No active alliance by that id this season.", 404);
    if (!factionId || !alliance.factionIds.includes(factionId)) throw new WorldError("Your faction is not in that alliance.", 403);
    allianceId = alliance.id;
  }

  const entry = await prisma.entry.create({
    data: {
      seasonId: season.id,
      tournament,
      title: body.title,
      summary: body.summary,
      body: body.body,
      url: body.url,
      repoUrl: body.repoUrl,
      deployedOn: body.deployedOn,
      authorId: user.id,
      crewId,
      factionId,
      allianceId,
      regionId,
      researchEventId,
      ethicsStatement: body.ethicsStatement,
      roadmap: body.roadmap,
      metrics: [],
      meaningfulTxDefinition: body.meaningfulTxDefinition,
      revealAuthorship: body.revealAuthorship ?? true,
      status: "SUBMITTED",
    },
  });
  return ok({ id: entry.id, title: entry.title, tournament: entry.tournament, status: entry.status }, { status: 201 });
});
