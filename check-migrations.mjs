import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await conn.query('SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 10');
  console.log('Applied migrations:', JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('Error:', e.message);
}
await conn.end();
