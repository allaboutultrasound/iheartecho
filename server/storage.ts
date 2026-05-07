// Storage helpers — Cloudflare R2 (S3-compatible)
// Falls back to Manus Forge proxy when R2 env vars are not set (backward compat)

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ── R2 client (lazy-initialised) ─────────────────────────────────────────────

let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;
  const endpoint = ENV.r2Endpoint;
  const accessKeyId = ENV.r2AccessKeyId;
  const secretAccessKey = ENV.r2SecretAccessKey;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials missing: set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY"
    );
  }

  _r2Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _r2Client;
}

function getBucket(): string {
  const bucket = ENV.r2BucketName;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var is not set");
  return bucket;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function getPublicUrl(key: string): string {
  const publicUrl = ENV.r2PublicUrl?.replace(/\/+$/, "");
  if (!publicUrl) throw new Error("R2_PUBLIC_URL env var is not set");
  return `${publicUrl}/${key}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload bytes to R2 and return the public URL.
 * The R2 bucket must have public access enabled.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: getPublicUrl(key) };
}

/**
 * Get a presigned GET URL for a private object, or the public URL if the
 * bucket has public access enabled.
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // If public URL is configured, return it directly (no signing needed)
  if (ENV.r2PublicUrl) {
    return { key, url: getPublicUrl(key) };
  }

  // Otherwise generate a presigned URL
  const client = getR2Client();
  const bucket = getBucket();
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
  return { key, url };
}
