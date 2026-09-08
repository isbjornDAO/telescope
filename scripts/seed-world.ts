/**
 * Seed the world: Team1 regions on the Arctic map and, optionally, Winter I.
 *
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-world.ts
 *   SEED_SEASON=1 SEASON_START=2026-10-05 npx ts-node ... scripts/seed-world.ts
 *
 * Regions come from the Team1 regional chapter list. Admin wallets are
 * added later from /world-admin; region admins are seeded as Anchors.
 */
import { PrismaClient, Tournament } from "@prisma/client";
import { SEASON, VOTING, seasonDisplayName } from "../src/lib/world/config";

const prisma = new PrismaClient();
const WEEK = 7 * 24 * 60 * 60 * 1000;

const REGIONS: { name: string; slug: string; country: string; lat: number; lng: number; description: string }[] = [
  { name: "Medellín", slug: "medellin", country: "Colombia", lat: 6.24, lng: -75.58, description: "Where Team1 started: Avalanche on the Metro." },
  { name: "Lima", slug: "lima", country: "Peru", lat: -12.05, lng: -77.04, description: "Latam chapter." },
  { name: "Mexico City", slug: "mexico-city", country: "Mexico", lat: 19.43, lng: -99.13, description: "Latam chapter." },
  { name: "São Paulo", slug: "sao-paulo", country: "Brazil", lat: -23.55, lng: -46.63, description: "Brazil chapter." },
  { name: "Madrid", slug: "madrid", country: "Spain", lat: 40.42, lng: -3.7, description: "Spain chapter." },
  { name: "Paris", slug: "paris", country: "France", lat: 48.86, lng: 2.35, description: "France chapter." },
  { name: "Istanbul", slug: "istanbul", country: "Turkey", lat: 41.01, lng: 28.98, description: "Turkey chapter." },
  { name: "Lagos", slug: "lagos", country: "Nigeria", lat: 6.52, lng: 3.38, description: "Nigeria and Africa chapter." },
  { name: "Nairobi", slug: "nairobi", country: "Kenya", lat: -1.29, lng: 36.82, description: "Kenya chapter." },
  { name: "Bangalore", slug: "bangalore", country: "India", lat: 12.97, lng: 77.59, description: "India chapter." },
  { name: "Tokyo", slug: "tokyo", country: "Japan", lat: 35.68, lng: 139.69, description: "Japan chapter." },
  { name: "Shanghai", slug: "shanghai", country: "China", lat: 31.23, lng: 121.47, description: "China chapter." },
  { name: "Manila", slug: "manila", country: "Philippines", lat: 14.6, lng: 120.98, description: "Philippines chapter." },
  { name: "Ho Chi Minh City", slug: "ho-chi-minh-city", country: "Vietnam", lat: 10.82, lng: 106.63, description: "Vietnam chapter." },
  { name: "Toronto", slug: "toronto", country: "Canada", lat: 43.65, lng: -79.38, description: "Canada chapter." },
  { name: "Auckland", slug: "auckland", country: "New Zealand", lat: -36.85, lng: 174.76, description: "Isbjorn's home floe." },
];

async function main() {
  for (const r of REGIONS) {
    await prisma.region.upsert({ where: { slug: r.slug }, create: { ...r, isChapter: true }, update: { lat: r.lat, lng: r.lng, country: r.country } });
  }
  console.log(`regions: ${REGIONS.length}`);

  if (process.env.SEED_SEASON) {
    const exists = await prisma.season.findUnique({ where: { number: 1 } });
    if (!exists) {
      // Same timeline as src/lib/world/seasons.ts (seasonDates + roundSchedule), kept inline so the script runs without path aliases.
      const startsAt = new Date(process.env.SEASON_START ?? Date.now() + WEEK);
      const submissionsClose = new Date(startsAt.getTime() + (SEASON.submissionsCloseWeek - 1) * WEEK);
      const endsAt = new Date(startsAt.getTime() + SEASON.weeks * WEEK);
      const retentionCheckAt = new Date(endsAt.getTime() + 90 * 24 * 60 * 60 * 1000);
      const season = await prisma.season.create({
        data: {
          number: 1,
          name: seasonDisplayName(1),
          theme: "Local records: what a community needs to remember, and who gets to forget",
          researchQuestion: "How can a community keep verifiable local records (land, identity, attendance, payments) on Avalanche infrastructure without exposing the people in them?",
          startsAt,
          submissionsClose,
          endsAt,
          retentionCheckAt,
        },
      });
      const span = endsAt.getTime() - submissionsClose.getTime();
      const half = new Date(submissionsClose.getTime() + span / 2);
      const rounds = [
        ...VOTING.gtmRounds.map((r, i, arr) => ({ tournament: Tournament.GTM, index: r.index, name: r.name, threshold: r.threshold, opensAt: new Date(submissionsClose.getTime() + (span * i) / arr.length), closesAt: new Date(submissionsClose.getTime() + (span * (i + 1)) / arr.length) })),
        { tournament: Tournament.LOCAL_SYSTEMS, index: 0, name: "Review", threshold: VOTING.localSystems.approvalThreshold, opensAt: submissionsClose, closesAt: half },
        { tournament: Tournament.LOCAL_SYSTEMS, index: 1, name: "Final", threshold: VOTING.localSystems.approvalThreshold, opensAt: half, closesAt: endsAt },
        { tournament: Tournament.RESEARCH_PAPERS, index: 0, name: "Review", threshold: VOTING.researchPapers.advanceMean / 10, opensAt: submissionsClose, closesAt: half },
        { tournament: Tournament.RESEARCH_PAPERS, index: 1, name: "Final", threshold: VOTING.researchPapers.advanceMean / 10, opensAt: half, closesAt: endsAt },
      ];
      await prisma.round.createMany({ data: rounds.map((r) => ({ ...r, seasonId: season.id })) });
      console.log(`season: ${season.name} starts ${season.startsAt.toISOString()}`);
    } else {
      console.log("season 1 exists");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
