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
import { PassThrough, Readable } from "stream";
import unzipper from "unzipper";

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

/**
 * Build a full-page HTML that loads a SCORM entry from the ZIP streaming endpoint.
 * Uses a <base> tag so all relative URLs in the SCORM content resolve correctly.
 */
function buildZipStreamPage(title: string, slug: string, entryPath: string, token?: string): string {
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  // URL-encode each path segment so spaces and special chars work in browser URLs
  const encodedEntryPath = entryPath.split("/").map((seg: string) => encodeURIComponent(seg)).join("/");
  const fullEntryUrl = `/api/media/${slug}/zip-file/${encodedEntryPath}${tokenParam}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${escapeHtml(title)}</title>
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
      height: 100dvh;
      height: 100vh;
    }
  </style>
</head>
<body>
  <iframe
    src="${fullEntryUrl}"
    title="${escapeHtml(title)}"
    allowfullscreen
    allow="fullscreen; autoplay"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-modals"
  ></iframe>
</body>
</html>`;
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
  <!-- SCORM 1.2 + SCORM 2004 API stubs so iSpring/Articulate content doesn't hang -->
  <script>
    // SCORM 1.2 stub
    window.API = {
      LMSInitialize: function() { return 'true'; },
      LMSFinish: function() { return 'true'; },
      LMSGetValue: function(e) { return ''; },
      LMSSetValue: function(e, v) { return 'true'; },
      LMSCommit: function() { return 'true'; },
      LMSGetLastError: function() { return '0'; },
      LMSGetErrorString: function() { return ''; },
      LMSGetDiagnostic: function() { return ''; }
    };
    // SCORM 2004 stub
    window.API_1484_11 = {
      Initialize: function() { return 'true'; },
      Terminate: function() { return 'true'; },
      GetValue: function(e) { return ''; },
      SetValue: function(e, v) { return 'true'; },
      Commit: function() { return 'true'; },
      GetLastError: function() { return '0'; },
      GetErrorString: function() { return ''; },
      GetDiagnostic: function() { return ''; }
    };
  </script>
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

/** Build a wrapper page for SCORM embed with loading state, error catching, and fallback. */
function buildScormEmbedWrapper(title: string, entryUrl: string, slug?: string, token?: string): string {
  // Build a safe /view URL that goes through our server (never expose CloudFront directly)
  const viewUrl = slug
    ? `/api/media/${slug}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`
    : entryUrl; // fallback to entryUrl only if slug not provided
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; background: #f0fbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #loading {
      position: fixed; inset: 0; z-index: 100;
      display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px;
      background: #f0fbfc;
      transition: opacity 0.3s;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #e0f4f5; border-top-color: #189aa1;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { color: #189aa1; font-size: 14px; font-weight: 600; }
    .loading-sub { color: #6b7280; font-size: 12px; max-width: 280px; text-align: center; }
    .mobile-tip {
      background: #fff; border: 1px solid #189aa1; border-radius: 10px;
      padding: 12px 16px; max-width: 300px; text-align: center;
      margin-top: 4px;
    }
    .mobile-tip-icon { font-size: 20px; margin-bottom: 4px; }
    .mobile-tip-title { color: #189aa1; font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .mobile-tip-text { color: #6b7280; font-size: 11px; line-height: 1.5; }
    .mobile-tip-text strong { color: #1a2e3b; }
    #mobile-banner {
      display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: linear-gradient(135deg, #0e1e2e, #0e4a50); color: #fff;
      padding: 14px 16px; text-align: center;
      font-size: 13px; line-height: 1.5;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.2);
    }
    #mobile-banner strong { color: #4ad9e0; }
    #mobile-banner a {
      display: inline-block; background: #189aa1; color: #fff; text-decoration: none;
      padding: 8px 20px; border-radius: 6px; font-weight: 600; font-size: 13px;
      margin-top: 8px;
    }
    #mobile-banner .dismiss {
      position: absolute; top: 8px; right: 12px; background: none; border: none;
      color: #fff; font-size: 18px; cursor: pointer; opacity: 0.7;
    }
    #error-panel {
      position: fixed; inset: 0; z-index: 200;
      display: none; align-items: center; justify-content: center; flex-direction: column; gap: 16px;
      background: #f0fbfc; padding: 24px; text-align: center;
    }
    #error-panel.visible { display: flex; }
    #error-panel h2 { color: #1a2e3b; font-size: 18px; }
    #error-panel p { color: #6b7280; font-size: 14px; max-width: 320px; }
    #error-panel .error-detail { color: #ef4444; font-size: 11px; background: #fef2f2; padding: 8px 12px; border-radius: 6px; max-width: 320px; word-break: break-all; font-family: monospace; }
    #error-panel a, #error-panel button {
      display: inline-block; background: #189aa1; color: #fff; text-decoration: none;
      padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;
      border: none; cursor: pointer; min-height: 44px;
    }
    #error-panel .secondary { background: transparent; color: #189aa1; border: 2px solid #189aa1; }
    #diag { display: none; color: #9ca3af; font-size: 10px; margin-top: 8px; max-width: 320px; word-break: break-all; font-family: monospace; }
    iframe {
      width: 100%; height: 100%; border: none; display: block;
      position: fixed; inset: 0;
    }
  </style>
