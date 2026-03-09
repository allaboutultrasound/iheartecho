/**
 * bulk-generate-flashcards.mjs
 * Generates quickReview (flashcard) questions for each clinical topic
 * and inserts them into the quickfireQuestions table.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: "/home/ubuntu/iheartecho/.env" });

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.ai";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const TOPICS = [
  { name: "HOCM", tags: ["HOCM", "Cardiomyopathy"] },
  { name: "Strain Imaging", tags: ["Strain", "GLS", "Speckle Tracking"] },
  { name: "Diastolic Function", tags: ["Diastolic Function", "Diastology"] },
  { name: "Dilated Cardiomyopathy", tags: ["Dilated CM", "DCM"] },
  { name: "Restrictive Cardiomyopathy", tags: ["Restrictive CM", "Amyloid"] },
  { name: "Constrictive Pericarditis", tags: ["Constrictive Pericarditis", "Pericardium"] },
  { name: "Cardiac Tamponade", tags: ["Tamponade", "Pericardial Effusion"] },
  { name: "Pulmonary Hypertension", tags: ["Pulmonary HTN", "RV Function"] },
  { name: "Pulmonary Embolism", tags: ["Pulmonary Embolism", "PE", "RV Strain"] },
];

const FLASHCARD_PROMPT = (topic) => `You are an expert echocardiography educator. Generate 5 high-quality flashcard questions about "${topic}" for sonographers, cardiologists, and ACS professionals.

Each flashcard should:
- Have a clear, clinically relevant question on the FRONT
- Have a concise, accurate answer on the BACK (1-3 sentences)
- Have a brief explanation (1-2 sentences of additional context)
- Be based on current ASE/EACVI guidelines

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "flashcards": [
    {
      "question": "What is the SAM threshold for HOCM diagnosis?",
      "answer": "Systolic anterior motion (SAM) of the mitral valve causing LVOT obstruction with a peak gradient ≥30 mmHg at rest or ≥50 mmHg with provocation.",
      "explanation": "SAM occurs when the mitral valve leaflet is drawn into the LVOT during systole due to the Venturi effect and drag forces in HOCM."
    }
  ]
}`;

async function callForgeAPI(prompt) {
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
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Forge API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  let totalInserted = 0;

  for (const topic of TOPICS) {
    console.log(`\n📚 Generating flashcards for: ${topic.name}`);
    try {
      const raw = await callForgeAPI(FLASHCARD_PROMPT(topic.name));

      // Strip markdown code blocks if present
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const flashcards = parsed.flashcards;

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        console.error(`  ❌ No flashcards returned for ${topic.name}`);
        continue;
      }

      for (const fc of flashcards) {
        await conn.execute(
          `INSERT INTO quickfireQuestions 
           (type, question, reviewAnswer, explanation, tags, difficulty, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            "quickReview",
            fc.question,
            fc.answer,
            fc.explanation || null,
            JSON.stringify(topic.tags),
            "intermediate",
            true,
          ]
        );
        totalInserted++;
        console.log(`  ✅ Inserted: ${fc.question.substring(0, 60)}...`);
      }
    } catch (err) {
      console.error(`  ❌ Error for ${topic.name}:`, err.message);
    }
  }

  await conn.end();
  console.log(`\n🎉 Done! Total flashcards inserted: ${totalInserted}`);
}

main().catch(console.error);
