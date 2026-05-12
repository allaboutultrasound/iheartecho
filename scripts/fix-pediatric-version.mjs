/**
 * Fix: pediatric-echo-flashcards-wyo4on has two versions.
 * Version 1: scormEntryUrl = done, extractionState = done ✓
 * Version 2: scormEntryUrl = null, extractionState = running (stuck) ✗
 * 
 * currentVersionId points to Version 2 (stuck).
 * This script sets currentVersionId back to Version 1 and marks Version 2 as failed.
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get both versions
  const [rows] = await conn.execute(
    `SELECT a.id as assetId, a.currentVersionId, mv.id as versionId, mv.scormEntryUrl, mv.extractionState 
     FROM mediaAssets a 
     JOIN mediaVersions mv ON mv.assetId = a.id 
     WHERE a.slug = 'pediatric-echo-flashcards-wyo4on' 
     ORDER BY mv.id`
  );
  
  console.log('Current state:', JSON.stringify(rows, null, 2));
  
  const goodVersion = rows.find(r => r.scormEntryUrl && r.scormEntryUrl !== 'FAILED');
  const stuckVersion = rows.find(r => r.extractionState === 'running' && !r.scormEntryUrl);
  
  if (!goodVersion) {
    console.error('No good version found!');
    process.exit(1);
  }
  
  console.log(`\nGood version ID: ${goodVersion.versionId}`);
  console.log(`Stuck version ID: ${stuckVersion?.versionId ?? 'none'}`);
  
  // Mark stuck version as failed
  if (stuckVersion) {
    await conn.execute(
      `UPDATE mediaVersions SET extractionState = 'failed', scormEntryUrl = 'FAILED' WHERE id = ?`,
      [stuckVersion.versionId]
    );
    console.log(`✓ Marked version ${stuckVersion.versionId} as failed`);
  }
  
  // Set currentVersionId to the good version
  await conn.execute(
    `UPDATE mediaAssets SET currentVersionId = ? WHERE id = ?`,
    [goodVersion.versionId, goodVersion.assetId]
  );
  console.log(`✓ Set currentVersionId to ${goodVersion.versionId} for asset ${goodVersion.assetId}`);
  
  // Verify
  const [verify] = await conn.execute(
    `SELECT a.currentVersionId, mv.id as versionId, LEFT(mv.scormEntryUrl, 80) as entryUrl, mv.extractionState 
     FROM mediaAssets a 
     JOIN mediaVersions mv ON mv.id = a.currentVersionId 
     WHERE a.slug = 'pediatric-echo-flashcards-wyo4on'`
  );
  console.log('\nVerification:', JSON.stringify(verify, null, 2));
  console.log('\n✅ Done! The /view and /embed endpoints will now use the good version.');
  
} finally {
  await conn.end();
}
