import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Check if queuePosition column exists
  const [rows] = await conn.execute("SHOW COLUMNS FROM quickfireChallenges LIKE 'queuePosition'");
  if (rows.length > 0) {
    console.log('queuePosition column already exists');
  } else {
    await conn.execute('ALTER TABLE quickfireChallenges ADD COLUMN queuePosition INT NULL DEFAULT NULL');
    console.log('✓ Added queuePosition column');
  }

  // Check status enum
  const [cols] = await conn.execute("SHOW COLUMNS FROM quickfireChallenges LIKE 'status'");
  if (cols.length > 0) {
    const currentType = cols[0].Type;
    console.log('Current status type:', currentType);
    if (!currentType.includes('queued')) {
      await conn.execute("ALTER TABLE quickfireChallenges MODIFY COLUMN status ENUM('draft','queued','scheduled','live','archived') NOT NULL DEFAULT 'queued'");
      console.log('✓ Updated status enum to include queued');
    } else {
      console.log('status enum already includes queued');
    }
  }

  // Mark the pending migration as applied so db:push doesn't try to re-run it
  const [migs] = await conn.execute("SELECT COUNT(*) as cnt FROM __drizzle_migrations");
  const count = migs[0].cnt;
  console.log('Current migration count:', count);

  // Get the hash for the latest migration file
  const fs = await import('fs');
  const path = await import('path');
  const crypto = await import('crypto');
  
  const journalPath = '/home/ubuntu/iheartecho/drizzle/meta/_journal.json';
  const journal = JSON.parse(fs.default.readFileSync(journalPath, 'utf-8'));
  const pendingEntries = journal.entries.slice(count);
  
  console.log('Pending journal entries:', pendingEntries.length);
  
  for (const entry of pendingEntries) {
    const sqlFile = `/home/ubuntu/iheartecho/drizzle/${entry.tag}.sql`;
    if (fs.default.existsSync(sqlFile)) {
      const content = fs.default.readFileSync(sqlFile, 'utf-8');
      const hash = crypto.default.createHash('sha256').update(content).digest('hex');
      await conn.execute(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [hash, Date.now()]
      );
      console.log(`✓ Marked migration ${entry.tag} as applied (hash: ${hash.slice(0, 8)}...)`);
    }
  }

  console.log('Done!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await conn.end();
}
