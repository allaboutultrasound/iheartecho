/**
 * POST /api/upload-user-question-media
 *
 * Authenticated-user endpoint for uploading images or video clips when submitting
 * a challenge question. WMV is explicitly excluded.
 *
 * Accepts:
 *   Images — JPEG, PNG, WEBP, GIF  (max 20 MB)
 *   Videos — MP4, WEBM, MOV, AVI, MKV  (max 200 MB)
 *
 * Returns { url, fileKey, mediaType: "image" | "video" }.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();

// 200 MB cap — covers typical echo video clips
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedImages = /^image\/(jpeg|jpg|png|webp|gif)$/;
    // WMV (x-ms-wmv) is intentionally excluded
    const allowedVideos = /^video\/(mp4|webm|quicktime|x-msvideo|x-matroska)$/;
    if (allowedImages.test(file.mimetype) || allowedVideos.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed images: JPEG, PNG, WEBP, GIF. Allowed videos: MP4, WEBM, MOV, AVI, MKV. WMV is not supported.`
        )
      );
    }
  },
});

router.post(
  "/api/upload-user-question-media",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Auth check — any logged-in user
      let user = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {}
      if (!user) {
        res.status(401).json({ error: "You must be signed in to upload media." });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided." });
        return;
      }

      const { originalname, mimetype, buffer, size } = req.file;
      const isVideo = mimetype.startsWith("video/");

      // Extra size guard: images ≤ 20 MB, videos ≤ 200 MB
      const maxImageBytes = 20 * 1024 * 1024;
      if (!isVideo && size > maxImageBytes) {
        res.status(400).json({ error: "Image files must be 20 MB or smaller." });
        return;
      }

      const ext = originalname.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const folder = isVideo ? "user-question-videos" : "user-question-images";
      const fileKey = `${folder}/${user.id}-${Date.now()}-${randomSuffix}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, mimetype);
      res.json({ url, fileKey, mediaType: isVideo ? "video" : "image" });
    } catch (err: any) {
      console.error("[upload-user-question-media]", err);
      res.status(500).json({ error: err?.message ?? "Upload failed." });
    }
  }
);

export function registerUploadUserQuestionMediaRoute(app: import("express").Express) {
  app.use(router);
}
