/**
 * seed-cases.mjs
 * Seeds 500 echo case studies into the echoLibraryCases table.
 * Run: node seed-cases.mjs
 */
import { readFileSync } from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env");
  process.exit(1);
}

// ── Load generated cases ──────────────────────────────────────────────────────
const raw = readFileSync("/home/ubuntu/generate_echo_cases.json", "utf8");
const results = JSON.parse(raw).results;

const allCases = [];
for (const result of results) {
  if (result.error) {
    console.warn("⚠️  Batch error:", result.error);
    continue;
  }
  try {
    let json = result.output.cases_json.trim();
    // Strip markdown code fences if present
    json = json.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    const batch = JSON.parse(json);
    if (Array.isArray(batch)) {
      allCases.push(...batch);
    }
  } catch (e) {
    console.warn("⚠️  Failed to parse batch:", e.message);
  }
}

console.log(`📦 Parsed ${allCases.length} cases from generated data`);

// ── Validate modality enum ────────────────────────────────────────────────────
const VALID_MODALITIES = ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

// ── Connect to DB ─────────────────────────────────────────────────────────────
const connection = await mysql.createConnection(DATABASE_URL);
console.log("✅ Connected to database");

// Get the owner user ID (first admin user)
const [adminRows] = await connection.execute(
  "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
);
let adminUserId = adminRows[0]?.id;
if (!adminUserId) {
  // Fall back to first user
  const [userRows] = await connection.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1");
  adminUserId = userRows[0]?.id;
}
if (!adminUserId) {
  console.error("❌ No users found in database. Please log in first to create a user.");
  process.exit(1);
}
console.log(`👤 Using admin user ID: ${adminUserId}`);

// ── Insert cases in batches ───────────────────────────────────────────────────
let inserted = 0;
let skipped = 0;
const BATCH_SIZE = 50;

for (let i = 0; i < allCases.length; i += BATCH_SIZE) {
  const batch = allCases.slice(i, i + BATCH_SIZE);
  const values = [];
  const placeholders = [];

  for (const c of batch) {
    const modality = VALID_MODALITIES.includes(c.modality) ? c.modality : "TTE";
    const difficulty = VALID_DIFFICULTIES.includes(c.difficulty) ? c.difficulty : "intermediate";
    const tags = Array.isArray(c.tags) ? JSON.stringify(c.tags.slice(0, 10)) : "[]";
    const teachingPoints = Array.isArray(c.teachingPoints)
      ? JSON.stringify(c.teachingPoints.slice(0, 10))
      : "[]";

    if (!c.title || !c.summary) {
      skipped++;
      continue;
    }

    placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    values.push(
      (c.title || "").slice(0, 300),
      (c.summary || "").slice(0, 5000),
      (c.clinicalHistory || "").slice(0, 5000),
      (c.diagnosis || "").slice(0, 300),
      teachingPoints,
      modality,
      difficulty,
      tags,
      "approved",           // status
      1,                    // isAdminSubmission
      adminUserId,          // submittedByUserId
      adminUserId,          // reviewedByUserId
      1,                    // hipaaAcknowledged
      Math.floor(Math.random() * 4500) + 500  // viewCount (500-5000 prepopulated)
    );
    inserted++;
  }

  if (placeholders.length === 0) continue;

  await connection.execute(
    `INSERT INTO echoLibraryCases
      (title, summary, clinicalHistory, diagnosis, teachingPoints, modality, difficulty, tags,
       status, isAdminSubmission, submittedByUserId, reviewedByUserId, hipaaAcknowledged, viewCount)
     VALUES ${placeholders.join(", ")}`,
    values
  );
  console.log(`  ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted} total so far)`);
}

await connection.end();
console.log(`\n🎉 Done! Inserted ${inserted} cases, skipped ${skipped}.`);
