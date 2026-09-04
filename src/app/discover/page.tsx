import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Rocket, BookOpen } from "lucide-react";

import { externalLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Find what is building on Avalanche: the Cascade ecosystem map, Builders Hub docs, and the Telescope showcase.",
};

/**
 * Telescope does not maintain its own project directory — Cascade already does,
 * with 500+ projects. This page points at the right destination for each intent
 * rather than duplicating any of them.
 */
const DESTINATIONS = [
  {
    title: "Ecosystem map",
    description:
      "500+ projects building on Avalanche, sorted by what they do. Maintained in Cascade.",
    href: externalLinks.cascade,
    label: "cascade.team1.network",
    icon: Compass,
    external: true,
  },
  {
    title: "Docs & courses",
    description:
      "Guides, references and the developer console, on the official Builders Hub.",
    href: externalLinks.buildersHubDocs,
    label: "build.avax.network/docs",
    icon: BookOpen,
    external: true,
  },
  {
    title: "Showcase",
    description:
      "What builders here are shipping right now — post yours and get feedback from the community.",
    href: "/forum/c/showcase",
    label: "Open the showcase",
    icon: Rocket,
    external: false,
  },
];

export default function DiscoverPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Everything worth finding on Avalanche, and where it actually lives.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {DESTINATIONS.map((destination) => {
          const Icon = destination.icon;
          const body = (
            <>
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-medium">{destination.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {destination.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">
                {destination.label}
                {destination.external ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
              </span>
            </>
          );

          const className =
            "block rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20";

          return destination.external ? (
            <a
              key={destination.title}
              href={destination.href}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              {body}
            </a>
          ) : (
            <Link key={destination.title} href={destination.href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
