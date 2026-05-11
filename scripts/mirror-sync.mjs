/**
 * mirror-sync.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Full mirror sync: Manus TiDB → Railway MySQL  +  Forge CDN → Cloudflare R2
 *
 * Usage:
 *   node scripts/mirror-sync.mjs [--db-only] [--media-only] [--dry-run]
 *
 * Required env vars (set in Railway Variables):
 *   SOURCE_DATABASE_URL   — Manus TiDB connection string
 *   RAILWAY_DATABASE_URL  — Railway MySQL connection string
 *   R2_ENDPOINT           — https://ACCOUNT_ID.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME
 *   R2_PUBLIC_URL         — https://pub-xxx.r2.dev
 */

import mysql from "mysql2/promise";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// ── Config ────────────────────────────────────────────────────────────────────
const SOURCE_URL =
  process.env.SOURCE_DATABASE_URL ||
  "mysql://2mhhtxpXA9Esras.root:HJkw07mdx3Eeg9V5P9cK@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/etVPnUidWNWG8W4GHnRqzv?ssl={\"rejectUnauthorized\":true}";
const DEST_URL =
  process.env.RAILWAY_DATABASE_URL ||
  "mysql://root:YHWJuGocKDAZXvGDmmEgPHRBcBNjlMOw@viaduct.proxy.rlwy.net:57983/railway";

const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  "https://926e046281eccc776864fd105e322ac8.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "2bf12c3da86ab3bf2a54394aaf1b7303";
const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY || "2ad2dea927e74526d62268d5bf3d519b004be0c4242236d75807023dc18c1538";
const R2_BUCKET = process.env.R2_BUCKET_NAME || "echoassist-media";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || "https://pub-f44b4ce505c44f6ab487108e0748a930.r2.dev";

const FORGE_CDN_BASE = "https://d2xsxph8kpxj0f.cloudfront.net";

const DRY_RUN = process.argv.includes("--dry-run");
const DB_ONLY = process.argv.includes("--db-only");
const MEDIA_ONLY = process.argv.includes("--media-only");

