import { env } from "@/env";
import { DefaultSession, NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

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
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "identify guilds email connections",
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
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        return {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: image_url,
          global_name: profile.global_name,
          accent_color: profile.accent_color,
        };
      },
    }),
  ],
  debug: true,
  cookies: {
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NEXT_PUBLIC_ENVIRONMENT === "production",
      },
    },
  },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return true;
    },
    jwt: async ({ token, account, profile }) => {
      if (account) {
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;
      }
      if (profile) {
        token.profile = profile;
      }
      return token;
    },
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    session: async ({ session, token }: { session: any; token: any }) => {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.tokenType = token.tokenType;
      session.discordUser = token.profile;
      return session;
    },
  },
};
