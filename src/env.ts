import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment for Telescope.
 *
 * Nothing here is required to BUILD the site. A missing key disables the
 * feature that needs it and says so at runtime; it never fails the deploy.
 * Discord, in particular, is a legacy surface — the world does not need it.
 *
 * Secrets that protect data are checked at runtime instead, in
 * `src/lib/world/crypto.ts`, which refuses to run in production on a
 * fallback key rather than silently weakening encryption.
 */
export const env = createEnv({
  // An empty value in a dashboard counts as "not set", not as a valid empty string.
  emptyStringAsUndefined: true,
  server: {
    DATABASE_URL: z.string().min(1).optional(),
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_ENVIRONMENT: z.string().min(3).optional(),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  },
});

/** Features that are switched off because their key is absent. */
export const featureFlags = {
  discordLogin: !!env.DISCORD_CLIENT_ID && !!env.DISCORD_CLIENT_SECRET,
  discordBot: !!env.DISCORD_BOT_TOKEN,
  walletConnect: !!env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  database: !!env.DATABASE_URL,
} as const;

export function missingEnvSummary(): string[] {
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL — nothing can be stored or read");
  if (!env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET — sessions and world encryption");
  if (!featureFlags.discordLogin) missing.push("DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET — Discord sign-in");
  if (!featureFlags.discordBot) missing.push("DISCORD_BOT_TOKEN — Discord events and notifications");
  if (!featureFlags.walletConnect) missing.push("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID — WalletConnect wallets");
  return missing;
}
