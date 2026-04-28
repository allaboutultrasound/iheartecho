/**
 * Media Serve Routes
 *
 * GET  /api/media/:slug/view      — Serve file inline in the browser
 *                                   • HTML files → proxied inline with Content-Type: text/html
 *                                   • SCORM/zip  → extracted on-demand, served as full-page iframe
 *                                   • Images/video/audio/PDF → proxied with correct Content-Type
 * GET  /api/media/:slug/download  — Force-download the original file
 * GET  /api/media/:slug           — Legacy: redirect to /view
 * GET  /api/media/:slug/embed     — Embeddable player page (for iframes in other sites)
 *
 * All routes log access to mediaAccessLogs for analytics.
 * Private assets require ?token=<accessToken> on every route.
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { mediaAssets, mediaVersions, mediaAccessRules, mediaAccessLogs } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { storagePut } from "../storage";
import JSZip from "jszip";

const router = Router();

// ─── SCORM / ZIP Extraction ───────────────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  html: "text/html", htm: "text/html",
  js: "application/javascript", mjs: "application/javascript",
  css: "text/css",
  json: "application/json", xml: "application/xml",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
  ico: "image/x-icon",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg",
  wav: "audio/wav", ogg: "audio/ogg",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
  eot: "application/vnd.ms-fontobject",
  pdf: "application/pdf",
  swf: "application/x-shockwave-flash",
};

/**
 * Extract a SCORM/HTML zip from a remote URL, upload all files to S3, and
 * return the URL of the entry-point HTML.
 *
 * Entry-point detection order:
 *  1. href of <resource type="webcontent"> in imsmanifest.xml
 *  2. index.html / index.htm at root
 *  3. First .html file found
 */
