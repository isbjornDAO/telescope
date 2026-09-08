# Telescope — Build Decisions v0.1

_Resolves the open questions the build hits first. Companion to World Rules v0.1. Numbers are starting values, tuned after Season One. Marked **(v2)** where the MVP ships a simpler version first._

The code reads every number on this page from `src/lib/world/config.ts`. Change it there, not in a component.

## 1. Trust score

**Node types and base score**
- Anchor (verified in person by a region): base 1.0
- Elder (admitted by Elders + region anchors): base 1.0, plus vote multipliers below
- Node (everyone else): base 0, earns score only through vouches

**Link weights**
- In-person vouch: 1.0
- Shipped-together vouch (same crew, shipped product, proof from Builder's Hub): 0.8
- Shared-vision vouch (online): 0.3

**Formula** (run 3 iterations over the graph, each season and nightly)

    score(n) = min(1.0, Σ over incoming vouches v of  score(voucher) × weight(v) × 0.5)  +  standing(n)

Decay is 0.5 per hop. Anchors and Elders are the only sources, so any node with no path to one has score 0 — this is the sybil defence and it needs no extra rules.

**Standing** adds up to +0.5 (so the maximum score is 1.5). Standing decays 25% per season if not renewed by new results.

**Vouching is scarce.** Each node has a vouch budget per season = score × 5. In-person vouches cost 1.0 of budget, shipped-together 0.8, shared-vision 0.3. You cannot vouch beyond your budget. This is the stake.

**Slashing.** When a node is slashed (finding by panel of ≥3 Elders + the region's anchors, published, one appeal), the slashed node's score goes to 0 and every voucher loses standing equal to 20% of the weight they staked on it. Slashing findings are permanent records.

## 2. Scout protocol

Scouts speak a small message set. Everything is signed by the scout's key; only commitments, payments and attestations touch the chain.

| Message | Who → who | Paid? | Purpose |
| --- | --- | --- | --- |
| INTENT | principal → own scout | no | What I'm looking for. Type: `role`, `partner_project`, `region_adopt`, `research_question`. Season-scoped; expires at season end. |
| CLAIM | scout → scout | no | A proof about the principal. MVP: signed assertion from the Telescope trust service. **(v2)** ZK proof: "≥N vouches from region X", "shipped ≥k in last 2 seasons", "faction standing ≥ s". |
| QUERY | scout → scout | yes (x402) | "Does your principal fit this intent?" Attaches the intent (minus identifying detail) and the asker's CLAIMs. Paid per query from the scout's budget. |
| OFFER | scout → scout | no | Proposed match: what each side would disclose on accept. |
| ACCEPT / DECLINE | scout → scout, human-gated | no | Both principals must accept. A scout may never accept on its own. |
| DISCLOSE | scout → scout, after mutual ACCEPT | no | Selective disclosure package: chosen name, contact channel, chosen history. Encrypted to the counterparty. |
| ATTEST | scout → chain | yes (gas) | A vouch or shipped-together attestation. Signed by both parties; stored as a commitment. |

**Budgets.** Default scout budget: 200 QUERYs per season, free. Above that, priced on Iggy L1 (MVP: priced in USDC on C-Chain). Rate limit: 50 QUERYs/day.

**Where scouts run.** MVP: scouts run as an Isbjorn-hosted service with per-user encrypted state, and the protocol is the public interface so they can be self-hosted or replaced later. **(v2)** Scouts run client-side or in a TEE; bring-your-own agent supported via the protocol.

**Privacy rules.** A scout never sends identifying data before mutual ACCEPT. CLAIMs are aggregates and proofs only. QUERY logs are retained 30 days for abuse detection, then deleted.

## 3. Voting and knockouts

**Weight per voter** = trust score, with multipliers:
- Elder ×3, Anchor ×1.5
- Elders + Anchors combined are capped at 40% of any round's total weight (scaled down proportionally if exceeded)
- Faction self-vote (voter and entry in the same faction or registered alliance): ×0.5
- Score 0 → weight 0 (cannot vote)

**GTM bracket** (thresholds are shares of total weighted votes cast in the round; a voter spreads weight across up to 3 entries per round)

| Round | Advance if ≥ | Target size |
| --- | --- | --- |
| Open | 5% | ~16 |
| Round of 16 | 12% | ~8 |
| Quarters | 20% | ~4 |
| Semis | 35% | 2 |
| Final | majority | Victor |

Threshold, not rank: everyone above the line advances, so brackets can be uneven. Fallback: if fewer than 2 clear a round, the top 2 by weight advance.

**Local Systems.** Panel of 9–15 Elders, published before submissions. Panelists recuse from own region/faction. Advance on ≥60% panel approval; the final is ranked by panel score.

**Research Papers.** 3 blind reviewers per paper, scored 1–10 on: advances the question / rigour / buildable. Advance on mean ≥7.0. Finalists get 5 reviewers; highest mean wins. Reviewer pool: Elders + past finalists; reviewers recuse from own faction (faction is hidden from them but checked by the system).

**Privacy.** Individual votes are private; tallies are public. MVP: votes stored encrypted, tally published with a hash commitment. **(v2)** ZK tally.

## 4. The 90-day retention metric (GTM)

- Day 0 = season close. Day 90 = vesting check.
- Active user = a wallet with trust score > 0 that made ≥1 meaningful transaction with the product in the trailing 30 days. "Meaningful" is defined per entry at submission (e.g. a swap, a post, a record written) and approved by the season organisers.
- Retention = active users at day 90 ÷ active users at day 0.
- Standing vests: 100% at retention ≥30%; pro-rata below; 0% below 5%.
- Only trust-graph wallets count, so sybil users don't move the number.

## 5. MVP scope (what Claude Code builds first)

**Season One ships with:**
1. Profiles (pseudonymous, three layers) + Builder's Hub proof import (manual/API, whichever is available first)
2. Trust graph with all three vouch types, budgets, and the score formula above
3. Scouts as a hosted service implementing the full protocol, INTENT → DISCLOSE
4. GTM as the full product: entries, public roadmap + metrics, weighted voting, bracket, Victor
5. Local Systems and Research Papers as lightweight flows: submission form, panel/review assignment, scoring, results. No bracket UI needed for Season One.
6. Crews and factions: create, join, one faction per person, alliance registration
7. Season calendar and the 90-day retention job
8. Regions: a region record, in-person vouch attestation by region admins (QR/check-in at events)

**Deferred:**
- ZK claims, ZK tally, TEE scouts **(v2)**
- Iggy L1: MVP settles attestations and payments on C-Chain; migrate when the L1 is live
- Bring-your-own agent
- Treasury contracts (Season One treasuries are ledger entries, paid out manually)

## 6. Defaults to revisit after Season One
Decay 0.5 · vouch budget ×5 · standing cap +0.5 · standing decay 25%/season · slash 20% · Elder ×3 · Anchor ×1.5 · E+A cap 40% · self-vote ×0.5 · bracket thresholds · retention vesting bands · scout budget 200/season.
