/**
 * bulk-generate-questions.mjs
 * Generates 5 MCQ questions per topic across 9 clinical topics using the Forge API,
 * then inserts them directly into the database.
 *
 * Usage: node scripts/bulk-generate-questions.mjs
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

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error("❌ Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL");
  process.exit(1);
}

const TOPICS = [
  { topic: "Hypertrophic Obstructive Cardiomyopathy (HOCM) — LVOT obstruction, SAM, Doppler assessment, provocable gradients, and management thresholds", tags: ["HOCM", "LVOT obstruction", "SAM", "Doppler"] },
  { topic: "Myocardial Strain and Speckle-Tracking Echocardiography — LV GLS, RV free wall strain, circumferential and radial strain, clinical applications and normal values", tags: ["strain", "GLS", "speckle tracking", "LV function"] },
  { topic: "Diastolic Function Assessment — E/A ratio, E/e' ratio, LA volume index, TR velocity, grading diastolic dysfunction per ASE guidelines", tags: ["diastolic function", "E/e'", "LA volume", "filling pressures"] },
  { topic: "Dilated Cardiomyopathy — LV dilation, reduced EF, wall motion abnormalities, functional MR, echo criteria and prognosis markers", tags: ["dilated cardiomyopathy", "DCM", "LV EF", "functional MR"] },
  { topic: "Restrictive Cardiomyopathy — Amyloidosis, sarcoidosis, hemochromatosis — echo features, granular sparkling, diastolic dysfunction, constrictive vs restrictive differentiation", tags: ["restrictive cardiomyopathy", "amyloidosis", "diastolic dysfunction", "infiltrative"] },
  { topic: "Constrictive Pericarditis — Septal bounce, respiratory variation, annulus reversus, tissue Doppler, hepatic vein flow, differentiating from restriction", tags: ["constrictive pericarditis", "septal bounce", "respiratory variation", "annulus reversus"] },
  { topic: "Cardiac Tamponade — Pericardial effusion, RA/RV collapse, IVC plethora, respiratory variation in Doppler flows, hemodynamic significance", tags: ["cardiac tamponade", "pericardial effusion", "RA collapse", "IVC"] },
  { topic: "Pulmonary Hypertension — TR velocity, RVSP estimation, RV size and function, PA acceleration time, McConnell sign, echo criteria per ASE/ESC guidelines", tags: ["pulmonary hypertension", "RVSP", "TR velocity", "RV function"] },
  { topic: "Pulmonary Embolism — RV strain, D-sign, McConnell sign, 60/60 sign, TR velocity, IVC, clinical context and echo findings in acute PE", tags: ["pulmonary embolism", "PE", "RV strain", "McConnell sign"] },
];

async function generateQuestions(topic, tags) {
  const prompt = `You are an expert echocardiography educator creating 5 intermediate multiple-choice questions about: "${topic}".

Each item is a multiple-choice question with exactly 4 options in 'options', a 0-indexed correctAnswer as a number (0, 1, 2, or 3), and a clear explanation. Do NOT include reviewAnswer.

Guidelines:
- Use accurate, up-to-date ASE/AHA/ACC guidelines where applicable
- Questions should be clinically relevant and educational
- Distractors should be plausible but clearly distinguishable from the correct answer
- Tags: use these specific tags: ${JSON.stringify(tags)}
- Difficulty: intermediate (clinical application level)

Return exactly 5 questions as a valid JSON object matching this format:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","tags":["...","..."]}]}

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Forge API ${response.status}: ${errBody.substring(0, 200)}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(`Forge error: ${data.error.message}`);

  let text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response from Forge API");

  // Strip markdown fences if present
  text = text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
  const jsonMatch = text.match(/([\[\{][\s\S]*[\]\}])/);
  if (jsonMatch) text = jsonMatch[1].trim();

  const raw = JSON.parse(text);
  const questions = Array.isArray(raw) ? raw : (raw.questions ?? []);
  return questions;
}

async function main() {
  console.log("🔌 Connecting to database...");
  const conn = await createConnection(DATABASE_URL);

  // Get the admin user ID (owner) to use as createdByUserId
  const [adminRows] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const adminId = adminRows[0]?.id ?? 1;
  console.log(`👤 Using admin user ID: ${adminId}`);

  let totalInserted = 0;

  for (const { topic, tags } of TOPICS) {
    const shortTopic = topic.split("—")[0].trim();
    console.log(`\n📝 Generating questions for: ${shortTopic}...`);
    
    try {
      const questions = await generateQuestions(topic, tags);
      console.log(`   ✅ Generated ${questions.length} questions`);

      for (const q of questions) {
        if (!q.question || !q.options || q.correctAnswer === undefined) {
          console.warn(`   ⚠️  Skipping malformed question: ${JSON.stringify(q).substring(0, 80)}`);
          continue;
        }
        await conn.execute(
          `INSERT INTO quickfireQuestions 
           (type, question, options, correctAnswer, explanation, reviewAnswer, imageUrl, difficulty, tags, isActive, createdByUserId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            "scenario",
            q.question,
            JSON.stringify(q.options),
            q.correctAnswer,
            q.explanation ?? null,
            null,
            null,
            "intermediate",
            JSON.stringify(q.tags ?? tags),
            1,
            adminId,
          ]
        );
        totalInserted++;
      }
      console.log(`   💾 Inserted ${questions.length} questions into DB`);
    } catch (err) {
      console.error(`   ❌ Failed for topic "${shortTopic}": ${err.message}`);
    }

    // Small delay between API calls to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  await conn.end();
  console.log(`\n✅ Done! Total questions inserted: ${totalInserted}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