// Tables to skip (migration metadata, ephemeral logs)
const SKIP_TABLES = new Set([
  "__drizzle_migrations",
  "webhookEvents",
  "qaLogs",
  "mediaAccessLogs",
  "abTestEvents",
  "caseViewEvents",
]);

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
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function r2KeyFromForgeUrl(forgeUrl) {
  // Strip the CDN base prefix to get a relative key
  // e.g. https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/foo/bar.mp4
  //   → media/foo/bar.mp4
  try {
    const url = new URL(forgeUrl);
    // Remove leading slash and the two path segments (account/appId)
    const parts = url.pathname.replace(/^\//, "").split("/");
    // parts[0] = accountId, parts[1] = appId, rest = actual path
    const relPath = parts.slice(2).join("/");
    return `media/${relPath}`;
  } catch {
    return null;
  }
}

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (e) {
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

async function uploadToR2(key, buffer, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

function guessContentType(url) {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const map = {
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
  return map[ext] || "application/octet-stream";
}

// ── DB Sync ───────────────────────────────────────────────────────────────────
async function syncDatabase() {
  log("=== DATABASE SYNC START ===");
  const src = await mysql.createConnection(SOURCE_URL);
  const dst = await mysql.createConnection(DEST_URL);

  try {
    // Get all source tables
    const [tableRows] = await src.query("SHOW TABLES");
    const allTables = tableRows.map((r) => Object.values(r)[0]);
    const tables = allTables.filter((t) => !SKIP_TABLES.has(t));
    log(`Found ${allTables.length} tables, syncing ${tables.length} (skipping ${SKIP_TABLES.size})`);

    // Disable FK checks on destination
    await dst.query("SET FOREIGN_KEY_CHECKS = 0");
    await dst.query("SET UNIQUE_CHECKS = 0");

    for (const table of tables) {
      try {
        // Get source DDL
        const [[ddlRow]] = await src.query(`SHOW CREATE TABLE \`${table}\``);
        let ddl = Object.values(ddlRow)[1];

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

        if (!DRY_RUN) {
          // Drop and recreate table
          await dst.query(`DROP TABLE IF EXISTS \`${table}\``);
          await dst.query(ddl);
        }

        // Get row count
        const [[countRow]] = await src.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
        const rowCount = countRow.cnt;

        if (rowCount === 0) {
          log(`  ✓ ${table}: schema only (0 rows)`);
          continue;
        }

        // Get columns
        const [cols] = await src.query(`SHOW COLUMNS FROM \`${table}\``);
        const colNames = cols.map((c) => c.Field);
        const colList = colNames.map((c) => `\`${c}\``).join(", ");

        // Batch insert
        const BATCH = 500;
        let offset = 0;
        let totalInserted = 0;

        while (offset < rowCount) {
          const [rows] = await src.query(
            `SELECT ${colList} FROM \`${table}\` LIMIT ${BATCH} OFFSET ${offset}`
          );
          if (rows.length === 0) break;

          if (!DRY_RUN) {
            const placeholders = rows
              .map(() => `(${colNames.map(() => "?").join(", ")})`)
              .join(", ");
            const values = rows.flatMap((r) => colNames.map((c) => r[c] ?? null));
            await dst.query(
              `INSERT INTO \`${table}\` (${colList}) VALUES ${placeholders}`,
              values
            );
          }

          totalInserted += rows.length;
          offset += BATCH;
        }

        log(`  ✓ ${table}: ${totalInserted} rows synced`);
      } catch (err) {
        log(`  ✗ ${table}: ERROR — ${err.message}`);
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
  log("=== MEDIA SYNC START ===");
  const src = await mysql.createConnection(SOURCE_URL);
  const dst = await mysql.createConnection(DEST_URL);

  try {
    // Collect all Forge CDN URLs from media-related tables
    const mediaQueries = [
      // mediaVersions: s3Url (ZIP files) + scormEntryUrl
      { table: "mediaVersions", cols: ["s3Url", "scormEntryUrl"], idCol: "id" },
      // scanCoachMedia: url (video/image)
      { table: "scanCoachMedia", cols: ["url"], idCol: "id" },
      // echoLibraryCaseMedia: url
      { table: "echoLibraryCaseMedia", cols: ["url"], idCol: "id" },
      // soundBytes: videoUrl, thumbnailUrl
      { table: "soundBytes", cols: ["videoUrl", "thumbnailUrl"], idCol: "id" },
      // educatorPresentations: coverImageUrl
      { table: "educatorPresentations", cols: ["coverImageUrl"], idCol: "id" },
    ];

    let totalFiles = 0;
    let skipped = 0;
    let uploaded = 0;
    let errors = 0;

    for (const { table, cols, idCol } of mediaQueries) {
      log(`  Scanning ${table}...`);
      try {
        const [rows] = await src.query(`SELECT ${idCol}, ${cols.join(", ")} FROM \`${table}\``);

        for (const row of rows) {
          for (const col of cols) {
            const url = row[col];
            if (!url || !url.startsWith(FORGE_CDN_BASE)) continue;

            totalFiles++;
            const r2Key = r2KeyFromForgeUrl(url);
            if (!r2Key) {
              log(`    ⚠ ${table}[${row[idCol]}].${col}: could not parse URL`);
              continue;
            }

            const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

            // Check if already in R2
            const exists = await r2Exists(r2Key);
            if (exists) {
              skipped++;
              // Update DB to point to R2 URL if not already
              if (!DRY_RUN) {
                await dst.query(
                  `UPDATE \`${table}\` SET \`${col}\` = ? WHERE \`${idCol}\` = ?`,
                  [r2Url, row[idCol]]
                );
              }
              continue;
            }

            // Download from Forge CDN
            log(`    ↓ Downloading ${r2Key}...`);
            try {
              const resp = await fetch(url);
              if (!resp.ok) {
                log(`    ✗ Download failed (${resp.status}): ${url}`);
                errors++;
                continue;
              }
              const buffer = Buffer.from(await resp.arrayBuffer());
              const contentType = guessContentType(url);

              if (!DRY_RUN) {
                await uploadToR2(r2Key, buffer, contentType);
                // Update DB URL to R2
                await dst.query(
                  `UPDATE \`${table}\` SET \`${col}\` = ? WHERE \`${idCol}\` = ?`,
                  [r2Url, row[idCol]]
                );
              }

              log(`    ✓ ${r2Key} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
              uploaded++;
            } catch (err) {
              log(`    ✗ ${r2Key}: ${err.message}`);
              errors++;
            }
          }
        }
      } catch (err) {
        log(`  ✗ ${table}: ERROR — ${err.message}`);
      }
    }

    log(`=== MEDIA SYNC COMPLETE: ${uploaded} uploaded, ${skipped} already in R2, ${errors} errors (${totalFiles} total) ===`);
  } finally {
    await src.end();
    await dst.end();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`Mirror sync starting (dry-run=${DRY_RUN}, db-only=${DB_ONLY}, media-only=${MEDIA_ONLY})`);

  if (!MEDIA_ONLY) await syncDatabase();
  if (!DB_ONLY) await syncMedia();

  log("All done.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
