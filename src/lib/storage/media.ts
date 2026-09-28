/** Types and size limits for forum image and video uploads. Pure, so the API and the composers share one check. */

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime";

const MEDIA_TYPES: Record<string, { ext: string; kind: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/avif": { ext: "avif", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
};

export type MediaCheck =
  | { ok: true; ext: string; kind: "image" | "video" }
  | { ok: false; error: string };

export function inspectMedia(contentType: string, size: number): MediaCheck {
  const spec = MEDIA_TYPES[contentType];
  if (!spec) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, or MOV file.",
    };
  }
  if (!Number.isInteger(size) || size <= 0) {
    return { ok: false, error: "That file is empty." };
  }
  const limit = spec.kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (size > limit) {
    const mb = Math.round(limit / (1024 * 1024));
    const noun = spec.kind === "video" ? "Videos" : "Images";
    return { ok: false, error: `${noun} must be under ${mb}MB.` };
  }
  return { ok: true, ext: spec.ext, kind: spec.kind };
}

/**
 * A new attachment may only be an object this app stored under the public R2 host.
 * Query strings are dropped so a signed URL cannot be smuggled in as the post URL.
 */
export function acceptedAttachment(
  url: string,
  publicBase: string | undefined
): { ok: true; url: string } | { ok: false; error: string } {
  const rejected = { ok: false as const, error: "That attachment is not allowed." };
  if (!publicBase) return { ok: false, error: "Media storage is not configured." };
  let parsed: URL;
  let base: URL;
  try {
    parsed = new URL(url);
    base = new URL(publicBase);
  } catch {
    return rejected;
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.origin !== base.origin ||
    !parsed.pathname.startsWith("/media/") ||
    parsed.pathname.includes("..")
  ) {
    return rejected;
  }
  return { ok: true, url: `${parsed.origin}${parsed.pathname}` };
}

export function resolveAttachment(
  value: unknown,
  publicBase: string | undefined
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, url: null };
  if (typeof value !== "string") {
    return { ok: false, error: "That attachment is not allowed." };
  }
  return acceptedAttachment(value, publicBase);
}

export function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}
