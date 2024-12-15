import { env } from "@/env";
import { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Telescope",
  author: "Isbjorn",
  description: "",
  keywords: ["web3", "crypto", "avalanche", "defi"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL || "https://isbjorn.xyz",
    author: "https://gabrielrusso.me",
  },
  links: {
    twitter: "https://x.com/gabrielrvita",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
};
