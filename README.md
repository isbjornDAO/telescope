# Telescope

Four tabs: **Forum**, **Tournaments**, **Calendar**, **Shop**. You land on the
forum and start talking.

Tournament rules and the reasoning behind them live in [`docs/`](docs/README.md).
`CLAUDE.md` maps the code.

## Quickstart

```bash
npm install
npx prisma db push     # first run, or after a schema change
npm run seed:world     # optional: seeds tournament regions
npm run dev
```

The site builds with no environment variables at all; a missing key just
switches that feature off. For a working deployment set `DATABASE_URL`,
`NEXTAUTH_SECRET` and `WORLD_ENCRYPTION_KEY`. See `.env.example`.

Tests: `npm test`. Nightly job: `GET /api/world/jobs/tick`, protected by
`CRON_SECRET`, scheduled in `vercel.json`.

## Data Import Formats

Sample data files should be placed in `/prisma/seeds/`

1. **Users (JSON):**
   ```json
   {
     "address": "0x...",
     "discordId": "123456789",
     "xp": 0,
     "level": 1,
     "streak": 0,
     "longestStreak": 0
   }
   ```

2. **Projects (JSON):**
   ```json
   {
     "name": "Project Name",
     "description": "Project Description",
     "avatar": "https://...",
     "tags": ["defi", "nft"],
     "social": {
       "twitter": "https://...",
       "discord": "https://...",
       "website": "https://..."
     }
   }
   ```

3. **Incubator Projects (JSON):**
   ```json
   {
     "title": "Project Title",
     "description": "Project Description",
     "logo": "https://...", // Image should be 120x120px, PNG/JPG format
     "status": "live",
     "launchDate": {
       "$date": "2024-03-20T00:00:00Z"
     },
     "createdAt": {
       "$date": "2024-12-15T19:07:12.808Z"
     },
     "tags": ["presale", "new"],
     "social": {
       "dexscreener": "https://...",
       "contractAddress": "0x..."
     }
   }
   ```

## Data Import Commands

1. **Import using mongoimport:**
   ```bash
   mongoimport --uri="DATABASE_URL" --collection=User --file=./prisma/seeds/users.json --jsonArray
   mongoimport --uri="DATABASE_URL" --collection=Project --file=./prisma/seeds/projects.json --jsonArray
   mongoimport --uri="DATABASE_URL" --collection=IncubatorProject --file=./prisma/seeds/incubator.json --jsonArray
   ```

2. **Or use Prisma client:**
   Create `seed.ts` file and run:
   ```bash
   npx prisma db seed
   ```

## Required Files

1. **Prisma Schema:** `prisma/schema.prisma`
2. **Environment Config:** `src/env.ts`
3. **Type Definitions:** `src/types/project.ts`

## Running the Project

- **Start development server:**
  ```bash
  npm run dev
  ```

- **Production build:**
  ```bash
  npm run build
  npm start
  ```

## Troubleshooting

**Common issues:**
- MongoDB connection failures: Verify `DATABASE_URL` format and IP whitelisting.
- Missing Discord env vars: All `DISCORD_` variables must be set.
- Schema mismatches: Run `npx prisma generate` after schema changes.
- Vote validation errors: Ensure user has connected Discord account.

For voting system implementation details, see:
`src/app/api/projects/[projectId]/vote/route.ts` (lines 7-164)