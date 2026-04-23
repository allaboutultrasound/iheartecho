/**
 * mediaChunkedUpload.ts
 *
 * Chunked upload endpoint for the Media Repository.
 * Supports files of any size by splitting into 5 MB chunks on the client.
 *
 * Flow:
 *  1. POST /api/media-upload/initiate   → returns uploadId
 *  2. POST /api/media-upload/chunk      → upload each chunk (multipart, field: chunk)
 *  3. POST /api/media-upload/complete   → reassemble and push to S3, returns { url, fileKey }
 *  4. POST /api/media-upload/abort      → clean up temp files
 *
 * Auth: platform admin only.
 * Temp files are stored in /tmp/media-chunks/<uploadId>/ and cleaned up after complete/abort.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();
const TEMP_DIR = "/tmp/media-chunks";

// Multer instance — store chunk to memory (each chunk is ≤ 5 MB)
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  // No size limit — each chunk is small by design
});

function chunkDir(uploadId: string): string {
  return path.join(TEMP_DIR, uploadId);
}

function ensureTempDir(uploadId: string): void {
  const dir = chunkDir(uploadId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanupTempDir(uploadId: string): void {
  const dir = chunkDir(uploadId);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

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

// ── 1. Initiate ───────────────────────────────────────────────────────────────
router.post("/api/media-upload/initiate", async (req: Request, res: Response) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { fileName, mimeType, totalChunks } = req.body as {
    fileName?: string;
    mimeType?: string;
    totalChunks?: number;
  };
  if (!fileName || !mimeType || !totalChunks) {
    res.status(400).json({ error: "fileName, mimeType, and totalChunks are required" });
    return;
  }
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  ensureTempDir(uploadId);
  // Store metadata
  fs.writeFileSync(
    path.join(chunkDir(uploadId), "_meta.json"),
    JSON.stringify({ fileName, mimeType, totalChunks: Number(totalChunks) })
  );
  res.json({ uploadId });
});

// ── 2. Upload chunk ───────────────────────────────────────────────────────────
router.post(
  "/api/media-upload/chunk",
  chunkUpload.single("chunk"),
  async (req: Request, res: Response) => {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const { uploadId, chunkIndex } = req.body as { uploadId?: string; chunkIndex?: string };
    if (!uploadId || chunkIndex === undefined) {
      res.status(400).json({ error: "uploadId and chunkIndex are required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No chunk data provided" });
      return;
    }
    const dir = chunkDir(uploadId);
    if (!fs.existsSync(dir)) {
      res.status(400).json({ error: "Upload session not found" });
      return;
    }
    const chunkPath = path.join(dir, `chunk_${String(chunkIndex).padStart(6, "0")}`);
    fs.writeFileSync(chunkPath, req.file.buffer);
    res.json({ received: true, chunkIndex: Number(chunkIndex) });
  }
);

// ── 3. Complete ───────────────────────────────────────────────────────────────
router.post("/api/media-upload/complete", async (req: Request, res: Response) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { uploadId, folder } = req.body as { uploadId?: string; folder?: string };
  if (!uploadId || !folder) {
    res.status(400).json({ error: "uploadId and folder are required" });
    return;
  }
  const dir = chunkDir(uploadId);
  if (!fs.existsSync(dir)) {
    res.status(400).json({ error: "Upload session not found" });
    return;
  }
  try {
    const metaRaw = fs.readFileSync(path.join(dir, "_meta.json"), "utf-8");
    const meta = JSON.parse(metaRaw) as { fileName: string; mimeType: string; totalChunks: number };
    // Collect chunk files in order
    const chunkFiles = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("chunk_"))
      .sort();
    if (chunkFiles.length !== meta.totalChunks) {
      res.status(400).json({
        error: `Expected ${meta.totalChunks} chunks but received ${chunkFiles.length}`,
      });
      return;
    }
    // Reassemble into a single Buffer
    const parts = chunkFiles.map((f) => fs.readFileSync(path.join(dir, f)));
    const assembled = Buffer.concat(parts);
    // Upload to S3
    const safeFileName = meta.fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const ext = meta.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;
    const { url } = await storagePut(fileKey, assembled, meta.mimeType);
    // Cleanup
    cleanupTempDir(uploadId);
    res.json({ url, fileKey, fileName: meta.fileName, mimeType: meta.mimeType, sizeBytes: assembled.length });
  } catch (err: any) {
    console.error("[media-chunked-upload] complete error:", err);
    cleanupTempDir(uploadId);
    res.status(500).json({ error: err?.message ?? "Assembly failed" });
  }
});

// ── 4. Abort ──────────────────────────────────────────────────────────────────
router.post("/api/media-upload/abort", async (req: Request, res: Response) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { uploadId } = req.body as { uploadId?: string };
  if (!uploadId) { res.status(400).json({ error: "uploadId required" }); return; }
  cleanupTempDir(uploadId);
  res.json({ aborted: true });
});

export function registerMediaChunkedUploadRoute(app: import("express").Express) {
  app.use(router);
}
