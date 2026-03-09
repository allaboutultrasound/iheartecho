/**
 * seed-fetal-flashcards.mjs
 * Generates 50 fetal echo flashcards (varied difficulty) via Forge API
 * and inserts them directly into the database.
 *
 * Run: node scripts/seed-fetal-flashcards.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL ?? "").replace(/\/+$/, "");
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY ?? "";

if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
if (!FORGE_API_URL || !FORGE_API_KEY) { console.error("Forge API credentials not set"); process.exit(1); }

// ── Batches: smaller count per call to avoid JSON truncation ─────────────────
const BATCHES = [
  // Beginner: anatomy, situs, normal views
  { topic: "Fetal cardiac anatomy: situs, cardiac position, levocardia, dextrocardia, and the normal four-chamber view", difficulty: "beginner", count: 8 },
  { topic: "Normal fetal echocardiography: cardiac axis, cardiothoracic ratio, AV valves, ventricular morphology, and foramen ovale", difficulty: "beginner", count: 7 },
  // Intermediate: Doppler, outflow tracts, arches
  { topic: "Fetal echo Doppler: outflow tract views, great artery identification, pulmonary artery vs aorta, and ductal arch vs aortic arch", difficulty: "intermediate", count: 8 },
  { topic: "Fetal echo: venous connections, ductus venosus, umbilical vein, pulmonary veins, and superior/inferior vena cava", difficulty: "intermediate", count: 7 },
  // Advanced: CHD diagnosis and management
  { topic: "Fetal CHD: hypoplastic left heart syndrome (HLHS), atrioventricular septal defect (AVSD), and tetralogy of Fallot — diagnosis, echo features, and prognosis", difficulty: "advanced", count: 10 },
  { topic: "Fetal CHD: transposition of the great arteries (TGA), coarctation of the aorta (CoA), and fetal hydrops — echo findings and clinical management", difficulty: "advanced", count: 10 },
];

/**
 * Robustly extract a JSON array from raw LLM text.
 * Handles: markdown fences, prose before/after, truncated arrays.
 */
function extractJsonArray(text) {
  // Strip markdown fences
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

  // Try to find a JSON object with a "questions" key first
  const objMatch = cleaned.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*?\]\s*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (Array.isArray(parsed.questions)) return parsed.questions;
    } catch (_) {}
  }

  // Try to find a root array
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  // Last resort: try to extract individual JSON objects from the text
  // (handles truncated arrays where the closing bracket is missing)
  const objects = [];
  const objRegex = /\{[^{}]*"question"\s*:[^{}]*"reviewAnswer"\s*:[^{}]*\}/g;
  let match;
  while ((match = objRegex.exec(cleaned)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj.question && obj.reviewAnswer) objects.push(obj);
    } catch (_) {}
  }
  if (objects.length > 0) {
    console.log(`  ⚠ Used fallback object extraction: found ${objects.length} objects`);
    return objects;
  }

  throw new Error(`Could not extract JSON array from response. Preview: ${cleaned.substring(0, 200)}`);
}

async function callForge(topic, difficulty, count) {
  const prompt = `You are an expert fetal echocardiography educator. Create exactly ${count} ${difficulty} flashcards about: "${topic}".

Each flashcard has a short clinical question or fact prompt in 'question' and a concise, accurate answer in 'reviewAnswer'.
Guidelines:
- Use accurate, up-to-date ASE/AHA fetal echo guidelines
- Questions should be clinically relevant and educational
- Tags: 2-4 specific clinical terms (e.g. "four-chamber view", "HLHS", "fetal Doppler")
- Difficulty: ${difficulty}
- Vary question style: definitions, expected findings, measurement thresholds, clinical scenarios

IMPORTANT: Return ONLY a valid JSON object. No prose, no markdown, no code fences.
Format: {"questions":[{"question":"...","reviewAnswer":"...","tags":["tag1","tag2"]}]}`;

  const resp = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }, // force JSON mode
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Forge API ${resp.status}: ${err.substring(0, 300)}`);
  }

  const data = await resp.json();
  if (data.error) throw new Error(`Forge error: ${data.error.message}`);

  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response from Forge");

  return extractJsonArray(text);
}

async function main() {
  const conn = await createConnection(DB_URL);
  console.log("Connected to database.");

  let allCards = [];

  for (const batch of BATCHES) {
    console.log(`\nGenerating ${batch.count} ${batch.difficulty} flashcards...`);
    console.log(`  Topic: ${batch.topic.substring(0, 80)}...`);
    try {
      const cards = await callForge(batch.topic, batch.difficulty, batch.count);
      console.log(`  ✓ Got ${cards.length} cards`);
      allCards.push(...cards.map(c => ({ ...c, difficulty: batch.difficulty })));
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      // Don't exit — continue with other batches
    }
  }

  // Trim to exactly 50
  const toInsert = allCards.slice(0, 50);
  console.log(`\nTotal cards to insert: ${toInsert.length}`);

  let inserted = 0;
  for (const card of toInsert) {
    const tags = JSON.stringify(Array.isArray(card.tags) ? card.tags : []);
    await conn.execute(
      `INSERT INTO quickfireQuestions (type, question, reviewAnswer, explanation, difficulty, tags, echoCategory, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'fetal', 1, NOW(), NOW())`,
      [
        "quickReview",
        (card.question ?? "").substring(0, 2000),
        (card.reviewAnswer ?? card.answer ?? "").substring(0, 2000),
        card.explanation ? card.explanation.substring(0, 2000) : null,
        card.difficulty ?? "intermediate",
        tags,
      ]
    );
    inserted++;
    process.stdout.write(`\r  Inserted ${inserted}/${toInsert.length}`);
  }

  console.log(`\n\n✅ Done! Inserted ${inserted} fetal echo flashcards.`);
  await conn.end();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
