import { env } from "@/env";
import { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Telescope",
  author: "Isbjorn",
  description:
    "Discover stars building for the planet. Isbjorn's world for research, projects, and tournaments — with Arctic conservation as the reason.",
  keywords: [
    "isbjorn",
    "avalanche",
    "research",
    "builders",
    "conservation",
    "polar bears",
    "telescope",
  ],
  url: {
    base: env.NEXT_PUBLIC_APP_URL || "https://isbjorn.xyz",
    author: "https://gabrielrusso.me",
  },
  links: {
    twitter: "https://x.com/IsbjornDAO",
    discord: "https://discord.gg/tyFug3Pz8G",
    telegram: "https://t.me/iggyavax",
    github: "https://github.com/isbjornDAO/telescope",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
};
