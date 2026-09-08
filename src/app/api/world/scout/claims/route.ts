import { NextRequest } from "next/server";
import { handle, ok, noStore } from "@/lib/world/api";
import { requireWorldUser } from "@/lib/world/session";
import { buildClaims } from "@/lib/world/scout";

export const dynamic = "force-dynamic";

/** Exactly what my scout is allowed to say about me to other scouts. */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  return ok(await buildClaims(user.id), noStore);
});
