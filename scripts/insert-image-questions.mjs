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

// CDN URLs for the uploaded echo images
const PLAX_LABELED = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/OkpDOCEQdNSksuFC.png?Expires=1804564207&Signature=cAI7D4Pm~1FigofsOtukEIRdmaMBQa9Ssy6IzkMwE5~apQCdAY2hK9xvB1CtBMEvGs9cv7Yb3lEtIbyfdC6oTvwdgGDFfSWJgMPmyeBmKP4uu1ZY4uuVMqEuBwnWAh97sDKDEgd~gw2LLF95gmyZ0jvPF1s-QHXaoSGl9ng7qTRaRRlcfx~QNlVLGJ5qWUNaSmxEmQu5LOFsN8ZiDWmYVZXQGfu~77QHLX5njti4uKkiHOSAFeqt0IuNrwmKCxfiUNYfolDytjYoTI6KKFYDbkSHKQ~ml~XM3d9MCiEze7OR3Ecrq8DO7cCU0wxwg49OB3lR58HLEhBaxhBmYSDXA__&Key-Pair-Id=K2HSFNDJXOU9YS";
const PLAX_NORMAL = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/EloGCUVyhJitLrHa.jpg?Expires=1804564207&Signature=tkFBPbzRxPsCbAhA4hb0EpoeYOUxU8iV-3bvpNGvcB~bCSTRB4drIt1EiiSrfjW5NTY~MQSkptPoxPKRgTfHuHFw0rtcIqmPQEiupyMPwC~mDj2UV6NcqxVRD2-pSx-x3EWUJuxJ0WTDl~KKgBhMnBPBqA2ORrPuQhBMCJBHrOkpK3OtnJqEbkBT6UGX9OzzDrMl2lgEoGhE6K~njbzGXhTXlPHQwCrbGjdjPxuu~Fe1Vu~a2gS7rUb40C1gA5NuP685zzJqTmjnDVvKBdn5nT~gcT~JciLLb1u45H-LI~qJJkoDGLsBdWc9dPq6mwfN3MEjzYbK1BRRAhRA-mxbvg__&Key-Pair-Id=K2HSFNDJXOU9YS";
const A4C_LABELED = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/lrDITMCqnBPodjrf.png?Expires=1804564207&Signature=JY2-ZC-5NXBXoYKTNZOs91~clts02LkoBixVtjUKTKbzAu8Djd-5MRrtJRq3MdqJSwEOA1yjl~xh6PyusYM0zUvEr6xtRS5XCmGjoTpn7HBqmzXZN6Z9WDIwTGoN46ebIqy3Xm3FfYik2NB9ospmp9rPp0TLi~yMTkSOzN8CoPV-5vOf9m1GLtKsi2qEWrzxTDpvB4SoP6uNRTVj3DvfmCeEcB4sRj39kal1yXMoXmMPzwxW-cKNW-y3eFT5ZYS6bCDZQxegXpdtbD-2dkH0oPT5xi03avtPvi9JCaKnyBoW2gvBAuFvxi84uBsLmo3f~nBKhFwUaLoBXaBAyTJvXA__&Key-Pair-Id=K2HSFNDJXOU9YS";
const A4C_NORMAL = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/oqMpzCspSVIAABAv.jpg?Expires=1804564207&Signature=ZyIqeOWnMOlPOKGKiFfJ0ltDClpGhmfOpYb8L7EEdDXOSAFgxAUrO1NqyCXPztUMWpmKhPxxxjTMaHAyeF3Rtrl6tV4CP1wxA1C8bSgFP-LgFljKnkEJrOcne7n-bcoCrLHOy77C9jcVwtgydBEChbCke-upQSnHAwOLQnG14gL61lk9sGBEgi9lLOTvVH0uieh2UuzyfnTKu0hGB8IZ6om87rTz-qy8JetC8QyX6ZhWywlGPBMTySQYBUeCTbOmTRsk149kT4wEpN7G94NX43DvBQ4S2bYPLnfRQdddjtUevoDv~W8g2xDxRdRXMzYemjMDpIjGPJdURdV2f2jFmA__&Key-Pair-Id=K2HSFNDJXOU9YS";

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
