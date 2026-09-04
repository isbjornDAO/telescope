# Telescope

The community forum for builders on Avalanche, supporting
[build.avax.network](https://build.avax.network). Ask a question, get an answer
you can accept, and find the Team1 hackathons and bounties worth your time.

## What Telescope is (and is not)

Telescope does one thing: it is the place builders come to get unstuck and to
find programmes to enter. It deliberately does not duplicate its neighbours:

| Need | Where it lives |
| --- | --- |
| Docs, courses, developer console | [build.avax.network](https://build.avax.network) |
| Ecosystem directory (500+ projects) | [cascade.team1.network](https://cascade.team1.network) |
| Questions, answers, discussion | Telescope |
| Hackathons and bounties | Telescope |

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

- **Questions** can be marked solved. The asker (or a moderator) accepts one
  reply, which pins it to the top and awards reputation to whoever wrote it.
- **Discussions** are plain threads with no accepted answer.
- Votes on topics and replies drive both the post score and author reputation.
  The awards live in one place, `REPUTATION` in `src/lib/forum.ts`.
- Profiles are public at `/u/[handle]` and show reputation, questions, answers,
  and how many of those answers were accepted.

Pages are server-rendered so questions are indexable — the point of a support
forum is that the answer is findable from a search engine.

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

## Archived

Project voting, the art programme, the radio player, the news aggregator and the
anonymous imageboard have been retired. Their Prisma models are retained so the
historical data in the live database stays readable — no UI points at them.
