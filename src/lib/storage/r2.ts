import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { inspectMedia, type MediaCheck } from "@/lib/storage/media";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

/** Absent keys switch media storage off. The site still builds. */
export function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export type PresignResult =
  | { ok: true; uploadUrl: string; url: string; contentType: string }
  | { ok: false; error: string; status: number };

/**
 * A short-lived PUT the browser sends straight to R2.
 * The object key is generated here so the client cannot choose the path.
 */
export async function presignMediaUpload(input: {
  contentType: string;
  size: number;
}): Promise<PresignResult> {
  const checked: MediaCheck = inspectMedia(input.contentType, input.size);
  if (!checked.ok) return { ok: false, error: checked.error, status: 400 };

  const cfg = r2Config();
  if (!cfg) {
    return { ok: false, error: "Media storage is not configured", status: 503 };
  }

  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `media/${now.getUTCFullYear()}/${month}/${randomUUID()}.${checked.ext}`;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: input.contentType,
    }),
    { expiresIn: 120 }
  );

  return {
    ok: true,
    uploadUrl,
    url: `${cfg.publicUrl}/${key}`,
    contentType: input.contentType,
  };
}
