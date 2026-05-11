// Storage helpers — dual-mode: Manus Forge (default) or Cloudflare R2 (Railway)
// Uses R2 when R2_ENDPOINT env var is set, otherwise falls back to Manus Forge proxy.
import { ENV } from './_core/env';

// ── Detect which backend to use ───────────────────────────────────────────────
function useR2(): boolean {
  return !!(ENV.r2Endpoint && ENV.r2AccessKeyId && ENV.r2SecretAccessKey);
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ── Manus Forge helpers ───────────────────────────────────────────────────────
type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function forgePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

async function forgeGet(relKey: string): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return { key, url: await buildDownloadUrl(baseUrl, key, apiKey) };
}

// ── Cloudflare R2 helpers ─────────────────────────────────────────────────────
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;
  _r2Client = new S3Client({
    region: "auto",
    endpoint: ENV.r2Endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
  return _r2Client;
}

function getR2PublicUrl(key: string): string {
  const publicUrl = ENV.r2PublicUrl?.replace(/\/+$/, "");
  if (!publicUrl) throw new Error("R2_PUBLIC_URL env var is not set");
  return `${publicUrl}/${key}`;
}

async function r2Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = ENV.r2BucketName;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var is not set");
  const key = normalizeKey(relKey);
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return { key, url: getR2PublicUrl(key) };
}

async function r2Get(relKey: string, expiresIn = 3600): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (ENV.r2PublicUrl) return { key, url: getR2PublicUrl(key) };
  const client = getR2Client();
  const bucket = ENV.r2BucketName;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var is not set");
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  return { key, url };
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Upload bytes to storage and return the public URL.
 * Uses R2 when R2_ENDPOINT is set, otherwise uses Manus Forge.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (useR2()) return r2Put(relKey, data, contentType);
  return forgePut(relKey, data, contentType);
}

/**
 * Get a download URL for an object.
 * Uses R2 when R2_ENDPOINT is set, otherwise uses Manus Forge.
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  if (useR2()) return r2Get(relKey, expiresIn);
  return forgeGet(relKey);
}
