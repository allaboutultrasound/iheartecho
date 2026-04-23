/**
 * Media Serve Routes
 *
 * GET  /api/media/:slug           — Redirect to S3 URL (public) or validate token (private)
 * GET  /api/media/:slug/embed     — Serve an HTML embed page for the asset
 *
 * Both routes log access to mediaAccessLogs for analytics.
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { mediaAssets, mediaVersions, mediaAccessRules, mediaAccessLogs } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";

const router = Router();

async function logAccess(opts: {
  assetId: number;
  versionId: number | null;
  accessType: "serve" | "embed";
  accessRuleId: number | null;
  userId: number | null;
  req: Request;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(mediaAccessLogs).values({
      assetId: opts.assetId,
      versionId: opts.versionId,
      accessType: opts.accessType,
      accessRuleId: opts.accessRuleId,
      userId: opts.userId,
      ipAddress: (opts.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? opts.req.ip ?? null,
      userAgent: opts.req.headers["user-agent"] ?? null,
      referer: opts.req.headers["referer"] ?? null,
    });
  } catch {
    // Non-fatal — don't block the response
  }
}

// ── Serve asset ────────────────────────────────────────────────────────────────
router.get("/api/media/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "Service unavailable" });
    return;
  }

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.slug, slug), isNull(mediaAssets.deletedAt)));

  if (!asset) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Get current version
  let version = null;
  if (asset.currentVersionId) {
    const [v] = await db
      .select()
      .from(mediaVersions)
      .where(eq(mediaVersions.id, asset.currentVersionId));
    version = v ?? null;
  }

  if (!version) {
    res.status(404).json({ error: "No active version" });
    return;
  }

  let accessRuleId: number | null = null;

  if (asset.accessMode === "private") {
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    const [rule] = await db
      .select()
      .from(mediaAccessRules)
      .where(
        and(
          eq(mediaAccessRules.assetId, asset.id),
          eq(mediaAccessRules.accessToken, token),
          isNull(mediaAccessRules.revokedAt)
        )
      );
    if (!rule) {
      res.status(403).json({ error: "Invalid or revoked access token" });
      return;
    }
    if (rule.expiresAt && rule.expiresAt < new Date()) {
      res.status(403).json({ error: "Access token has expired" });
      return;
    }
    accessRuleId = rule.id;
  }

  // Log access (fire-and-forget)
  void logAccess({
    assetId: asset.id,
    versionId: version.id,
    accessType: "serve",
    accessRuleId,
    userId: null,
    req,
  });

  // Redirect to S3 URL
  res.redirect(302, version.s3Url);
});

// ── Embed page ─────────────────────────────────────────────────────────────────
router.get("/api/media/:slug/embed", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const db = await getDb();
  if (!db) {
    res.status(503).send("<p>Service unavailable</p>");
    return;
  }

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.slug, slug), isNull(mediaAssets.deletedAt)));

  if (!asset) {
    res.status(404).send("<p>Not found</p>");
    return;
  }

  let version = null;
  if (asset.currentVersionId) {
    const [v] = await db
      .select()
      .from(mediaVersions)
      .where(eq(mediaVersions.id, asset.currentVersionId));
    version = v ?? null;
  }

  if (!version) {
    res.status(404).send("<p>No active version</p>");
    return;
  }

  let accessRuleId: number | null = null;

  if (asset.accessMode === "private") {
    if (!token) {
      res.status(401).send("<p>Access token required</p>");
      return;
    }
    const [rule] = await db
      .select()
      .from(mediaAccessRules)
      .where(
        and(
          eq(mediaAccessRules.assetId, asset.id),
          eq(mediaAccessRules.accessToken, token),
          isNull(mediaAccessRules.revokedAt)
        )
      );
    if (!rule) {
      res.status(403).send("<p>Invalid or revoked access token</p>");
      return;
    }
    if (rule.expiresAt && rule.expiresAt < new Date()) {
      res.status(403).send("<p>Access token has expired</p>");
      return;
    }
    accessRuleId = rule.id;
  }

  // Log embed access (fire-and-forget)
  void logAccess({
    assetId: asset.id,
    versionId: version.id,
    accessType: "embed",
    accessRuleId,
    userId: null,
    req,
  });

  const mime = version.mimeType ?? "";
  const url = version.s3Url;
  const title = asset.title;

  // Build embed HTML based on media type
  let mediaHtml = "";
  if (asset.mediaType === "video" || mime.startsWith("video/")) {
    mediaHtml = `<video src="${url}" controls autoplay muted playsinline style="width:100%;max-height:100vh;display:block;background:#000;" title="${title}"></video>`;
  } else if (asset.mediaType === "audio" || mime.startsWith("audio/")) {
    mediaHtml = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0fbfc;">
        <div style="text-align:center;padding:32px;max-width:480px;">
          <div style="font-size:48px;margin-bottom:16px;">🎵</div>
          <p style="font-family:Merriweather,Georgia,serif;font-size:18px;color:#1a2e3b;margin:0 0 20px;">${title}</p>
          <audio src="${url}" controls style="width:100%;"></audio>
        </div>
      </div>`;
  } else if (asset.mediaType === "image" || mime.startsWith("image/")) {
    mediaHtml = `<img src="${url}" alt="${title}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`;
  } else if (asset.mediaType === "html" || mime === "text/html") {
    // Redirect to the HTML file directly
    res.redirect(302, url);
    return;
  } else if (asset.mediaType === "document" || mime === "application/pdf") {
    mediaHtml = `<iframe src="${url}" style="width:100%;height:100vh;border:none;" title="${title}"></iframe>`;
  } else {
    mediaHtml = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0fbfc;">
        <div style="text-align:center;padding:32px;">
          <p style="font-family:Merriweather,Georgia,serif;font-size:18px;color:#1a2e3b;margin:0 0 20px;">${title}</p>
          <a href="${url}" download style="display:inline-block;background:#189aa1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Download File</a>
        </div>
      </div>`;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — iHeartEcho™</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
  </style>
</head>
<body>
  ${mediaHtml}
</body>
</html>`);
});

export function registerMediaServeRoute(app: import("express").Express) {
  app.use(router);
}
