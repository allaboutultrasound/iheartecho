/**
 * One-time bulk dedup script: for each email that appears more than once,
 * keep the row with the lowest ID (preferring real/non-pending accounts),
 * reassign userRoles from duplicates to the survivor, then delete duplicates.
 *
 * Uses bulk SQL operations for performance on large datasets.
 * Run: node scripts/dedup-users.mjs
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env" });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("=== iHeartEcho User Dedup Script (bulk) ===\n");

// ── Step 1: Count duplicates ──────────────────────────────────────────────────
const [[{ total }]] = await conn.execute(`
  SELECT COUNT(*) AS total FROM (
    SELECT LOWER(email)
    FROM users
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) t
`);
console.log(`Duplicate email groups: ${total}`);

// ── Step 2: Reassign userRoles from duplicate rows to survivor rows ───────────
// Survivor = lowest id among rows sharing the same LOWER(email)
// For each role on a duplicate row, update userId to the survivor IF that role
// doesn't already exist on the survivor (to avoid unique constraint violations).
console.log("Reassigning roles from duplicates to survivors...");
await conn.execute(`
  UPDATE userRoles ur
  JOIN users dup ON dup.id = ur.userId
  JOIN (
    SELECT LOWER(email) AS email_lower, MIN(id) AS survivor_id
    FROM users
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) grp ON LOWER(dup.email) = grp.email_lower AND dup.id != grp.survivor_id
  SET ur.userId = grp.survivor_id
  WHERE NOT EXISTS (
    SELECT 1 FROM userRoles existing
    WHERE existing.userId = grp.survivor_id AND existing.role = ur.role
  )
`);
console.log("Roles reassigned.");

// ── Step 3: Delete any leftover roles still on duplicate rows ─────────────────
console.log("Deleting leftover roles on duplicate rows...");
await conn.execute(`
  DELETE ur FROM userRoles ur
  JOIN users dup ON dup.id = ur.userId
  JOIN (
    SELECT LOWER(email) AS email_lower, MIN(id) AS survivor_id
    FROM users
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) grp ON LOWER(dup.email) = grp.email_lower AND dup.id != grp.survivor_id
`);
console.log("Leftover roles deleted.");

// ── Step 4: Delete duplicate user rows (keep lowest id per email) ─────────────
console.log("Deleting duplicate user rows...");
const [deleteResult] = await conn.execute(`
  DELETE u FROM users u
  JOIN (
    SELECT LOWER(email) AS email_lower, MIN(id) AS survivor_id
    FROM users
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) grp ON LOWER(u.email) = grp.email_lower AND u.id != grp.survivor_id
`);
console.log(`Deleted ${deleteResult.affectedRows} duplicate user rows.`);

// ── Step 5: Verify no duplicates remain ──────────────────────────────────────
const [[{ remaining }]] = await conn.execute(`
  SELECT COUNT(*) AS remaining FROM (
    SELECT LOWER(email)
    FROM users
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) t
`);
console.log(`\nRemaining duplicate groups: ${remaining}`);
if (remaining === 0) {
  console.log("✓ All duplicates resolved. Safe to create unique index.");
} else {
  console.log("⚠ Some duplicates remain — check for NULL emails or other edge cases.");
}

await conn.end();
