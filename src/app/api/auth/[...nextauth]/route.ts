import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import { verifyMessage } from "viem";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
    discordUser?: {
      id: string;
      username: string;
      discriminator: string;
      avatar: string;
      accent_color: number;
      global_name: string;
    };
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
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
          state: undefined,
        },
      },
      profile(profile) {
        console.log("🎮 Discord profile received:", {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          hasAvatar: !!profile.avatar,
        });

        let image_url: string;
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
          console.log("🖼️ Using default Discord avatar:", {
            defaultAvatarNumber,
            image_url,
          });
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
          console.log("🖼️ Using custom Discord avatar:", { format, image_url });
        }

        const processedProfile = {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: image_url,
          global_name: profile.global_name,
          accent_color: profile.accent_color,
        };

        console.log("✨ Processed Discord profile:", processedProfile);
        return processedProfile;
      },
    }),
  ],
  debug: true,
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔵 Discord SignIn callback started", {
        user: {
          id: user?.id,
          name: user?.name,
          hasImage: !!user?.image,
        },
        account: {
          provider: account?.provider,
          type: account?.type,
          hasAccessToken: !!account?.access_token,
        },
        hasProfile: !!profile,
      });

      // We'll let the user sign in with Discord, but the actual user connection
      // will be handled by the connect-discord endpoint where we verify the wallet signature
      console.log("✅ Allowing Discord sign in, wallet verification pending");
      return true;
    },

    jwt: async ({ token, account, profile }) => {
      console.log("🔑 JWT callback started", {
        hasExistingToken: !!token,
        hasNewAccount: !!account,
        hasProfile: !!profile,
      });

      if (account) {
        console.log("💫 Adding account details to token");
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;
      }
      if (profile) {
        console.log("👤 Adding profile details to token");
        token.profile = profile;
      }

      console.log("✨ Returning enhanced token");
      return token;
    },

    session: async ({ session, token }: { session: any; token: any }) => {
      console.log("🔄 Session callback started", {
        hasToken: !!token,
        hasExistingSession: !!session,
      });

      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.tokenType = token.tokenType;
      session.discordUser = token.profile;

      console.log("✅ Enhanced session with Discord data:", {
        hasAccessToken: !!session.accessToken,
        hasDiscordUser: !!session.discordUser,
      });
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
