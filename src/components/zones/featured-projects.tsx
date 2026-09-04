import { ArrowUpRight, Star } from "lucide-react";

import { externalLinks } from "@/lib/site";

/**
 * A short editorial list, with the full ecosystem left to Cascade.
 *
 * These are hand-picked rather than fetched: Cascade exposes no API yet (see
 * docs/integrations.md). Once it serves a project feed, this component reads
 * from it and the constant below goes away.
 */
const FEATURED: { name: string; blurb: string; href: string }[] = [
  {
    name: "Avalanche Ecosystem Map",
    blurb: "500+ projects building on Avalanche, sorted by what they do.",
    href: externalLinks.cascade,
  },
  {
    name: "Builders Hub",
    blurb: "Docs, courses and the developer console — the official starting point.",
    href: externalLinks.buildersHub,
  },
  {
    name: "Team1",
    blurb: "The team behind Telescope, the hackathons and the bounty programmes.",
    href: externalLinks.team1,
  },
];

export function FeaturedProjects() {
  return (
    <section className="rounded-xl bg-white p-4 shadow-md dark:bg-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Star className="h-4 w-4 text-muted-foreground" aria-hidden />
        Featured
      </h2>

      <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-700/60">
        {FEATURED.map((project) => (
          <li key={project.name}>
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium group-hover:underline">
                  {project.name}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {project.blurb}
                </span>
              </span>
              <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
