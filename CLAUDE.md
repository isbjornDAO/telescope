# Telescope

Tabs: **Home**, **Forum**, **Build**, **Calendar**, **Shop**.

Build’s submenu is Research · Projects · Tournaments (routes stay
`/research`, `/projects`, `/tournaments`).

Home is the strategic vision page. Forum is where you land to talk — no
onboarding, no preamble before posting. If a change adds a step before someone
can post or enter, it is the wrong change.

Background on the tournament rules lives in `docs/`. Read it when you touch
scoring or voting; you do not need it for anything else.

## Stack

- Next.js 14 app router, TypeScript, Tailwind, shadcn/ui (`src/components/ui`).
- Prisma + MongoDB (`prisma/schema.prisma`). Schema changes: `npx prisma db push`, then `npx prisma generate`.
- wagmi + RainbowKit for wallets (Avalanche C-Chain). next-auth for Discord.
- Tests: Jest (`npm test`), files under `src/__tests__/*.test.ts`.

## Where things are

- `src/components/page-navigation.tsx` — `TABS` is the single source of truth for navigation. The navbar reads it too.
- `src/app/page.tsx` — vision homepage. `/forum` is the conversation (composer first).
- `src/app/research/` — continuous research bounties, paper archive, ACP shelf.
- `src/app/projects/` — public builder kanban (not the shop/admin Project directory).
- `src/app/tournaments/` — seasons, brackets, entries (GTM + Local Systems; Research links out).
- `src/app/calendar/`, `src/app/shop/` — unchanged legacy surfaces.
- `src/lib/world/config.ts` — every tunable number for tournaments. Change numbers here only.
- `src/lib/world/{trust,voting,retention,scout,research}.ts` — scoring / succession engines, pure functions with tests.
- `src/lib/world/{audience,forum-access}.ts` — who can read a post. Pure, tested.
- `src/app/api/world/**` — API. Privacy rules are enforced here, never in the client.
- `archive/` — pages and components no longer linked. Excluded from typecheck. Kept so nothing is lost, deleted freely when clearly dead.

## Product thesis

Telescope is the homepage for a strategic development vision: philosophical and
technical. Topics can be communication, data infrastructure, privacy, local
systems, governance, finance. You do not need to care about Avalanche to write
or build. Team1 funds prizes; inspired tools become real on Avalanche,
Chainlink, Midnight, or elsewhere. Missions and tournaments lead to Arctic
conservation journeys — the bear is the reason, not the pitch.

## Rules for changes

- Nothing is required to *build* the site. A missing key switches its feature
  off (`featureFlags` in `src/env.ts`); it never fails a deploy. The exception
  is encryption: `src/lib/world/crypto.ts` refuses a fallback key in production.
- Any route touching the database declares `dynamic = "force-dynamic"`, or Next
  will run it at build time. One of them used to delete every forum board.
- Never expose who vouched for whom, or an individual ballot. Aggregates and
  hash-committed tallies only.
- Forum posts carry an audience policy set by their author, over provable
  attributes and never over names. It is enforced in the API, evaluated as an
  AND down board → thread → post, and has no admin bypass. Default is open and
  posting must stay one tap. See `docs/forum-access.md` and
  `src/lib/world/audience.ts`.
- Research paper entries are blind to reviewers: strip author, crew, faction
  and region server-side.
- Adding a new top-level tab is a product decision, not a cleanup. Ask first.

## Env

See `.env.example`. All optional for building. For a working deployment:
`DATABASE_URL`, `NEXTAUTH_SECRET`, `WORLD_ENCRYPTION_KEY`, `CRON_SECRET`,
`WORLD_ADMIN_ADDRESSES`, and the Discord keys if you want Discord sign-in.
