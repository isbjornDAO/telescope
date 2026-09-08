import { NextRequest } from "next/server";
import { handle, ok, requireCronSecret } from "@/lib/world/api";
import { recomputeTrustScores } from "@/lib/world/trust-db";
import { runRetentionChecks, tickSeasons } from "@/lib/world/seasons";
import { cleanupScout } from "@/lib/world/scout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The world's heartbeat. Run nightly (vercel.json cron) or by hand with the
 * cron secret: season transitions, round open/close, trust recompute,
 * retention vesting, scout log retention.
 */
async function tick(req: NextRequest) {
  requireCronSecret(req);
  const seasons = await tickSeasons();
  const trust = await recomputeTrustScores();
  const retention = await runRetentionChecks();
  const scout = await cleanupScout();
  return ok({ at: new Date().toISOString(), seasons, trust, retention, scout });
}

export const GET = handle(tick);
export const POST = handle(tick);
