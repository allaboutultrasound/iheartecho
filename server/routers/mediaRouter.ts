/**
 * Media Repository Router
 *
 * Manages media assets (images, audio, video, HTML/SCORM, documents) for
 * the iHeartEcho™ platform.
 *
 * Features:
 *  - Asset CRUD with versioning (each re-upload creates a new version)
 *  - Access control: public (anyone with link) or private (email-invite only)
 *  - Folder/category organisation for grouping assets
 *  - Access audit log
 *  - Embed analytics (view/play counts per asset)
 *
 * All procedures require platform admin access (role === "admin").
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq, isNotNull, isNull, like, lt, or, sql } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import JSZip from "jszip";
import { sendEmail } from "../_core/email";
import {
  mediaAssets,
  mediaVersions,
  mediaAccessRules,
  mediaAccessLogs,
  mediaFolders,
} from "../../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAppUrl(): string {
  return process.env.VITE_APP_URL ?? "https://app.iheartecho.com";
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/** Infer a broad media type from a MIME type string */
function inferMediaType(
  mimeType: string | undefined,
  filename: string
): "image" | "audio" | "video" | "html" | "scorm" | "zip" | "lms" | "document" | "other" {
  if (!mimeType) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return "image";
    if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
    if (["mp4", "webm", "mov", "avi", "wmv", "mkv"].includes(ext)) return "video";
    if (["html", "htm"].includes(ext)) return "html";
    if (["zip"].includes(ext)) return "zip";
    if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) return "document";
    return "other";
  }
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "text/html" || mimeType === "application/xhtml+xml") return "html";
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return "zip";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return "document";
  return "other";
}


// ─── SCORM Extraction Helper ──────────────────────────────────────────────────
/**
 * Given a zip file buffer and a base S3 key prefix, extracts all files from the
 * zip, uploads them to S3, and returns the URL of the SCORM entry-point HTML.
 *
 * Entry-point detection order:
 *  1. href attribute of <resource> with type "webcontent" in imsmanifest.xml
 *  2. index.html / index.htm at root
 *  3. First .html file found
 */
