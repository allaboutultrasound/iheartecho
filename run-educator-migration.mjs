import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const conn = await createConnection(process.env.DATABASE_URL);

// Read the migration file and extract only the educator-related CREATE TABLE statements
const sql = readFileSync('./drizzle/0002_messy_shinko_yamashiro.sql', 'utf8');

// Split by statement-breakpoint
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

// Filter to only educator and platformFeatureFlags statements
const educatorStatements = statements.filter(s => 
  s.includes('educatorAnnouncements') ||
  s.includes('educatorAssignments') ||
  s.includes('educatorCompetencies') ||
  s.includes('educatorCourses') ||
  s.includes('educatorModules') ||
  s.includes('educatorOrgMembers') ||
  s.includes('educatorOrgs') ||
  s.includes('educatorPresentations') ||
  s.includes('educatorQuizAttempts') ||
  s.includes('educatorQuizQuestions') ||
  s.includes('educatorQuizzes') ||
  s.includes('educatorStudentCompetencies') ||
  s.includes('educatorStudentProgress') ||
  s.includes('platformFeatureFlags') ||
  // Also include ALTER TABLE statements for userRoles enum changes
  (s.includes('ALTER TABLE') && s.includes('userRoles'))
);

console.log(`Found ${educatorStatements.length} statements to execute`);

for (const stmt of educatorStatements) {
  if (!stmt) continue;
  try {
    await conn.query(stmt);
    const tableName = stmt.match(/CREATE TABLE `([^`]+)`/)?.[1] || stmt.match(/ALTER TABLE `([^`]+)`/)?.[1] || 'unknown';
    console.log(`✓ ${tableName}`);
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`⚠ Already exists: ${e.sqlMessage}`);
    } else if (e.code === 'ER_DUP_KEYNAME') {
      console.log(`⚠ Index already exists: ${e.sqlMessage}`);
    } else {
      console.error(`✗ Error: ${e.message}`);
      console.error('Statement:', stmt.substring(0, 100));
    }
  }
}

await conn.end();
console.log('Done!');
