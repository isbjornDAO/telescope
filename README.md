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

> Builders Hub is currently an OAuth *consumer* (NextAuth with those three
> providers) and exposes no authorization or token endpoint, so a literal
> "Sign in with Builders Hub" button cannot be built yet. `src/lib/auth.ts`
> keeps a slot for a `builders-hub` provider; when Ava Labs ships one, adding it
> there links existing users automatically through the same email matching.

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