</head>
<body>
  <!-- SCORM 1.2 + SCORM 2004 API stubs so iSpring/Articulate content doesn't hang -->
  <script>
    window.API = {
      LMSInitialize: function() { return 'true'; },
      LMSFinish: function() { return 'true'; },
      LMSGetValue: function(e) { return ''; },
      LMSSetValue: function(e, v) { return 'true'; },
      LMSCommit: function() { return 'true'; },
      LMSGetLastError: function() { return '0'; },
      LMSGetErrorString: function() { return ''; },
      LMSGetDiagnostic: function() { return ''; }
    };
    window.API_1484_11 = {
      Initialize: function() { return 'true'; },
      Terminate: function() { return 'true'; },
      GetValue: function(e) { return ''; },
      SetValue: function(e, v) { return 'true'; },
      Commit: function() { return 'true'; },
      GetLastError: function() { return '0'; },
      GetErrorString: function() { return ''; },
      GetDiagnostic: function() { return ''; }
    };
  </script>

  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Loading content...</div>
    <div class="loading-sub" id="loading-status">Connecting to content server</div>
    <div class="mobile-tip" id="mobile-tip" style="display:none">
      <div class="mobile-tip-icon">&#128241;</div>
      <div class="mobile-tip-title">Viewing on mobile?</div>
      <div class="mobile-tip-text">
        If content doesn't display, switch to<br/>
        <strong>Desktop Site</strong> in your browser settings.<br/>
        <span style="color:#9ca3af; font-size:10px;">Chrome: &#8942; &rarr; Desktop site &nbsp;|&nbsp; Safari: aA &rarr; Request Desktop Website</span>
      </div>
    </div>
  </div>

  <!-- Persistent banner shown after content loads (in case it goes gray) -->
  <div id="mobile-banner">
    <button class="dismiss" onclick="this.parentElement.style.display='none'">&times;</button>
    Having trouble viewing? Switch to <strong>Desktop Site</strong> in your browser menu.<br/>
    <span style="font-size:11px; opacity:0.7;">Chrome: &#8942; &rarr; Desktop site &nbsp;|&nbsp; Safari: aA &rarr; Request Desktop Website</span><br/>
    <a href="${viewUrl}" target="_blank" rel="noopener">Open in New Tab</a>
  </div>

  <div id="error-panel">
    <h2>Unable to Load Content</h2>
    <p id="error-msg">The content failed to load. You can open it directly in your browser.</p>
    <div class="error-detail" id="error-detail"></div>
    <a href="${viewUrl}" target="_blank" rel="noopener">Open Directly</a>
    <button class="secondary" onclick="retryLoad()">Retry</button>
    <div id="diag"></div>
  </div>

  <iframe id="content-frame" title="${escapeHtml(title)}" allowfullscreen allow="fullscreen; autoplay" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>

  <script>
    var CONTENT_URL = ${JSON.stringify(entryUrl)};
    var frame = document.getElementById('content-frame');
    var loadingEl = document.getElementById('loading');
    var errorPanel = document.getElementById('error-panel');
    var errorDetail = document.getElementById('error-detail');
    var diagEl = document.getElementById('diag');
    var statusEl = document.getElementById('loading-status');
    var loadTimer = null;
    var diagLog = [];

    function addDiag(msg) {
      var ts = new Date().toISOString().substr(11, 12);
      diagLog.push(ts + ' ' + msg);
      if (diagEl) diagEl.textContent = diagLog.join('\\n');
    }

    function showError(msg, detail) {
      loadingEl.classList.add('hidden');
      errorPanel.classList.add('visible');
      if (detail) errorDetail.textContent = detail;
      if (msg) document.getElementById('error-msg').textContent = msg;
      diagEl.style.display = 'block';
      addDiag('ERROR: ' + (detail || msg));
    }

    function startLoad() {
      errorPanel.classList.remove('visible');
      loadingEl.classList.remove('hidden');
      statusEl.textContent = 'Connecting to content server';
      addDiag('Starting load: ' + CONTENT_URL);

      // First, verify the content URL is reachable
      addDiag('Sending preflight fetch...');
      statusEl.textContent = 'Checking content availability...';

      fetch(CONTENT_URL, { method: 'HEAD', mode: 'no-cors' })
        .then(function() {
          addDiag('Preflight OK, setting iframe src');
          statusEl.textContent = 'Loading interactive content...';
          frame.src = CONTENT_URL;
        })
        .catch(function(err) {
          addDiag('Preflight failed: ' + err.message);
          // Still try loading in iframe — no-cors may fail but iframe might work
          statusEl.textContent = 'Loading content...';
          frame.src = CONTENT_URL;
        });

      // Timeout: if iframe hasn't loaded in 30 seconds, show error
      clearTimeout(loadTimer);
      loadTimer = setTimeout(function() {
        addDiag('30s timeout reached');
        // Check if iframe has content
        try {
          var hasContent = frame.contentDocument && frame.contentDocument.body && frame.contentDocument.body.innerHTML.length > 0;
          addDiag('iframe contentDocument accessible: ' + !!hasContent);
          if (!hasContent) {
            showError(
              'Content is taking too long to load. This may be a network issue on your device.',
              'Timeout after 30s. Try opening directly.'
            );
          }
        } catch(e) {
          addDiag('iframe cross-origin (expected): ' + e.message);
          // Cross-origin — can't check content. Hide loading and hope it loaded.
          loadingEl.classList.add('hidden');
        }
      }, 30000);
    }

    frame.addEventListener('load', function() {
      clearTimeout(loadTimer);
      addDiag('iframe onload fired');
      // Small delay to let content render
      setTimeout(function() {
        loadingEl.classList.add('hidden');
        addDiag('Loading hidden, content should be visible');
        // On mobile, show the persistent banner after content loads
        if (isMobile) {
          var banner = document.getElementById('mobile-banner');
          if (banner) banner.style.display = 'block';
        }
        // Check if the iframe body is actually empty (blank page scenario)
        try {
          var body = frame.contentDocument && frame.contentDocument.body;
          if (body && body.innerHTML.trim().length === 0) {
            addDiag('WARNING: iframe body is empty after load!');
            showError(
              'Content loaded but appears blank. Switch to Desktop Site in your browser settings, or open directly.',
              'iframe loaded with empty body. Try Desktop mode or open directly.'
            );
          }
        } catch(e) {
          // Cross-origin — can't inspect, which is fine
          addDiag('Cross-origin iframe (normal for CloudFront)');
        }
      }, 1500);
    });

    frame.addEventListener('error', function(e) {
      clearTimeout(loadTimer);
      addDiag('iframe onerror: ' + (e.message || 'unknown'));
      showError('Failed to load content.', 'iframe error event: ' + (e.message || 'unknown'));
    });

    function retryLoad() {
      addDiag('Retry requested');
      frame.src = 'about:blank';
      setTimeout(startLoad, 200);
    }

    // Catch any attempt by iframe content to navigate the top/parent window
    window.addEventListener('beforeunload', function(e) {
      addDiag('WARNING: beforeunload fired — something tried to navigate away!');
    });

    // Also monitor for the page going blank by checking visibility periodically
    var blankCheckCount = 0;
    var blankChecker = setInterval(function() {
      blankCheckCount++;
      if (blankCheckCount > 60) { clearInterval(blankChecker); return; } // stop after 60s
      try {
        // If our own DOM elements are gone, something overwrote the page
        if (!document.getElementById('content-frame')) {
          addDiag('CRITICAL: Our DOM was destroyed!');
          clearInterval(blankChecker);
        }
      } catch(e) {}
    }, 1000);

    // Detect mobile and show tip
    var isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    if (isMobile) {
      var tip = document.getElementById('mobile-tip');
      if (tip) tip.style.display = 'block';
    }

    // Start loading
    startLoad();
  </script>
