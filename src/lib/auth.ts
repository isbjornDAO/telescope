import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import DiscordProvider from "next-auth/providers/discord";

import { prisma } from "@/lib/prisma";
import { handleFromIdentity } from "@/lib/handle";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle: string | null;
      role: string;
      reputation: number;
      address: string | null;
    } & DefaultSession["user"];
  }
}

export type UserRole = "member" | "moderator" | "admin";

/**
 * Admins are configured by email so access does not depend on any one provider.
 * Comma-separated, e.g. ADMIN_EMAILS="a@x.com,b@y.com".
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function canModerate(role: string | undefined): boolean {
  return role === "admin" || role === "moderator";
}

/**
 * Builders Hub as a first-class identity provider.
 *
 * Discovery-driven, so nothing here is specific to how Ava Labs implement it:
 * set BUILDERS_HUB_ISSUER to an origin serving
 * `/.well-known/openid-configuration` and this provider configures itself from
 * that document. Turning it on is an environment change, not a code change.
 *
 * Until those credentials exist, the providers below mirror the three that
 * build.avax.network already offers, and accounts are matched on verified
 * email — so a builder who signs into Builders Hub with GitHub and then signs
 * in here with GitHub lands on the same Telescope identity either way. That
 * same email matching is what links an existing account to Builders Hub SSO
 * the first time someone uses it, with no migration.
 */
function buildersHubProvider(): Provider | null {
  const issuer = process.env.BUILDERS_HUB_ISSUER;
  const clientId = process.env.BUILDERS_HUB_CLIENT_ID;
  const clientSecret = process.env.BUILDERS_HUB_CLIENT_SECRET;

  if (!issuer || !clientId || !clientSecret) return null;

  return {
    id: "builders-hub",
    name: "Builders Hub",
    type: "oauth",
    wellKnown: `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    checks: ["pkce", "state"],
    clientId,
    clientSecret,
    // Standard OIDC claims. `preferred_username` seeds the Telescope handle
    // when it is present, so handles line up across the two sites.
    profile(profile: Record<string, unknown>) {
      return {
        id: String(profile.sub),
        name:
          (profile.name as string | undefined) ??
          (profile.preferred_username as string | undefined) ??
          null,
        email: (profile.email as string | undefined) ?? null,
        image: (profile.picture as string | undefined) ?? null,
      };
    },
  };
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  // Listed first so it renders as the primary button once configured.
  const buildersHub = buildersHubProvider();
  if (buildersHub) providers.push(buildersHub);

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
        maxAge: 10 * 60, // sign-in link valid for 10 minutes
      })
    );
  }

  // Discord stays available for the existing community, but is no longer the
  // only way in.
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        authorization: { params: { scope: "identify email" } },
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: buildProviders(),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", verifyRequest: "/signin/check-email" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          handle: true,
          role: true,
          reputation: true,
          address: true,
          email: true,
        },
      });

      session.user = {
        ...session.user,
        id: user.id,
        handle: record?.handle ?? null,
        // An email on the admin list always resolves to admin, so access
        // survives a role field that was never backfilled.
        role: isAdminEmail(record?.email) ? "admin" : record?.role ?? "member",
        reputation: record?.reputation ?? 0,
        address: record?.address ?? null,
      };

      return session;
    },
  },
  events: {
    /**
     * Give every new account a handle and, for a listed admin, the admin role.
     * Done on creation so the rest of the app can assume a handle exists.
     */
    async createUser({ user }) {
      const handle = await handleFromIdentity(
        { name: user.name, email: user.email },
        async (candidate) =>
          (await prisma.user.count({ where: { handle: candidate } })) > 0
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          handle,
          role: isAdminEmail(user.email) ? "admin" : "member",
          lastActive: new Date(),
        },
      });
    },
    async signIn({ user }) {
      await prisma.user
        .update({ where: { id: user.id }, data: { lastActive: new Date() } })
        .catch(() => {
          // A failed activity stamp must never block a sign-in.
        });
    },
  },
};
