/**
 * Media Serve Routes
 *
 * GET  /api/media/:slug/view      — Serve file inline in the browser (Content-Disposition: inline)
 *                                   HTML/SCORM → full-page iframe wrapper
 *                                   Images/video/audio/PDF → proxied with correct Content-Type
 * GET  /api/media/:slug/download  — Force-download the file (Content-Disposition: attachment)
 * GET  /api/media/:slug           — Legacy: redirect to /view (backward-compatible)
 * GET  /api/media/:slug/embed     — Embeddable player page (for iframes in other sites)
 *
 * All routes log access to mediaAccessLogs for analytics.
 * Private assets require ?token=<accessToken> on every route.
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { mediaAssets, mediaVersions, mediaAccessRules, mediaAccessLogs } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Resolve the asset + version for a given slug, enforcing access control. */
async function resolveAsset(
  slug: string,
  token: string | undefined,
  res: Response
): Promise<{
  asset: typeof mediaAssets.$inferSelect;
  version: typeof mediaVersions.$inferSelect;
  accessRuleId: number | null;
} | null> {
  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "Service unavailable" });
    return null;
  }

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.slug, slug), isNull(mediaAssets.deletedAt)));

  if (!asset) {
    res.status(404).json({ error: "Not found" });
    return null;
  }

  if (!asset.currentVersionId) {
    res.status(404).json({ error: "No active version" });
    return null;
  }

  const [version] = await db
    .select()
    .from(mediaVersions)
    .where(eq(mediaVersions.id, asset.currentVersionId));

  if (!version) {
    res.status(404).json({ error: "No active version" });
    return null;
  }

  let accessRuleId: number | null = null;

  if (asset.accessMode === "private") {
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return null;
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
      return null;
    }
    if (rule.expiresAt && rule.expiresAt < new Date()) {
      res.status(403).json({ error: "Access token has expired" });
      return null;
    }
    accessRuleId = rule.id;
  }

  return { asset, version, accessRuleId };
}

/**
 * Proxy a remote URL back to the client with the given Content-Disposition.
 * Streams the response to avoid buffering large files in memory.
 */
async function proxyFile(
  remoteUrl: string,
  disposition: "inline" | "attachment",
  filename: string,
  mimeType: string,
  res: Response
): Promise<void> {
  try {
    const upstream = await fetch(remoteUrl);
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ error: "Failed to fetch file from storage" });
      return;
    }
    const contentType = upstream.headers.get("content-type") ?? mimeType ?? "application/octet-stream";
    const safeFilename = encodeURIComponent(filename.replace(/[^\w.\-]/g, "_"));
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeFilename}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    // Forward content-length if available
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    // Stream body to client
    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    await pump();
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: "Proxy error" });
    }
  }
}

/**
 * Build an HTML page that renders a SCORM package in a full-page iframe.
 * The iframe src points to the extracted entry-point URL stored in scormEntryUrl.
 */
