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
  if (!Number.isFinite(size) || size <= 0) {
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

export function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}