async function extractScormZip(
  zipBuffer: Buffer,
  keyPrefix: string
): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = zip.files;
    const uploadedUrls: Record<string, string> = {};

    // Upload all files in the zip to S3
    for (const [relativePath, file] of Object.entries(files)) {
      if (file.dir) continue;
      const fileBuffer = Buffer.from(await file.async("arraybuffer"));
      const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
      const mimeMap: Record<string, string> = {
        html: "text/html", htm: "text/html",
        js: "application/javascript", css: "text/css",
        json: "application/json", xml: "application/xml",
        png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
        mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg",
        wav: "audio/wav", ogg: "audio/ogg",
        woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
        eot: "application/vnd.ms-fontobject",
        pdf: "application/pdf",
      };
      const contentType = mimeMap[ext] ?? "application/octet-stream";
      const s3Key = `${keyPrefix}/${relativePath}`;
      const result = await storagePut(s3Key, fileBuffer, contentType);
      // Encode spaces and special chars in the URL path for browser compatibility
      try {
        const urlObj = new URL(result.url);
        const encodedPath = urlObj.pathname.split('/').map((seg: string) => encodeURIComponent(decodeURIComponent(seg))).join('/');
        uploadedUrls[relativePath] = urlObj.origin + encodedPath;
      } catch {
        uploadedUrls[relativePath] = result.url;
      }
    }

    // Try to find the entry point from imsmanifest.xml
    const manifestFile = files["imsmanifest.xml"] ?? files["imsmanifest.XML"];
    if (manifestFile) {
      const manifestText = await manifestFile.async("text");
      // Look for <resource ... href="..." type="webcontent"...>
      const hrefMatch = manifestText.match(/<resource[^>]+type=["'][^"']*webcontent[^"']*["'][^>]+href=["']([^"']+)["']/i)
        ?? manifestText.match(/<resource[^>]+href=["']([^"']+)["'][^>]+type=["'][^"']*webcontent[^"']*["']/i)
        ?? manifestText.match(/<resource[^>]+href=["']([^"']+)["']/i);
      if (hrefMatch) {
        const entryPath = hrefMatch[1].replace(/\\/g, "/");
        if (uploadedUrls[entryPath]) return uploadedUrls[entryPath];
      }
    }

    // Fallback: index.html / index.htm at root
    if (uploadedUrls["index.html"]) return uploadedUrls["index.html"];
    if (uploadedUrls["index.htm"]) return uploadedUrls["index.htm"];

    // Fallback: first HTML file found
    const firstHtml = Object.keys(uploadedUrls).find(k => k.endsWith(".html") || k.endsWith(".htm"));
    if (firstHtml) return uploadedUrls[firstHtml];
    console.error("[SCORM] No HTML entry point found in zip. Files:", Object.keys(uploadedUrls).slice(0, 10));
    return "FAILED";
  } catch (err) {
    console.error("[SCORM] Extraction failed:", err);
    return "FAILED";
  }
}
// ─── Router ───────────────────────────────────────────────────────────────────

export const mediaRouter = router({
  // ── List assets ────────────────────────────────────────────────────────────
  listAssets: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        mediaType: z
          .enum(["image", "audio", "video", "html", "scorm", "zip", "lms", "document", "other"])
          .optional(),
        accessMode: z.enum(["public", "private"]).optional(),
        folderId: z.number().nullable().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const conditions = [isNull(mediaAssets.deletedAt)];

      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            like(mediaAssets.title, pattern),
            like(mediaAssets.description ?? sql`''`, pattern),
            like(mediaAssets.tags ?? sql`''`, pattern)
          )!
        );
      }
      if (input.mediaType) {
        conditions.push(eq(mediaAssets.mediaType, input.mediaType));
      }
      if (input.accessMode) {
        conditions.push(eq(mediaAssets.accessMode, input.accessMode));
      }
      if (input.folderId !== undefined) {
        if (input.folderId === null) {
          conditions.push(isNull(mediaAssets.folderId));
        } else {
          conditions.push(eq(mediaAssets.folderId, input.folderId));
        }
      }

      const assets = await db
        .select()
        .from(mediaAssets)
        .where(and(...conditions))
        .orderBy(desc(mediaAssets.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Attach current version info (s3Url, mimeType) for thumbnail display
      const assetIds = assets.map((a) => a.id);
      let versionMap: Record<number, { s3Url: string; mimeType: string | null }> = {};
      if (assetIds.length > 0) {
        const versions = await db
          .select()
          .from(mediaVersions)
          .where(
            and(
              sql`${mediaVersions.assetId} IN (${sql.join(assetIds.map((id) => sql`${id}`), sql`, `)})`,
              sql`${mediaVersions.id} IN (
                SELECT currentVersionId FROM mediaAssets WHERE id IN (${sql.join(assetIds.map((id) => sql`${id}`), sql`, `)})
              )`
            )
          );
        for (const v of versions) {
          versionMap[v.assetId] = { s3Url: v.s3Url, mimeType: v.mimeType ?? null };
        }
      }

      // Count total for pagination
      const [{ total }] = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(mediaAssets)
        .where(and(...conditions));

      const appUrl = getAppUrl();
      return {
        assets: assets.map((a) => ({
          ...a,
          tags: a.tags ? (JSON.parse(a.tags) as string[]) : [],
          currentVersionUrl: versionMap[a.id]?.s3Url ?? null,
          currentVersionMime: versionMap[a.id]?.mimeType ?? null,
          serveUrl: `${appUrl}/api/media/${a.slug}`,
          viewUrl: `${appUrl}/api/media/${a.slug}/view`,
          downloadUrl: `${appUrl}/api/media/${a.slug}/download`,
          embedUrl: `${appUrl}/api/media/${a.slug}/embed`,
        })),
        total: Number(total),
      };
    }),

  // ── Get single asset with versions and access rules ─────────────────────────
  getAsset: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, input.assetId), isNull(mediaAssets.deletedAt)));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const versions = await db
        .select()
        .from(mediaVersions)
        .where(eq(mediaVersions.assetId, input.assetId))
        .orderBy(desc(mediaVersions.versionNumber));
      const accessRules = await db
        .select()
        .from(mediaAccessRules)
        .where(and(eq(mediaAccessRules.assetId, input.assetId), isNull(mediaAccessRules.revokedAt)));
      const appUrl = getAppUrl();
      const serveUrl = `${appUrl}/api/media/${asset.slug}`;
      const viewUrl = `${appUrl}/api/media/${asset.slug}/view`;
      const downloadUrl = `${appUrl}/api/media/${asset.slug}/download`;
      const embedUrl = `${appUrl}/api/media/${asset.slug}/embed`;
      return {
        asset: { ...asset, tags: asset.tags ? (JSON.parse(asset.tags) as string[]) : [] },
        versions,
        accessRules,
        serveUrl,
        viewUrl,
        downloadUrl,
        embedUrl,
      };
    }),

  // ── Create asset + first version (upload via base64 or S3 URL) ─────────────
  createAsset: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        accessMode: z.enum(["public", "private"]).default("private"),
        folderId: z.number().optional(),
        // File data: either base64 content or a pre-uploaded S3 URL
        fileBase64: z.string().optional(),
        fileS3Url: z.string().url().optional(),
        fileS3Key: z.string().optional(),
        mimeType: z.string().optional(),
        fileSizeBytes: z.number().optional(),
        originalFilename: z.string().optional(),
        changeNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const slug = generateSlug(input.title);
      const mediaType = inferMediaType(input.mimeType, input.originalFilename ?? "");

      // Upload to S3 if base64 provided
      let s3Url = input.fileS3Url ?? "";
      let s3Key = input.fileS3Key ?? "";
      if (input.fileBase64 && !input.fileS3Url) {
        const buf = Buffer.from(input.fileBase64, "base64");
        const ext = input.originalFilename?.split(".").pop() ?? "bin";
        const key = `media-repository/${slug}-v1.${ext}`;
        const result = await storagePut(key, buf, input.mimeType ?? "application/octet-stream");
        s3Url = result.url;
        s3Key = result.key;
      }

      // For SCORM/zip: extract files and find entry point
      let scormEntryUrl: string | null = null;
      if ((mediaType === "scorm" || mediaType === "zip" || mediaType === "lms") && s3Url) {
        try {
          const zipRes = await fetch(s3Url);
          if (zipRes.ok) {
            const zipBuf = Buffer.from(await zipRes.arrayBuffer());
            const keyPrefix = `media-repository/${slug}-scorm`;
            scormEntryUrl = await extractScormZip(zipBuf, keyPrefix);
          }
        } catch (e) {
          console.error("[SCORM] createAsset extraction error:", e);
        }
      }
      // Insert asset row
      const [assetResult] = await db.insert(mediaAssets).values({
        slug,
        title: input.title,
        description: input.description ?? null,
        mediaType: scormEntryUrl ? "scorm" : mediaType,
        originalFilename: input.originalFilename ?? null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        accessMode: input.accessMode,
        folderId: input.folderId ?? null,
        uploadedByUserId: ctx.user.id,
        currentVersionId: null,
      });
      const assetId = (assetResult as any).insertId as number;
      // Insert version row
      const [versionResult] = await db.insert(mediaVersions).values({
        assetId,
        versionNumber: 1,
        s3Key,
        s3Url,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        originalFilename: input.originalFilename ?? null,
        changeNote: input.changeNote ?? null,
        scormEntryUrl,
        uploadedByUserId: ctx.user.id,
      });
      const versionId = (versionResult as any).insertId as number;
      // Point asset to first version
      await db.update(mediaAssets).set({ currentVersionId: versionId }).where(eq(mediaAssets.id, assetId));
      return { assetId, versionId, slug, s3Url, scormEntryUrl };
      return { assetId, versionId, slug, s3Url };
    }),

  // ── Add a new version to an existing asset ─────────────────────────────────
  addVersion: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        fileBase64: z.string().optional(),
        fileS3Url: z.string().url().optional(),
        fileS3Key: z.string().optional(),
        mimeType: z.string().optional(),
        fileSizeBytes: z.number().optional(),
        originalFilename: z.string().optional(),
        changeNote: z.string().optional(),
        promoteToActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, input.assetId), isNull(mediaAssets.deletedAt)));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      // Get next version number
      const [{ maxVer }] = await db
        .select({ maxVer: sql<number>`MAX(versionNumber)` })
        .from(mediaVersions)
        .where(eq(mediaVersions.assetId, input.assetId));
      const versionNumber = (maxVer ?? 0) + 1;

      let s3Url = input.fileS3Url ?? "";
      let s3Key = input.fileS3Key ?? "";
      if (input.fileBase64 && !input.fileS3Url) {
        const buf = Buffer.from(input.fileBase64, "base64");
        const ext = input.originalFilename?.split(".").pop() ?? "bin";
        const key = `media-repository/${asset.slug}-v${versionNumber}.${ext}`;
        const result = await storagePut(key, buf, input.mimeType ?? "application/octet-stream");
        s3Url = result.url;
        s3Key = result.key;
      }

      // For SCORM/zip: extract files and find entry point
      let scormEntryUrlV: string | null = null;
      if ((asset.mediaType === "scorm" || asset.mediaType === "zip" || asset.mediaType === "lms") && s3Url) {
        try {
          const zipRes = await fetch(s3Url);
          if (zipRes.ok) {
            const zipBuf = Buffer.from(await zipRes.arrayBuffer());
            const keyPrefix = `media-repository/${asset.slug}-scorm-v${versionNumber}`;
            scormEntryUrlV = await extractScormZip(zipBuf, keyPrefix);
          }
        } catch (e) {
          console.error("[SCORM] addVersion extraction error:", e);
        }
      }
      const [versionResult] = await db.insert(mediaVersions).values({
        assetId: input.assetId,
        versionNumber,
        s3Key,
        s3Url,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        originalFilename: input.originalFilename ?? null,
        changeNote: input.changeNote ?? null,
        scormEntryUrl: scormEntryUrlV,
        uploadedByUserId: ctx.user.id,
      });
      const versionId = (versionResult as any).insertId as number;
      if (input.promoteToActive) {
        await db
          .update(mediaAssets)
          .set({
            currentVersionId: versionId,
            updatedAt: new Date(),
            ...(scormEntryUrlV ? { mediaType: "scorm" } : {}),
          })
          .where(eq(mediaAssets.id, input.assetId));
      }
      return { versionId, versionNumber, s3Url, scormEntryUrl: scormEntryUrlV };
    }),

  // ── Re-extract SCORM/zip for an existing asset ─────────────────────────────
  reExtractScorm: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, input.assetId));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      if (!asset.currentVersionId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active version" });
      const [version] = await db.select().from(mediaVersions).where(eq(mediaVersions.id, asset.currentVersionId));
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      // Clear any previous FAILED sentinel so the view route won't show the error page during re-extraction
      await db.update(mediaVersions).set({ scormEntryUrl: null } as any).where(eq(mediaVersions.id, version.id));
      const keyPrefix = `media-repository/${asset.slug}-scorm`;
      const entryUrl = await extractScormZip(Buffer.from(await fetch(version.s3Url).then(r => r.arrayBuffer())), keyPrefix);
      if (!entryUrl || entryUrl === "FAILED") {
        // Store FAILED sentinel and throw a user-friendly error
        await db.update(mediaVersions).set({ scormEntryUrl: "FAILED" } as any).where(eq(mediaVersions.id, version.id));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Extraction failed — no displayable HTML entry point found in the zip. Please re-export the package from your authoring tool as a complete SCORM or HTML package." });
      }
      await db.update(mediaVersions).set({ scormEntryUrl: entryUrl } as any).where(eq(mediaVersions.id, version.id));
      await db.update(mediaAssets).set({ mediaType: "scorm", updatedAt: new Date() } as any).where(eq(mediaAssets.id, asset.id));
      return { scormEntryUrl: entryUrl };
    }),
  // ── Promote a specific version to active ───────────────────────────────────
  promoteVersion: adminProcedure
    .input(z.object({ assetId: z.number(), versionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [version] = await db
        .select()
        .from(mediaVersions)
        .where(and(eq(mediaVersions.id, input.versionId), eq(mediaVersions.assetId, input.assetId)));
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      await db.update(mediaAssets)
        .set({ currentVersionId: input.versionId, updatedAt: new Date() })
        .where(eq(mediaAssets.id, input.assetId));
      return { success: true };
    }),

  // ── Update asset metadata ───────────────────────────────────────────────────
  updateAsset: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        title: z.string().min(1).max(256).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        accessMode: z.enum(["public", "private"]).optional(),
        folderId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.tags !== undefined) updates.tags = JSON.stringify(input.tags);
      if (input.accessMode !== undefined) updates.accessMode = input.accessMode;
      if (input.folderId !== undefined) updates.folderId = input.folderId;
      await db.update(mediaAssets).set(updates).where(eq(mediaAssets.id, input.assetId));
      return { success: true };
    }),

  // ── Soft-delete an asset ────────────────────────────────────────────────────
  deleteAsset: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(mediaAssets)
        .set({ deletedAt: new Date() })
        .where(eq(mediaAssets.id, input.assetId));
      return { success: true };
    }),
  // ── List soft-deleted assets (Recycle Bin) ────────────────────────────────
  listDeletedAssets: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(isNotNull(mediaAssets.deletedAt))
        .orderBy(desc(mediaAssets.deletedAt));
      return rows.map((a) => {
        const deletedAt = a.deletedAt ? new Date(a.deletedAt).getTime() : Date.now();
        const daysElapsed = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysElapsed);
        return { ...a, daysRemaining };
      });
    }),
  // ── Restore a soft-deleted asset ─────────────────────────────────────────
  restoreAsset: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(mediaAssets)
        .set({ deletedAt: null })
        .where(eq(mediaAssets.id, input.assetId));
      return { success: true };
    }),

  // ── Invite a user by email to access a private asset ───────────────────────
  // Delete a single version (cannot delete the currently active version)
  deleteVersion: adminProcedure
    .input(z.object({ assetId: z.number(), versionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, input.assetId), isNull(mediaAssets.deletedAt)));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      if (asset.currentVersionId === input.versionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the active version. Promote another version first.",
        });
      }
      const [version] = await db
        .select()
        .from(mediaVersions)
        .where(and(eq(mediaVersions.id, input.versionId), eq(mediaVersions.assetId, input.assetId)));
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      await db.delete(mediaVersions).where(eq(mediaVersions.id, input.versionId));
      return { success: true };
    }),

  inviteByEmail: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        email: z.string().email(),
        expiresInDays: z.number().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, input.assetId), isNull(mediaAssets.deletedAt)));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      // Check if already invited and not revoked
      const [existing] = await db
        .select()
        .from(mediaAccessRules)
        .where(
          and(
            eq(mediaAccessRules.assetId, input.assetId),
            eq(mediaAccessRules.email, input.email),
            isNull(mediaAccessRules.revokedAt)
          )
        );

      let accessToken: string;
      let ruleId: number;
      if (existing) {
        accessToken = existing.accessToken;
        ruleId = existing.id;
      } else {
        accessToken = generateToken();
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 86400000)
          : undefined;
        const [result] = await db.insert(mediaAccessRules).values({
          assetId: input.assetId,
          email: input.email,
          accessToken,
          grantedByUserId: ctx.user.id,
          expiresAt: expiresAt ?? null,
        });
        ruleId = (result as any).insertId as number;
      }

      const appUrl = getAppUrl();
      const privateLink = `${appUrl}/api/media/${asset.slug}?token=${accessToken}`;
      const embedLink = `${appUrl}/api/media/${asset.slug}/embed?token=${accessToken}`;

      // Send invite email
      await sendEmail({
        to: { name: input.email, email: input.email },
        subject: `You've been granted access to: ${asset.title}`,
        htmlBody: buildMediaInviteEmail({
          recipientEmail: input.email,
          assetTitle: asset.title,
          mediaType: asset.mediaType,
          privateLink,
          embedLink,
          senderName: (ctx.user as any).name ?? "iHeartEcho™ Admin",
        }),
      });

      return { success: true, ruleId, accessToken, privateLink, embedLink };
    }),

  // ── Revoke email access ─────────────────────────────────────────────────────
  revokeAccess: adminProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(mediaAccessRules)
        .set({ revokedAt: new Date() })
        .where(eq(mediaAccessRules.id, input.ruleId));
      return { success: true };
    }),

  // ── List access rules for an asset ─────────────────────────────────────────
  listAccessRules: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      return db
        .select()
        .from(mediaAccessRules)
        .where(eq(mediaAccessRules.assetId, input.assetId))
        .orderBy(desc(mediaAccessRules.createdAt));
    }),

  // ── Get access logs for an asset ────────────────────────────────────────────
  getAccessLogs: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      return db
        .select()
        .from(mediaAccessLogs)
        .where(eq(mediaAccessLogs.assetId, input.assetId))
        .orderBy(desc(mediaAccessLogs.accessedAt))
        .limit(input.limit);
    }),

  // ── Get embed code for an asset ─────────────────────────────────────────────
  getEmbedCode: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        width: z.string().default("100%"),
        height: z.string().default("480px"),
        token: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, input.assetId), isNull(mediaAssets.deletedAt)));
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const appUrl = getAppUrl();
      const tokenParam = input.token ? `?token=${input.token}` : "";
      const embedUrl = `${appUrl}/api/media/${asset.slug}/embed${tokenParam}`;
      const code = `<iframe src="${embedUrl}" width="${input.width}" height="${input.height}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
      return { embedUrl, code };
    }),

  // ─── Folder Management ─────────────────────────────────────────────────────

  listFolders: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const folders = await db
        .select()
        .from(mediaFolders)
        .orderBy(mediaFolders.sortOrder, mediaFolders.name);
      return folders;
    }),

  createFolder: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const result = await db.insert(mediaFolders).values({
        name: input.name,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        sortOrder: 0,
        createdByUserId: ctx.user.id,
      });
      return { id: (result as any).insertId as number };
    }),

  updateFolder: adminProcedure
    .input(
      z.object({
        folderId: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(mediaFolders)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        .where(eq(mediaFolders.id, input.folderId));
      return { ok: true };
    }),

  deleteFolder: adminProcedure
    .input(z.object({ folderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Move assets in this folder to no folder before deleting
      await db
        .update(mediaAssets)
        .set({ folderId: null })
        .where(eq(mediaAssets.folderId, input.folderId));
      await db.delete(mediaFolders).where(eq(mediaFolders.id, input.folderId));
      return { ok: true };
    }),

  moveAssetToFolder: adminProcedure
    .input(
      z.object({
        assetId: z.number(),
        folderId: z.number().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(mediaAssets)
        .set({ folderId: input.folderId })
        .where(eq(mediaAssets.id, input.assetId));
      return { ok: true };
    }),

  // ── Embed Analytics ────────────────────────────────────────────────────────
  getAssetAnalytics: adminProcedure
    .input(z.object({ assetId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const logs = await db
        .select()
        .from(mediaAccessLogs)
        .where(eq(mediaAccessLogs.assetId, input.assetId))
        .orderBy(desc(mediaAccessLogs.accessedAt));
      const totalServe = logs.filter((l) => l.accessType === "serve").length;
      const totalEmbed = logs.filter((l) => l.accessType === "embed").length;
      const total = logs.length;
      // Last 30 days daily breakdown
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentLogs = logs.filter((l) => l.accessedAt >= thirtyDaysAgo);
      const byDate: Record<string, { serve: number; embed: number }> = {};
      for (const log of recentLogs) {
        const date = log.accessedAt.toISOString().slice(0, 10);
        if (!byDate[date]) byDate[date] = { serve: 0, embed: 0 };
        byDate[date][log.accessType]++;
      }
      const dailyBreakdown = Object.entries(byDate)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const recentAccess = logs.slice(0, 20).map((l) => ({
        id: l.id,
        accessType: l.accessType,
        ipAddress: l.ipAddress,
        referer: l.referer,
        accessedAt: l.accessedAt,
      }));
      return { total, totalServe, totalEmbed, dailyBreakdown, recentAccess };
    }),

  // ── Bulk analytics summary for all assets ─────────────────────────────────
  getAnalyticsSummary: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select({
          assetId: mediaAccessLogs.assetId,
          total: sql<number>`COUNT(*)`,
          embedCount: sql<number>`SUM(CASE WHEN accessType = 'embed' THEN 1 ELSE 0 END)`,
          serveCount: sql<number>`SUM(CASE WHEN accessType = 'serve' THEN 1 ELSE 0 END)`,
        })
        .from(mediaAccessLogs)
        .groupBy(mediaAccessLogs.assetId);
      const map: Record<number, { total: number; embedCount: number; serveCount: number }> = {};
      for (const r of rows) {
        map[r.assetId] = {
          total: Number(r.total),
          embedCount: Number(r.embedCount),
          serveCount: Number(r.serveCount),
        };
      }
      return map;
    }),
});

// ─── Email Template ───────────────────────────────────────────────────────────
function buildMediaInviteEmail(opts: {
  recipientEmail: string;
  assetTitle: string;
  mediaType: string;
  privateLink: string;
  embedLink: string;
  senderName: string;
}): string {
  const BRAND = "#189aa1";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Media Access Granted</title></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:${BRAND};padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-family:Merriweather,Georgia,serif;">iHeartEcho™</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Media Repository</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#1a2e3b;font-family:Merriweather,Georgia,serif;font-size:18px;">You've been granted access</h2>
          <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 24px;">
            ${opts.senderName} has shared the following ${opts.mediaType} with you:
          </p>
          <div style="background:#f0fbfc;border-left:4px solid ${BRAND};border-radius:6px;padding:16px 20px;margin:0 0 28px;">
            <p style="margin:0;color:#1a2e3b;font-weight:600;font-size:15px;">${opts.assetTitle}</p>
            <p style="margin:4px 0 0;color:#718096;font-size:13px;text-transform:capitalize;">${opts.mediaType}</p>
          </div>
          <a href="${opts.privateLink}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:16px;">
            View ${opts.mediaType.charAt(0).toUpperCase() + opts.mediaType.slice(1)}
          </a>
          <p style="color:#718096;font-size:13px;margin:16px 0 0;">
            If you need to embed this content, use the following link:<br/>
            <a href="${opts.embedLink}" style="color:${BRAND};">${opts.embedLink}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#a0aec0;font-size:12px;">© iHeartEcho™ · All About Ultrasound</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
