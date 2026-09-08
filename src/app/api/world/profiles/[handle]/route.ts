import { NextRequest } from "next/server";
import { handle, ok, noStore } from "@/lib/world/api";
import { publicProfile, requireNode } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: NextRequest, { params }: { params: { handle: string } }) => {
  const user = await requireNode(decodeURIComponent(params.handle));
  return ok(await publicProfile(user), noStore);
});
