import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/world/api";
import { requireWorldUser } from "@/lib/world/session";
import { runScout } from "@/lib/world/scout";
import { currentSeasonNumber } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

/** Send the scout out. Each candidate queried costs one QUERY from the budget. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const result = await runScout(user, await currentSeasonNumber());
  return ok(result);
});
