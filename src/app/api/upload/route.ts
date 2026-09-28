import { NextRequest, NextResponse } from "next/server";
import { presignMediaUpload } from "@/lib/storage/r2";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

// Signs a direct upload. Stays dynamic so a missing R2 key is a runtime miss, not a build failure.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireWorldUser(request);
  } catch (error) {
    if (error instanceof WorldError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const { contentType, size } = body as { contentType?: unknown; size?: unknown };
  if (typeof contentType !== "string" || typeof size !== "number") {
    return NextResponse.json(
      { error: "contentType and size are required" },
      { status: 400 }
    );
  }

  try {
    const result = await presignMediaUpload({ contentType, size });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      url: result.url,
      headers: { "Content-Type": result.contentType },
    });
  } catch (error) {
    console.error("Error preparing upload:", error);
    return NextResponse.json({ error: "Failed to prepare upload" }, { status: 500 });
  }
}
