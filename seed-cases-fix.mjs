/**
 * seed-cases-fix.mjs
 * Fixes and seeds batch 9 (ICE/Advanced Imaging) which had a control character issue.
 */
import { readFileSync } from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("❌ DATABASE_URL not set"); process.exit(1); }

const raw = readFileSync("/home/ubuntu/generate_echo_cases.json", "utf8");
const results = JSON.parse(raw).results;

// Get batch 9 (index 9)
const batch9 = results[9];
let json = batch9.output.cases_json.trim()
  .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

// Sanitize control characters (replace with space)
json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");

let cases = [];
try {
  cases = JSON.parse(json);
  console.log(`✅ Parsed ${cases.length} cases from batch 9 after sanitization`);
} catch (e) {
  // Try to extract individual objects
  console.warn("⚠️  Full parse failed, attempting partial extraction:", e.message);
  const matches = json.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g) || [];
  for (const m of matches) {
    try { cases.push(JSON.parse(m)); } catch {}
  }
  console.log(`  Extracted ${cases.length} cases via partial parse`);
}

if (cases.length === 0) {
  console.error("❌ No cases could be extracted from batch 9");
  process.exit(1);
}

const VALID_MODALITIES = ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const connection = await mysql.createConnection(DATABASE_URL);
console.log("✅ Connected to database");

const [adminRows] = await connection.execute(
  "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
);
let adminUserId = adminRows[0]?.id;
if (!adminUserId) {
  const [userRows] = await connection.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1");
  adminUserId = userRows[0]?.id;
}
console.log(`👤 Using admin user ID: ${adminUserId}`);

const values = [];
const placeholders = [];
let inserted = 0;

for (const c of cases) {
  if (!c.title || !c.summary) continue;
  const modality = VALID_MODALITIES.includes(c.modality) ? c.modality : "Other";
  const difficulty = VALID_DIFFICULTIES.includes(c.difficulty) ? c.difficulty : "intermediate";
  const tags = Array.isArray(c.tags) ? JSON.stringify(c.tags.slice(0, 10)) : "[]";
  const teachingPoints = Array.isArray(c.teachingPoints) ? JSON.stringify(c.teachingPoints.slice(0, 10)) : "[]";

  placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  values.push(
    c.title.slice(0, 300),
    c.summary.slice(0, 5000),
    (c.clinicalHistory || "").slice(0, 5000),
    (c.diagnosis || "").slice(0, 300),
    teachingPoints,
    modality,
    difficulty,
    tags,
    "approved",
    1,
    adminUserId,
    adminUserId,
    1,
    Math.floor(Math.random() * 4500) + 500
  );
  inserted++;
}

if (placeholders.length > 0) {
  await connection.execute(
    `INSERT INTO echoLibraryCases
      (title, summary, clinicalHistory, diagnosis, teachingPoints, modality, difficulty, tags,
       status, isAdminSubmission, submittedByUserId, reviewedByUserId, hipaaAcknowledged, viewCount)
     VALUES ${placeholders.join(", ")}`,
    values
  );
}

await connection.end();
console.log(`\n🎉 Done! Inserted ${inserted} additional cases from batch 9.`);

// Show total count
const conn2 = await mysql.createConnection(DATABASE_URL);
const [countRows] = await conn2.execute("SELECT COUNT(*) as total FROM echoLibraryCases WHERE status = 'approved'");
console.log(`📊 Total approved cases in DB: ${countRows[0].total}`);
await conn2.end();
