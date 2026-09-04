import { ArrowUpRight, Wrench } from "lucide-react";

/**
 * Practical software people actually reach for, grouped by what it is for.
 *
 * Deliberately a short curated list rather than an exhaustive directory — the
 * complete ecosystem lives in Cascade, and a list nobody maintains is worse
 * than no list.
 */
const TOOLS: { group: string; items: { name: string; blurb: string; href: string }[] }[] = [
  {
    group: "Money & markets",
    items: [
      {
        name: "Core",
        blurb: "Wallet and portfolio for Avalanche and beyond.",
        href: "https://core.app",
      },
      {
        name: "DefiLlama",
        blurb: "TVL, yields and protocol revenue across chains.",
        href: "https://defillama.com/chain/Avalanche",
      },
    ],
  },
  {
    group: "On-chain data",
    items: [
      {
        name: "Snowtrace",
        blurb: "Block explorer for the C-Chain.",
        href: "https://snowtrace.io",
      },
      {
        name: "AvaCloud",
        blurb: "Managed L1s, APIs, indexing and webhooks.",
        href: "https://avacloud.io",
      },
    ],
  },
  {
    group: "Build & operate",
    items: [
      {
        name: "Avalanche CLI",
        blurb: "Create, deploy and manage an L1 from the terminal.",
        href: "https://github.com/ava-labs/avalanche-cli",
      },
      {
        name: "Builders Hub docs",
        blurb: "References and guides for everything above.",
        href: "https://build.avax.network/docs",
      },
    ],
  },
];

export function ToolDirectory() {
  return (
    <section className="rounded-xl bg-white p-4 shadow-md dark:bg-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden />
        Useful tools
      </h2>

      <div className="mt-3 space-y-4">
        {TOOLS.map((section) => (
          <div key={section.group}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {section.group}
            </h3>
            <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-700/60">
              {section.items.map((tool) => (
                <li key={tool.name}>
                  <a
                    href={tool.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium group-hover:underline">
                        {tool.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {tool.blurb}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Missing something useful? Post it in the board below.
      </p>
    </section>
  );
}