function buildScormPage(title: string, entryUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — iHeartEcho™</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe src="${entryUrl}" title="${escapeHtml(title)}" allowfullscreen allow="fullscreen"></iframe>
</body>
</html>`;
}

/**
 * Build an inline viewer HTML page for a given media type.
 * Used by the /view route for HTML files and as a fallback for unsupported types.
 */
function buildViewerPage(
  title: string,
  url: string,
  mediaType: string,
  mime: string
): string {
  let body = "";
  if (mediaType === "video" || mime.startsWith("video/")) {
    body = `<video src="${url}" controls autoplay muted playsinline style="width:100%;max-height:100vh;display:block;background:#000;" title="${escapeHtml(title)}"></video>`;
  } else if (mediaType === "audio" || mime.startsWith("audio/")) {
    body = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0fbfc;">
        <div style="text-align:center;padding:32px;max-width:480px;">
          <div style="font-size:48px;margin-bottom:16px;">🎵</div>
          <p style="font-family:Merriweather,Georgia,serif;font-size:18px;color:#1a2e3b;margin:0 0 20px;">${escapeHtml(title)}</p>
          <audio src="${url}" controls style="width:100%;"></audio>
        </div>
      </div>`;
  } else if (mediaType === "image" || mime.startsWith("image/")) {
    body = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;">
      <img src="${url}" alt="${escapeHtml(title)}" style="max-width:100%;max-height:100vh;display:block;" />
    </div>`;
  } else if (mediaType === "document" || mime === "application/pdf") {
    body = `<iframe src="${url}" style="width:100%;height:100vh;border:none;" title="${escapeHtml(title)}"></iframe>`;
  } else if (mediaType === "html" || mime === "text/html") {
    // HTML files are proxied directly — this branch is only reached if proxying failed
    body = `<iframe src="${url}" style="width:100%;height:100vh;border:none;" title="${escapeHtml(title)}"></iframe>`;
  } else {
    body = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0fbfc;">
        <div style="text-align:center;padding:32px;">
          <p style="font-family:Merriweather,Georgia,serif;font-size:18px;color:#1a2e3b;margin:0 0 20px;">${escapeHtml(title)}</p>
          <a href="${url}" download style="display:inline-block;background:#189aa1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Download File</a>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — iHeartEcho™</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── VIEW route — inline display ────────────────────────────────────────────────
router.get("/api/media/:slug/view", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version, accessRuleId } = resolved;

  void logAccess({ assetId: asset.id, versionId: version.id, accessType: "serve", accessRuleId, userId: null, req });

  const mime = version.mimeType ?? "";
  const filename = version.originalFilename ?? `${asset.slug}.bin`;
  const url = version.s3Url;

  // SCORM: serve the extracted entry-point in a full-page iframe
  if (asset.mediaType === "scorm" || asset.mediaType === "lms") {
    const entryUrl = (version as any).scormEntryUrl as string | null;
    if (entryUrl) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.send(buildScormPage(asset.title, entryUrl));
      return;
    }
    // Fallback: download the zip if not yet extracted
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.redirect(302, url);
    return;
  }

  // HTML: proxy the raw HTML inline so it renders in the browser
  if (asset.mediaType === "html" || mime === "text/html" || mime === "application/xhtml+xml") {
    await proxyFile(url, "inline", filename, mime || "text/html", res);
    return;
  }

  // Images, video, audio, PDF: proxy inline
  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/pdf"
  ) {
    await proxyFile(url, "inline", filename, mime, res);
    return;
  }

  // Everything else: serve a viewer HTML page (wraps in appropriate tag or offers download)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.send(buildViewerPage(asset.title, url, asset.mediaType, mime));
});

// ── DOWNLOAD route — force attachment ─────────────────────────────────────────
router.get("/api/media/:slug/download", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version, accessRuleId } = resolved;

  void logAccess({ assetId: asset.id, versionId: version.id, accessType: "serve", accessRuleId, userId: null, req });

  const filename = version.originalFilename ?? `${asset.slug}.bin`;
  const mime = version.mimeType ?? "application/octet-stream";

  await proxyFile(version.s3Url, "attachment", filename, mime, res);
});

// ── Legacy /api/media/:slug — redirect to /view ───────────────────────────────
router.get("/api/media/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  res.redirect(302, `/api/media/${slug}/view${tokenParam}`);
});

// ── EMBED page — embeddable player for third-party iframes ────────────────────
router.get("/api/media/:slug/embed", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version, accessRuleId } = resolved;

  void logAccess({ assetId: asset.id, versionId: version.id, accessType: "embed", accessRuleId, userId: null, req });

  const mime = version.mimeType ?? "";
  const url = version.s3Url;

  // SCORM: iframe to extracted entry
  if (asset.mediaType === "scorm" || asset.mediaType === "lms") {
    const entryUrl = (version as any).scormEntryUrl as string | null;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    if (entryUrl) {
      res.send(buildScormPage(asset.title, entryUrl));
    } else {
      res.send(buildViewerPage(asset.title, url, asset.mediaType, mime));
    }
    return;
  }

  // HTML: proxy inline
  if (asset.mediaType === "html" || mime === "text/html") {
    await proxyFile(url, "inline", version.originalFilename ?? `${asset.slug}.html`, mime || "text/html", res);
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.send(buildViewerPage(asset.title, url, asset.mediaType, mime));
});

export function registerMediaServeRoute(app: import("express").Express) {
  app.use(router);
}
