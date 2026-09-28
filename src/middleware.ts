import { NextResponse } from "next/server";

/**
 * Admin pages are not gated here. A wallet cookie is set by the browser, so
 * treating it as proof used to let a request through. Each admin API checks
 * the signed world session instead.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
