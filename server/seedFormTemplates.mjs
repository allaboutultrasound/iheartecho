/**
 * Seed script: create all four existing review forms as Form Builder templates.
 * Run with: node server/seedFormTemplates.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// ─── helpers ─────────────────────────────────────────────────────────────────

async function templateExists(name) {
  const [rows] = await conn.execute(
    "SELECT id FROM accreditationFormTemplates WHERE name = ? LIMIT 1", [name]);
  return rows.length > 0 ? rows[0].id : null;
}

async function insertTemplate(name, description, formType) {
  const [result] = await conn.execute(
    `INSERT INTO accreditationFormTemplates (name, description, formType, version, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, 1, 1, NOW(), NOW())`,
    [name, description, formType]);
  return result.insertId;
}

async function insertSection(templateId, title, description, sortOrder) {
  const [result] = await conn.execute(
    `INSERT INTO accreditationFormSections (templateId, title, description, sortOrder, createdAt)
     VALUES (?, ?, ?, ?, NOW())`,
    [templateId, title, description ?? null, sortOrder]);
  return result.insertId;
}

async function insertItem(templateId, sectionId, data) {
  const {
    label, itemType, isRequired = 1, sortOrder,
    placeholder = null, helpText = null, scoreWeight = 1,
    scaleMin = null, scaleMax = null, scaleMinLabel = null, scaleMaxLabel = null,
    richTextContent = null, emailRoutingRules = null,
  } = data;
  const [result] = await conn.execute(
    `INSERT INTO accreditationFormItems
       (sectionId, templateId, label, itemType, isRequired, sortOrder, placeholder, helpText,
        scoreWeight, scaleMin, scaleMax, scaleMinLabel, scaleMaxLabel,
        richTextContent, emailRoutingRules, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [sectionId, templateId, label, itemType, isRequired, sortOrder,
     placeholder, helpText, scoreWeight, scaleMin, scaleMax,
     scaleMinLabel, scaleMaxLabel, richTextContent, emailRoutingRules]);
  return result.insertId;
}

async function insertOption(itemId, label, value, qualityScore = 0, sortOrder = 0) {
  await conn.execute(
    `INSERT INTO accreditationFormOptions (itemId, label, value, qualityScore, sortOrder, createdAt)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [itemId, label, value, qualityScore, sortOrder]);
}

// ─── convenience wrappers ─────────────────────────────────────────────────────

const YES_NO_NA = ["Yes", "No", "N/A"];
const YES_NO = ["Yes", "No"];
const QUALITY_SCALE = ["Excellent", "Good", "Acceptable", "Needs Improvement", "Unacceptable"];

async function radio(tid, sid, label, options, sortOrder, scoreWeight = 1, helpText = null) {
  const itemId = await insertItem(tid, sid, { label, itemType: "radio", isRequired: 1, sortOrder, scoreWeight, helpText });
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const sv = opt === "N/A" ? scoreWeight * 10 : (i === 0 ? scoreWeight * 10 : 0);
    await insertOption(itemId, opt, opt, sv, i);
  }
  return itemId;
}

async function checkbox(tid, sid, label, options, sortOrder, scoreWeight = 1, helpText = null) {
  const itemId = await insertItem(tid, sid, { label, itemType: "checkbox", isRequired: 0, sortOrder, scoreWeight, helpText });
  for (let i = 0; i < options.length; i++) {
    await insertOption(itemId, options[i], options[i], 10, i);
  }
  return itemId;
}

async function text(tid, sid, label, sortOrder, isRequired = 0, placeholder = null) {
  return insertItem(tid, sid, { label, itemType: "text", isRequired, sortOrder, placeholder, scoreWeight: 0 });
}

async function textarea(tid, sid, label, sortOrder, isRequired = 0, placeholder = null) {
  return insertItem(tid, sid, { label, itemType: "textarea", isRequired, sortOrder, placeholder, scoreWeight: 0 });
}

async function select(tid, sid, label, options, sortOrder, isRequired = 1) {
  const itemId = await insertItem(tid, sid, { label, itemType: "select", isRequired, sortOrder, scoreWeight: 0 });
  for (let i = 0; i < options.length; i++) {
    await insertOption(itemId, options[i], options[i], 0, i);
  }
  return itemId;
}

async function heading(tid, sid, label, sortOrder) {
  return insertItem(tid, sid, { label, itemType: "heading", isRequired: 0, sortOrder, scoreWeight: 0 });
}

// ─── TEMPLATE 1: Image Quality Review (IQR) ──────────────────────────────────

async function seedIQR() {
  const name = "Image Quality Review (IQR)";
  const existing = await templateExists(name);
  if (existing) { console.log(`  ✓ IQR already exists (id=${existing})`); return; }
  const tid = await insertTemplate(name,
    "Comprehensive image quality review for Adult TTE, PETTE, Fetal Echo, and TEE examinations. Covers protocol compliance, image quality, measurements, Doppler, and clinical correlation.",
    "image_quality_review");

  // Section 1: Exam Information
  const s1 = await insertSection(tid, "Exam Information", "Basic exam identification and metadata", 1);
  await text(tid, s1, "Sonographer Name / ID", 1, 1);
  await text(tid, s1, "Patient MRN (de-identified)", 2, 0, "Optional");
  await text(tid, s1, "Review Date", 3, 1);
  await text(tid, s1, "Exam Date", 4, 1);
  await select(tid, s1, "Exam Type", ["Adult TTE", "PETTE (Pediatric TTE)", "Fetal Echo", "TEE", "Stress Echo", "Limited/Follow-Up"], 5, 1);
  await select(tid, s1, "Exam Scope", ["Complete Exam", "Limited/Follow Up Exam"], 6, 1);
  await select(tid, s1, "Indication Appropriateness", ["Appropriate", "Possibly Appropriate", "Rarely Appropriate", "N/A"], 7, 1);
  await radio(tid, s1, "Are patient demographics, charges, reporting and charting notes entered appropriately and accurately?", YES_NO_NA, 8, 1);

  // Section 2: Protocol Compliance
  const s2 = await insertSection(tid, "Protocol Compliance", "Views obtained and protocol adherence", 2);
  await checkbox(tid, s2, "Standard Protocol Views Obtained", [
    "Parasternal Long Axis (PLAX)", "PSAX — Aortic Valve Level", "PSAX — Mitral Valve Level",
    "PSAX — Papillary Muscle Level", "Apical 4-Chamber (A4C)", "Apical 2-Chamber (A2C)",
    "Apical 3-Chamber / ALAX", "Apical 5-Chamber (A5C)", "Subcostal 4-Chamber",
    "Subcostal IVC", "Suprasternal Notch (SSN)", "Right Parasternal"
  ], 1, 2);
  await checkbox(tid, s2, "Doppler / Color Flow Views Obtained", [
    "Aortic Valve — CW Doppler", "Mitral Valve — PW/CW Doppler", "Tricuspid Valve — CW Doppler (TR Jet)",
    "Pulmonic Valve — PW/CW Doppler", "LVOT — PW Doppler",
    "Mitral Annulus — Tissue Doppler (Septal & Lateral e′)", "Pulmonary Vein — PW Doppler",
    "Color Flow — IAS & IVS", "Color Flow — All Valves"
  ], 2, 2);

  // Section 3: 2D Image Quality
  const s3 = await insertSection(tid, "2D Image Quality", "Assessment of 2D image acquisition quality", 3);
  await radio(tid, s3, "Were all required 2D views obtained or attempted?", YES_NO_NA, 1, 2);
  await radio(tid, s3, "Was image depth, gain, focus and sector width optimized?", YES_NO_NA, 2, 2);
  await radio(tid, s3, "Were harmonic imaging settings utilized appropriately?", YES_NO_NA, 3, 1);
  await radio(tid, s3, "Was contrast utilized when indicated?", YES_NO_NA, 4, 1);
  await radio(tid, s3, "Was the patient positioned appropriately for optimal image acquisition?", YES_NO_NA, 5, 1);
  await radio(tid, s3, "Was an effort made to better define any suboptimal views?", YES_NO_NA, 6, 1);
  await radio(tid, s3, "Were all required M-Mode views obtained?", YES_NO_NA, 7, 1);

  // Section 4: Measurements
  const s4 = await insertSection(tid, "Measurements Completeness & Accuracy", "Protocol measurements and accuracy assessment", 4);
  await radio(tid, s4, "Were all protocol measurements obtained?", YES_NO_NA, 1, 2);
  await radio(tid, s4, "Are 2D measurements placed accurately in the correct window location/angle/anatomy landmarks?", YES_NO_NA, 2, 2);
  await radio(tid, s4, "Does the study accurately measure ventricular function?", YES_NO_NA, 3, 2);
  await radio(tid, s4, "Did the PSAX View Left Ventricle include all appropriate image clips?", YES_NO_NA, 4, 1);
  await radio(tid, s4, "Are 2D and/or M-Mode EF measurements obtained accurately, in the correct ECG timing/cardiac cycle?", YES_NO_NA, 5, 2);
  await radio(tid, s4, "Are Simpson's EF Measurements placed accurately, in the correct ECG timing/Cardiac cycle and correlate with 2D images?", YES_NO_NA, 6, 2);
  await radio(tid, s4, "Are bi-plane volume measurements of the Left Atrium obtained accurately and in the correct ECG timing/cardiac cycle?", YES_NO_NA, 7, 1);
  await radio(tid, s4, "Are measurements placed accurately in the correct window location/angle/anatomy landmarks/ECG cycle? (Summary)", YES_NO_NA, 8, 2);

  // Section 5: Doppler Quality
  const s5 = await insertSection(tid, "Doppler Settings & Quality", "Spectral and color Doppler assessment", 5);
  await radio(tid, s5, "Are Doppler waveform settings correct (Baseline/PRF-Scale)?", YES_NO_NA, 1, 2);
  await radio(tid, s5, "Does the study demonstrate a forward flow spectrum for each of the valves?", YES_NO_NA, 2, 2);
  await radio(tid, s5, "Are Doppler sample volumes and measurement calipers placed in the correct location/angle consistently?", YES_NO_NA, 3, 2);
  await radio(tid, s5, "Were spectral envelope peaks clearly defined or attempted multiple times when difficult?", YES_NO_NA, 4, 1);
  await radio(tid, s5, "Does the study demonstrate color flow interrogation of all normal and abnormal flows within the heart?", YES_NO_NA, 5, 2);
  await radio(tid, s5, "Was Color Doppler utilized on both the IAS & IVS appropriately?", YES_NO_NA, 6, 1);
  await checkbox(tid, s5, "Was Diastolic Function/LAP evaluated appropriately?", [
    "E/A ratio obtained", "e′ tissue Doppler obtained (septal & lateral)", "E/e′ ratio calculated",
    "TR velocity obtained for RVSP", "LA volume indexed obtained", "Pulmonary vein Doppler obtained"
  ], 7, 2);
  await radio(tid, s5, "Was Pulmonary Vein Inflow Doppler measured/assessed properly (if applicable)?", YES_NO_NA, 8, 1);
  await checkbox(tid, s5, "Was Right Heart Function evaluated appropriately?", [
    "RV size assessed", "RV systolic function assessed (TAPSE/FAC)", "RVSP estimated via TR jet",
    "IVC size and collapsibility assessed", "Tissue Doppler RV annulus obtained"
  ], 9, 2);
  await radio(tid, s5, "Were TAPSE measurements performed accurately?", YES_NO_NA, 10, 1);
  await radio(tid, s5, "Was Tissue Doppler adequate and measured/assessed properly?", YES_NO_NA, 11, 1);

  // Section 6: Cardiac Evaluation
  const s6 = await insertSection(tid, "Cardiac Evaluation", "Valve and structural assessment", 6);
  await radio(tid, s6, "Is the Aortic Valve evaluated with 2D/Color/CW Doppler appropriately?", YES_NO_NA, 1, 2);
  await radio(tid, s6, "Is the LVOT sampled with PW Doppler in the correct location?", YES_NO_NA, 2, 2);
  await radio(tid, s6, "Is the Mitral Valve evaluated with 2D/Color/CW/PW Doppler appropriately?", YES_NO_NA, 3, 2);
  await radio(tid, s6, "Is the Tricuspid Valve evaluated with 2D/Color/CW Doppler appropriately?", YES_NO_NA, 4, 2);
  await radio(tid, s6, "Is the Pulmonic Valve evaluated with 2D/Color/PW Doppler appropriately?", YES_NO_NA, 5, 1);
  await radio(tid, s6, "Was CW Pedoff utilized when indicated?", YES_NO_NA, 6, 1);
  await radio(tid, s6, "Is the Pedoff CW spectral envelope complete and well-defined?", YES_NO_NA, 7, 1);
  await radio(tid, s6, "Is the Pedoff CW Doppler labelled with the correct valve?", YES_NO_NA, 8, 1);
  await radio(tid, s6, "Was PISA/ERO evaluated when indicated?", YES_NO_NA, 9, 1);
  await radio(tid, s6, "Are PISA/ERO measurements accurate?", YES_NO_NA, 10, 1);
  await radio(tid, s6, "Is LV Global Longitudinal Strain (GLS) performed correctly when indicated?", YES_NO_NA, 11, 1);

  // Section 7: IAC Compliance
  const s7 = await insertSection(tid, "IAC Compliance Assessment", "Overall IAC acceptability determination", 7);
  await select(tid, s7, "IAC Compliance Rating", [
    "IAC Acceptable — No deficiencies",
    "IAC Acceptable — Minor deficiencies noted",
    "Not IAC Acceptable — Major deficiencies",
    "N/A — Non-IAC lab"
  ], 1, 1);
  await textarea(tid, s7, "Deficiencies / Comments", 2, 0, "Describe any deficiencies or areas for improvement...");

  // Section 8: Summary
  const s8 = await insertSection(tid, "Summary & Overall Assessment", "Final reviewer assessment and recommendations", 8);
  await radio(tid, s8, "Does the study accurately document pathology when present?", YES_NO_NA, 1, 2);
  await radio(tid, s8, "Does the study answer the clinical question?", YES_NO_NA, 2, 2);
  await radio(tid, s8, "Is the sonographer's assessment concordant with the physician's final interpretation?", YES_NO_NA, 3, 2);
  await radio(tid, s8, "Is the study comparable to previous studies when available?", YES_NO_NA, 4, 1);
  await select(tid, s8, "Overall Quality Rating", QUALITY_SCALE, 5, 1);
  await textarea(tid, s8, "Reviewer Comments & Recommendations", 6, 0, "Enter overall feedback, commendations, or areas for improvement...");
  await text(tid, s8, "Reviewer Name / Credentials", 7, 1);

  console.log(`  ✓ IQR template created (id=${tid}, 8 sections)`);
}

// ─── TEMPLATE 2: Sonographer Peer Review ─────────────────────────────────────

async function seedSonographerPeerReview() {
  const name = "Sonographer Peer Review";
  const existing = await templateExists(name);
  if (existing) { console.log(`  ✓ Sonographer Peer Review already exists (id=${existing})`); return; }
  const tid = await insertTemplate(name,
    "Peer review of sonographer performance covering image quality, protocol compliance, measurements, Doppler, and cardiac evaluation. Used for ongoing competency assessment.",
    "peer_review");

  const s1 = await insertSection(tid, "Exam Information", null, 1);
  await text(tid, s1, "Sonographer Being Reviewed", 1, 1);
  await text(tid, s1, "Reviewer Name", 2, 1);
  await text(tid, s1, "Review Date", 3, 1);
  await text(tid, s1, "Exam Date", 4, 1);
  await select(tid, s1, "Exam Type", ["Adult TTE", "PETTE", "Fetal Echo", "TEE", "Stress Echo", "Limited/Follow-Up"], 5, 1);
  await select(tid, s1, "Exam Scope", ["Complete Exam", "Limited/Follow Up Exam"], 6, 1);

  const s2 = await insertSection(tid, "Protocol Compliance", "Views and protocol adherence", 2);
  await checkbox(tid, s2, "Standard Protocol Views Obtained", [
    "PLAX", "PSAX — AV Level", "PSAX — MV Level", "PSAX — Papillary Muscle",
    "Apical 4-Chamber", "Apical 2-Chamber", "Apical 3-Chamber/ALAX", "Apical 5-Chamber",
    "Subcostal 4-Chamber", "Subcostal IVC", "Suprasternal Notch"
  ], 1, 2);

  const s3 = await insertSection(tid, "Overall Image Quality", null, 3);
  await radio(tid, s3, "Was contrast/UAE used if it was appropriate to do so?", YES_NO_NA, 1, 1);
  await radio(tid, s3, "If contrast was used, were the settings appropriate?", YES_NO_NA, 2, 1);
  await radio(tid, s3, "Does the study demonstrate standard on-axis imaging planes?", YES_NO_NA, 3, 2);
  await radio(tid, s3, "Was an effort made to better define any suboptimal views?", YES_NO_NA, 4, 1);

  const s4 = await insertSection(tid, "Measurements / Accuracy", null, 4);
  await radio(tid, s4, "Were all protocol measurements obtained?", YES_NO_NA, 1, 2);
  await radio(tid, s4, "Does the study accurately measure ventricular function?", YES_NO_NA, 2, 2);

  const s5 = await insertSection(tid, "Doppler Quality", null, 5);
  await radio(tid, s5, "Are Doppler waveform settings correct (Baseline/PRF-Scale)?", YES_NO_NA, 1, 2);
  await radio(tid, s5, "Does the study demonstrate a forward flow spectrum for each of the valves?", YES_NO_NA, 2, 2);
  await radio(tid, s5, "Are Doppler sample volumes and measurement calipers placed in the correct location/angle consistently?", YES_NO_NA, 3, 2);
  await radio(tid, s5, "Does the study demonstrate color flow interrogation of all normal and abnormal flows?", YES_NO_NA, 4, 2);
  await checkbox(tid, s5, "Was Diastolic Function/LAP evaluated appropriately?", [
    "E/A ratio", "Tissue Doppler e′", "E/e′ ratio", "TR velocity", "LA volume", "Pulmonary vein Doppler"
  ], 5, 2);
  await radio(tid, s5, "Was Pulmonary Vein Inflow Doppler measured/assessed properly (if applicable)?", YES_NO_NA, 6, 1);
  await checkbox(tid, s5, "Was Right Heart Function evaluated appropriately?", [
    "RV size", "RV systolic function (TAPSE/FAC)", "RVSP via TR jet", "IVC size/collapsibility"
  ], 7, 2);

  const s6 = await insertSection(tid, "Cardiac Evaluation", null, 6);
  await radio(tid, s6, "Is the Aortic Valve evaluated with 2D/Color/CW Doppler appropriately?", YES_NO_NA, 1, 2);
  await radio(tid, s6, "Is the Mitral Valve evaluated with 2D/Color/CW/PW Doppler appropriately?", YES_NO_NA, 2, 2);
  await radio(tid, s6, "Is the Tricuspid Valve evaluated with 2D/Color/CW Doppler appropriately?", YES_NO_NA, 3, 2);
  await radio(tid, s6, "Is the Pulmonic Valve evaluated with 2D/Color/PW Doppler appropriately?", YES_NO_NA, 4, 1);
  await radio(tid, s6, "Is the Pericardium evaluated appropriately?", YES_NO_NA, 5, 1);

  const s7 = await insertSection(tid, "Professionalism & Communication", null, 7);
  await radio(tid, s7, "Was the sonographer professional and courteous with the patient?", YES_NO_NA, 1, 1);
  await radio(tid, s7, "Was the exam completed in a timely manner?", YES_NO_NA, 2, 1);
  await radio(tid, s7, "Was the preliminary report/worksheet completed accurately?", YES_NO_NA, 3, 1);

  const s8 = await insertSection(tid, "Summary & Recommendations", null, 8);
  await select(tid, s8, "Overall Performance Rating", QUALITY_SCALE, 1, 1);
  await textarea(tid, s8, "Strengths Observed", 2, 0, "Describe areas where the sonographer performed well...");
  await textarea(tid, s8, "Areas for Improvement", 3, 0, "Describe specific areas needing improvement...");
  await textarea(tid, s8, "Action Plan / Follow-Up Required", 4, 0, "Describe any required follow-up, training, or re-review...");
  await text(tid, s8, "Reviewer Signature / Credentials", 5, 1);

  console.log(`  ✓ Sonographer Peer Review created (id=${tid}, 8 sections)`);
}

// ─── TEMPLATE 3: Physician / Over-Read Peer Review ───────────────────────────

async function seedPhysicianPeerReview() {
  const name = "Physician / Over-Read Peer Review";
  const existing = await templateExists(name);
  if (existing) { console.log(`  ✓ Physician Peer Review already exists (id=${existing})`); return; }
  const tid = await insertTemplate(name,
    "Physician over-read peer review comparing original interpretation with peer reviewer findings across LV function, valve disease, hemodynamics, and clinical correlation.",
    "physician_peer_review");

  const s1 = await insertSection(tid, "Case Information", null, 1);
  await text(tid, s1, "Reviewing Physician Name / Credentials", 1, 1);
  await text(tid, s1, "Original Interpreting Physician", 2, 1);
  await text(tid, s1, "Review Date", 3, 1);
  await text(tid, s1, "Exam Date", 4, 1);
  await select(tid, s1, "Exam Type", ["Adult TTE", "PETTE", "Fetal Echo", "TEE", "Stress Echo", "Limited/Follow-Up"], 5, 1);
  await select(tid, s1, "Exam Scope", ["Complete Exam", "Limited/Follow Up Exam"], 6, 1);

  const s2 = await insertSection(tid, "Left Ventricular Function", "Comparison of LV function parameters", 2);
  const LV_SIZE = ["Normal", "Mildly Enlarged", "Moderately Enlarged", "Severely Enlarged", "Unable to Assess"];
  const LV_EF = ["Normal (≥55%)", "Mildly Reduced (45-54%)", "Moderately Reduced (30-44%)", "Severely Reduced (<30%)", "Unable to Assess"];
  const DIASTOLIC = ["Normal", "Grade I (Impaired Relaxation)", "Grade II (Pseudonormal)", "Grade III (Restrictive)", "Indeterminate", "Unable to Assess"];
  await select(tid, s2, "LV Size (Original)", LV_SIZE, 1, 0);
  await select(tid, s2, "LV Size (Reviewer)", LV_SIZE, 2, 0);
  await select(tid, s2, "LV Systolic Function / EF (Original)", LV_EF, 3, 0);
  await select(tid, s2, "LV Systolic Function / EF (Reviewer)", LV_EF, 4, 0);
  await select(tid, s2, "Diastolic Function (Original)", DIASTOLIC, 5, 0);
  await select(tid, s2, "Diastolic Function (Reviewer)", DIASTOLIC, 6, 0);
  const RWMA = ["None", "Present — Anterior", "Present — Inferior", "Present — Lateral", "Present — Septal", "Present — Posterior", "Present — Multiple Territories"];
  await select(tid, s2, "RWMA (Original)", RWMA, 7, 0);
  await select(tid, s2, "RWMA (Reviewer)", RWMA, 8, 0);

  const s3 = await insertSection(tid, "Right Ventricular Function", null, 3);
  const RV_SIZE = ["Normal", "Mildly Enlarged", "Moderately Enlarged", "Severely Enlarged", "Unable to Assess"];
  const RV_FX = ["Normal", "Mildly Reduced", "Moderately Reduced", "Severely Reduced", "Unable to Assess"];
  await select(tid, s3, "RV Size (Original)", RV_SIZE, 1, 0);
  await select(tid, s3, "RV Size (Reviewer)", RV_SIZE, 2, 0);
  await select(tid, s3, "RV Systolic Function (Original)", RV_FX, 3, 0);
  await select(tid, s3, "RV Systolic Function (Reviewer)", RV_FX, 4, 0);

  const s4 = await insertSection(tid, "Valve Disease", "Stenosis and regurgitation comparison", 4);
  const SEVERITY = ["None/Trivial", "Mild", "Moderate", "Severe", "Unable to Assess"];
  const valves = ["Aortic Stenosis", "Aortic Insufficiency/AR", "Mitral Stenosis", "Mitral Regurgitation", "Tricuspid Stenosis", "Tricuspid Regurgitation", "Pulmonic Stenosis", "Pulmonic Insufficiency"];
  for (let i = 0; i < valves.length; i++) {
    await select(tid, s4, `${valves[i]} (Original)`, SEVERITY, i * 2 + 1, 0);
    await select(tid, s4, `${valves[i]} (Reviewer)`, SEVERITY, i * 2 + 2, 0);
  }

  const s5 = await insertSection(tid, "Hemodynamics", null, 5);
  const RVSP = ["<35 mmHg (Normal)", "35-50 mmHg (Mild Elevation)", "50-70 mmHg (Moderate Elevation)", ">70 mmHg (Severe Elevation)", "Unable to Estimate"];
  await select(tid, s5, "RVSP Estimate (Original)", RVSP, 1, 0);
  await select(tid, s5, "RVSP Estimate (Reviewer)", RVSP, 2, 0);

  const s6 = await insertSection(tid, "Clinical Correlation & Concordance", null, 6);
  await radio(tid, s6, "Is the peer reviewer's interpretation concordant with the original interpretation?", [
    "Concordant — No significant differences",
    "Minor Discordance — Clinically insignificant differences",
    "Major Discordance — Clinically significant differences"
  ], 1, 3);
  await textarea(tid, s6, "Description of Discordance (if any)", 2, 0, "Describe specific differences between original and reviewer interpretation...");
  await radio(tid, s6, "Does the original report answer the clinical question?", YES_NO_NA, 3, 2);
  await radio(tid, s6, "Is the report complete, accurate, and appropriately formatted?", YES_NO_NA, 4, 2);
  await select(tid, s6, "Overall Report Quality", QUALITY_SCALE, 5, 1);
  await textarea(tid, s6, "Reviewer Comments & Recommendations", 6, 0, "Enter overall feedback and any recommended actions...");

  console.log(`  ✓ Physician Peer Review created (id=${tid}, 6 sections)`);
}

// ─── TEMPLATE 4: Case Mix Submission ─────────────────────────────────────────

async function seedCaseMix() {
  const name = "Case Mix Submission";
  const existing = await templateExists(name);
  if (existing) { console.log(`  ✓ Case Mix Submission already exists (id=${existing})`); return; }
  const tid = await insertTemplate(name,
    "Accreditation case mix submission tracking the distribution of exam types, pathology, and special studies required for IAC/ICAEL accreditation.",
    "case_mix");

  const s1 = await insertSection(tid, "Submission Information", null, 1);
  await text(tid, s1, "Lab / Facility Name", 1, 1);
  await text(tid, s1, "Submission Period (e.g., Jan 2025 – Dec 2025)", 2, 1);
  await text(tid, s1, "Accreditation Body (IAC / ICAEL / Other)", 3, 1);
  await text(tid, s1, "Accreditation Application Number", 4, 0);
  await text(tid, s1, "Submitted By", 5, 1);
  await text(tid, s1, "Submission Date", 6, 1);

  const s2 = await insertSection(tid, "Adult TTE Case Mix", "Required case distribution for Adult Echocardiography accreditation", 2);
  await heading(tid, s2, "Minimum Requirements: 150 complete TTE exams in the submission period", 1);
  await text(tid, s2, "Total Adult TTE Exams Performed", 2, 1, "Enter total count");
  await text(tid, s2, "Normal Studies (count)", 3, 1);
  await text(tid, s2, "LV Systolic Dysfunction — Mild (count)", 4, 0);
  await text(tid, s2, "LV Systolic Dysfunction — Moderate (count)", 5, 0);
  await text(tid, s2, "LV Systolic Dysfunction — Severe (count)", 6, 0);
  await text(tid, s2, "Diastolic Dysfunction (count)", 7, 0);
  await text(tid, s2, "Aortic Stenosis (count)", 8, 0);
  await text(tid, s2, "Aortic Regurgitation (count)", 9, 0);
  await text(tid, s2, "Mitral Stenosis (count)", 10, 0);
  await text(tid, s2, "Mitral Regurgitation (count)", 11, 0);
  await text(tid, s2, "Tricuspid Regurgitation (count)", 12, 0);
  await text(tid, s2, "Pericardial Effusion / Tamponade (count)", 13, 0);
  await text(tid, s2, "Cardiomyopathy (count)", 14, 0);
  await text(tid, s2, "Congenital Heart Disease in Adults (count)", 15, 0);
  await text(tid, s2, "Mass / Thrombus (count)", 16, 0);
  await text(tid, s2, "Prosthetic Valve (count)", 17, 0);
  await text(tid, s2, "Contrast Studies (count)", 18, 0);

  const s3 = await insertSection(tid, "TEE Case Mix", "Required case distribution for TEE accreditation", 3);
  await heading(tid, s3, "Minimum Requirements: 50 complete TEE exams in the submission period", 1);
  await text(tid, s3, "Total TEE Exams Performed", 2, 1);
  await text(tid, s3, "Intraoperative TEE (count)", 3, 0);
  await text(tid, s3, "Diagnostic TEE (count)", 4, 0);
  await text(tid, s3, "Structural Heart Procedure Guidance (count)", 5, 0);
  await text(tid, s3, "Atrial Fibrillation / LAA Thrombus Evaluation (count)", 6, 0);
  await text(tid, s3, "Endocarditis / Valve Disease (count)", 7, 0);
  await text(tid, s3, "Aortic Disease (count)", 8, 0);

  const s4 = await insertSection(tid, "Stress Echo Case Mix", "Required case distribution for Stress Echo accreditation", 4);
  await heading(tid, s4, "Minimum Requirements: 50 complete Stress Echo exams in the submission period", 1);
  await text(tid, s4, "Total Stress Echo Exams Performed", 2, 1);
  await text(tid, s4, "Exercise Stress Echo (count)", 3, 0);
  await text(tid, s4, "Dobutamine Stress Echo (DSE) (count)", 4, 0);
  await text(tid, s4, "Normal / Negative Studies (count)", 5, 0);
  await text(tid, s4, "Abnormal / Positive Studies (count)", 6, 0);
  await text(tid, s4, "Indeterminate Studies (count)", 7, 0);

  const s5 = await insertSection(tid, "Pediatric & Fetal Echo Case Mix", "Required case distribution for Pediatric/Fetal accreditation", 5);
  await heading(tid, s5, "Minimum Requirements: 100 complete Pediatric TTE or 50 Fetal Echo exams", 1);
  await text(tid, s5, "Total Pediatric TTE Exams Performed", 2, 0);
  await text(tid, s5, "Total Fetal Echo Exams Performed", 3, 0);
  await text(tid, s5, "Normal Studies (count)", 4, 0);
  await text(tid, s5, "Congenital Heart Disease — Simple (count)", 5, 0);
  await text(tid, s5, "Congenital Heart Disease — Complex (count)", 6, 0);
  await text(tid, s5, "Fetal Arrhythmia (count)", 7, 0);
  await text(tid, s5, "Cardiomyopathy (count)", 8, 0);

  const s6 = await insertSection(tid, "Attestation & Certification", null, 6);
  await radio(tid, s6, "I attest that all cases submitted are actual patient studies performed at this facility during the stated submission period.", ["Yes — I attest", "No"], 1, 3);
  await radio(tid, s6, "All cases meet the minimum technical quality standards for the accreditation body.", YES_NO, 2, 2);
  await textarea(tid, s6, "Additional Notes / Special Circumstances", 3, 0, "Describe any special circumstances, site exceptions, or additional information...");
  await text(tid, s6, "Authorized Signatory Name & Title", 4, 1);
  await text(tid, s6, "Date of Attestation", 5, 1);

  console.log(`  ✓ Case Mix Submission created (id=${tid}, 6 sections)`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log("Seeding form templates...");
try {
  await seedIQR();
  await seedSonographerPeerReview();
  await seedPhysicianPeerReview();
  await seedCaseMix();
  console.log("\n✅ All templates seeded successfully.");
} catch (err) {
  console.error("❌ Seed error:", err);
  process.exit(1);
} finally {
  await conn.end();
}
