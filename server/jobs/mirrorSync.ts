/**
 * mirrorSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily mirror sync: Manus TiDB → Railway MySQL  +  Forge CDN → Cloudflare R2
 *
 * Runs once per day at 2:00 AM UTC (configurable via MIRROR_SYNC_HOUR_UTC).
 * Only runs when RAILWAY_DATABASE_URL is set (i.e., on Railway deployment).
 * On Manus hosting, this job is a no-op.
 */

import mysql from "mysql2/promise";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// ── Config ────────────────────────────────────────────────────────────────────
const SOURCE_URL = process.env.DATABASE_URL!;
const DEST_URL = process.env.RAILWAY_DATABASE_URL;
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  "https://926e046281eccc776864fd105e322ac8.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "2bf12c3da86ab3bf2a54394aaf1b7303";
const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  "2ad2dea927e74526d62268d5bf3d519b004be0c4242236d75807023dc18c1538";
const R2_BUCKET = process.env.R2_BUCKET_NAME || "echoassist-media";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || "https://pub-f44b4ce505c44f6ab487108e0748a930.r2.dev";
const FORGE_CDN_BASE = "https://d2xsxph8kpxj0f.cloudfront.net";

// Tables to skip during DB sync (ephemeral/log tables)
const SKIP_TABLES = new Set([
  "__drizzle_migrations",
  "webhookEvents",
  "qaLogs",
  "mediaAccessLogs",
  "abTestEvents",
  "caseViewEvents",
]);

// Media table definitions: which columns hold Forge CDN URLs
const MEDIA_TABLES = [
  { table: "mediaVersions", cols: ["s3Url", "scormEntryUrl"], idCol: "id" },
  { table: "scanCoachMedia", cols: ["url"], idCol: "id" },
  { table: "echoLibraryCaseMedia", cols: ["url"], idCol: "id" },
  { table: "soundBytes", cols: ["videoUrl", "thumbnailUrl"], idCol: "id" },
  { table: "educatorPresentations", cols: ["coverImageUrl"], idCol: "id" },
];

// ── R2 client ─────────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[MirrorSync ${new Date().toISOString()}] ${msg}`);
}

function r2KeyFromForgeUrl(forgeUrl: string): string | null {
  try {
    const url = new URL(forgeUrl);
    const parts = url.pathname.replace(/^\//, "").split("/");
    const relPath = parts.slice(2).join("/");
    return `media/${relPath}`;
  } catch {
    return null;
  }
}

async function r2Exists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (e: any) {
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

function guessContentType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    wmv: "video/x-ms-wmv",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    zip: "application/zip",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    json: "application/json",
  };
  return map[ext || ""] || "application/octet-stream";
}

