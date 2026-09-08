# The trust graph

Trust on Telescope is modelled like node infrastructure. Every person is a node. A vouch is a link with a weight. Trust flows along links back to an in-person anchor, and decays with distance.

## Node types

- **Node** — any profile.
- **Anchor** — a node verified in person by a region. Anchors are the validator set of the social graph.
- **Elder** (also called Verifier) — a node with recognised expertise and verified standing outside the world: university teachers, researchers, practitioners. Elders sit on the [Local Systems](../seasons/local-systems.md) panel and carry higher vouch weight. Elders are admitted by existing Elders and by region anchors. **(proposal)** Isbjorn seeds the first Elders with Team1.

## Link types

- **In-person vouch** — both people were in the same room, and a region attests it. Strong. This is the only link that can create an Anchor.
- **Shipped-together vouch** — the two were in the same crew for a shipped project. Strong, verifiable from Builder's Hub proofs.
- **Shared-vision vouch** — an online endorsement from someone who has reviewed your work or shares your faction's vision. Lighter. Reaches across regions.

## A vouch is a stake

When you vouch for someone, you put your own standing behind them. If they rug — a confirmed fraud, a stolen treasury, a fabricated submission — the people who vouched for them lose standing too, proportional to the weight they gave. This is validator logic applied to people, and it is why the graph resists sybil attacks: a farmer with ten thousand wallets can create ten thousand nodes, but none of them has a path to a room full of humans, and nobody with standing will stake on them.

## Trust score

A node's trust score is a function of the weighted paths from it back to Anchors and Elders, decaying with each hop. It determines:

- **voting weight** in tournaments (see [Voting and knockouts](../seasons/voting-and-knockouts.md));
- how much weight the node's own vouches carry;
- what a scout may claim about the node in negotiation.

Standing, the season-earned form of trust, adds to the score. Standing does not travel: it belongs to the person, crew or faction that earned it.

The formula and starting numbers are in [Build decisions](../build-decisions.md#1-trust-score).

## Privacy of the graph

The graph is private by default. What is public is proofs and aggregates: "this node has at least N in-person vouches from region X", "this faction's standing is in the top decile". Who vouched for whom is visible only to the two parties, unless both choose otherwise. Zero-knowledge proofs make the public parts verifiable without exposing the private parts.

## Slashing and appeal

**(proposal)** Slashing events require a finding by a panel of Elders and the affected region's anchors, with a published rationale. The person slashed and their vouchers can appeal once. The record of the finding is permanent.
