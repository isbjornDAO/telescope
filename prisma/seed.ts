import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Categories are aimed at what a builder arriving from build.avax.network
 * actually needs help with, rather than the token-chat boards that came before.
 */
const CATEGORIES = [
  {
    slug: "help",
    title: "Help & Troubleshooting",
    description: "Stuck on something? Ask here and get an answer you can accept.",
    icon: "LifeBuoy",
    position: 0,
  },
  {
    slug: "l1s",
    title: "Avalanche L1s & Subnets",
    description: "Launching, configuring and operating your own L1.",
    icon: "Layers",
    position: 1,
  },
  {
    slug: "contracts",
    title: "Smart Contracts",
    description: "Solidity, deployment, upgrades, audits and gas.",
    icon: "FileCode",
    position: 2,
  },
  {
    slug: "tooling",
    title: "SDKs, APIs & Tooling",
    description: "AvaCloud, Core, the Avalanche CLI, indexers and RPC.",
    icon: "Wrench",
    position: 3,
  },
  {
    slug: "nodes",
    title: "Nodes & Validators",
    description: "Running nodes, staking, and keeping validators healthy.",
    icon: "Server",
    position: 4,
  },
  {
    slug: "showcase",
    title: "Showcase",
    description: "Share what you are building on Avalanche and get feedback.",
    icon: "Star",
    position: 5,
  },
  {
    slug: "hackathons",
    title: "Hackathons & Bounties",
    description: "Team1 hackathon and bounty programmes: rules, teams, support.",
    icon: "Trophy",
    position: 6,
  },
  {
    slug: "general",
    title: "General",
    description: "Everything else about building on Avalanche.",
    icon: "MessagesSquare",
    position: 7,
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
        position: category.position,
        archived: false,
      },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} forum categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
