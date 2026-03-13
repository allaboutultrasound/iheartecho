import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Step 1: Apply only the truly new columns (skip already-existing ones)
  const newColumns = [
    // From 0073: challengeCategoryPrefs
    { sql: "ALTER TABLE `users` ADD `challengeCategoryPrefs` text", desc: "users.challengeCategoryPrefs" },
    // From 0074: interestPrefs, emailTemplates, emailCampaigns
    { sql: "ALTER TABLE `users` ADD `interestPrefs` text", desc: "users.interestPrefs" },
    { sql: `CREATE TABLE IF NOT EXISTS \`emailTemplates\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`createdByUserId\` int NOT NULL,
      \`name\` varchar(200) NOT NULL,
      \`subject\` varchar(500) NOT NULL,
      \`htmlBody\` longtext NOT NULL,
      \`previewText\` varchar(300),
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`emailTemplates_id\` PRIMARY KEY(\`id\`)
    )`, desc: "emailTemplates table" },
    { sql: `CREATE TABLE IF NOT EXISTS \`emailCampaigns\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`sentByUserId\` int NOT NULL,
      \`subject\` varchar(500) NOT NULL,
      \`htmlBody\` longtext NOT NULL,
      \`previewText\` varchar(300),
      \`audienceFilter\` text NOT NULL,
      \`recipientCount\` int NOT NULL DEFAULT 0,
      \`status\` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
      \`sentAt\` timestamp,
      \`errorMessage\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`emailCampaigns_id\` PRIMARY KEY(\`id\`)
    )`, desc: "emailCampaigns table" },
  ];

  for (const { sql, desc } of newColumns) {
    try {
      await conn.query(sql);
      console.log(`✓ Applied: ${desc}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`⏭ Already exists (skipped): ${desc}`);
      } else {
        throw err;
      }
    }
  }

  // Step 2: Mark all pending migrations (70-74) as applied in __drizzle_migrations
  const journal = JSON.parse(fs.readFileSync('drizzle/meta/_journal.json', 'utf8'));
  const [existing] = await conn.query('SELECT hash FROM __drizzle_migrations');
  const appliedHashes = new Set(existing.map(r => r.hash));

  for (const entry of journal.entries) {
    if (entry.idx < 70) continue;
    const sqlFile = `drizzle/${entry.tag}.sql`;
    if (!fs.existsSync(sqlFile)) { console.log(`MISSING file: ${sqlFile}`); continue; }
    const content = fs.readFileSync(sqlFile, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    if (appliedHashes.has(hash)) {
      console.log(`⏭ Already recorded: ${entry.tag}`);
      continue;
    }
    await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [hash, Date.now()]);
    console.log(`✓ Recorded migration: ${entry.tag}`);
  }

  console.log('\n✅ Migration fix complete!');
} finally {
  await conn.end();
}