async function extractZipAndGetEntryUrl(
  zipUrl: string,
  keyPrefix: string
): Promise<string | null> {
  try {
    const zipRes = await fetch(zipUrl);
    if (!zipRes.ok) {
      console.error(`[SCORM] Failed to fetch zip: ${zipRes.status} ${zipUrl}`);
      return null;
    }
    const zipBuf = Buffer.from(await zipRes.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuf);
    const files = zip.files;
    const uploadedUrls: Record<string, string> = {};

    // Upload all files in the zip to S3
    for (const [relativePath, file] of Object.entries(files)) {
      if (file.dir) continue;
      const fileBuffer = Buffer.from(await file.async("arraybuffer"));
      const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
      const contentType = MIME_MAP[ext] ?? "application/octet-stream";
      const s3Key = `${keyPrefix}/${relativePath}`;
      try {
        const result = await storagePut(s3Key, fileBuffer, contentType);
        // Encode spaces and special chars in the URL path for browser compatibility
        try {
          const urlObj = new URL(result.url);
          const encodedPath = urlObj.pathname.split('/').map((seg: string) => encodeURIComponent(decodeURIComponent(seg))).join('/');
          uploadedUrls[relativePath] = urlObj.origin + encodedPath;
        } catch {
          uploadedUrls[relativePath] = result.url;
        }
      } catch (uploadErr) {
        console.error(`[SCORM] Failed to upload ${relativePath}:`, uploadErr);
      }
    }

    if (Object.keys(uploadedUrls).length === 0) {
      console.error("[SCORM] No files were uploaded from zip — all files may be empty/null");
      return "FAILED";
    }

    // Try to find the entry point from imsmanifest.xml
    const manifestFile = files["imsmanifest.xml"] ?? files["imsmanifest.XML"];
    if (manifestFile) {
      const manifestText = await manifestFile.async("text");
      // Look for <resource ... href="..." type="webcontent"...>
      const hrefMatch =
        manifestText.match(/<resource[^>]+type=["'][^"']*webcontent[^"']*["'][^>]+href=["']([^"']+)["']/i) ??
        manifestText.match(/<resource[^>]+href=["']([^"']+)["'][^>]+type=["'][^"']*webcontent[^"']*["']/i) ??
        manifestText.match(/<resource[^>]+href=["']([^"']+)["']/i);
      if (hrefMatch) {
        const entryPath = hrefMatch[1].replace(/\\/g, "/");
        if (uploadedUrls[entryPath]) return uploadedUrls[entryPath];
        // Try case-insensitive match
        const lcEntry = entryPath.toLowerCase();
        const match = Object.keys(uploadedUrls).find(k => k.toLowerCase() === lcEntry);
        if (match) return uploadedUrls[match];
      }
    }

    // Fallback: index.html / index.htm at root
    if (uploadedUrls["index.html"]) return uploadedUrls["index.html"];
    if (uploadedUrls["index.htm"]) return uploadedUrls["index.htm"];

    // Fallback: first HTML file found (sorted so root-level files come first)
    const htmlFiles = Object.keys(uploadedUrls)
      .filter(k => k.endsWith(".html") || k.endsWith(".htm"))
      .sort((a, b) => a.split("/").length - b.split("/").length);
    if (htmlFiles.length > 0) return uploadedUrls[htmlFiles[0]];

    // No HTML entry found — mark as failed so we don't retry indefinitely
    console.error("[SCORM] No HTML entry point found in zip. Files uploaded:", Object.keys(uploadedUrls).slice(0, 10));
    return "FAILED";
  } catch (err) {
    console.error("[SCORM] Extraction failed:", err);
    return "FAILED";
  }
}

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
    // Non-fatal
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
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch {
    if (!res.headersSent) {
      res.status(502).json({ error: "Proxy error" });
    }
  }
}

/** Build a full-page HTML wrapper that loads a SCORM entry URL in an iframe. */
function buildScormPage(title: string, entryUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${escapeHtml(title)} — iHeartEcho™</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { height: 100%; height: -webkit-fill-available; }
    body {
      min-height: 100vh;
      min-height: -webkit-fill-available;
      overflow: hidden;
      background: #000;
      display: flex;
      flex-direction: column;
    }
    iframe {
      flex: 1;
      width: 100%;
      border: none;
      display: block;
      /* iOS Safari: use dvh for dynamic viewport */
      height: 100dvh;
      height: 100vh;
    }
    /* Fallback message for browsers that block iframes */
    .fallback {
      display: none;
      position: fixed;
      inset: 0;
      background: #f0fbfc;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .fallback h2 { color: #1a2e3b; font-size: clamp(16px, 4vw, 20px); }
    .fallback p { color: #6b7280; font-size: clamp(13px, 3.5vw, 15px); }
    .fallback a {
      display: inline-block;
      background: #189aa1;
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: clamp(14px, 3.5vw, 16px);
      min-height: 44px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <iframe
    src="${entryUrl}"
    title="${escapeHtml(title)}"
    allowfullscreen
    allow="fullscreen; autoplay"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
    onerror="document.querySelector('.fallback').style.display='flex'"
  ></iframe>
  <div class="fallback">
    <h2>${escapeHtml(title)}</h2>
    <p>This content could not be displayed inline.<br/>Open it directly in your browser.</p>
    <a href="${entryUrl}" target="_blank" rel="noopener">Open Content</a>
  </div>
</body>
</html>`;
}

/** Build a loading/extracting page that uses SSE to show real-time progress. */
function buildExtractingPage(title: string, slug: string, token?: string): string {
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  const sseUrl = `/api/media/${slug}/extract-sse${tokenParam}`;
  const viewUrl = `/api/media/${slug}/view${tokenParam}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>Loading ${escapeHtml(title)}\u2026</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { height: 100%; height: -webkit-fill-available; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: -webkit-fill-available;
      background: #f0fbfc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Merriweather, Georgia, serif;
      padding: env(safe-area-inset-top, 24px) env(safe-area-inset-right, 24px)
               env(safe-area-inset-bottom, 24px) env(safe-area-inset-left, 24px);
    }
    .card {
      text-align: center;
      padding: clamp(28px, 8vw, 48px) clamp(20px, 6vw, 40px);
      max-width: min(420px, 92vw);
      width: 100%;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(24,154,161,0.12);
    }
    .spinner {
      width: clamp(36px, 10vw, 52px);
      height: clamp(36px, 10vw, 52px);
      border: 4px solid #e0f7f8;
      border-top-color: #189aa1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 {
      color: #1a2e3b;
      font-size: clamp(15px, 4vw, 18px);
      margin-bottom: 8px;
      line-height: 1.4;
    }
    p {
      color: #6b7280;
      font-size: clamp(12px, 3.2vw, 14px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.5;
    }
    .progress-bar-wrap {
      width: 100%; background: #e0f7f8; border-radius: 8px;
      height: 8px; margin: 14px 0 6px; overflow: hidden;
    }
    .progress-bar {
      height: 100%; background: #189aa1; border-radius: 8px;
      transition: width 0.4s ease;
      width: 0%;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Preparing ${escapeHtml(title)}</h2>
    <p id="status-msg">Extracting package files\u2026 this may take a moment.</p>
    <div class="progress-bar-wrap"><div class="progress-bar" id="pbar"></div></div>
    <p id="pct-msg" style="font-size:12px;color:#189aa1;margin-top:4px;"></p>
  </div>
<script>
(function(){
  var es = new EventSource('${sseUrl}');
  var pbar = document.getElementById('pbar');
  var pct = document.getElementById('pct-msg');
  var msg = document.getElementById('status-msg');
  es.addEventListener('progress', function(e){
    try {
      var d = JSON.parse(e.data);
      if (d.pct != null) {
        if (pbar) pbar.style.width = d.pct + '%';
        if (pct) pct.textContent = d.pct + '% uploaded';
      }
    } catch(ex){}
  });
  es.addEventListener('done', function(e){
    es.close();
    if (pbar) pbar.style.width = '100%';
    if (msg) msg.textContent = 'Done! Loading content\u2026';
    setTimeout(function(){ window.location.replace('${viewUrl}'); }, 400);
  });
  es.addEventListener('error', function(e){
    es.close();
    if (msg) msg.textContent = 'Extraction failed. Redirecting\u2026';
    setTimeout(function(){ window.location.replace('${viewUrl}'); }, 2000);
  });
  es.onerror = function(){
    es.close();
    setTimeout(function(){ window.location.replace('${viewUrl}'); }, 3000);
  };
})();
<\/script>
</body>
</html>`;
}
/** Build an error page for zips that have no displayable HTML entry point. */
function buildNoEntryPage(title: string, downloadUrl: string): string {
  const safeTitle = escapeHtml(title);
  const safeDownload = escapeHtml(downloadUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${safeTitle}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { height: 100%; height: -webkit-fill-available; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: -webkit-fill-available;
      background: #f0fbfc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: env(safe-area-inset-top, 24px) env(safe-area-inset-right, 24px)
               env(safe-area-inset-bottom, 24px) env(safe-area-inset-left, 24px);
    }
    .card {
      text-align: center;
      padding: clamp(28px, 8vw, 48px) clamp(20px, 6vw, 40px);
      max-width: min(420px, 92vw);
      width: 100%;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(24,154,161,0.12);
    }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h2 { color: #1a2e3b; font-size: clamp(15px, 4vw, 18px); margin-bottom: 8px; line-height: 1.4; }
    p { color: #6b7280; font-size: clamp(12px, 3.2vw, 14px); line-height: 1.5; margin-bottom: 20px; }
    a.btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 24px; border-radius: 8px;
      background: #189aa1; color: #fff; text-decoration: none;
      font-size: 14px; font-weight: 600;
      transition: opacity 0.15s;
    }
    a.btn:hover { opacity: 0.88; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📦</div>
    <h2>${safeTitle}</h2>
    <p>This package does not contain a displayable HTML entry point.<br/>
    It may need to be re-exported from your authoring tool as a complete SCORM or HTML package.</p>
    <a class="btn" href="${safeDownload}" download>⬇ Download File</a>
  </div>
</body>
</html>`;
}
/** Build a viewer page for non-zip media types. */

function buildViewerPage(title: string, url: string, mediaType: string, mime: string): string {
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(url);

  // ── Shared CSS reset + mobile-safe viewport ──────────────────────────────
  const head = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${safeTitle} — iHeartEcho™</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { height: 100%; height: -webkit-fill-available; }
    body {
      min-height: 100vh;
      min-height: -webkit-fill-available;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    /* Responsive typography base */
    :root { font-size: clamp(14px, 3.5vw, 16px); }
  </style>
</head>
<body>`;

  let body = "";

  if (mediaType === "video" || mime.startsWith("video/")) {
    body = `
  <style>
    body { background: #000; justify-content: center; align-items: center; }
    video {
      width: 100%;
      max-width: 100vw;
      /* Use dvh so iOS Safari address bar doesn't clip controls */
      max-height: 100dvh;
      max-height: 100vh;
      display: block;
      object-fit: contain;
    }
  </style>
  <video
    src="${safeUrl}"
    controls
    autoplay
    muted
    playsinline
    webkit-playsinline
    title="${safeTitle}"
  ></video>`;
  } else if (mediaType === "audio" || mime.startsWith("audio/")) {
    body = `
  <style>
    body {
      background: linear-gradient(135deg, #f0fbfc 0%, #e0f7f8 100%);
      justify-content: center;
      align-items: center;
      padding: env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px)
               env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px);
    }
    .card {
      text-align: center;
      padding: clamp(20px, 6vw, 40px);
      max-width: min(480px, 92vw);
      width: 100%;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(24,154,161,0.12);
    }
    .icon { font-size: clamp(36px, 10vw, 56px); margin-bottom: 12px; }
    h2 {
      font-family: Merriweather, Georgia, serif;
      font-size: clamp(15px, 4vw, 20px);
      color: #1a2e3b;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    audio { width: 100%; min-height: 44px; }
  </style>
  <div class="card">
    <div class="icon">🎵</div>
    <h2>${safeTitle}</h2>
    <audio src="${safeUrl}" controls></audio>
  </div>`;
  } else if (mediaType === "image" || mime.startsWith("image/")) {
    body = `
  <style>
    body {
      background: #111;
      justify-content: center;
      align-items: center;
      padding: env(safe-area-inset-top, 8px) env(safe-area-inset-right, 8px)
               env(safe-area-inset-bottom, 8px) env(safe-area-inset-left, 8px);
    }
    img {
      max-width: 100%;
      max-height: 100dvh;
      max-height: 100vh;
      object-fit: contain;
      display: block;
    }
  </style>
  <img src="${safeUrl}" alt="${safeTitle}" />`;
  } else if (mediaType === "document" || mime === "application/pdf") {
    body = `
  <style>
    body { background: #525659; }
    iframe {
      flex: 1;
      width: 100%;
      height: 100dvh;
      height: 100vh;
      border: none;
      display: block;
    }
    /* Mobile fallback: PDF iframes often don't work on iOS */
    .pdf-fallback {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: clamp(20px, 6vw, 40px);
      text-align: center;
      background: #f0fbfc;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .pdf-fallback h2 { color: #1a2e3b; font-size: clamp(16px, 4vw, 20px); }
    .pdf-fallback p { color: #6b7280; font-size: clamp(13px, 3.5vw, 15px); }
    .pdf-fallback a {
      display: inline-block;
      background: #189aa1;
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: clamp(14px, 3.5vw, 16px);
      min-height: 44px;
      line-height: 1.5;
    }
    @media (max-width: 640px) {
      /* On mobile, show fallback link instead of broken PDF iframe */
      iframe { display: none; }
      .pdf-fallback { display: flex; }
    }
  </style>
  <iframe src="${safeUrl}" title="${safeTitle}"></iframe>
  <div class="pdf-fallback">
    <h2>${safeTitle}</h2>
    <p>PDF preview is not supported on this device.<br/>Tap below to open it directly.</p>
    <a href="${safeUrl}" target="_blank" rel="noopener">Open PDF</a>
  </div>`;
  } else {
    body = `
  <style>
    body {
      background: #f0fbfc;
      justify-content: center;
      align-items: center;
      padding: env(safe-area-inset-top, 24px) env(safe-area-inset-right, 24px)
               env(safe-area-inset-bottom, 24px) env(safe-area-inset-left, 24px);
    }
    .card {
      text-align: center;
      padding: clamp(24px, 7vw, 48px);
      max-width: min(420px, 92vw);
      width: 100%;
    }
    h2 {
      font-family: Merriweather, Georgia, serif;
      font-size: clamp(16px, 4vw, 20px);
      color: #1a2e3b;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    a {
      display: inline-block;
      background: #189aa1;
      color: #fff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: clamp(14px, 3.5vw, 16px);
      /* Minimum tap target size */
      min-height: 44px;
      line-height: 1.5;
      transition: opacity 0.15s;
    }
    a:active { opacity: 0.8; }
  </style>
  <div class="card">
    <h2>${safeTitle}</h2>
    <a href="${safeUrl}" download>Download File</a>
  </div>`;
  }

  return head + body + `
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Determine if a MIME type or mediaType is a zip/SCORM package. */
function isZipLike(mediaType: string, mime: string): boolean {
  return (
    mediaType === "scorm" ||
    mediaType === "lms" ||
    mediaType === "zip" ||
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/x-zip" ||
    mime === "application/octet-stream" && mediaType === "zip"
  );
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

    // ── SCORM / ZIP: extract on-demand if needed ────────────────────────────────
  if (isZipLike(asset.mediaType, mime)) {
    const existingEntryUrl = (version as any).scormEntryUrl as string | null;
    if (existingEntryUrl === "FAILED") {
      // Previously attempted extraction found no HTML entry — show error page
      const dlUrl = `/api/media/${slug}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(buildNoEntryPage(asset.title, dlUrl));
      return;
    }
    if (existingEntryUrl) {
      // Already extracted — serve the iframe immediately
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(buildScormPage(asset.title, existingEntryUrl));
      return;
    }
    // Not yet extracted — start extraction in the background and show a loading page
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildExtractingPage(asset.title, slug, token));
    // Extract asynchronously (fire-and-forget; next request will get the iframe or error page)
    const keyPrefix = `media-repository/${asset.slug}-scorm`;
    extractZipAndGetEntryUrl(url, keyPrefix).then(async (entryUrl) => {
      try {
        const db = await getDb();
        if (!db) return;
        if (!entryUrl || entryUrl === "FAILED") {
          // Store FAILED sentinel so we don't retry on every page load
          await db.update(mediaVersions).set({ scormEntryUrl: "FAILED" } as any).where(eq(mediaVersions.id, version.id));
          console.error(`[SCORM] Extraction produced no entry URL for asset ${asset.id} — stored FAILED sentinel`);
          return;
        }
        // Store scormEntryUrl on the version row
        await db.update(mediaVersions).set({ scormEntryUrl: entryUrl } as any).where(eq(mediaVersions.id, version.id));
        // Promote mediaType to "scorm" so future requests hit the right branch
        await db.update(mediaAssets).set({ mediaType: "scorm" } as any).where(eq(mediaAssets.id, asset.id));
        console.log(`[SCORM] Extraction complete for asset ${asset.id}: ${entryUrl}`);
      } catch (dbErr) {
        console.error("[SCORM] Failed to save extraction result:", dbErr);
      }
    }).catch((err) => {
      console.error("[SCORM] Background extraction error:", err);
    });
     return;
  }
  // ── HTML: proxy the raw HTML inline ────────────────────────────────────────
  if (asset.mediaType === "html" || mime === "text/html" || mime === "application/xhtml+xml") {
    await proxyFile(url, "inline", filename, mime || "text/html", res);
    return;
  }

  // ── Images, video, audio, PDF: proxy inline ─────────────────────────────────
  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/pdf"
  ) {
    await proxyFile(url, "inline", filename, mime, res);
    return;
  }

  // ── Everything else: viewer page ────────────────────────────────────────────
  res.setHeader("Content-Type", "text/html; charset=utf-8");
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

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");

  // SCORM/zip: iframe to extracted entry
  if (isZipLike(asset.mediaType, mime)) {
    const entryUrl = (version as any).scormEntryUrl as string | null;
    if (entryUrl === "FAILED") {
      const downloadUrl = `/api/media/${slug}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      res.send(buildNoEntryPage(asset.title, downloadUrl));
    } else if (entryUrl) {
      res.send(buildScormPage(asset.title, entryUrl));
    } else {
      res.send(buildExtractingPage(asset.title, slug, token));
      // Trigger extraction in background
      const keyPrefix = `media-repository/${asset.slug}-scorm`;
      extractZipAndGetEntryUrl(url, keyPrefix).then(async (result) => {
        const db = await getDb();
        if (!db) return;
        if (!result || result === "FAILED") {
          await db.update(mediaVersions).set({ scormEntryUrl: "FAILED" } as any).where(eq(mediaVersions.id, version.id));
          return;
        }
        await db.update(mediaVersions).set({ scormEntryUrl: result } as any).where(eq(mediaVersions.id, version.id));
        await db.update(mediaAssets).set({ mediaType: "scorm" } as any).where(eq(mediaAssets.id, asset.id));
      }).catch(console.error);
    }
    return;
  }

  // HTML: proxy inline
  if (asset.mediaType === "html" || mime === "text/html") {
    await proxyFile(url, "inline", version.originalFilename ?? `${asset.slug}.html`, mime || "text/html", res);
    return;
  }

  res.send(buildViewerPage(asset.title, url, asset.mediaType, mime));
});

// ── SSE extraction endpoint — streams progress to the loading page ────────────
// This is called by the EventSource in buildExtractingPage.
// It runs the extraction and sends progress events, then a 'done' event.
// If extraction was already completed (scormEntryUrl set), it sends 'done' immediately.
router.get("/api/media/:slug/extract-sse", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  // Resolve asset (enforces access control)
  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version } = resolved;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // If already extracted, send done immediately
  const existingEntry = (version as any).scormEntryUrl as string | null;
  if (existingEntry && existingEntry !== "FAILED") {
    send("done", { entryUrl: existingEntry });
    res.end();
    return;
  }

  // If not a zip-like asset, send done immediately (nothing to extract)
  const mime = version.mimeType ?? "";
  if (!isZipLike(asset.mediaType, mime)) {
    send("done", {});
    res.end();
    return;
  }

  // Run extraction with progress reporting
  const keyPrefix = `media-repository/${asset.slug}-scorm`;
  try {
    const zipRes = await fetch(version.s3Url);
    if (!zipRes.ok) {
      send("error", { message: "Failed to fetch zip" });
      res.end();
      return;
    }
    const zipBuf = Buffer.from(await zipRes.arrayBuffer());
    const JSZipLib = (await import("jszip")).default;
    const zip = await JSZipLib.loadAsync(zipBuf);
    const files = zip.files;
    const fileEntries = Object.entries(files).filter(([, f]) => !f.dir);
    const total = fileEntries.length;
    const uploadedUrls: Record<string, string> = {};
    let uploaded = 0;

    for (const [relativePath, file] of fileEntries) {
      const fileBuffer = Buffer.from(await file.async("arraybuffer"));
      const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
      const contentType = MIME_MAP[ext] ?? "application/octet-stream";
      const s3Key = `${keyPrefix}/${relativePath}`;
      try {
        const result = await storagePut(s3Key, fileBuffer, contentType);
        try {
          const urlObj = new URL(result.url);
          const encodedPath = urlObj.pathname.split("/").map((seg: string) => encodeURIComponent(decodeURIComponent(seg))).join("/");
          uploadedUrls[relativePath] = urlObj.origin + encodedPath;
        } catch {
          uploadedUrls[relativePath] = result.url;
        }
      } catch (uploadErr) {
        console.error(`[SCORM SSE] Failed to upload ${relativePath}:`, uploadErr);
      }
      uploaded++;
      const pct = Math.round((uploaded / total) * 100);
      send("progress", { pct, uploaded, total });
    }

    // Determine entry URL
    let entryUrl: string | null = null;
    const manifestFile = files["imsmanifest.xml"] ?? files["imsmanifest.XML"];
    if (manifestFile) {
      const manifestText = await manifestFile.async("text");
      const hrefMatch =
        manifestText.match(/<resource[^>]+type=["'][^"']*webcontent[^"']*["'][^>]+href=["']([^"']+)["']/i) ??
        manifestText.match(/<resource[^>]+href=["']([^"']+)["'][^>]+type=["'][^"']*webcontent[^"']*["']/i) ??
        manifestText.match(/<resource[^>]+href=["']([^"']+)["']/i);
      if (hrefMatch) {
        const entryPath = hrefMatch[1].replace(/\\/g, "/");
        if (uploadedUrls[entryPath]) entryUrl = uploadedUrls[entryPath];
        else {
          const lcEntry = entryPath.toLowerCase();
          const match = Object.keys(uploadedUrls).find(k => k.toLowerCase() === lcEntry);
          if (match) entryUrl = uploadedUrls[match];
        }
      }
    }
    if (!entryUrl && uploadedUrls["index.html"]) entryUrl = uploadedUrls["index.html"];
    if (!entryUrl && uploadedUrls["index.htm"]) entryUrl = uploadedUrls["index.htm"];
    if (!entryUrl) {
      const htmlFiles = Object.keys(uploadedUrls)
        .filter(k => k.endsWith(".html") || k.endsWith(".htm"))
        .sort((a, b) => a.split("/").length - b.split("/").length);
      if (htmlFiles.length > 0) entryUrl = uploadedUrls[htmlFiles[0]];
    }

    // Persist result
    const db = await getDb();
    if (db) {
      if (!entryUrl) {
        await db.update(mediaVersions).set({ scormEntryUrl: "FAILED" } as any).where(eq(mediaVersions.id, version.id));
        send("error", { message: "No HTML entry point found" });
        res.end();
        return;
      }
      await db.update(mediaVersions).set({ scormEntryUrl: entryUrl } as any).where(eq(mediaVersions.id, version.id));
      await db.update(mediaAssets).set({ mediaType: "scorm" } as any).where(eq(mediaAssets.id, asset.id));
    }

    send("done", { entryUrl });
    res.end();
  } catch (err) {
    console.error("[SCORM SSE] Extraction error:", err);
    send("error", { message: String(err) });
    res.end();
  }
});

export function registerMediaServeRoute(app: import("express").Express) {
  app.use(router);
}
