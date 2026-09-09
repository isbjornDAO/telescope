import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

const INITIAL_BOARDS = [
  {
    name: "gen",
    title: "General",
    description: "General community discussion & Avalanche topics"
  },
  {
    name: "tech",
    title: "Tech & Development",
    description: "Tech is good"
  },
  {
    name: "defi",
    title: "DeFi & Yield Farming",
    description: "Decentralized finance and yield opportunities"
  },
  {
    name: "nft",
    title: "NFTs & Collectibles",
    description: "NFT projects, marketplaces, and collections"
  },
  {
    name: "game",
    title: "Gaming & Metaverse",
    description: "Gaming projects and virtual worlds"
  },
  {
    name: "rwa",
    title: "Real-World Assets & Tokenization",
    description: "Tokenization of real-world assets"
  },
  {
    name: "inst",
    title: "Institutional Adoption & Partnerships",
    description: "Enterprise and institutional adoption"
  },
  {
    name: "price",
    title: "Price Discussion & Trading",
    description: "Token prices and market analysis"
  },
  {
    name: "meme",
    title: "Memecoins & Shitposting",
    description: "nochillio"
  },
  {
    name: "drama",
    title: "Drama",
    description: "Contribute to Avalore"
  },
  {
    name: "gov",
    title: "Governance & Proposals",
    description: "DAO governance and proposals"
  },
  {
    name: "sec",
    title: "Security & Audits",
    description: "Security best practices and audits"
  },
  {
    name: "adopt",
    title: "Adoption & Use Cases",
    description: "Real-world adoption and use cases"
  },
  {
    name: "dev",
    title: "Developer Resources",
    description: "Tools, docs, and developer support"
  },
  {
    name: "eco",
    title: "Ecosystem Projects",
    description: "Projects building on Avalanche"
  },
  {
    name: "reg",
    title: "Regulations & Compliance",
    description: "Legal and regulatory discussions"
  },
  {
    name: "bridge",
    title: "Newcomers",
    description: "Arriving to Avalanche"
  },
  {
    name: "avax_art",
    title: "Post Your AVAX Artwork",
    description: "hi ava artists, let's see your work! include salvor link if it's a collection"
  },
  {
    name: "b",
    title: "Random",
    description: "Off-topic and random discussion"
  }
];

async function seedBoards() {
  try {
    // Check if boards already exist
    const existingBoards = await prisma.board.count();

    if (existingBoards > 0) {
      return NextResponse.json({
        message: "Boards already exist",
        count: existingBoards
      });
    }

    // Create all boards
    const boards = await prisma.board.createMany({
      data: INITIAL_BOARDS
    });

    return NextResponse.json({
      success: true,
      message: "Boards created successfully",
      count: boards.count
    });
  } catch (error) {
    console.error("Error seeding boards:", error);
    return NextResponse.json(
      {
        error: "Failed to seed boards",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return seedBoards();
}

export async function POST() {
  return seedBoards();
}
