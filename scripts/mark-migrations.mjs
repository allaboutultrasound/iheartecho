// Mark unapplied migrations as applied in __drizzle_migrations
// Use this when tables already exist in DB but migration tracking is out of sync
import mysql from 'mysql2/promise';
import fs from 'fs';
import crypto from 'crypto';
import { config } from 'dotenv';

config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get existing hashes
const [rows] = await conn.query('SELECT hash FROM __drizzle_migrations');
const appliedHashes = new Set(rows.map(r => r.hash));

// Check migrations 0015 through 0019 - mark as applied WITHOUT running SQL
// (tables already exist in DB from previous direct pushes)
const migrationsToMark = [
  '0015_wooden_scarecrow.sql',
  '0016_great_vulture.sql',
  '0017_messy_rocket_raccoon.sql',
  '0018_woozy_songbird.sql',
];

for (const file of migrationsToMark) {
  const content = fs.readFileSync(`drizzle/${file}`, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  if (appliedHashes.has(hash)) {
    console.log(`SKIP (already applied): ${file}`);
    continue;
  }
  const now = Date.now();
  await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [hash, now]);
  console.log(`MARKED as applied: ${file} (hash: ${hash.substring(0, 12)})`);
}

// Now run 0019 (the new cmeEntries + labMembers role change migration) for real
console.log('\nNow running 0019_thick_purifiers.sql...');
const sql0019 = fs.readFileSync('drizzle/0019_thick_purifiers.sql', 'utf8');
const statements = sql0019.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {
  try {
    await conn.query(stmt);
    console.log('  OK:', stmt.substring(0, 60).replace(/\n/g, ' '));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY' || e.message.includes('already exists') || e.message.includes('Duplicate')) {
      console.log('  SKIP (already exists):', stmt.substring(0, 60).replace(/\n/g, ' '));
    } else {
      console.error('  ERROR:', e.message, '\n  SQL:', stmt.substring(0, 100));
    }
  }
}

// Mark 0019 as applied
const content0019 = fs.readFileSync('drizzle/0019_thick_purifiers.sql', 'utf8');
const hash0019 = crypto.createHash('sha256').update(content0019).digest('hex');
if (!appliedHashes.has(hash0019)) {
  await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [hash0019, Date.now()]);
  console.log(`MARKED as applied: 0019_thick_purifiers.sql`);
}

await conn.end();
console.log('\nDone!');
