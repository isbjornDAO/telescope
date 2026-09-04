# Telescope

The community forum for builders on Avalanche, supporting
[build.avax.network](https://build.avax.network). Ask a question, get an answer
you can accept, and find the Team1 hackathons and bounties worth your time.

## What Telescope is (and is not)

Telescope is the Avalanche community forum. It covers three things: getting
Avalanche in front of people, putting it to work in the real world, and building
on it. It deliberately does not duplicate its neighbours:

| Need | Where it lives |
| --- | --- |
| Docs, courses, developer console | [build.avax.network](https://build.avax.network) |
| Ecosystem directory (500+ projects) | [cascade.team1.network](https://cascade.team1.network) |
| Questions, answers, discussion | Telescope |
| Go-to-market, growth, real-world use, research | Telescope |
| Hackathons and bounties | Telescope |

## The three areas

The forum is split into visibly separate rooms, so nobody has to decide whether
their question belongs among validator stack traces:

| Area | Route | For |
| --- | --- | --- |
| **Growth** | `/z/growth` | Go-to-market, campaigns, partnerships, real users and on-chain volume |
| **Real World** | `/z/real-world` | Local pilots, payments, climate, economy, policy, public goods |
| **Build** | `/z/tech` | The technical room: L1s, contracts, tooling, nodes, help |
| **Community** | `/z/community` | Hackathons, bounties, everything else |

Areas are defined in `src/lib/zones.ts` and map onto `Category.group`, so the
navigation and the taxonomy cannot drift apart. Each area page shows only its
own categories in the filter bar.

## Categories

Fifteen categories in four sections, seeded by `npm run seed` and grouped on
`/categories`.

**Growth & Go-To-Market** — Go-To-Market · Users & On-Chain Volume · Showcase

**Real-World Impact** — Local & IRL Solutions · Public Goods & Social Impact ·
Climate & Energy · Economy & Markets · Policy & Regulation

**Build** — Help & Troubleshooting · Avalanche L1s & Subnets · Smart Contracts ·
SDKs, APIs & Tooling · Nodes & Validators

**Community** — Hackathons & Bounties · General

To change the taxonomy, edit `CATEGORIES` in `prisma/seed.ts` and re-run the
seed. Categories dropped from that list are archived rather than deleted, so
topics filed under them are never orphaned.

## Identity

Sign-in mirrors Builders Hub exactly — **GitHub, Google, and an email link** —
and accounts are matched on verified email, so a builder arriving from
build.avax.network lands on the same Telescope profile rather than creating a
second one. Discord remains available for the existing community.

A wallet is **not** a login. It is an optional credential you link from your
profile to receive bounty payouts and claim rewards.

### Builders Hub SSO

A `builders-hub` provider is implemented and discovery-driven. Set
`BUILDERS_HUB_ISSUER`, `BUILDERS_HUB_CLIENT_ID` and `BUILDERS_HUB_CLIENT_SECRET`
and "Continue with Builders Hub" becomes the primary sign-in button — the
provider configures itself from the issuer's `/.well-known/openid-configuration`,
so enabling it is an environment change with no code change and no migration.
Existing accounts link on first use through the same verified-email matching.

Until Builders Hub exposes an OIDC issuer (today it is an OAuth *consumer*, with
no authorization or token endpoint of its own), the three mirrored providers
already deliver the important half: the same credentials resolve to the same
Telescope identity. See `docs/integrations.md` for what each partner team needs
to provide.

## How the forum works

The forum **is** the site: it renders at `/`, and everything else — Discover,
Events, Rewards, your profile, moderation — sits behind the menu button in the
header. `/forum` redirects to `/` so older links keep working.

- Topics are listed the way a conventional forum lists them: avatar, title,
  category, author, last activity, and reply/view counts in a right-hand column.
  Categories are chips above the list, reachable at every width.
- Threads read **chronologically**, with numbered posts and the author
  identified at the top of each one.
- **Questions** can be marked solved. The asker (or a moderator) accepts a
  reply; it keeps its place in the thread and a "Solved by …" banner at the top
  jumps to it, so the conversation still reads in order.
- **Discussions** are plain threads with no accepted answer.
- Posts are liked rather than up/down voted. Likes drive author reputation; the
  awards live in one place, `REPUTATION` in `src/lib/forum.ts`. The vote API
  still accepts `-1` if downvotes are ever wanted back.
- Profiles are public at `/u/[handle]`.

Pages are server-rendered so topics are indexable — the point of a support forum
is that the answer is findable from a search engine.

### Mobile

The layout is built mobile-first and verified at 390px with a real browser:
no horizontal overflow on any page, counts in a fixed column rather than
wrapping metadata, 16px inputs so iOS does not zoom on focus, and touch targets
at or above 44px.

## Setup

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, NEXTAUTH_SECRET, one provider
npx prisma db push      # sync the schema
npm run seed            # create the forum categories
npm run dev
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate the Prisma client and build |
| `npm run seed` | Create/refresh forum categories |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run bot` | Discord bot for the events calendar |

## Architecture

```
src/
  app/
    forum/            Topic list, ask composer, thread and category pages
    u/[handle]/       Public profiles
    signin/           Sign-in and email confirmation
    discover/         Pointers to Cascade and Builders Hub
    api/forum/        Topics, replies, votes, accepted answers, categories
  lib/
    auth.ts           NextAuth providers, roles, admin allowlist
    session.ts        currentUser / requireUser / requireModerator
    forum.ts          Validation, slugs, reputation rules
    forum-queries.ts  Server-side reads for rendered pages
    vote.ts           Vote, score and reputation in one transaction path
```

Authorisation is decided in route handlers and pages via `requireUser` and
`requireModerator`. `middleware.ts` only bounces sessionless visitors away from
`/admin`; it never grants access.

## Wallets

A wallet lives in its own `Wallet` model, not as a column on `User`. This is not
cosmetic: MongoDB unique indexes treat `null` as a value and Prisma writes an
explicit null for an absent optional scalar, so a `String? @unique` column on
User meant the *second* user without a wallet failed to be created. The same
applies to `handle` (assigned inside the adapter's `createUser`, never null) and
to `email` (wallet-only accounts get a namespaced placeholder). Any new optional
unique field on `User` needs the same treatment.

## Archived

Project voting, the art programme, the radio player, the news aggregator and the
anonymous imageboard have been retired. Their Prisma models are retained so the
historical data in the live database stays readable — no UI points at them.
