import { env } from "@/env";
import { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Telescope",
  author: "Team1",
  description:
    "The community forum for builders on Avalanche. Ask questions, get answers, and find the hackathons and bounties worth your time.",
  keywords: ["avalanche", "avax", "builders", "forum", "hackathon", "bounty", "web3"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL || "https://isbjorn.xyz",
    author: "https://team1.network",
  },
  links: {
    twitter: "https://x.com/gabrielrvita",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL ?? ""}/og.jpg`,
};

/**
 * Telescope supports build.avax.network rather than duplicating it, and the
 * ecosystem directory lives in Cascade. Both are linked, never rebuilt here.
 */
export const externalLinks = {
  buildersHub: "https://build.avax.network",
  buildersHubDocs: "https://build.avax.network/docs",
  cascade: "https://cascade.team1.network",
  team1: "https://team1.network",
} as const;
