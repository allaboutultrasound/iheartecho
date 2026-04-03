/**
 * POST /api/upload-scancoach-media
 *
 * Accepts a multipart/form-data upload with fields:
 *   file     — the image or video file
 *   module   — ScanCoach module key (e.g. "tte", "tee", "chd")
 *   viewId   — view identifier (e.g. "plax", "a4c")
 *   slot     — image slot: "echo" | "anatomy" | "transducer" | "additional"
 *   caption  — (optional) caption for additional media
 *
 * Validates the session cookie (must be platform admin), uploads to S3 via storagePut,
 * upserts the URL into the scanCoachOverrides table, and returns { url, fileKey }.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { scanCoachOverrides } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Store files in memory (max 100 MB per file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image|video)\//;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post(
  "/api/upload-scancoach-media",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Auth check — must be platform admin
      let user = null;
      try { user = await sdk.authenticateRequest(req); } catch {}
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if ((user as any).role !== "admin") {
        res.status(403).json({ error: "Forbidden: platform admin required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { module, viewId, slot, caption } = req.body as {
        module?: string;
        viewId?: string;
        slot?: string;
        caption?: string;
      };

      if (!module || !viewId || !slot) {
        res.status(400).json({ error: "Missing required fields: module, viewId, slot" });
        return;
      }

      const validSlots = ["echo", "anatomy", "transducer", "additional"];
      if (!validSlots.includes(slot)) {
        res.status(400).json({ error: `Invalid slot. Must be one of: ${validSlots.join(", ")}` });
        return;
      }

      const { originalname, mimetype, buffer } = req.file;
      const ext = originalname.split(".").pop()?.toLowerCase() ?? "bin";
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const safeFileName = originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `scancoach/${module}/${viewId}/${slot}-${safeFileName}-${randomSuffix}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, mimetype);

      // Auto-upsert into scanCoachOverrides
      const db = await getDb();
      if (db) {
        if (slot === "additional") {
          // Append to additionalMedia JSON array
          const existing = await db
            .select({ id: scanCoachOverrides.id, additionalMedia: scanCoachOverrides.additionalMedia })
            .from(scanCoachOverrides)
            .where(
              and(
                eq(scanCoachOverrides.module, module),
                eq(scanCoachOverrides.viewId, viewId)
              )
            )
            .limit(1);

          const newEntry = { url, fileKey, mimeType: mimetype, caption: caption ?? "" };

          if (existing.length > 0) {
            let arr: any[] = [];
            try { arr = JSON.parse(existing[0].additionalMedia ?? "[]"); } catch {}
            arr.push(newEntry);
            await db
              .update(scanCoachOverrides)
              .set({ additionalMedia: JSON.stringify(arr), updatedByUserId: user.id })
              .where(eq(scanCoachOverrides.id, existing[0].id));
          } else {
            await db.insert(scanCoachOverrides).values({
              module,
              viewId,
              additionalMedia: JSON.stringify([newEntry]),
              updatedByUserId: user.id,
            });
          }
        } else {
          // Primary image slot
          const slotField = {
            echo: "echoImageUrl",
            anatomy: "anatomyImageUrl",
            transducer: "transducerImageUrl",
          }[slot] as "echoImageUrl" | "anatomyImageUrl" | "transducerImageUrl";

          const existing = await db
            .select({ id: scanCoachOverrides.id })
            .from(scanCoachOverrides)
            .where(
              and(
                eq(scanCoachOverrides.module, module),
                eq(scanCoachOverrides.viewId, viewId)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(scanCoachOverrides)
              .set({ [slotField]: url, updatedByUserId: user.id })
              .where(eq(scanCoachOverrides.id, existing[0].id));
          } else {
            await db.insert(scanCoachOverrides).values({
              module,
              viewId,
              [slotField]: url,
              updatedByUserId: user.id,
            });
          }
        }
      }

      res.json({ url, fileKey });
    } catch (err: any) {
      console.error("[upload-scancoach-media]", err);
      res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  }
);

export function registerUploadScanCoachMediaRoute(app: import("express").Express) {
  app.use(router);
}
