import { NextRequest, NextResponse } from "next/server";
import { handle, fail } from "@/lib/world/api";
import { buildSignInMessage, issueNonce } from "@/lib/world/session";
import { ADDRESS_RE } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const address = req.nextUrl.searchParams.get("address") || "";
  if (!ADDRESS_RE.test(address)) return fail("A wallet address is required.", 422);
  const res = NextResponse.json({ ok: true });
  const nonce = issueNonce(res);
  const issuedAt = new Date().toISOString();
  const message = buildSignInMessage(address as `0x${string}`, nonce, issuedAt);
  return NextResponse.json({ message, nonce, issuedAt }, { headers: res.headers });
});