// ── DB Sync ───────────────────────────────────────────────────────────────────
async function syncDatabase() {
  if (!DEST_URL) {
    log("RAILWAY_DATABASE_URL not set — skipping DB sync (Manus hosting)");
    return;
  }
  log("=== DATABASE SYNC START ===");
  const src = await mysql.createConnection(SOURCE_URL);
  const dst = await mysql.createConnection(DEST_URL);

  try {
    const [tableRows] = await src.query("SHOW TABLES") as any[];
    const allTables: string[] = tableRows.map((r: any) => Object.values(r)[0] as string);
    const tables = allTables.filter((t) => !SKIP_TABLES.has(t));
    log(`Found ${allTables.length} tables, syncing ${tables.length}`);

    await dst.query("SET FOREIGN_KEY_CHECKS = 0");
    await dst.query("SET UNIQUE_CHECKS = 0");

    for (const table of tables) {
      try {
        const [[ddlRow]] = await src.query(`SHOW CREATE TABLE \`${table}\``) as any[];
        let ddl: string = Object.values(ddlRow)[1] as string;

        // Clean up TiDB-specific syntax for MySQL compatibility
        ddl = ddl
          .replace(/\/\*T!\[clustered_index\][^*]*\*\//g, "")
          .replace(/\/\*T![^*]*\*\//g, "")
          .replace(/AUTO_RANDOM\(\d+\)/gi, "AUTO_INCREMENT")
          .replace(/AUTO_RANDOM/gi, "AUTO_INCREMENT")
          .replace(/SHARD_ROW_ID_BITS=\d+/gi, "")
          .replace(/PRE_SPLIT_REGIONS=\d+/gi, "")
          .replace(/,\s*\)/g, "\n)")
          .trim();

        await dst.query(`DROP TABLE IF EXISTS \`${table}\``);
        await dst.query(ddl);

        const [[countRow]] = await src.query(`SELECT COUNT(*) as cnt FROM \`${table}\``) as any[];
        const rowCount = (countRow as any).cnt;

        if (rowCount === 0) {
          log(`  ✓ ${table}: schema only`);
          continue;
        }

        const [cols] = await src.query(`SHOW COLUMNS FROM \`${table}\``) as any[];
        const colNames: string[] = (cols as any[]).map((c: any) => c.Field);
        const colList = colNames.map((c) => `\`${c}\``).join(", ");

        const BATCH = 500;
        let offset = 0;
        let totalInserted = 0;

        while (offset < rowCount) {
          const [rows] = await src.query(
            `SELECT ${colList} FROM \`${table}\` LIMIT ${BATCH} OFFSET ${offset}`
          ) as any[];
          if ((rows as any[]).length === 0) break;

          const placeholders = (rows as any[])
            .map(() => `(${colNames.map(() => "?").join(", ")})`)
            .join(", ");
          const values = (rows as any[]).flatMap((r: any) => colNames.map((c) => r[c] ?? null));
          await dst.query(
            `INSERT INTO \`${table}\` (${colList}) VALUES ${placeholders}`,
            values
          );

          totalInserted += (rows as any[]).length;
          offset += BATCH;
        }

        log(`  ✓ ${table}: ${totalInserted} rows`);
      } catch (err: any) {
        log(`  ✗ ${table}: ${err.message}`);
      }
    }

    await dst.query("SET FOREIGN_KEY_CHECKS = 1");
    await dst.query("SET UNIQUE_CHECKS = 1");
    log("=== DATABASE SYNC COMPLETE ===");
  } finally {
    await src.end();
    await dst.end();
  }
}

// ── Media Sync ────────────────────────────────────────────────────────────────
async function syncMedia() {
  if (!DEST_URL) {
    log("RAILWAY_DATABASE_URL not set — skipping media sync (Manus hosting)");
    return;
  }
  log("=== MEDIA SYNC START ===");
  const src = await mysql.createConnection(SOURCE_URL);
  const dst = await mysql.createConnection(DEST_URL);

  try {
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;
    let total = 0;

    for (const { table, cols, idCol } of MEDIA_TABLES) {
      log(`  Scanning ${table}...`);
      try {
        const [rows] = await src.query(
          `SELECT ${idCol}, ${cols.join(", ")} FROM \`${table}\``
        ) as any[];

        for (const row of rows as any[]) {
          for (const col of cols) {
            const url = row[col];
            if (!url || !url.startsWith(FORGE_CDN_BASE)) continue;

            total++;
            const r2Key = r2KeyFromForgeUrl(url);
            if (!r2Key) continue;

            const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;
            const exists = await r2Exists(r2Key);

            if (exists) {
              skipped++;
              await dst.query(
                `UPDATE \`${table}\` SET \`${col}\` = ? WHERE \`${idCol}\` = ?`,
                [r2Url, row[idCol]]
              );
              continue;
            }

            try {
              const resp = await fetch(url);
              if (!resp.ok) { errors++; continue; }
              const buffer = Buffer.from(await resp.arrayBuffer());
              await r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: r2Key,
                Body: buffer,
                ContentType: guessContentType(url),
              }));
              await dst.query(
                `UPDATE \`${table}\` SET \`${col}\` = ? WHERE \`${idCol}\` = ?`,
                [r2Url, row[idCol]]
              );
              log(`    ✓ ${r2Key} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
              uploaded++;
            } catch (err: any) {
              log(`    ✗ ${r2Key}: ${err.message}`);
              errors++;
            }
          }
        }
      } catch (err: any) {
        log(`  ✗ ${table}: ${err.message}`);
      }
    }

    log(`=== MEDIA SYNC COMPLETE: ${uploaded} uploaded, ${skipped} already in R2, ${errors} errors (${total} total) ===`);
  } finally {
    await src.end();
    await dst.end();
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
let syncRunning = false;

async function runMirrorSync() {
  if (syncRunning) {
    log("Sync already running — skipping");
    return;
  }
  syncRunning = true;
  try {
    await syncDatabase();
    await syncMedia();
  } catch (err: any) {
    log(`FATAL: ${err.message}`);
  } finally {
    syncRunning = false;
  }
}

export function startMirrorSyncJob() {
  // Only run on Railway (when RAILWAY_DATABASE_URL is set)
  if (!DEST_URL) {
    console.log("[MirrorSync] RAILWAY_DATABASE_URL not set — mirror sync disabled (Manus hosting)");
    return;
  }

  const SYNC_HOUR_UTC = parseInt(process.env.MIRROR_SYNC_HOUR_UTC || "2", 10);
  console.log(`[MirrorSync] Scheduled daily at ${SYNC_HOUR_UTC}:00 UTC`);

  // Check every 5 minutes if it's time to run
  setInterval(() => {
    const now = new Date();
    if (now.getUTCHours() === SYNC_HOUR_UTC && now.getUTCMinutes() < 5) {
      runMirrorSync().catch(console.error);
    }
  }, 5 * 60 * 1000);

  // Also run immediately on startup if MIRROR_SYNC_ON_START=true
  if (process.env.MIRROR_SYNC_ON_START === "true") {
    log("Running initial sync on startup...");
    runMirrorSync().catch(console.error);
  }
}

// Export for manual trigger via tRPC admin procedure
export { runMirrorSync };
