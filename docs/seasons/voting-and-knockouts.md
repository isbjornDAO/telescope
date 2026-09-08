# Voting and knockouts

Knockouts are decided by threshold, not rank: an entry advances if it clears the round's threshold of weighted support. That means a round can advance everyone, or nobody. Thresholds are published before the season starts.

## Voting weight comes from the trust graph

This is the rule that makes everything else work. A vote's weight is a function of the voter's [trust score](../trust/trust-graph.md). Accounts do not vote; nodes with trust do. A node with no path back to an Anchor or Elder has a weight of zero. A farmer with ten thousand wallets has ten thousand votes that add up to nothing.

## By tournament

- **Local Systems** — only Elders on the season's panel vote. Panelists are excluded from entries from their own region or faction.
- **Research Papers** — only the blind review pool votes, on papers without authorship.
- **GTM** — every node with trust votes, weighted. Elders and Anchors carry more weight, but not enough to decide a round alone.

## Threshold **(proposal)**

Each round's threshold is set as a share of the total active weighted vote in that tournament, so it scales with participation. Early rounds use a low threshold to keep the bracket wide; the final uses a majority of weighted votes cast.

Starting values are in [Build decisions](../build-decisions.md#3-voting-and-knockouts).

## Voting is private

How you voted is private, provable in aggregate by zero-knowledge, and never shown to the entrants. The tally is public and verifiable.

## Anti-collusion **(proposal)**

Faction members' votes for their own faction's entries carry reduced weight in GTM. Alliances register before voting opens, and allied factions are treated as one for this rule.
