import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/session";

/**
 * Single exit point for route handlers. Known failures keep their status and
 * message; anything unexpected is logged and reported as a generic 500 so
 * internal detail never reaches the client.
 */
export function respondToError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error("Unhandled route error:", error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

/** Clamp a user-supplied page size to something the database can serve. */
export function pageSize(raw: string | null, fallback = 20, max = 50): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
