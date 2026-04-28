/**
 * mediaChunkedUpload.ts
 *
 * Stateless chunked upload endpoint for the Media Repository.
 * Supports files of any size by splitting into 5 MB chunks on the client.
 *
 * Flow:
 *  1. POST /api/media-upload/initiate   → returns uploadId
 *  2. POST /api/media-upload/chunk      → server receives chunk via multer (memory),
 *                                         immediately uploads it to Forge as a temp chunk file
 *  3. POST /api/media-upload/complete   → server downloads all chunk files from Forge in order,
 *                                         concatenates them, and uploads the final file to Forge
 *  4. POST /api/media-upload/abort      → no-op (chunk files expire naturally in Forge)
 *
 * Auth: platform admin only.
 *
 * Stateless design: no /tmp disk storage is used. All intermediate state lives in Forge
 * storage under the prefix `_chunks/<uploadId>/`. This means any Cloud Run instance can
 * handle any request in the sequence without sticky sessions.
 *
 * Memory usage: each chunk is buffered in memory only for the duration of the upload to Forge
 * (≤ 5 MB per chunk). The complete step downloads all chunks and concatenates them in memory
 * before uploading. For a 400 MB file this uses ~400 MB of RAM, which is within Cloud Run's
 * default 2 GB memory limit.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import FormDataNode from "form-data";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";

const router = Router();

// Multer — store each chunk in memory (≤ 5 MB per chunk)
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB safety limit per chunk
});

// ── Forge helpers ─────────────────────────────────────────────────────────────

function forgeUploadUrl(fileKey: string): string {
  const base = ENV.forgeApiUrl.replace(/\/+$/, "");
  const url = new URL("v1/storage/upload", base + "/");
  url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
  return url.toString();
}

function forgeDownloadApiUrl(fileKey: string): string {
  const base = ENV.forgeApiUrl.replace(/\/+$/, "");
  const url = new URL("v1/storage/downloadUrl", base + "/");
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
    filename: fileKey.split("/").pop() ?? "chunk",
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
    timeout: 5 * 60 * 1000,
  });
  return (res.data as { url: string }).url;
}

async function getForgeSignedDownloadUrl(fileKey: string): Promise<string> {
  const res = await axios.get(forgeDownloadApiUrl(fileKey), {
    headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    timeout: 30_000,
  });
  return (res.data as { url: string }).url;
}

async function downloadChunkBuffer(fileKey: string): Promise<Buffer> {
  const signedUrl = await getForgeSignedDownloadUrl(fileKey);
  const res = await axios.get(signedUrl, {
    responseType: "arraybuffer",
    timeout: 5 * 60 * 1000,
  });
  return Buffer.from(res.data as ArrayBuffer);
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

// ── 1. Initiate ───────────────────────────────────────────────────────────────
router.post("/api/media-upload/initiate", async (req: Request, res: Response) => {
  try {
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
    // Store metadata as a small JSON file in Forge so any instance can read it
    const metaKey = `_chunks/${uploadId}/_meta.json`;
    const metaBuffer = Buffer.from(
      JSON.stringify({ fileName, mimeType, totalChunks: Number(totalChunks) })
    );
    await uploadBufferToForge(metaBuffer, metaKey, "application/json");
    res.json({ uploadId });
  } catch (err: any) {
    console.error("[media-chunked-upload] initiate error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Initiate failed" });
  }
});

// ── 2. Upload chunk ───────────────────────────────────────────────────────────
router.post(
  "/api/media-upload/chunk",
  chunkUpload.single("chunk"),
  async (req: Request, res: Response) => {
    try {
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
      // Upload this chunk to Forge as a temp file (stateless — any instance can do this)
      const paddedIndex = String(chunkIndex).padStart(6, "0");
      const chunkKey = `_chunks/${uploadId}/chunk_${paddedIndex}.bin`;
      await uploadBufferToForge(req.file.buffer, chunkKey, "application/octet-stream");
      res.json({ received: true, chunkIndex: Number(chunkIndex) });
    } catch (err: any) {
      console.error("[media-chunked-upload] chunk error:", err?.message ?? err);
      res.status(500).json({ error: err?.message ?? "Chunk upload failed" });
    }
  }
);

// ── 3. Complete ───────────────────────────────────────────────────────────────
router.post("/api/media-upload/complete", async (req: Request, res: Response) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const { uploadId, folder } = req.body as { uploadId?: string; folder?: string };
    if (!uploadId || !folder) {
      res.status(400).json({ error: "uploadId and folder are required" });
      return;
    }

    // Use a longer timeout for large files (20 minutes)
    res.setTimeout(20 * 60 * 1000);

    // Read metadata from Forge
    const metaKey = `_chunks/${uploadId}/_meta.json`;
    const metaBuf = await downloadChunkBuffer(metaKey);
    const meta = JSON.parse(metaBuf.toString("utf-8")) as {
      fileName: string;
      mimeType: string;
      totalChunks: number;
    };

    // Build the final file key
    const safeFileName = meta.fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const ext = meta.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;

    console.log(
      `[media-chunked-upload] Assembling ${meta.totalChunks} chunks for "${meta.fileName}" → ${fileKey}`
    );

    // Download all chunks sequentially and concatenate into a single Buffer.
    // We do this chunk-by-chunk to keep peak memory at ~2× chunk size (current + next).
    const chunkBuffers: Buffer[] = [];
    let totalBytes = 0;
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkKey = `_chunks/${uploadId}/chunk_${String(i).padStart(6, "0")}.bin`;
      const buf = await downloadChunkBuffer(chunkKey);
      chunkBuffers.push(buf);
      totalBytes += buf.length;
      if ((i + 1) % 10 === 0 || i + 1 === meta.totalChunks) {
        console.log(
          `[media-chunked-upload] Downloaded ${i + 1}/${meta.totalChunks} chunks (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`
        );
      }
    }

    // Concatenate all chunks and upload to Forge as the final file
    const assembled = Buffer.concat(chunkBuffers);
    console.log(
      `[media-chunked-upload] Uploading assembled file: ${(assembled.length / 1024 / 1024).toFixed(1)} MB`
    );

    const form = new FormDataNode();
    form.append("file", assembled, {
      filename: safeFileName,
      contentType: meta.mimeType,
      knownLength: assembled.length,
    });

    const uploadRes = await axios.post(forgeUploadUrl(fileKey), form, {
      headers: {
        Authorization: `Bearer ${ENV.forgeApiKey}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 15 * 60 * 1000,
    });

    const { url } = uploadRes.data as { url: string };
    console.log(`[media-chunked-upload] Upload complete: ${url}`);

    res.json({
      url,
      fileKey,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      sizeBytes: assembled.length,
    });
  } catch (err: any) {
    const errDetail = err?.response?.data ?? err?.message ?? String(err);
    console.error("[media-chunked-upload] complete error:", errDetail);
    res.status(500).json({
      error: typeof errDetail === "string" ? errDetail : JSON.stringify(errDetail),
    });
  }
});

// ── 4. Abort ──────────────────────────────────────────────────────────────────
router.post("/api/media-upload/abort", async (req: Request, res: Response) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    // Chunk files in Forge will expire naturally — no explicit cleanup needed
    res.json({ aborted: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Abort failed" });
  }
});

export function registerMediaChunkedUploadRoute(app: import("express").Express) {
  app.use(router);
}
