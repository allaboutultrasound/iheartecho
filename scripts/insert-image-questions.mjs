/**
 * Insert sample image-based (MCQ) questions using uploaded echo images.
 * Run: node scripts/insert-image-questions.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL not set");

const conn = await mysql.createConnection(DB_URL);

function requireImageUrl(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must point to a Railway/R2-hosted image URL`);
  return value;
}

const PLAX_LABELED = requireImageUrl("SAMPLE_PLAX_LABELED_URL");
const PLAX_NORMAL = requireImageUrl("SAMPLE_PLAX_NORMAL_URL");
const A4C_LABELED = requireImageUrl("SAMPLE_A4C_LABELED_URL");
const A4C_NORMAL = requireImageUrl("SAMPLE_A4C_NORMAL_URL");

const questions = [
  {
    type: "image",
    question: "Identify the cardiac structure labeled 'MV' in this PLAX view. What is the correct name?",
    options: JSON.stringify(["Mitral Valve", "Aortic Valve", "Tricuspid Valve", "Pulmonic Valve"]),
    correctAnswer: 0,
    explanation: "In the Parasternal Long Axis (PLAX) view, 'MV' refers to the Mitral Valve. The PLAX view displays the LV, LVOT, aortic valve, left atrium, and mitral valve in a single plane. The mitral valve is the posterior AV valve separating the left atrium from the left ventricle.",
    imageUrl: PLAX_LABELED,
    difficulty: "beginner",
    tags: JSON.stringify(["Adult Echo", "PLAX", "Anatomy", "Valve Identification"]),
    points: 10,
  },
  {
    type: "image",
    question: "In this PLAX view, which structure is labeled 'LVOT'?",
    options: JSON.stringify(["Left Ventricular Outflow Tract", "Left Ventricular Posterior Wall", "Left Atrial Appendage", "Interventricular Septum"]),
    correctAnswer: 0,
    explanation: "The LVOT (Left Ventricular Outflow Tract) is the region between the interventricular septum and the anterior mitral valve leaflet, leading to the aortic valve. In the PLAX view, it is measured just below the aortic valve. Normal LVOT diameter is 1.8–2.2 cm.",
    imageUrl: PLAX_LABELED,
    difficulty: "beginner",
    tags: JSON.stringify(["Adult Echo", "PLAX", "Anatomy", "LVOT"]),
    points: 10,
  },
  {
    type: "image",
    question: "This is a normal Parasternal Long Axis (PLAX) view. What is the normal range for the LV internal diameter in diastole (LVIDd) in an adult?",
    options: JSON.stringify(["3.0–4.2 cm", "4.2–5.8 cm", "5.8–6.5 cm", "6.5–7.5 cm"]),
    correctAnswer: 1,
    explanation: "Normal LV internal diameter in diastole (LVIDd) is 4.2–5.8 cm in adults (ASE 2015 guidelines). Values >5.8 cm suggest LV dilation. The PLAX view is the standard view for measuring LVIDd at the level of the mitral valve leaflet tips, perpendicular to the long axis of the LV.",
    imageUrl: PLAX_NORMAL,
    difficulty: "intermediate",
    tags: JSON.stringify(["Adult Echo", "PLAX", "LV Function", "Normal Values"]),
    points: 15,
  },
  {
    type: "image",
    question: "In this Apical 4-Chamber (A4C) view, which chamber is labeled 'RA'?",
    options: JSON.stringify(["Right Atrium", "Right Ventricle", "Left Atrium", "Left Ventricle"]),
    correctAnswer: 0,
    explanation: "In the Apical 4-Chamber (A4C) view, the right atrium (RA) is the chamber in the upper right of the image. The A4C view displays all four cardiac chambers simultaneously. The right heart structures (RV and RA) appear on the left side of the image due to the transducer orientation.",
    imageUrl: A4C_LABELED,
    difficulty: "beginner",
    tags: JSON.stringify(["Adult Echo", "A4C", "Anatomy", "Chamber Identification"]),
    points: 10,
  },
  {
    type: "image",
    question: "In this A4C view, the tricuspid valve (TV) is seen between which two chambers?",
    options: JSON.stringify(["Right Atrium and Right Ventricle", "Left Atrium and Left Ventricle", "Right Ventricle and Left Ventricle", "Right Atrium and Left Atrium"]),
    correctAnswer: 0,
    explanation: "The tricuspid valve (TV) is the right-sided atrioventricular (AV) valve that separates the right atrium (RA) from the right ventricle (RV). In the A4C view, it is positioned slightly more apically (closer to the apex) than the mitral valve — this apical displacement of the TV is a normal finding and helps distinguish the right from left heart.",
    imageUrl: A4C_LABELED,
    difficulty: "beginner",
    tags: JSON.stringify(["Adult Echo", "A4C", "Anatomy", "Tricuspid Valve"]),
    points: 10,
  },
  {
    type: "image",
    question: "In this normal A4C view, what is the normal range for the RV basal diameter?",
    options: JSON.stringify(["< 2.0 cm", "2.0–2.8 cm", "2.8–4.1 cm", "> 4.1 cm"]),
    correctAnswer: 2,
    explanation: "Normal RV basal diameter (measured at the base of the RV in the A4C view) is 2.8–4.1 cm (ASE 2015). RV basal diameter > 4.1 cm indicates RV dilation. The RV basal diameter is measured at end-diastole from the lateral RV wall to the interventricular septum at the level of the tricuspid annulus.",
    imageUrl: A4C_NORMAL,
    difficulty: "intermediate",
    tags: JSON.stringify(["Adult Echo", "A4C", "RV Function", "Normal Values"]),
    points: 15,
  },
];

let inserted = 0;
for (const q of questions) {
  await conn.execute(
    `INSERT INTO quickfireQuestions (type, question, options, correctAnswer, explanation, imageUrl, difficulty, tags, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [q.type, q.question, q.options, q.correctAnswer, q.explanation, q.imageUrl, q.difficulty, q.tags]
  );
  inserted++;
  console.log(`✓ Inserted: ${q.question.slice(0, 60)}...`);
}

console.log(`\n✅ Inserted ${inserted} image-based questions`);
await conn.end();
