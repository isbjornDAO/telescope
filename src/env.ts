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

/**
 * Which features are switched off because their key is absent.
 *
 * This is a function, not an object, and it is SERVER ONLY. Reading a
 * server-side variable while a module is being evaluated in the browser
 * throws, and because `@/env` reaches the client bundle through siteConfig,
 * an object here would take the whole page down on load. Call it inside a
 * server component, route handler or server action.
 */
export function serverFeatures() {
  return {
    discordLogin: !!env.DISCORD_CLIENT_ID && !!env.DISCORD_CLIENT_SECRET,
    discordBot: !!env.DISCORD_BOT_TOKEN,
    database: !!env.DATABASE_URL,
  } as const;
}

/** Safe to read anywhere: these are NEXT_PUBLIC, so they exist in the browser. */
export const clientFeatures = {
  walletConnect: !!env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
} as const;

/** Server only, for the same reason as serverFeatures. */
export function missingEnvSummary(): string[] {
  const f = serverFeatures();
  const missing: string[] = [];
  if (!f.database) missing.push("DATABASE_URL — nothing can be stored or read");
  if (!env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET — sessions and world encryption");
  if (!f.discordLogin) missing.push("DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET — Discord sign-in");
  if (!f.discordBot) missing.push("DISCORD_BOT_TOKEN — Discord events and notifications");
  if (!clientFeatures.walletConnect) missing.push("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID — WalletConnect wallets");
  return missing;
}
