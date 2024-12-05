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

export interface LeaderboardItem {
  id: number | string;
  rank: number;
  avatar?: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  social?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
}

export interface LeaderboardProps {
  items: LeaderboardItem[];
  renderMetadata?: (item: LeaderboardItem) => React.ReactNode;
  renderActions?: (item: LeaderboardItem) => React.ReactNode;
  showSocial?: boolean;
}
