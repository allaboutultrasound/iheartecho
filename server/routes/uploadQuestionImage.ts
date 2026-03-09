/**
 * POST /api/upload-question-image
 *
 * Admin-only endpoint for uploading echo images for image-based questions.
 * Accepts a single image file (JPEG, PNG, WEBP, GIF).
 * Returns { url, fileKey }.
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();

// Store files in memory (max 20 MB per image)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WEBP, GIF allowed.`));
    }
  },
});

router.post(
  "/api/upload-question-image",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Auth check — admin only
      let user = null;
      try { user = await sdk.authenticateRequest(req); } catch {}
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (user.role !== "admin") {
        res.status(403).json({ error: "Admin only" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { originalname, mimetype, buffer } = req.file;
      const ext = originalname.split(".").pop()?.toLowerCase() ?? "jpg";
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `question-images/${Date.now()}-${randomSuffix}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, mimetype);

      res.json({ url, fileKey });
    } catch (err: any) {
      console.error("[upload-question-image]", err);
      res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  }
);

export function registerUploadQuestionImageRoute(app: import("express").Express) {
  app.use(router);
}
