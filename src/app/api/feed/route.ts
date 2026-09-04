import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/session";
import { respondToError, pageSize } from "@/lib/api";
import { buildFeed, FEED_TABS, type FeedTab } from "@/lib/feed";

export const dynamic = "force-dynamic";

/** GET /api/feed?tab=discover&skip=0 — one page of a ranked timeline. */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const raw = params.get("tab") ?? "discover";
    const tab: FeedTab = (FEED_TABS as readonly string[]).includes(raw)
      ? (raw as FeedTab)
      : "discover";

    const take = pageSize(params.get("limit"), 20, 40);
    const skip = Math.max(0, Number.parseInt(params.get("skip") ?? "0", 10) || 0);

    const viewer = await currentUser();
    const items = await buildFeed({ tab, viewerId: viewer?.id ?? null, take, skip });

    return NextResponse.json({
      items,
      // A short page means the ranker ran out of candidates, not that the
      // client should keep asking.
      hasMore: items.length === take,
      needsSignIn: tab === "following" && !viewer,
    });
  } catch (error) {
    return respondToError(error);
  }
}
