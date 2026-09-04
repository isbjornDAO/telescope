import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap gate only: bounce anyone without a session cookie away from admin
 * routes so they see a sign-in page rather than a flash of the dashboard.
 *
 * Authorisation is NOT decided here. Middleware runs on the edge without
 * database access, and the previous version tried to work around that by
 * fetching an API route for the caller's Discord ID — then calling
 * `NextResponse.next()` whenever that lookup came back empty, which let
 * unauthenticated requests straight through to /api/admin. Every admin route
 * and page now calls `requireModerator()` for itself, which is the only check
 * that actually decides access.
 */
const SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  );

  if (hasSession) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const signIn = new URL("/signin", request.url);
  signIn.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
