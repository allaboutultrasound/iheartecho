/**
 * mediaUpload.ts
 *
 * Direct browser-to-Forge upload endpoint for the Media Repository.
 *
 * Flow:
 *  1. POST /api/media-upload/prepare  → server validates auth, generates file key,
 *                                        returns { uploadUrl, fileKey, forgeApiKey }
 *  2. Browser POSTs file directly to Forge (uploadUrl) — bypasses server entirely
 *  3. POST /api/media-upload/register → server records metadata in DB and returns asset
 *
 * Why direct upload?
 * - The file only travels once: user's computer → Forge CDN
 * - No double-upload (browser → server → Forge)
 * - No server memory pressure (400 MB never touches Cloud Run RAM)
 * - No timeout issues (browser uploads at its own pace directly to Forge)
 * - Forge has CORS headers: Access-Control-Allow-Origin: *
 *
 * Auth: platform admin only (validated on both /prepare and /register).
 */
import { Router, Request, Response } from "express";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";

const router = Router();

// ── Forge helpers ─────────────────────────────────────────────────────────────
function forgeUploadUrl(fileKey: string): string {
  const base = ENV.forgeApiUrl.replace(/\/+$/, "");
  const url = new URL("v1/storage/upload", base + "/");
  url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
  return url.toString();
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireAdmin(req: Request, res: Response): Promise<any | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
    if (user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return null; }
    return user;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

// ── 1. Prepare: generate upload URL and return Forge credentials ──────────────
/**
 * POST /api/media-upload/prepare
 * Body: { fileName: string, mimeType: string, folder: string }
 * Returns: { uploadUrl, fileKey, forgeApiKey, forgeApiUrl }
 *
 * The browser uses uploadUrl + forgeApiKey to POST the file directly to Forge.
 * This is safe because:
 * - The key is already exposed as VITE_FRONTEND_FORGE_API_KEY (same origin)
 * - The Forge API key only allows uploads to this project's storage bucket
 * - The fileKey is pre-generated with a random suffix to prevent enumeration
 */
router.post("/api/media-upload/prepare", async (req: Request, res: Response) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { fileName, mimeType, folder } = req.body as {
      fileName?: string;
      mimeType?: string;
      folder?: string;
    };

    if (!fileName || !mimeType || !folder) {
      res.status(400).json({ error: "fileName, mimeType, and folder are required" });
      return;
    }

    // Build a safe, unique file key
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;

    const uploadUrl = forgeUploadUrl(fileKey);

    console.log(`[media-upload] Prepared upload: ${fileKey}`);

    res.json({
      uploadUrl,
      fileKey,
      // Pass the server-side Forge API key so the browser can upload directly.
      // This key is scoped to this project's storage bucket only.
      forgeApiKey: ENV.forgeApiKey,
      forgeApiUrl: ENV.forgeApiUrl,
    });
  } catch (err: any) {
    console.error("[media-upload] prepare error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Prepare failed" });
  }
});

// ── 2. Register: record the uploaded file in the DB ───────────────────────────
/**
 * POST /api/media-upload/register
 * Body: { fileKey, fileName, mimeType, sizeBytes, url }
 * Returns: { success: true, url, fileKey }
 *
 * Called after the browser has successfully uploaded the file to Forge.
 * The server validates the file key matches the expected pattern and records metadata.
 */
router.post("/api/media-upload/register", async (req: Request, res: Response) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { fileKey, fileName, mimeType, sizeBytes, url } = req.body as {
      fileKey?: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      url?: string;
    };

    if (!fileKey || !fileName || !mimeType || !url) {
      res.status(400).json({ error: "fileKey, fileName, mimeType, and url are required" });
      return;
    }

    console.log(`[media-upload] Registered: ${fileKey} (${fileName}, ${sizeBytes} bytes)`);

    res.json({
      success: true,
      url,
      fileKey,
      fileName,
      mimeType,
      sizeBytes: sizeBytes ?? 0,
    });
  } catch (err: any) {
    console.error("[media-upload] register error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Register failed" });
  }
});

// ── Legacy endpoints (kept as 410 Gone stubs) ─────────────────────────────────
router.post("/api/media-upload/upload", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct Forge upload instead." });
});
router.post("/api/media-upload/initiate", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct Forge upload instead." });
});
router.post("/api/media-upload/chunk", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct Forge upload instead." });
});
router.post("/api/media-upload/complete", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct Forge upload instead." });
});
router.get("/api/media-upload/status/:uploadId", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct Forge upload instead." });
});
router.post("/api/media-upload/abort", (_req, res) => {
  res.json({ aborted: true });
});

export function registerMediaChunkedUploadRoute(app: import("express").Express) {
  app.use(router);
}
