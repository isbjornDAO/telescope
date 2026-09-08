# Telescope

Telescope is a world, not a social network. Read `docs/README.md` first, then `docs/build-decisions.md`. Every feature is subordinate to safety, security, privacy and pseudonymity (`docs/principles.md`).

## Stack

- Next.js 14 app router, TypeScript, Tailwind, shadcn/ui (`src/components/ui`).
- Prisma + MongoDB (`prisma/schema.prisma`). Schema changes: `npx prisma db push`, then `npx prisma generate`.
- wagmi + RainbowKit for wallets (Avalanche C-Chain). next-auth for Discord.
- Tests: Jest (`npm test`), files under `src/__tests__/*.test.ts`.

## World code map

- `src/lib/world/config.ts` — every tunable number from build decisions §6. Change numbers here only.
- `src/lib/world/trust.ts` — trust score formula, vouch budgets, slashing. Pure functions + `recomputeTrustScores()`.
- `src/lib/world/voting.ts` — voter weight, E+A cap, self-vote, thresholds, bracket advancement.
- `src/lib/world/retention.ts` — 90-day retention and vesting bands.
- `src/lib/world/scout.ts` — scout protocol (INTENT → DISCLOSE), budgets, rate limits.
- `src/lib/world/session.ts` — signed wallet session for world actions (sign once, cookie).
- `src/lib/world/crypto.ts` — AES-GCM at rest for ballots and disclosures; commitments.
- `src/app/api/world/**` — all world API routes. Privacy rules are enforced here, never in the client.
- `src/app/(pages)` — `/`, `/seasons`, `/scout`, `/crews`, `/factions`, `/regions`, `/trust`, `/elders`, `/admin/world`.

## Rules for changes

- Never expose who vouched for whom unless both parties set visibility. Return aggregates and proofs.
- Never expose an individual ballot. Tallies only, with a hash commitment.
- Research Papers entries are blind to reviewers: strip author, crew, faction, region server-side.
- A scout never discloses identifying data before mutual ACCEPT.
- Anything marked **(proposal)** in the docs ships behind a flag in `config.ts`.
- Parked legacy surfaces (radio, shop, artists, collectables) stay in the tree but are unlinked from navigation.

## Env

See `.env.example`. World-specific: `WORLD_ENCRYPTION_KEY`, `CRON_SECRET`, `SCOUT_TREASURY_ADDRESS`, `BUILDERS_HUB_API_URL`, `BUILDERS_HUB_API_KEY`.
