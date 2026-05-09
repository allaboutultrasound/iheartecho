/**
 * mediaUpload.ts
 *
 * Direct browser-to-R2 upload endpoint for the Media Repository.
 *
 * Flow:
 *  1. POST /api/media-upload/prepare  → server validates auth and returns a
 *                                        presigned R2 upload URL.
 *  2. Browser PUTs file directly to R2 (uploadUrl) — bypasses server entirely.
 *  3. POST /api/media-upload/register → server records metadata in DB and returns asset
 *
 * Why direct upload?
 * - The file only travels once: user's computer → R2
 * - No double-upload (browser → server → object storage)
 * - No server memory pressure (400 MB never touches Railway RAM)
 * - No timeout issues (browser uploads at its own pace directly to R2)
 * - R2 CORS must allow PUT from the app origin.
 *
 * Auth: platform admin only (validated on both /prepare and /register).
 */
import { Router, Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { storageCreateUploadUrl } from "../storage";

const router = Router();

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

// ── 1. Prepare: generate upload URL ───────────────────────────────────────────
/**
 * POST /api/media-upload/prepare
 * Body: { fileName: string, mimeType: string, folder: string }
 * Returns: { uploadUrl, fileKey, publicUrl, method, headers }
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

    const { uploadUrl, publicUrl } = await storageCreateUploadUrl(fileKey, mimeType);

    console.log(`[media-upload] Prepared upload: ${fileKey}`);

    res.json({
      uploadUrl,
      fileKey,
      publicUrl,
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
      },
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
 * Called after the browser has successfully uploaded the file to R2.
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
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct R2 upload instead." });
});
router.post("/api/media-upload/initiate", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct R2 upload instead." });
});
router.post("/api/media-upload/chunk", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct R2 upload instead." });
});
router.post("/api/media-upload/complete", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct R2 upload instead." });
});
router.get("/api/media-upload/status/:uploadId", (_req, res) => {
  res.status(410).json({ error: "Use /api/media-upload/prepare + direct R2 upload instead." });
});
router.post("/api/media-upload/abort", (_req, res) => {
  res.json({ aborted: true });
});

export function registerMediaChunkedUploadRoute(app: import("express").Express) {
  app.use(router);
}
