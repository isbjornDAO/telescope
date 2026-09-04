/**
 * Telescope has three places to go, and they are deliberately different rooms.
 *
 * A newcomer who wants to talk about a payments pilot in their city should not
 * have to wade through validator sync errors to find the conversation, and a
 * developer debugging an L1 should not have to scroll past growth campaigns.
 * Each zone maps to the `group` field on Category, so the taxonomy and the
 * navigation can never drift apart.
 */
export type Zone = {
  slug: string;
  /** Must match Category.group exactly. */
  group: string;
  label: string;
  /** Shown on the zone page, in plain language. */
  tagline: string;
  icon: "TrendingUp" | "Globe2" | "Code2" | "MessagesSquare";
};

export const ZONES: Zone[] = [
  {
    slug: "growth",
    group: "Growth & Go-To-Market",
    label: "Growth",
    tagline:
      "Getting Avalanche in front of real people — launches, campaigns, partnerships, and everything that turns interest into on-chain activity.",
    icon: "TrendingUp",
  },
  {
    slug: "real-world",
    group: "Real-World Impact",
    label: "Real World",
    tagline:
      "Avalanche doing something useful off the screen — local pilots, payments, climate, the economy, policy, and the good this can actually do.",
    icon: "Globe2",
  },
  {
    slug: "tech",
    group: "Build",
    label: "Build",
    tagline:
      "The technical room. Help with your L1, contracts, tooling and nodes — bring the error message.",
    icon: "Code2",
  },
  {
    slug: "community",
    group: "Community",
    label: "Community",
    tagline:
      "Hackathons, bounties, and everything else about the people building here.",
    icon: "MessagesSquare",
  },
];

export function zoneBySlug(slug: string): Zone | undefined {
  return ZONES.find((zone) => zone.slug === slug);
}

export function zoneForGroup(group: string): Zone | undefined {
  return ZONES.find((zone) => zone.group === group);
}
