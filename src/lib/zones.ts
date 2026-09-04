/**
 * Telescope's three areas.
 *
 * Each is a discussion board plus the things that belong beside that
 * conversation: Discover carries projects, news and events; Tools carries a
 * directory of practical software. `group` matches Category.group, so the
 * navigation and the taxonomy cannot drift apart.
 */
export type Zone = {
  slug: string;
  /** Must match Category.group exactly. */
  group: string;
  label: string;
  tagline: string;
  icon: "Code2" | "Compass" | "Wrench" | "MessagesSquare";
};

export const ZONES: Zone[] = [
  {
    slug: "code",
    group: "Build",
    label: "Code",
    tagline:
      "The builders' board. Help with your L1, contracts, tooling and nodes — the technical side of build.avax.network.",
    icon: "Code2",
  },
  {
    slug: "discover",
    group: "Growth & Go-To-Market",
    label: "Discover",
    tagline:
      "What is happening on Avalanche: featured projects, Team1 news, upcoming events, and how teams are reaching real users.",
    icon: "Compass",
  },
  {
    slug: "tools",
    group: "Real-World Impact",
    label: "Tools",
    tagline:
      "Avalanche put to work — local and real-world solutions, plus the practical and financial tools people actually use.",
    icon: "Wrench",
  },
  {
    slug: "community",
    group: "Community",
    label: "Community",
    tagline: "Hackathons, bounties, and everything else about the people here.",
    icon: "MessagesSquare",
  },
];

/** The three that get a tab. Community lives in the menu. */
export const MAIN_ZONES = ZONES.filter((zone) => zone.slug !== "community");

export function zoneBySlug(slug: string): Zone | undefined {
  return ZONES.find((zone) => zone.slug === slug);
}

export function zoneForGroup(group: string): Zone | undefined {
  return ZONES.find((zone) => zone.group === group);
}