</body>
</html>`;
}

/** Build a loading/extracting page that polls for progress. */
function buildExtractingPage(title: string, slug: string, token?: string): string {
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  const startUrl = `/api/media/${slug}/extract-start${tokenParam}`;
  const statusUrl = `/api/media/${slug}/extract-status${tokenParam}`;
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
    <p id="status-msg">Starting extraction\u2026</p>
    <div class="progress-bar-wrap"><div class="progress-bar" id="pbar"></div></div>
    <p id="pct-msg" style="font-size:12px;color:#189aa1;margin-top:4px;"></p>
  </div>
<script>
(function(){
  var pbar = document.getElementById('pbar');
  var pct = document.getElementById('pct-msg');
  var msg = document.getElementById('status-msg');
  var pollTimer = null;
  var failed = false;

  var idleRetries = 0;

  function handleResult(d) {
    if (failed) return;
    if (d.pct != null && pbar) pbar.style.width = d.pct + '%';
    if (d.total > 0 && pct) pct.textContent = d.pct + '% \u2014 ' + d.uploaded + ' / ' + d.total + ' files';
    else if (d.pct != null && pct) pct.textContent = d.pct + '%';
    if (d.status && msg) msg.textContent = d.status;
    if (d.state === 'done') {
      clearInterval(pollTimer);
      if (pbar) pbar.style.width = '100%';
      if (msg) msg.textContent = 'Done! Loading content\u2026';
      // Use entryUrl directly if available (avoids extra round-trip through /view)
      var dest = (d.entryUrl) ? d.entryUrl : '${viewUrl}';
      setTimeout(function(){ window.location.replace(dest); }, 400);
    } else if (d.state === 'failed') {
      clearInterval(pollTimer);
      failed = true;
      if (msg) msg.textContent = 'Extraction failed. Redirecting\u2026';
      setTimeout(function(){ window.location.replace('${viewUrl}'); }, 2000);
    } else if (d.state === 'idle') {
      // No job running on any instance — restart extraction
      idleRetries++;
      if (idleRetries <= 3) {
        if (msg) msg.textContent = 'Restarting extraction\u2026';
        clearInterval(pollTimer);
        startExtraction();
      } else {
        clearInterval(pollTimer);
        failed = true;
        if (msg) msg.textContent = 'Extraction could not start. Redirecting\u2026';
        setTimeout(function(){ window.location.replace('${viewUrl}'); }, 2000);
      }
    }
  }

  function poll() {
    fetch('${statusUrl}')
      .then(function(r){ return r.json(); })
      .then(handleResult)
      .catch(function(){ /* network error \u2014 keep polling */ });
  }

  function startExtraction() {
    // Start the background extraction job, then begin polling
    fetch('${startUrl}', { method: 'POST' })
      .then(function(r){ return r.json(); })
      .then(function(d) {
        handleResult(d);
        if (d.state === 'running') {
          // Job started or already running \u2014 begin polling
          poll();
          pollTimer = setInterval(poll, 2000);
        } else if (d.state === 'done' && d.entryUrl) {
          // Already extracted — go directly to content
          window.location.replace(d.entryUrl);
        }
      })
      .catch(function() {
        // Fallback: just redirect to view
        setTimeout(function(){ window.location.replace('${viewUrl}'); }, 3000);
      });
  }

  startExtraction();
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
    // Google Docs Viewer works on all mobile browsers including iOS Safari
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(safeUrl)}&embedded=true`;
    body = `
  <style>
    body { background: #525659; margin: 0; padding: 0; }
    /* Desktop: direct PDF iframe fills viewport */
    .pdf-desktop {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      height: 100dvh;
    }
    .pdf-desktop iframe {
      flex: 1;
      width: 100%;
      border: none;
      display: block;
    }
    /* Mobile: Google Docs Viewer + open/download buttons */
    .pdf-mobile {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: clamp(16px, 5vw, 32px) clamp(12px, 4vw, 24px);
      background: #f0fbfc;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .pdf-mobile h2 {
      color: #1a2e3b;
      font-size: clamp(15px, 4vw, 19px);
      margin: 0;
      line-height: 1.4;
      text-align: center;
    }
    .pdf-mobile .viewer-frame {
      width: 100%;
      flex: 1;
      min-height: 60vh;
      border: none;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      background: #fff;
    }
    .pdf-mobile .btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      width: 100%;
      padding-bottom: env(safe-area-inset-bottom, 16px);
    }
    .pdf-mobile a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #189aa1;
      color: #fff;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: clamp(13px, 3.5vw, 15px);
      min-height: 44px;
      flex: 1;
      min-width: 130px;
      max-width: 200px;
      text-align: center;
    }
    .pdf-mobile a.secondary {
      background: #fff;
      color: #189aa1;
      border: 2px solid #189aa1;
    }
    @media (max-width: 768px) {
      .pdf-desktop { display: none !important; }
      .pdf-mobile { display: flex; }
    }
  </style>
  <!-- Desktop: direct PDF iframe -->
  <div class="pdf-desktop">
    <iframe src="${safeUrl}" title="${safeTitle}"></iframe>
  </div>
  <!-- Mobile: Google Docs Viewer + direct open/download fallback -->
  <div class="pdf-mobile">
    <h2>${safeTitle}</h2>
    <iframe
      class="viewer-frame"
      src="${googleDocsUrl}"
      title="${safeTitle}"
      allow="autoplay"
    ></iframe>
    <div class="btn-row">
      <a href="${safeUrl}" target="_blank" rel="noopener">Open PDF</a>
      <a href="${safeUrl}" download class="secondary">Download</a>
    </div>
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

    // ── SCORM / ZIP: serve content directly (no redirect — mobile browsers block 302 in cross-origin iframes)
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
      // Already extracted to S3/CloudFront — redirect directly to the entry URL (full-page)
      res.redirect(302, existingEntryUrl);
      return;
    }
    // Not yet extracted — use ZIP streaming instead (instant, no extraction needed)
    try {
      const entryPath = await findScormEntryPath(version.id, url);
      if (entryPath) {
        // Build a wrapper page that loads the SCORM content via ZIP streaming
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(buildZipStreamPage(asset.title, slug, entryPath, token));
        return;
      }
    } catch (e) {
      console.error('[ZIP STREAM] Failed to find entry path:', e);
    }
    // Fallback: show extraction page
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildExtractingPage(asset.title, slug, token));
    return;
  }
  // ── HTML: proxy the raw HTML inline ────────────────────────────────────────
  if (asset.mediaType === "html" || mime === "text/html" || mime === "application/xhtml+xml") {
    await proxyFile(url, "inline", filename, mime || "text/html", res);
    return;
  }

  // ── Images, video, audio: proxy inline ─────────────────────────────────────
  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/")
  ) {
    await proxyFile(url, "inline", filename, mime, res);
    return;
  }

  // ── PDF / document: serve via HTML viewer page (handles mobile fallback) ────────
  // Raw PDF proxy works on desktop but fails on iOS Safari and many Android browsers.
  // The viewer page uses Google Docs Viewer as a mobile-compatible iframe fallback.
  if (mime === "application/pdf" || asset.mediaType === "document") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildViewerPage(asset.title, url, "document", "application/pdf"));
    return;
  }

  // ── Everything else: viewer page ─────────────────────────────────────
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(buildViewerPage(asset.title, url, asset.mediaType, mime));
});

// ── ZIP file streaming route — serve individual files from ZIP on S3 ──────────
// Pattern: GET /api/media/:slug/zip-file/*filepath
// Streams the requested file directly from the ZIP using HTTP Range requests.
// Performance: caches the parsed ZIP directory + small file buffers in memory.

// --- Caches for zip-file streaming performance ---
// 1. Asset resolution cache: slug → { version, expiry }
const assetResolveCache = new Map<string, { version: any; expiry: number }>();
const ASSET_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function resolveAssetCached(slug: string, token: string | undefined, res: Response) {
  const cacheKey = `${slug}:${token ?? ''}`;
  const cached = assetResolveCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.version;
  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return null;
  assetResolveCache.set(cacheKey, { version: resolved, expiry: Date.now() + ASSET_CACHE_TTL });
  // Evict old entries if cache grows too large
  if (assetResolveCache.size > 200) {
    const now = Date.now();
    Array.from(assetResolveCache.entries()).forEach(([k, v]) => { if (v.expiry < now) assetResolveCache.delete(k); });
  }
  return resolved;
}

// 2. Parsed ZIP directory cache: s3Url → { dir (unzipper directory object), expiry }
const zipOpenCache = new Map<string, { dir: any; expiry: number; promise?: Promise<any> }>();
const ZIP_OPEN_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getZipOpen(s3Url: string): Promise<any> {
  const cached = zipOpenCache.get(s3Url);
  if (cached && cached.expiry > Date.now()) {
    if (cached.promise) return cached.promise;
    return cached.dir;
  }
  // Deduplicate concurrent opens for the same URL
  const promise = (async () => {
    const source = makeFetchRangeSource(s3Url);
    const dir = await unzipper.Open.custom(source);
    zipOpenCache.set(s3Url, { dir, expiry: Date.now() + ZIP_OPEN_CACHE_TTL });
    return dir;
  })();
  zipOpenCache.set(s3Url, { dir: null, expiry: Date.now() + ZIP_OPEN_CACHE_TTL, promise });
  try {
    return await promise;
  } catch (err) {
    zipOpenCache.delete(s3Url);
    throw err;
  }
}

// 3. File buffer cache: cacheKey → { buffer, contentType, expiry }
//    Only caches files < 2 MB to avoid memory bloat.
const fileBufferCache = new Map<string, { buffer: Buffer; contentType: string; expiry: number }>();
const FILE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const FILE_CACHE_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const FILE_CACHE_MAX_ENTRIES = 500;

// 4. Background prefetch: when any file from a ZIP is requested, pre-cache ALL
//    small files from that ZIP in the background so subsequent requests are instant.
const prefetchInProgress = new Set<string>();

async function prefetchZipFiles(slug: string, s3Url: string) {
  if (prefetchInProgress.has(s3Url)) return;
  prefetchInProgress.add(s3Url);
  try {
    const dir = await getZipOpen(s3Url);
    // Process files in batches of 5 concurrently
    const files = dir.files.filter((f: any) => f.type === 'File' && f.uncompressedSize <= FILE_CACHE_MAX_SIZE);
    console.log(`[ZIP PREFETCH] Starting prefetch for ${slug}: ${files.length} files`);
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map(async (entry: any) => {
        const cacheKey = `${slug}:${entry.path}`;
        if (fileBufferCache.has(cacheKey)) return; // already cached
        try {
          const chunks: Buffer[] = [];
          const stream = entry.stream();
          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);
          const ext = entry.path.split('.').pop()?.toLowerCase() ?? '';
          const ct = MIME_MAP[ext] ?? 'application/octet-stream';
          fileBufferCache.set(cacheKey, { buffer, contentType: ct, expiry: Date.now() + FILE_CACHE_TTL });
        } catch { /* skip failed files */ }
      }));
    }
    console.log(`[ZIP PREFETCH] Done for ${slug}: ${fileBufferCache.size} total cached files`);
  } catch (err) {
    console.error('[ZIP PREFETCH] Error:', err);
  } finally {
    prefetchInProgress.delete(s3Url);
  }
}

router.get("/api/media/:slug/zip-file/*", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;
  const filePath = (req.params as any)[0] as string;
  if (!filePath) { res.status(400).json({ error: 'Missing file path' }); return; }

  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

  // Check file buffer cache first (instant response)
  const fileCacheKey = `${slug}:${filePath}`;
  const cachedFile = fileBufferCache.get(fileCacheKey);
  if (cachedFile && cachedFile.expiry > Date.now()) {
    res.setHeader('Content-Type', cachedFile.contentType);
    res.setHeader('Content-Length', cachedFile.buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:");
    res.setHeader('X-Cache', 'HIT');
    res.end(cachedFile.buffer);
    return;
  }

  // Resolve asset (cached)
  const resolved = await resolveAssetCached(slug, token, res);
  if (!resolved) return;
  const { version } = resolved;

  try {
    // Get cached ZIP directory (avoids re-reading central directory)
    const dir = await getZipOpen(version.s3Url);
    const entry = dir.files.find((f: any) => f.path === filePath || f.path.toLowerCase() === filePath.toLowerCase());
    if (!entry) { res.status(404).json({ error: 'File not found in ZIP' }); return; }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:");
    res.setHeader('X-Cache', 'MISS');

    // For small files, buffer into memory cache for instant future responses
    if (entry.uncompressedSize <= FILE_CACHE_MAX_SIZE) {
      const chunks: Buffer[] = [];
      const stream = entry.stream();
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      // Store in cache
      fileBufferCache.set(fileCacheKey, { buffer, contentType, expiry: Date.now() + FILE_CACHE_TTL });
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } else {
      // Large files: stream directly
      const fileStream = entry.stream();
      fileStream.pipe(res);
      fileStream.on('error', (err: Error) => {
        if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
      });
    }

    // Trigger background prefetch for ALL files in this ZIP (fire-and-forget)
    prefetchZipFiles(slug, version.s3Url).catch(() => {});
  } catch (err) {
    console.error('[ZIP STREAM] Error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file from ZIP' });
  }
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

  // SCORM/zip: serve wrapper page with loading state, error catching, and fallback
  if (isZipLike(asset.mediaType, mime)) {
    const entryUrl = (version as any).scormEntryUrl as string | null;
    if (entryUrl === "FAILED") {
      const downloadUrl = `/api/media/${slug}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      res.send(buildNoEntryPage(asset.title, downloadUrl));
    } else if (entryUrl) {
      // Serve a wrapper page that loads the CloudFront content with loading/error UI
      res.send(buildScormEmbedWrapper(asset.title, entryUrl, slug, token));
      return;
    } else {
      // Not yet extracted — use ZIP streaming
      try {
        const entryPath = await findScormEntryPath(version.id, url);
        if (entryPath) {
          res.send(buildZipStreamPage(asset.title, slug, entryPath, token));
          return;
        }
      } catch { /* fall through */ }
      res.send(buildExtractingPage(asset.title, slug, token));
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

// ── ZIP directory cache ──────────────────────────────────────────────────────
// Keyed by versionId. Caches the parsed ZIP directory so we don't re-read the
// central directory on every file request. Entries expire after 30 minutes.
interface ZipDirEntry { path: string; type: string; }
const zipDirCache = new Map<number, { files: ZipDirEntry[]; expiry: number }>();

async function getZipDirectory(versionId: number, zipUrl: string): Promise<ZipDirEntry[]> {
  const cached = zipDirCache.get(versionId);
  if (cached && cached.expiry > Date.now()) return cached.files;
  const source = makeFetchRangeSource(zipUrl);
  const dir = await unzipper.Open.custom(source);
  const files: ZipDirEntry[] = dir.files.map((f: any) => ({ path: f.path, type: f.type }));
  zipDirCache.set(versionId, { files, expiry: Date.now() + 30 * 60 * 1000 });
  return files;
}

/** Find the SCORM entry point from a ZIP directory listing. */
async function findScormEntryPath(versionId: number, zipUrl: string): Promise<string | null> {
  const files = await getZipDirectory(versionId, zipUrl);
  const filePaths = files.filter((f: ZipDirEntry) => f.type === 'File').map((f: ZipDirEntry) => f.path);
  // Try imsmanifest.xml first
  const manifestPath = filePaths.find((p: string) => p.toLowerCase().endsWith('imsmanifest.xml'));
  if (manifestPath) {
    // Read the manifest to find the entry href
    try {
      const source2 = makeFetchRangeSource(zipUrl);
      const dir2 = await unzipper.Open.custom(source2);
      const manifestFile = dir2.files.find((f: any) => f.path === manifestPath);
      if (manifestFile) {
        const chunks: Buffer[] = [];
        const stream = manifestFile.stream();
        for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const manifestText = Buffer.concat(chunks).toString('utf8');
        const hrefMatch =
          manifestText.match(/<resource[^>]+type=["'][^"']*webcontent[^"']*["'][^>]+href=["']([^"']+)["']/i) ??
          manifestText.match(/<resource[^>]+href=["']([^"']+)["'][^>]+type=["'][^"']*webcontent[^"']*["']/i) ??
          manifestText.match(/<resource[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const entryPath = hrefMatch[1].replace(/\\/g, '/');
          // Resolve relative to manifest directory
          const manifestDir = manifestPath.includes('/') ? manifestPath.substring(0, manifestPath.lastIndexOf('/') + 1) : '';
          const fullPath = manifestDir + entryPath;
          const match = filePaths.find((p: string) => p === fullPath || p.toLowerCase() === fullPath.toLowerCase());
          if (match) return match;
          // Also try without manifest dir prefix
          const match2 = filePaths.find((p: string) => p === entryPath || p.toLowerCase() === entryPath.toLowerCase());
          if (match2) return match2;
        }
      }
    } catch { /* fall through to index.html search */ }
  }
  // Fall back to index.html
  const indexHtml = filePaths.find((p: string) => p.toLowerCase().endsWith('/index.html') || p.toLowerCase() === 'index.html');
  if (indexHtml) return indexHtml;
  // Any HTML file (shallowest path)
  const htmlFiles = filePaths.filter((p: string) => p.endsWith('.html') || p.endsWith('.htm'))
    .sort((a: string, b: string) => a.split('/').length - b.split('/').length);
  return htmlFiles[0] ?? null;
}

// ── Background extraction job map ────────────────────────────────────────────
// Keyed by asset ID. Survives across HTTP requests so polling can read progress.
type JobState = {
  state: "running" | "done" | "failed";
  pct: number;
  uploaded: number;
  total: number;
  status: string;
  entryUrl?: string;
};
const extractionJobs = new Map<number, JobState>();

// Build a custom unzipper source that uses HTTP Range requests
// stream() must return synchronously — pipe async fetch into a PassThrough
function makeFetchRangeSource(url: string) {
  return {
    stream: (offset: number, length: number) => {
      const pass = new PassThrough();
      const end = length ? offset + length - 1 : "";
      fetch(url, { headers: { Range: `bytes=${offset}-${end}` } })
        .then(r => {
          if (!r.ok && r.status !== 206) {
            pass.destroy(new Error(`Range request failed: ${r.status}`));
            return;
          }
          // @ts-ignore — r.body is a web ReadableStream; pipe via Node Readable
          Readable.fromWeb(r.body as any).pipe(pass);
        })
        .catch((e: Error) => pass.destroy(e));
      return pass;
    },
    size: () =>
      fetch(url, { method: "HEAD" }).then(r => {
        const cl = r.headers.get("content-length");
        if (!cl) throw new Error("Missing content-length header");
        return parseInt(cl, 10);
      }),
  };
}

/** Helper: write progress to DB (best-effort, never throws). */
async function persistProgress(versionId: number, state: string, pct: number, uploaded: number, total: number, status: string) {
  try {
    const db = await getDb();
    if (db) {
      await db.update(mediaVersions)
        .set({
          extractionState: state,
          extractionProgress: JSON.stringify({ pct, uploaded, total, status }),
        } as any)
        .where(eq(mediaVersions.id, versionId));
    }
  } catch { /* ignore — progress is best-effort */ }
}

/** Run extraction as a background job (not tied to any HTTP request). */
async function runExtractionJob(assetId: number, versionId: number, slug: string, zipUrl: string) {
  const job = extractionJobs.get(assetId)!;
  const keyPrefix = `media-repository/${slug}-scorm`;

  try {
    console.log(`[SCORM JOB] Starting streaming extraction for asset ${assetId} (${slug})`);
    job.status = "Reading zip directory\u2026";
    await persistProgress(versionId, "running", 0, 0, 0, "Reading zip directory\u2026");

    const source = makeFetchRangeSource(zipUrl);
    const directory = await unzipper.Open.custom(source);
    const fileEntries = directory.files.filter((f: any) => !f.type || f.type !== "Directory");
    const total = fileEntries.length;
    job.total = total;
    job.status = `Uploading ${total} files\u2026`;
    job.pct = 2;
    console.log(`[SCORM JOB] Zip has ${total} files for asset ${assetId}`);
    await persistProgress(versionId, "running", 2, 0, total, `Uploading ${total} files\u2026`);

    const uploadedUrls: Record<string, string> = {};
    let uploaded = 0;
    let manifestText: string | null = null;
    let lastPersistedPct = 2;

    // Upload in parallel batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < fileEntries.length; i += BATCH_SIZE) {
      const batch = fileEntries.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (file: any) => {
        const relativePath: string = file.path;
        try {
          const chunks: Buffer[] = [];
          const fileStream = file.stream();
          for await (const chunk of fileStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const fileBuffer = Buffer.concat(chunks);
          const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
          const contentType = MIME_MAP[ext] ?? "application/octet-stream";
          const s3Key = `${keyPrefix}/${relativePath}`;
          const result = await storagePut(s3Key, fileBuffer, contentType);
          try {
            const urlObj = new URL(result.url);
            const encodedPath = urlObj.pathname.split("/").map((seg: string) => encodeURIComponent(decodeURIComponent(seg))).join("/");
            uploadedUrls[relativePath] = urlObj.origin + encodedPath;
          } catch {
            uploadedUrls[relativePath] = result.url;
          }
          const lp = relativePath.toLowerCase();
          if (lp === "imsmanifest.xml" && !manifestText) {
            manifestText = fileBuffer.toString("utf8");
          }
        } catch (uploadErr) {
          console.error(`[SCORM JOB] Failed to process ${relativePath}:`, uploadErr);
        }
        uploaded++;
      }));
      job.uploaded = uploaded;
      job.pct = Math.min(95, Math.round(2 + (uploaded / total) * 93));
      // Persist to DB every ~10% to avoid too many DB writes
      if (job.pct - lastPersistedPct >= 10) {
        lastPersistedPct = job.pct;
        await persistProgress(versionId, "running", job.pct, uploaded, total, job.status);
      }
    }

    // Determine entry URL
    let entryUrl: string | null = null;
    if (manifestText) {
      const hrefMatch =
        (manifestText as string).match(/<resource[^>]+type=["'][^"']*webcontent[^"']*["'][^>]+href=["']([^"']+)["']/i) ??
        (manifestText as string).match(/<resource[^>]+href=["']([^"']+)["'][^>]+type=["'][^"']*webcontent[^"']*["']/i) ??
        (manifestText as string).match(/<resource[^>]+href=["']([^"']+)["']/i);
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
        await db.update(mediaVersions).set({ scormEntryUrl: "FAILED", extractionState: "failed", extractionProgress: JSON.stringify({ pct: 0, uploaded, total, status: "No HTML entry point found" }) } as any).where(eq(mediaVersions.id, versionId));
        job.state = "failed";
        job.status = "No HTML entry point found";
        console.error(`[SCORM JOB] No entry URL found for asset ${assetId}`);
        return;
      }
      await db.update(mediaVersions).set({ scormEntryUrl: entryUrl, extractionState: "done", extractionProgress: JSON.stringify({ pct: 100, uploaded, total, status: "Done" }) } as any).where(eq(mediaVersions.id, versionId));
      await db.update(mediaAssets).set({ mediaType: "scorm" } as any).where(eq(mediaAssets.id, assetId));
    }
    job.state = "done";
    job.pct = 100;
    job.entryUrl = entryUrl ?? undefined;
    console.log(`[SCORM JOB] Extraction complete for asset ${assetId}: ${entryUrl}`);
    // Clean up job after 5 minutes
    setTimeout(() => extractionJobs.delete(assetId), 5 * 60 * 1000);
  } catch (err) {
    console.error("[SCORM JOB] Extraction error:", err);
    job.state = "failed";
    job.status = `Error: ${String(err)}`;
    // Persist FAILED sentinel
    try {
      const db = await getDb();
      if (db) {
        await db.update(mediaVersions).set({ scormEntryUrl: "FAILED", extractionState: "failed", extractionProgress: JSON.stringify({ pct: 0, uploaded: 0, total: 0, status: `Error: ${String(err)}` }) } as any).where(eq(mediaVersions.id, versionId));
      }
    } catch { /* ignore */ }
    setTimeout(() => extractionJobs.delete(assetId), 5 * 60 * 1000);
  }
}

// ── POST /api/media/:slug/extract-start — start background extraction job ─────
// Returns immediately with { state: 'running' | 'done' | 'failed' }.
// Uses DB extractionState to prevent duplicate jobs across Cloud Run instances.
router.post("/api/media/:slug/extract-start", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version } = resolved;

  const v = version as any;
  const existingEntry = v.scormEntryUrl as string | null;
  const dbState = v.extractionState as string | null;

  // If already extracted in DB, return done immediately
  if (existingEntry && existingEntry !== "FAILED") {
    res.json({ state: "done", pct: 100, uploaded: 0, total: 0, status: "Already extracted", entryUrl: existingEntry });
    return;
  }

  // If in-memory job is already running on this instance, return it
  const existing = extractionJobs.get(asset.id);
  if (existing && existing.state === "running") {
    res.json(existing);
    return;
  }
  // If DB says 'running' but no in-memory job on this instance, the previous Cloud Run
  // instance was recycled mid-extraction. Reset DB state and restart the job here.
  if (dbState === "running") {
    const db2 = await getDb();
    if (db2) {
      await db2.update(mediaVersions).set({ extractionState: null, extractionProgress: null } as any).where(eq(mediaVersions.id, version.id));
    }
    // Fall through to start a new job below
  }
    // Clear FAILED state so extraction can retry
  if (existingEntry === "FAILED" || dbState === "failed") {
    const db = await getDb();
    if (db) {
      await db.update(mediaVersions).set({ scormEntryUrl: null, extractionState: null, extractionProgress: null } as any).where(eq(mediaVersions.id, version.id));
      await db.update(mediaAssets).set({ mediaType: "zip" } as any).where(eq(mediaAssets.id, asset.id));
    }
  }

  // Start new background job
  const job: JobState = { state: "running", pct: 0, uploaded: 0, total: 0, status: "Starting\u2026" };
  extractionJobs.set(asset.id, job);
  // Fire-and-forget — does NOT await
  runExtractionJob(asset.id, version.id, asset.slug, version.s3Url).catch(() => {});

  res.json(job);
});

//// ── GET /api/media/:slug/extract-status — poll extraction progress ────────
// Reads from in-memory job map first (same instance), falls back to DB (cross-instance).
router.get("/api/media/:slug/extract-status", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const token = req.query.token as string | undefined;

  const resolved = await resolveAsset(slug, token, res);
  if (!resolved) return;
  const { asset, version } = resolved;
  const v = version as any;

  // Check in-memory job first (same instance)
  const job = extractionJobs.get(asset.id);
  if (job) {
    const resp: any = { state: job.state, pct: job.pct, uploaded: job.uploaded, total: job.total, status: job.status };
    if (job.entryUrl) resp.entryUrl = job.entryUrl;
    res.json(resp);
    return;
  }

  // Fall back to DB state (cross-instance: different Cloud Run instance started the job)
  const entryUrl = v.scormEntryUrl as string | null;
  const dbState = v.extractionState as string | null;
  const prog = v.extractionProgress ? JSON.parse(v.extractionProgress) : {};

  if (entryUrl && entryUrl !== "FAILED") {
    res.json({ state: "done", pct: 100, uploaded: prog.total ?? 0, total: prog.total ?? 0, status: "Extraction complete", entryUrl });
  } else if (entryUrl === "FAILED" || dbState === "failed") {
    res.json({ state: "failed", pct: prog.pct ?? 0, uploaded: prog.uploaded ?? 0, total: prog.total ?? 0, status: prog.status ?? "Extraction failed" });
  } else if (dbState === "running") {
    // DB says running but no in-memory job on this instance.
    // The Cloud Run instance that started the job was recycled.
    // Return 'idle' so the client calls extract-start to restart the job.
    res.json({ state: "idle", pct: prog.pct ?? 0, uploaded: prog.uploaded ?? 0, total: prog.total ?? 0, status: "Restarting extraction\u2026" });
  } else {
    // No job running anywhere — client should call extract-start again
    res.json({ state: "idle", pct: 0, uploaded: 0, total: 0, status: "Waiting for extraction to start\u2026" });
  }
});

export function registerMediaServeRoute(app: import("express").Express) {
  app.use(router);
}

/**
 * Start a background extraction job for a newly uploaded ZIP/SCORM asset.
 * Call this fire-and-forget (no await) from createAsset / addVersion / reExtractScorm.
 * Safe to call even if a job is already running — it will skip if already done/running.
 */
export function startExtractionJobForAsset(
  assetId: number,
  versionId: number,
  slug: string,
  s3Url: string
): void {
  // Skip if already running on this instance
  const existing = extractionJobs.get(assetId);
  if (existing && existing.state === "running") return;
  // Check DB state first — skip if already extracted or currently running on another instance
  // This is async but fire-and-forget is fine here
  (async () => {
    try {
      const db = await getDb();
      if (db) {
        const [v] = await db.select().from(mediaVersions).where(eq(mediaVersions.id, versionId));
        if (v) {
          const existingEntry = (v as any).scormEntryUrl as string | null;
          const dbState = (v as any).extractionState as string | null;
          // Already extracted successfully — nothing to do
          if (existingEntry && existingEntry !== "FAILED") {
            console.log(`[SCORM JOB] Asset ${assetId} already extracted, skipping.`);
            return;
          }
          // Another instance is already running — skip
          if (dbState === "running") {
            console.log(`[SCORM JOB] Asset ${assetId} extraction already running on another instance, skipping.`);
            return;
          }
        }
      }
    } catch (e) {
      console.error("[SCORM JOB] DB check failed, proceeding with extraction:", e);
    }
    // Set up job state and fire
    const job: JobState = { state: "running", pct: 0, uploaded: 0, total: 0, status: "Starting\u2026" };
    extractionJobs.set(assetId, job);
    runExtractionJob(assetId, versionId, slug, s3Url).catch((err) => {
      console.error("[SCORM JOB] Unhandled error in startExtractionJobForAsset:", err);
    });
  })();
}
