/**
 * seed-caselab-questions.mjs
 * Inserts the 6 original Echo Case Lab questions into the quickfireQuestions table
 * with isActive = false so they sit in the admin bank, ready to be added to a challenge.
 *
 * Run: node scripts/seed-caselab-questions.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const cases = [
  {
    type: "scenario",
    question: "A 68-year-old woman presents with exertional dyspnea. TTE shows a heavily calcified aortic valve with peak velocity 4.8 m/s, mean gradient 52 mmHg, and AVA 0.7 cm². LV function is preserved. What is the severity classification?",
    options: [
      "Mild aortic stenosis",
      "Moderate aortic stenosis",
      "Severe aortic stenosis",
      "Very severe aortic stenosis"
    ],
    correctAnswer: 3,
    explanation: "Peak velocity ≥5 m/s OR mean gradient ≥60 mmHg OR AVA ≤0.6 cm² defines very severe AS per ASE 2021 guidelines. However, with a mean gradient of 52 mmHg and AVA 0.7 cm², this meets criteria for severe AS (mean gradient ≥40 mmHg, AVA ≤1.0 cm²). The peak velocity of 4.8 m/s also confirms severe AS (≥4 m/s). Answer: Severe aortic stenosis.",
    difficulty: "intermediate",
    tags: ["Aortic Stenosis", "ASE 2021", "Valve Disease", "Adult Echo"],
    category: "Adult Echo",
  },
  {
    type: "scenario",
    question: "On a routine TTE, you identify a 2.5 cm ostium secundum ASD with left-to-right shunting. Qp/Qs is calculated at 2.1:1. The RV is dilated. Which of the following is the most appropriate next step?",
    options: [
      "Reassure and follow up in 5 years",
      "Refer for transcatheter ASD closure evaluation",
      "Start diuretic therapy and recheck in 6 months",
      "Perform TEE to rule out PFO"
    ],
    correctAnswer: 1,
    explanation: "A Qp/Qs ≥1.5:1 with RV volume overload (dilation) is an indication for ASD closure per ACC/AHA guidelines. Transcatheter closure is preferred for secundum ASDs ≤38 mm with adequate rims. TEE is typically performed as part of the pre-procedural workup, not as the 'next step' here.",
    difficulty: "intermediate",
    tags: ["ASD", "Congenital Heart", "Qp/Qs", "Pediatric Echo"],
    category: "Pediatric Echo",
  },
  {
    type: "scenario",
    question: "A 45-year-old man with known bicuspid aortic valve undergoes surveillance TTE. The aortic root measures 4.6 cm and the ascending aorta is 4.8 cm. He is asymptomatic. What is the recommended management threshold for surgical intervention on the aorta in this patient?",
    options: [
      "Aortic diameter ≥4.5 cm",
      "Aortic diameter ≥5.0 cm",
      "Aortic diameter ≥5.5 cm",
      "Only operate if symptomatic regardless of size"
    ],
    correctAnswer: 1,
    explanation: "For patients with bicuspid aortic valve, current AHA/ACC guidelines recommend surgical repair when the aortic diameter reaches ≥5.0 cm (or ≥4.5 cm if there are additional risk factors such as rapid growth >0.5 cm/year, family history of dissection, or coarctation). This patient is at 4.8 cm — close monitoring is warranted.",
    difficulty: "advanced",
    tags: ["Bicuspid Aortic Valve", "Aortic Dilation", "Adult Echo", "ASE Guidelines"],
    category: "Adult Echo",
  },
  {
    type: "scenario",
    question: "During a fetal echo at 22 weeks gestation, you identify discordant atrioventricular connections with the right atrium connecting to a morphologic left ventricle and the left atrium connecting to a morphologic right ventricle. The great arteries are also transposed. What is the diagnosis?",
    options: [
      "D-Transposition of the Great Arteries (D-TGA)",
      "Congenitally Corrected Transposition of the Great Arteries (ccTGA)",
      "Double Outlet Right Ventricle (DORV)",
      "Tetralogy of Fallot"
    ],
    correctAnswer: 1,
    explanation: "Congenitally corrected TGA (ccTGA / L-TGA) is characterised by discordant AV connections (RA → morphologic LV, LA → morphologic RV) AND discordant ventriculoarterial connections. The result is physiologically 'corrected' circulation but the systemic ventricle is a morphologic RV, predisposing to long-term failure. D-TGA has concordant AV connections with discordant VA connections.",
    difficulty: "advanced",
    tags: ["Fetal Echo", "ccTGA", "Congenital Heart", "Transposition"],
    category: "Fetal Echo",
  },
  {
    type: "scenario",
    question: "A 55-year-old patient in the ICU is being evaluated for hemodynamic instability post-CABG. TEE shows a new moderate pericardial effusion with right atrial collapse lasting >1/3 of the cardiac cycle and respiratory variation in mitral inflow >25%. What is the most likely diagnosis?",
    options: [
      "Constrictive pericarditis",
      "Cardiac tamponade",
      "Severe tricuspid regurgitation",
      "Right ventricular failure"
    ],
    correctAnswer: 1,
    explanation: "Cardiac tamponade is characterised by: pericardial effusion + right atrial collapse (>1/3 cardiac cycle) or right ventricular diastolic collapse + respiratory variation in mitral inflow >25% (or tricuspid >40%) on Doppler. These findings together with haemodynamic instability confirm tamponade physiology requiring urgent pericardiocentesis or surgical drainage.",
    difficulty: "intermediate",
    tags: ["Cardiac Tamponade", "Pericardial Effusion", "TEE", "ACS"],
    category: "ACS",
  },
  {
    type: "scenario",
    question: "In a patient with STEMI involving the inferior wall, which echocardiographic finding would be most consistent with acute right ventricular infarction?",
    options: [
      "Dilated LV with global hypokinesis",
      "Dilated RV with free wall hypokinesis and McConnell sign",
      "Severe mitral regurgitation with posterior leaflet flail",
      "Pericardial effusion with tamponade physiology"
    ],
    correctAnswer: 1,
    explanation: "RV infarction complicates ~30-50% of inferior STEMIs (RCA territory). Echo findings include: RV dilation, RV free wall hypokinesis with preserved apical contractility (McConnell sign), elevated RVSP, and paradoxical septal motion. McConnell sign (apical sparing with free wall akinesis) is highly specific for acute RV pressure overload/infarction. Severe MR with posterior flail is a mechanical complication of inferior MI but is a separate entity.",
    difficulty: "intermediate",
    tags: ["ACS", "RV Infarction", "STEMI", "McConnell Sign"],
    category: "ACS",
  },
];

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database");

  let inserted = 0;
  for (const c of cases) {
    const [result] = await conn.execute(
      `INSERT INTO quickfireQuestions (type, question, options, correctAnswer, explanation, difficulty, tags, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        c.type,
        c.question,
        JSON.stringify(c.options),
        c.correctAnswer,
        c.explanation,
        c.difficulty,
        JSON.stringify(c.tags),
      ]
    );
    console.log(`  Inserted question ID ${result.insertId}: ${c.question.slice(0, 60)}...`);
    inserted++;
  }

  console.log(`\nDone — inserted ${inserted} questions (isActive=false, in admin bank)`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
