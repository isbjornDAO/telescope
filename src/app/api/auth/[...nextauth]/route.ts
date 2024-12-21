import NextAuth, {
  DefaultSession,
  NextAuthOptions,
  Session,
  Account,
} from "next-auth";
import { JWT } from "next-auth/jwt";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import { Address } from "viem";

declare module "next-auth" {
  interface Account {
    walletAddress?: Address;
  }

  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
    discordUser?: {
      id: string;
      username: string;
      discriminator: string;
      image_url: string;
      accentColor: number;
    };
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    walletAddress?: Address | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    profile?: any;
    walletAddress?: string;
    userId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "identify guilds email connections",
        },
      },
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        return {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          image_url: profile.image_url,
          accentColor: profile.accentColor,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    jwt: async ({
      token,
      user,
      account,
      profile,
      trigger,
      session,
    }: {
      token: JWT;
      user?: any;
      account?: Account | null;
      profile?: any;
      trigger?: string;
      session?: any;
    }) => {
      console.log("JWT Callback Trigger:", trigger);
      console.log("User:", user);
      console.log("Account:", account);
      console.log("Profile:", profile);
      console.log("Session:", session);

      if (user) {
        token.userId = user.id;
      }

      if (account) {
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;

        if (typeof (account as any).walletAddress === "string") {
          token.walletAddress = (account as any).walletAddress;
          console.log("Wallet Address set in token:", token.walletAddress);
        }
      }

      if (profile) {
        token.profile = profile;
        console.log("Profile set in token:", token.profile);
      }

      if (trigger === "signIn" && session?.walletAddress) {
        token.walletAddress = session.walletAddress;
        console.log("Wallet Address set from session:", token.walletAddress);
      }

      return token;
    },

    session: async ({ session, token }: { session: Session; token: JWT }) => {
      console.log("Session Callback Triggered", session);
      console.log("Token:", token);

      if (token.userId) {
        session.user = {
          ...session.user,
          id: token.userId,
        };
      } else {
        console.warn("No userId found in token");
      }

      if (session.user?.id) {
        const user = await prisma.user.findUnique({
          where: { address: token.walletAddress as Address },
          select: { address: true },
        });

        const walletAddress = user?.address || null;
        const profile = token.profile as {
          id: string;
          username: string;
          discriminator: string;
          image_url: string;
          accentColor: number;
        };

        console.log("Wallet Address in Session:", walletAddress);
        console.log("Profile in Session:", profile);

        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.tokenType = token.tokenType as string;
        session.discordUser = profile;
        session.walletAddress = walletAddress as Address | null;

        return session;
      } else {
        console.warn("Session user id is undefined");
        return session;
      }
    },

    signIn: async ({ user, account, profile, email, credentials }) => {
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
