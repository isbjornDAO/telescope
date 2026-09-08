import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { WorldError } from "@/lib/world/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler so WorldError and Zod errors become clean JSON. */
export function handle<T extends unknown[]>(
  fn: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof WorldError) return fail(err.message, err.status);
      if (err instanceof ZodError) {
        return fail(err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "), 422);
      }
      console.error("world api error", err);
      return fail("Something broke in the world. Try again.", 500);
    }
  };
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new WorldError("Body must be JSON.", 400);
  }
  return schema.parse(json);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const noStore = { headers: { "Cache-Control": "no-store" } } as const;

export function requireCronSecret(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  const header = req.headers.get("x-cron-secret") || "";
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new WorldError("CRON_SECRET not set.", 503);
    return;
  }
  if (auth !== `Bearer ${secret}` && header !== secret) throw new WorldError("Forbidden.", 403);
}
