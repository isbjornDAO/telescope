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
 * Sign-in providers.
 *
 * These deliberately mirror build.avax.network, which offers GitHub, Google and
 * an email code. A builder arriving from Builders Hub signs in here with the
 * same credentials and — because accounts are matched on verified email — lands
 * on the same Telescope identity rather than creating a second one.
 *
 * Builders Hub is currently an OAuth *consumer* (NextAuth with those three
 * providers); it exposes no authorization/token endpoint, so a true
 * "Sign in with Builders Hub" button cannot be implemented yet. When Ava Labs
 * ships one, add it here as an OAuth provider with id "builders-hub": existing
 * users link automatically through the same verified-email matching below.
 */
function buildProviders(): Provider[] {
  const providers: Provider[] = [];

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
