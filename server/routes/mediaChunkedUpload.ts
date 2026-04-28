/**
 * mediaUpload.ts
 *
 * Single-request streaming upload endpoint for the Media Repository.
 * The client sends the entire file in one multipart POST request.
 * The server receives it via multer (memory), then uploads directly to Forge.
 *
 * This is the simplest and most reliable approach for Cloud Run:
 * - No background jobs (Cloud Run kills idle instances)
 * - No chunked assembly (no temp storage, no multi-instance issues)
 * - No polling (single request returns the final URL)
 * - 400 MB uploads complete in ~23 seconds at 17 MB/s to Forge
 *
 * Auth: platform admin only.
 *
 * POST /api/media-upload/upload
 *   Body: multipart/form-data
 *     file: the file to upload
 *     folder: destination folder in Forge (e.g. "media/courses/acs")
 *   Response: { url, fileKey, sizeBytes }
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import FormDataNode from "form-data";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";

const router = Router();

// Multer — store entire file in memory
// Cloud Run has 32 GB RAM; 400 MB files are fine
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB safety limit
});

// ── Forge helpers ─────────────────────────────────────────────────────────────
function forgeUploadUrl(fileKey: string): string {
  const base = ENV.forgeApiUrl.replace(/\/+$/, "");
  const url = new URL("v1/storage/upload", base + "/");
  url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
  return url.toString();
}

async function uploadBufferToForge(
  buffer: Buffer,
  fileKey: string,
  mimeType: string
): Promise<string> {
  const form = new FormDataNode();
  form.append("file", buffer, {
    filename: fileKey.split("/").pop() ?? "file",
    contentType: mimeType,
    knownLength: buffer.length,
  });
  const res = await axios.post(forgeUploadUrl(fileKey), form, {
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 20 * 60 * 1000, // 20 min timeout for very large files
  });
  return (res.data as { url: string }).url;
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

// ── Single upload endpoint ────────────────────────────────────────────────────
router.post(
  "/api/media-upload/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = await requireAdmin(req, res);
      if (!user) return;

      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const folder = (req.body.folder as string) || "media";
      const originalName = req.file.originalname || "upload";
      const mimeType = req.file.mimetype || "application/octet-stream";

      // Build a safe, unique file key
      const safeFileName = originalName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
      const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;

      console.log(
        `[media-upload] Uploading ${(req.file.buffer.length / 1024 / 1024).toFixed(1)} MB → ${fileKey}`
      );

      const url = await uploadBufferToForge(req.file.buffer, fileKey, mimeType);

      console.log(`[media-upload] Done: ${url}`);

      res.json({
        url,
        fileKey,
        sizeBytes: req.file.buffer.length,
      });
    } catch (err: any) {
      const errMsg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : (err?.message ?? String(err));
      console.error("[media-upload] error:", errMsg);
      res.status(500).json({ error: errMsg });
    }
  }
);

// ── Legacy chunked endpoints (kept for backward compatibility, all return 410 Gone) ──
// These were the old chunked upload endpoints. The new single-upload endpoint
// at /api/media-upload/upload replaces all of them.
router.post("/api/media-upload/initiate", (_req, res) => {
  res.status(410).json({ error: "Chunked upload is no longer supported. Use /api/media-upload/upload instead." });
});
router.post("/api/media-upload/chunk", (_req, res) => {
  res.status(410).json({ error: "Chunked upload is no longer supported. Use /api/media-upload/upload instead." });
});
router.post("/api/media-upload/complete", (_req, res) => {
  res.status(410).json({ error: "Chunked upload is no longer supported. Use /api/media-upload/upload instead." });
});
router.get("/api/media-upload/status/:uploadId", (_req, res) => {
  res.status(410).json({ error: "Chunked upload is no longer supported. Use /api/media-upload/upload instead." });
});
router.post("/api/media-upload/abort", (_req, res) => {
  res.json({ aborted: true });
});

export function registerMediaChunkedUploadRoute(app: import("express").Express) {
  app.use(router);
}
