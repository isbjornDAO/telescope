import { useQuery } from "@tanstack/react-query";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  avatar_url: string;
  banner: string | null;
  banner_url: string | null;
  bot?: boolean;
  system?: boolean;
  accent_color?: number | null;
  global_name?: string | null;
}

export function useUserDiscord(discordUserId: string) {
  return useQuery<DiscordUser>({
    queryKey: ["discord-user", discordUserId],
    queryFn: async () => {
      const response = await fetch(`/api/discord/user/${discordUserId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch Discord user");
      }
      
      return response.json();
    },
    enabled: Boolean(discordUserId),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
