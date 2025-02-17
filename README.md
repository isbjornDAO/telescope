# Telescope Platform Documentation

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env` file in the root directory with:
   ```plaintext
   DATABASE_URL="mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority"
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_BOT_TOKEN=your_discord_bot_token
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wc_project_id
   ```

3. **Database setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Environment Variables Generation

1. **Generate NextAuth secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Get Discord credentials:**
   - Create application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

3. **WalletConnect Project ID:**
   - Create project at [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Use the project ID in your `.env`

4. **MongoDB connection:**
   - Create free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Whitelist IP `0.0.0.0/0` (temporarily for development)
   - Get connection string from "Connect" button
   - PD: Ask for access for production connection string

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
     "logo": "https://...",
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