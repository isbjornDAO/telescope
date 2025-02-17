export type SiteConfig = {
  name: string;
  author: string;
  description: string;
  keywords: Array<string>;
  url: {
    base: string;
    author: string;
  };
  links: {
    twitter: string;
  };
  ogImage: string;
};

export interface Social {
  twitter?: string;
  discord?: string;
  telegram?: string;
  website?: string;
  dexscreener?: string;
  contractAddress?: string;
}

export interface LeaderboardItem {
  id: string;
  rank: number;
  avatar?: string;
  name: string;
  description?: string;
  metadata?: ItemMetadata;
  social?: Social;
  tags?: string[];
}

export interface ItemMetadata {
  votes: number;
  voters: number;
}

export interface User {
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardProps {
  items: LeaderboardItem[];
  renderMetadata?: (item: LeaderboardItem) => React.ReactNode;
  renderActions?: (item: LeaderboardItem) => React.ReactNode;
  showSocial?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  accent_color: number | null;
  global_name: string | null;
}

export interface IncubatorProject {
  id: string;
  title: string;
  description: string;
  logo: string;
  status: 'live' | 'upcoming' | 'presale';
  launchDate: Date;
  createdAt: Date;
  updatedAt: Date;
  social?: Social;
  tags: string[];
}
