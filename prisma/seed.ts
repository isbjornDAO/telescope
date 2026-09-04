import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Telescope's subject matter, in four sections.
 *
 * The forum is not only developer support. It covers how Avalanche reaches
 * people (go-to-market and on-chain growth), what it is actually used for in
 * the world (local deployments, climate, economy, policy, public goods), and
 * how it is built — in that order, because the first two are the harder and
 * less-served conversations.
 *
 * `group` drives the section headings on /categories; `position` orders both
 * the sections and the categories inside them.
 */
const CATEGORIES = [
  // --- Growth & Go-To-Market -------------------------------------------------
  {
    slug: "gtm",
    title: "Go-To-Market",
    description:
      "Launch strategy, positioning, pricing, partnerships and distribution. What worked, what did not, and why.",
    icon: "Megaphone",
    group: "Growth & Go-To-Market",
    position: 0,
  },
  {
    slug: "growth",
    title: "Users & On-Chain Volume",
    description:
      "The classic problem: acquiring real users, keeping them, and turning activity into sustained on-chain volume. Incentives, campaigns, funnels and liquidity.",
    icon: "TrendingUp",
    group: "Growth & Go-To-Market",
    position: 1,
  },
  {
    slug: "showcase",
    title: "Showcase",
    description:
      "Share what you are building on Avalanche and get honest feedback from people who have shipped.",
    icon: "Rocket",
    group: "Growth & Go-To-Market",
    position: 2,
  },

  // --- Real-World Impact -----------------------------------------------------
  {
    slug: "irl",
    title: "Local & IRL Solutions",
    description:
      "Avalanche deployed in the physical world: payments and merchants, identity, logistics, ticketing, and adoption in a specific city or region.",
    icon: "MapPin",
    group: "Real-World Impact",
    position: 3,
  },
  {
    slug: "impact",
    title: "Public Goods & Social Impact",
    description:
      "The good this technology can actually do — financial inclusion, aid distribution, transparency, and funding public goods.",
    icon: "HeartHandshake",
    group: "Real-World Impact",
    position: 4,
  },
  {
    slug: "climate",
    title: "Climate & Energy",
    description:
      "Carbon markets, energy grids, environmental data and measurement. Research and working systems, not pledges.",
    icon: "Leaf",
    group: "Real-World Impact",
    position: 5,
  },
  {
    slug: "economy",
    title: "Economy & Markets",
    description:
      "Research on tokenomics, monetary design, real-world assets and market structure. Bring data.",
    icon: "LineChart",
    group: "Real-World Impact",
    position: 6,
  },
  {
    slug: "policy",
    title: "Policy & Regulation",
    description:
      "Regulation, governance and the politics of adoption, by jurisdiction. What builders need to know before they ship.",
    icon: "Scale",
    group: "Real-World Impact",
    position: 7,
  },

  // --- Build -----------------------------------------------------------------
  {
    slug: "help",
    title: "Help & Troubleshooting",
    description:
      "Stuck on something? Ask here and mark the reply that solved it.",
    icon: "LifeBuoy",
    group: "Build",
    position: 8,
  },
  {
    slug: "l1s",
    title: "Avalanche L1s & Subnets",
    description: "Launching, configuring and operating your own L1.",
    icon: "Layers",
    group: "Build",
    position: 9,
  },
  {
    slug: "contracts",
    title: "Smart Contracts",
    description: "Solidity, deployment, upgrades, audits and gas.",
    icon: "FileCode",
    group: "Build",
    position: 10,
  },
  {
    slug: "tooling",
    title: "SDKs, APIs & Tooling",
    description: "AvaCloud, Core, the Avalanche CLI, indexers and RPC.",
    icon: "Wrench",
    group: "Build",
    position: 11,
  },
  {
    slug: "nodes",
    title: "Nodes & Validators",
    description: "Running nodes, staking, and keeping validators healthy.",
    icon: "Server",
    group: "Build",
    position: 12,
  },

  // --- Community -------------------------------------------------------------
  {
    slug: "hackathons",
    title: "Hackathons & Bounties",
    description:
      "Team1 hackathon and bounty programmes: briefs, rules, teams and support.",
    icon: "Trophy",
    group: "Community",
    position: 13,
  },
  {
    slug: "general",
    title: "General",
    description: "Everything else about Avalanche and the people building on it.",
    icon: "MessagesSquare",
    group: "Community",
    position: 14,
  },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        title: category.title,
        description: category.description,
        icon: category.icon,
        group: category.group,
        position: category.position,
        archived: false,
      },
    });
  }

  // Categories that existed before this taxonomy and are no longer part of it
  // are archived rather than deleted, so any topics filed under them survive.
  const keep = CATEGORIES.map((category) => category.slug);
  const { count } = await prisma.category.updateMany({
    where: { slug: { notIn: keep } },
    data: { archived: true },
  });

  console.log(
    `Seeded ${CATEGORIES.length} categories in ${new Set(CATEGORIES.map((c) => c.group)).size} sections.` +
      (count > 0 ? ` Archived ${count} category(ies) no longer in the taxonomy.` : "")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
