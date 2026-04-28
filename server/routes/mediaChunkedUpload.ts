/**
 * mediaChunkedUpload.ts
 *
 * Chunked upload endpoint for the Media Repository.
 * Supports files of any size by splitting into 5 MB chunks on the client.
 *
 * Flow:
 *  1. POST /api/media-upload/initiate   → returns uploadId
 *  2. POST /api/media-upload/chunk      → upload each chunk (multipart, field: chunk)
 *  3. POST /api/media-upload/complete   → stream-assemble to a temp file, then stream to S3 proxy
 *  4. POST /api/media-upload/abort      → clean up temp files
 *
 * Auth: platform admin only.
 * Temp files are stored in /tmp/media-chunks/<uploadId>/ and cleaned up after complete/abort.
 *
 * Memory-safe: chunks are written to disk as they arrive; the complete step
 * concatenates them into a single temp file and streams it to the storage proxy
 * via axios (which supports streaming multipart bodies) without ever loading
 * the full file into a JS Buffer.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormDataNode from "form-data";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";

const router = Router();
const TEMP_DIR = "/tmp/media-chunks";

// Multer instance — store each chunk to disk (not memory) to avoid RAM spikes
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const uploadId = (req.body as any).uploadId as string | undefined;
      if (!uploadId) return cb(new Error("uploadId missing"), "");
      const dir = chunkDir(uploadId);
      if (!fs.existsSync(dir)) return cb(new Error("Upload session not found"), "");
      cb(null, dir);
    },
    filename: (_req, _file, cb) => {
      // Temporary name; we'll rename after we know the chunkIndex
      cb(null, `_incoming_${Date.now()}`);
    },
  }),
  // No size limit — each chunk is small by design (≤ 5 MB)
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
    if (!user) {
      // Clean up the temp file multer wrote if auth fails
      if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
      return;
    }
    const { uploadId, chunkIndex } = req.body as { uploadId?: string; chunkIndex?: string };
    if (!uploadId || chunkIndex === undefined) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
      res.status(400).json({ error: "uploadId and chunkIndex are required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No chunk data provided" });
      return;
    }
    const dir = chunkDir(uploadId);
    if (!fs.existsSync(dir)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      res.status(400).json({ error: "Upload session not found" });
      return;
    }
    // Rename the incoming file to the correct chunk name
    const chunkPath = path.join(dir, `chunk_${String(chunkIndex).padStart(6, "0")}`);
    fs.renameSync(req.file.path, chunkPath);
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

  // Use a longer timeout for large files (15 minutes)
  res.setTimeout(15 * 60 * 1000);

  const assembledPath = path.join(dir, "_assembled");
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

    // ── Stream-assemble chunks into a single temp file (no memory spike) ──
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(assembledPath);
      writeStream.on("error", reject);
      writeStream.on("finish", resolve);

      (async () => {
        for (const chunkFile of chunkFiles) {
          await new Promise<void>((res2, rej2) => {
            const readStream = fs.createReadStream(path.join(dir, chunkFile));
            readStream.on("error", rej2);
            readStream.on("end", res2);
            readStream.pipe(writeStream, { end: false });
          });
        }
        writeStream.end();
      })().catch(reject);
    });

    const sizeBytes = fs.statSync(assembledPath).size;

    // ── Stream the assembled file to the Forge storage proxy via axios ──
    // axios properly supports streaming multipart bodies (unlike native fetch)
    const safeFileName = meta.fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const ext = meta.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;

    const forgeBaseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const uploadUrl = new URL(`v1/storage/upload`, forgeBaseUrl + "/");
    uploadUrl.searchParams.set("path", fileKey.replace(/^\/+/, ""));

    // Build a streaming form-data body using the form-data npm package
    const form = new FormDataNode();
    form.append("file", fs.createReadStream(assembledPath), {
      filename: safeFileName,
      contentType: meta.mimeType,
      knownLength: sizeBytes,
    });

    const uploadResponse = await axios.post(uploadUrl.toString(), form, {
      headers: {
        Authorization: `Bearer ${ENV.forgeApiKey}`,
        ...form.getHeaders(),
      },
      // No size limit — we're streaming from disk
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      // 10 minute timeout for the actual S3 upload
      timeout: 10 * 60 * 1000,
    });

    const { url } = uploadResponse.data as { url: string };

    // Cleanup
    cleanupTempDir(uploadId);
    res.json({ url, fileKey, fileName: meta.fileName, mimeType: meta.mimeType, sizeBytes });
  } catch (err: any) {
    console.error("[media-chunked-upload] complete error:", err?.response?.data ?? err?.message ?? err);
    // Clean up assembled file if it exists
    try { if (fs.existsSync(assembledPath)) fs.unlinkSync(assembledPath); } catch {}
    cleanupTempDir(uploadId);
    const errMsg = err?.response?.data?.error ?? err?.response?.data ?? err?.message ?? "Assembly failed";
    res.status(500).json({ error: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg) });
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
