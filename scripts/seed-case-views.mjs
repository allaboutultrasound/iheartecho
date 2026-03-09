/**
 * seed-case-views.mjs
 *
 * One-time script: seeds the `viewCount` column on approved echo library cases
 * that currently have 0 views, using the same deterministic LCG formula as the
 * client-side `caseViewCount.ts` utility.
 *
 * This ensures the member-facing display count (seeded baseline + actual DB count)
 * looks naturally populated from day one, matching what members would see.
 *
 * Safe to re-run: only updates rows where viewCount = 0.
 *
 * Usage: node scripts/seed-case-views.mjs
 */

import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// ── LCG seeded random (mirrors client-side caseViewCount.ts) ─────────────────
function seededRandom(seed) {
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  return ((a * seed + c) >>> 0) / m;
}

function getSeededViewCount(caseId, publishedAt) {
  const r = seededRandom(caseId * 31 + 7);

  let ageFactor = 1.0;
  if (publishedAt) {
    const published = publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
    const ageMs = Date.now() - published.getTime();
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30);
    ageFactor = Math.min(2.0, 1.0 + ageMonths / 12);
  }

  const base = Math.floor(150 + r * 1050);
  return Math.round((base * ageFactor) / 10) * 10;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const db = await createConnection(process.env.DATABASE_URL);

  try {
    // Fetch all approved cases with 0 views
    const [rows] = await db.execute(
      "SELECT id, title, submittedAt FROM echoLibraryCases WHERE status = 'approved' AND viewCount = 0"
    );

    if (rows.length === 0) {
      console.log("✅ No approved cases with 0 views found — nothing to seed.");
      return;
    }

    console.log(`Found ${rows.length} approved case(s) with 0 views. Computing seeds...\n`);

    let updated = 0;
    for (const row of rows) {
      const seeded = getSeededViewCount(row.id, row.submittedAt);
      await db.execute(
        "UPDATE echoLibraryCases SET viewCount = ? WHERE id = ? AND viewCount = 0",
        [seeded, row.id]
      );
      console.log(`  Case #${row.id} "${row.title.slice(0, 50)}" → ${seeded} views`);
      updated++;
    }

    console.log(`\n✅ Done — seeded ${updated} case(s) with deterministic view counts.`);
    console.log("   Members will now see these as the baseline (seeded + actual).");
    console.log("   Admin panel shows only the true actual count (same seeded value until real views accumulate).");
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
