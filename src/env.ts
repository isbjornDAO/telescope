import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Auth providers are all optional: Telescope boots with whichever credentials
 * are configured, so a contributor can run it locally with a single provider.
 * At least one must be set in production for anyone to sign in.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1).optional(),
    NEXTAUTH_SECRET: z.string().min(1),

    BUILDERS_HUB_ISSUER: z.string().url().optional(),
    BUILDERS_HUB_CLIENT_ID: z.string().min(1).optional(),
    BUILDERS_HUB_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    EMAIL_SERVER: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),

    ADMIN_EMAILS: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_ENVIRONMENT: z.string().min(3).optional(),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    BUILDERS_HUB_ISSUER: process.env.BUILDERS_HUB_ISSUER,
    BUILDERS_HUB_CLIENT_ID: process.env.BUILDERS_HUB_CLIENT_ID,
    BUILDERS_HUB_CLIENT_SECRET: process.env.BUILDERS_HUB_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    EMAIL_SERVER: process.env.EMAIL_SERVER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  },
})
