/**
 * Generic multipart upload route — /api/upload
 *
 * Accepts a single file via multipart/form-data and uploads it to S3.
 * Returns { url, fileKey }.
 *
 * Required body fields:
 *   - file        : the file (multipart field)
 *   - folder      : S3 path prefix, e.g. "avatars", "soundbytes", "tee-media"
 *
 * Optional body fields:
 *   - maxMB       : max file size in MB (default 100, max 600)
 *   - allowedTypes: comma-separated MIME type prefixes, e.g. "image,video,audio" (default "image,video,audio")
 *
 * Auth: any authenticated user (role check is caller's responsibility via folder convention).
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();

// Max 600 MB — covers large SoundBytes videos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 600 * 1024 * 1024 },
});

router.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Auth check — must be logged in
      let user: any = null;
      try { user = await sdk.authenticateRequest(req); } catch {}
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { folder, maxMB, allowedTypes } = req.body as {
        folder?: string;
        maxMB?: string;
        allowedTypes?: string;
      };

      if (!folder || !/^[a-zA-Z0-9_\-/]+$/.test(folder)) {
        res.status(400).json({ error: "Missing or invalid folder" });
        return;
      }

      // Validate file size
      const maxBytes = Math.min(parseInt(maxMB ?? "100", 10), 600) * 1024 * 1024;
      if (req.file.size > maxBytes) {
        res.status(413).json({ error: `File too large. Max ${maxMB ?? 100} MB.` });
        return;
      }

      // Validate MIME type
      const allowed = (allowedTypes ?? "image,video,audio").split(",").map((s) => s.trim());
      const mimeOk = allowed.some((prefix) => req.file!.mimetype.startsWith(prefix));
      if (!mimeOk) {
        res.status(400).json({ error: `Unsupported file type: ${req.file.mimetype}` });
        return;
      }

      const { originalname, mimetype, buffer } = req.file;
      const ext = originalname.split(".").pop()?.toLowerCase() ?? "bin";
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const safeFileName = originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, mimetype);

      res.json({ url, fileKey });
    } catch (err: any) {
      console.error("[upload-generic]", err);
      res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  }
);

export function registerUploadGenericRoute(app: import("express").Express) {
  app.use(router);
}
