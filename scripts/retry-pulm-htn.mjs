/**
 * retry-pulm-htn.mjs — retry Pulmonary Hypertension question generation
 */
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, "") ?? "";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const prompt = `You are an expert echocardiography educator creating 5 intermediate multiple-choice questions about Pulmonary Hypertension assessment by echocardiography.

Topics to cover: TR velocity, RVSP estimation, RV size and function, PA acceleration time, McConnell sign, echo criteria per ASE/ESC guidelines.

Each item is a multiple-choice question with exactly 4 options in 'options', a 0-indexed correctAnswer as a number (0, 1, 2, or 3), and a clear explanation. Do NOT include reviewAnswer.

Return exactly 5 questions as a valid JSON object:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","tags":["pulmonary hypertension","RVSP","TR velocity","RV function"]}]}

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

async function main() {
  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${FORGE_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.5 }),
  });
  const data = await response.json();
  let text = data.choices?.[0]?.message?.content ?? "";
  text = text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
  const jsonMatch = text.match(/([\[\{][\s\S]*[\]\}])/);
  if (jsonMatch) text = jsonMatch[1].trim();
  const raw = JSON.parse(text);
  const questions = Array.isArray(raw) ? raw : (raw.questions ?? []);
  console.log(`Generated ${questions.length} questions`);

  const conn = await createConnection(DATABASE_URL);
  const [adminRows] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const adminId = adminRows[0]?.id ?? 1;
  let inserted = 0;
  for (const q of questions) {
    if (!q.question || !q.options || q.correctAnswer === undefined) continue;
    await conn.execute(
      `INSERT INTO quickfireQuestions (type, question, options, correctAnswer, explanation, reviewAnswer, imageUrl, difficulty, tags, isActive, createdByUserId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      ["scenario", q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation ?? null, null, null, "intermediate", JSON.stringify(q.tags ?? ["pulmonary hypertension"]), 1, adminId]
    );
    inserted++;
  }
  await conn.end();
  console.log(`✅ Inserted ${inserted} Pulmonary Hypertension questions`);
}

main().catch(err => { console.error(err); process.exit(1); });
