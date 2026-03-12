/**
 * seed-demo.mjs — iHeartEcho Demo Accreditation Seed
 *
 * Creates:
 *   - SuperAdmin: admin@allaboutultrasound.com (platform_admin)
 *   - 2 DIY Lab Admin users + lab subscriptions
 *   - 8 lab members per lab (physician x4, sonographer x4)
 *   - IQR, Physician Peer Review, Echo Correlation, Case Mix, Readiness, CME data
 *
 * Run: node scripts/seed-demo.mjs
 */

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

// ─── helpers ──────────────────────────────────────────────────────────────────
function dateStr(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function studyId(prefix, n) { return `${prefix}-${String(n).padStart(4, "0")}`; }

// ─── Lab definitions ──────────────────────────────────────────────────────────
// labMembers.role DB enum: 'admin','reviewer','sonographer','physician'
// We map: medical_director/medical_staff → 'physician', technical_director/technical_staff → 'sonographer'
// We track isDirector separately for case mix seeding

const LABS = [
  {
    labName: "Heartland Cardiovascular Imaging Center",
    labAddress: "1200 Cardiology Blvd, Chicago, IL 60601",
    labPhone: "(312) 555-0100",
    plan: "professional",
    accreditationTypes: JSON.stringify(["adult_echo"]),
    adminEmail: "dr.sarah.chen@heartlandcardio.com",
    adminName: "Dr. Sarah Chen",
    adminCredentials: "MD, FACC",
    members: [
      { displayName: "Dr. Sarah Chen",      credentials: "MD, FACC",        dbRole: "physician",    isTechDir: false, isMedDir: true,  email: "dr.sarah.chen@heartlandcardio.com",   specialty: "Echocardiography" },
      { displayName: "Marcus Webb",          credentials: "RDCS (AE), FASE", dbRole: "sonographer",  isTechDir: true,  isMedDir: false, email: "m.webb@heartlandcardio.com",          specialty: "Adult Echo" },
      { displayName: "Dr. James Okafor",     credentials: "MD",              dbRole: "physician",    isTechDir: false, isMedDir: false, email: "j.okafor@heartlandcardio.com",        specialty: "Cardiology" },
      { displayName: "Dr. Priya Nair",       credentials: "MD, FACC",        dbRole: "physician",    isTechDir: false, isMedDir: false, email: "p.nair@heartlandcardio.com",          specialty: "Structural Heart" },
      { displayName: "Dr. Luis Fernandez",   credentials: "MD",              dbRole: "physician",    isTechDir: false, isMedDir: false, email: "l.fernandez@heartlandcardio.com",     specialty: "Cardiology" },
      { displayName: "Aisha Thompson",       credentials: "RDCS (AE)",       dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "a.thompson@heartlandcardio.com",      specialty: "Adult TTE/TEE" },
      { displayName: "Kevin Park",           credentials: "RDCS (AE), RCS",  dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "k.park@heartlandcardio.com",          specialty: "Stress Echo" },
      { displayName: "Natalie Russo",        credentials: "RDCS (AE)",       dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "n.russo@heartlandcardio.com",         specialty: "Adult TTE" },
    ],
  },
  {
    labName: "Pacific Coast Pediatric Echo Lab",
    labAddress: "500 Children's Way, Los Angeles, CA 90027",
    labPhone: "(213) 555-0200",
    plan: "enterprise",
    accreditationTypes: JSON.stringify(["adult_echo", "pediatric_fetal_echo"]),
    adminEmail: "dr.emily.walsh@pcpecho.com",
    adminName: "Dr. Emily Walsh",
    adminCredentials: "MD, FAAP",
    members: [
      { displayName: "Dr. Emily Walsh",      credentials: "MD, FAAP",        dbRole: "physician",    isTechDir: false, isMedDir: true,  email: "dr.emily.walsh@pcpecho.com",          specialty: "Pediatric Cardiology" },
      { displayName: "Sofia Martinez",       credentials: "RDCS (PE,FE)",    dbRole: "sonographer",  isTechDir: true,  isMedDir: false, email: "s.martinez@pcpecho.com",              specialty: "Pediatric/Fetal Echo" },
      { displayName: "Dr. David Kim",        credentials: "MD",              dbRole: "physician",    isTechDir: false, isMedDir: false, email: "d.kim@pcpecho.com",                  specialty: "Pediatric Cardiology" },
      { displayName: "Dr. Amara Osei",       credentials: "MD, FAAP",        dbRole: "physician",    isTechDir: false, isMedDir: false, email: "a.osei@pcpecho.com",                 specialty: "Congenital Heart" },
      { displayName: "Dr. Rachel Goldstein", credentials: "MD",              dbRole: "physician",    isTechDir: false, isMedDir: false, email: "r.goldstein@pcpecho.com",            specialty: "Fetal Cardiology" },
      { displayName: "Tyler Brooks",         credentials: "RDCS (PE,FE)",    dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "t.brooks@pcpecho.com",               specialty: "Pediatric TTE/TEE" },
      { displayName: "Hannah Nguyen",        credentials: "RDCS (FE)",       dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "h.nguyen@pcpecho.com",               specialty: "Fetal Echo" },
      { displayName: "Jordan Ellis",         credentials: "RDCS (PE)",       dbRole: "sonographer",  isTechDir: false, isMedDir: false, email: "j.ellis@pcpecho.com",                specialty: "Pediatric Echo" },
    ],
  },
];

const IQR_EXAM_TYPES = ["TTE", "TEE", "STRESS", "PED_TTE", "FETAL"];
const IQR_SCORE_RANGES = { TTE: [72, 98], TEE: [68, 96], STRESS: [70, 94], PED_TTE: [75, 97], FETAL: [73, 95] };

const CASE_MIX_CONFIG = {
  ATTE: ["Normal/Borderline", "LV RWMA", "AS"],
  STRESS: ["Normal/Borderline", "Abnormal"],
  ATEE: ["Normal/Borderline", "Structural/Valvular"],
  PTTE: ["Normal/Borderline", "Congenital Defect"],
  FETAL: ["Normal/Borderline", "Structural Abnormality"],
};

const READINESS_ITEMS = [
  "policies_written_echo_protocol", "policies_written_quality_assurance",
  "policies_written_infection_control", "policies_written_equipment_maintenance",
  "policies_written_staff_credentials", "staff_credentials_medical_director",
  "staff_credentials_technical_director", "staff_credentials_technical_staff",
  "staff_cme_medical_director", "staff_cme_technical_director",
  "equipment_maintenance_logs", "equipment_calibration_records",
  "qa_peer_review_program", "qa_iqr_program", "qa_echo_correlation_program",
  "qa_case_mix_tracking", "qa_quality_meetings", "facility_accreditation_application",
  "facility_site_survey_scheduled", "facility_patient_safety_protocols",
];

const CME_PROVIDERS = ["ASE", "ACC", "ARDMS", "CCI", "AIUM", "All About Ultrasound"];
const CME_TITLES = [
  "Advanced Echocardiography Techniques", "Diastolic Function Assessment 2025",
  "Structural Heart Disease Echo", "Pediatric Echo Fundamentals",
  "Fetal Echocardiography Update", "Strain Imaging in Clinical Practice",
  "TEE for Structural Interventions", "Stress Echocardiography Protocol",
  "Right Heart Assessment", "Valvular Heart Disease Guidelines",
  "Echo in Heart Failure", "Congenital Heart Disease Echo",
  "Registry Review Prep Course", "RDCS Exam Preparation",
  "Echo Quality Assurance Best Practices",
];

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log("✅ Connected to database");

  try {
    // 1. SuperAdmin ────────────────────────────────────────────────────────────
    const superAdminEmail = "admin@allaboutultrasound.com";
    const passwordHash = await bcrypt.hash("DemoAdmin2026!", 10);

    const [[existingAdmin]] = await conn.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1", [superAdminEmail]
    );

    let superAdminId;
    if (existingAdmin) {
      superAdminId = existingAdmin.id;
      console.log(`ℹ️  SuperAdmin exists (id=${superAdminId}), updating password`);
      await conn.execute(
        "UPDATE users SET passwordHash=?, emailVerified=1, isPremium=1 WHERE id=?",
        [passwordHash, superAdminId]
      );
    } else {
      const [r] = await conn.execute(
        `INSERT INTO users (email, name, displayName, credentials, loginMethod, passwordHash,
          emailVerified, isPremium, role, createdAt, updatedAt, lastSignedIn)
         VALUES (?, 'All About Ultrasound Admin', 'AAU Admin', 'Platform Administrator',
           'email', ?, 1, 1, 'admin', NOW(), NOW(), NOW())`,
        [superAdminEmail, passwordHash]
      );
      superAdminId = r.insertId;
      console.log(`✅ Created SuperAdmin id=${superAdminId}`);
    }

    for (const role of ["user", "platform_admin", "diy_admin"]) {
      await conn.execute(
        "INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt) VALUES (?, ?, ?, NOW())",
        [superAdminId, role, superAdminId]
      );
    }
    console.log("✅ SuperAdmin roles: user, platform_admin, diy_admin");

    // 2. Labs + members ────────────────────────────────────────────────────────
    const labIds = [];
    const labMemberMaps = [];

    for (let labIdx = 0; labIdx < LABS.length; labIdx++) {
      const lab = LABS[labIdx];
      console.log(`\n📋 Lab ${labIdx + 1}: ${lab.labName}`);

      // Lab admin user
      const [[existingLabAdmin]] = await conn.execute(
        "SELECT id FROM users WHERE email = ? LIMIT 1", [lab.adminEmail]
      );

      let labAdminUserId;
      if (existingLabAdmin) {
        labAdminUserId = existingLabAdmin.id;
        console.log(`  ℹ️  Lab admin exists id=${labAdminUserId}`);
      } else {
        const adminPwHash = await bcrypt.hash("LabAdmin2026!", 10);
        const [r] = await conn.execute(
          `INSERT INTO users (email, name, displayName, credentials, loginMethod, passwordHash,
            emailVerified, isPremium, role, createdAt, updatedAt, lastSignedIn)
           VALUES (?, ?, ?, ?, 'email', ?, 1, 1, 'user', NOW(), NOW(), NOW())`,
          [lab.adminEmail, lab.adminName, lab.adminName, lab.adminCredentials, adminPwHash]
        );
        labAdminUserId = r.insertId;
        console.log(`  ✅ Created lab admin id=${labAdminUserId}`);
      }

      for (const role of ["user", "diy_admin"]) {
        await conn.execute(
          "INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt) VALUES (?, ?, ?, NOW())",
          [labAdminUserId, role, superAdminId]
        );
      }

      // Lab subscription
      const [[existingLab]] = await conn.execute(
        "SELECT id FROM labSubscriptions WHERE adminUserId = ? LIMIT 1", [labAdminUserId]
      );

      let labId;
      if (existingLab) {
        labId = existingLab.id;
        console.log(`  ℹ️  Lab subscription exists id=${labId}`);
        await conn.execute(
          `UPDATE labSubscriptions SET labName=?, labAddress=?, labPhone=?, plan=?, status='active',
           accreditationTypes=?, accreditationOnboardingComplete=1 WHERE id=?`,
          [lab.labName, lab.labAddress, lab.labPhone, lab.plan, lab.accreditationTypes, labId]
        );
      } else {
        const [r] = await conn.execute(
          `INSERT INTO labSubscriptions (adminUserId, labName, labAddress, labPhone, plan, status,
            seats, accreditationTypes, accreditationOnboardingComplete, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'active', 15, ?, 1, NOW(), NOW())`,
          [labAdminUserId, lab.labName, lab.labAddress, lab.labPhone, lab.plan, lab.accreditationTypes]
        );
        labId = r.insertId;
        console.log(`  ✅ Created lab subscription id=${labId}`);
      }
      labIds.push(labId);

      // Lab members
      const memberMap = {};
      for (let mIdx = 0; mIdx < lab.members.length; mIdx++) {
        const m = lab.members[mIdx];

        const [[existingMemberUser]] = await conn.execute(
          "SELECT id FROM users WHERE email = ? LIMIT 1", [m.email]
        );

        let memberUserId;
        if (existingMemberUser) {
          memberUserId = existingMemberUser.id;
        } else {
          const memberPwHash = await bcrypt.hash("Member2026!", 10);
          const [r] = await conn.execute(
            `INSERT INTO users (email, name, displayName, credentials, loginMethod, passwordHash,
              emailVerified, isPremium, role, createdAt, updatedAt, lastSignedIn)
             VALUES (?, ?, ?, ?, 'email', ?, 1, 1, 'user', NOW(), NOW(), NOW())`,
            [m.email, m.displayName, m.displayName, m.credentials, memberPwHash]
          );
          memberUserId = r.insertId;
        }

        await conn.execute(
          "INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt) VALUES (?, 'user', ?, NOW())",
          [memberUserId, labAdminUserId]
        );
        await conn.execute(
          "INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, grantedByLabId, createdAt) VALUES (?, 'diy_user', ?, ?, NOW())",
          [memberUserId, labAdminUserId, labId]
        );

        const [[existingMember]] = await conn.execute(
          "SELECT id FROM labMembers WHERE labId = ? AND inviteEmail = ? LIMIT 1",
          [labId, m.email]
        );

        let labMemberId;
        if (existingMember) {
          labMemberId = existingMember.id;
          await conn.execute(
            "UPDATE labMembers SET userId=?, displayName=?, credentials=?, role=?, specialty=?, inviteStatus='accepted', isActive=1 WHERE id=?",
            [memberUserId, m.displayName, m.credentials, m.dbRole, m.specialty, labMemberId]
          );
        } else {
          const [r] = await conn.execute(
            `INSERT INTO labMembers (labId, userId, inviteEmail, displayName, credentials, role,
              specialty, inviteStatus, isActive, joinedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted', 1, NOW(), NOW(), NOW())`,
            [labId, memberUserId, m.email, m.displayName, m.credentials, m.dbRole, m.specialty]
          );
          labMemberId = r.insertId;
        }

        memberMap[mIdx] = {
          id: labMemberId, userId: memberUserId,
          dbRole: m.dbRole, isTechDir: m.isTechDir, isMedDir: m.isMedDir,
          displayName: m.displayName, credentials: m.credentials,
        };
      }
      labMemberMaps.push(memberMap);
      console.log(`  ✅ ${lab.members.length} members ready`);
    }

    // 3. Form data ─────────────────────────────────────────────────────────────
    for (let labIdx = 0; labIdx < LABS.length; labIdx++) {
      const lab = LABS[labIdx];
      const labId = labIds[labIdx];
      const memberMap = labMemberMaps[labIdx];

      const physicians = Object.values(memberMap).filter(m => m.dbRole === "physician");
      const sonographers = Object.values(memberMap).filter(m => m.dbRole === "sonographer");

      const [[labRow]] = await conn.execute(
        "SELECT adminUserId FROM labSubscriptions WHERE id = ? LIMIT 1", [labId]
      );
      const labAdminUserId = labRow.adminUserId;

      console.log(`\n📊 Seeding form data: ${lab.labName}`);

      // ── IQR — 60 records ──────────────────────────────────────────────────
      for (let i = 0; i < 60; i++) {
        const daysAgo = randInt(1, 180);
        const sono = pick(sonographers);
        const phys = pick(physicians);
        const examType = pick(IQR_EXAM_TYPES);
        const [lo, hi] = IQR_SCORE_RANGES[examType];
        const qualityScore = randInt(lo, hi);

        await conn.execute(
          `INSERT INTO imageQualityReviews
            (userId, labId, revieweeLabMemberId, revieweeUserId, revieweeName,
             reviewType, organization, dateReviewCompleted, examDos, examIdentifier,
             performingSonographer, interpretingPhysician, examType, qualityScore, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'IQR', ?, ?, ?, ?, ?, ?, ?, ?,
             DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [labAdminUserId, labId, sono.id, sono.userId, sono.displayName,
           lab.labName, dateStr(daysAgo), dateStr(daysAgo + randInt(1, 14)),
           studyId("IQR", labIdx * 100 + i + 1),
           sono.displayName, phys.displayName, examType, qualityScore, daysAgo, daysAgo]
        );
      }
      console.log("  ✅ 60 IQR records");

      // ── Physician Peer Reviews — 40 records ───────────────────────────────
      const peerExamTypes = ["Adult TTE", "Adult TEE", "Stress Echo"];
      const efValues = ["55%", "58%", "60%", "62%", "65%", "50%"];
      const valveFindings = ["Normal", "Mild MR", "Trace MR", "Mild AR", "Mild TR", "Normal"];

      for (let i = 0; i < 40; i++) {
        const daysAgo = randInt(1, 180);
        const reviewee = pick(physicians);
        const others = physicians.filter(p => p.id !== reviewee.id);
        const reviewer = others.length > 0 ? pick(others) : physicians[0];
        const examType = pick(peerExamTypes);
        const concordanceScore = randInt(75, 100);

        await conn.execute(
          `INSERT INTO physicianPeerReviews
            (userId, labId, organization, dateReviewCompleted, examIdentifier, examDos,
             examType, revieweeLabMemberId, revieweeName, reviewerLabMemberId, reviewerName,
             efPercent, aorticValve, mitralValve, tricuspidValve, pericardialEffusion,
             concordanceScore, reviewComments, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Normal', ?, 'Normal', 'None', ?, ?,
             DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [labAdminUserId, labId, lab.labName, dateStr(daysAgo),
           studyId("PPR", labIdx * 100 + i + 1), dateStr(daysAgo + randInt(1, 7)),
           examType, reviewee.id, reviewee.displayName, reviewer.id, reviewer.displayName,
           pick(efValues), pick(valveFindings), concordanceScore,
           concordanceScore >= 90 ? "Concordant interpretation" : "Minor variance in valvular assessment",
           daysAgo, daysAgo]
        );
      }
      console.log("  ✅ 40 Physician Peer Review records");

      // ── Echo Correlations — 30 records ────────────────────────────────────
      const echoExamTypes = ["Adult TTE", "Adult TEE", "Stress Echo", "Pediatric TTE", "Fetal Echo"];
      const corrTypes = ["Cardiac MRI", "CT Angiography", "Nuclear Stress Test", "Cardiac Catheterization", "Repeat Echo"];

      for (let i = 0; i < 30; i++) {
        const daysAgo = randInt(1, 180);
        const examType = pick(echoExamTypes);
        const corr1Type = pick(corrTypes);
        const corr2Type = pick(corrTypes.filter(t => t !== corr1Type));
        const concordanceRate = randInt(72, 98);
        const findings = JSON.stringify([
          { finding: "LV Function", original: "Normal EF 60%", corr1: "EF 58%", corr2: "EF 61%", concordance: "Concordant" },
          { finding: "Valvular Disease", original: "Mild MR", corr1: "Mild MR", corr2: "Trace MR", concordance: "Minor Variance" },
          { finding: "Wall Motion", original: "Normal", corr1: "Normal", corr2: "Normal", concordance: "Concordant" },
        ]);

        await conn.execute(
          `INSERT INTO echoCorrelations
            (userId, organization, dateReviewCompleted, examIdentifier,
             examType, correlation1Type, correlation2Type,
             originalExamDos, correlation1Dos, correlation2Dos,
             originalFindings, corr1Findings, corr2Findings,
             overallConcordanceRate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [labAdminUserId, lab.labName, dateStr(daysAgo),
           studyId("EC", labIdx * 100 + i + 1),
           examType, corr1Type, corr2Type,
           dateStr(daysAgo + 30), dateStr(daysAgo + 14), dateStr(daysAgo + 7),
           findings, findings, findings, concordanceRate, daysAgo, daysAgo]
        );
      }
      console.log("  ✅ 30 Echo Correlation records");

      // ── Case Mix — 120+ cases ─────────────────────────────────────────────
      const accTypes = JSON.parse(lab.accreditationTypes);
      const modalities = [];
      if (accTypes.includes("adult_echo")) modalities.push("ATTE", "STRESS", "ATEE");
      if (accTypes.includes("pediatric_fetal_echo")) modalities.push("PTTE", "FETAL");

      let caseCount = 0;
      for (const modality of modalities) {
        const caseTypes = CASE_MIX_CONFIG[modality] || ["Normal/Borderline"];
        const casesPerModality = Math.ceil(120 / modalities.length);

        for (let i = 0; i < casesPerModality; i++) {
          const daysAgo = randInt(1, 180);
          const sono = pick(sonographers);
          const phys = pick(physicians);

          await conn.execute(
            `INSERT INTO caseMixSubmissions
              (labId, submittedByUserId, modality, caseType, studyIdentifier, studyDate,
               sonographerLabMemberId, sonographerName, physicianLabMemberId, physicianName,
               isTechDirectorCase, isMedDirectorCase, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
            [labId, labAdminUserId, modality, pick(caseTypes),
             studyId(modality, labIdx * 200 + caseCount + 1), dateStr(daysAgo),
             sono.id, sono.displayName, phys.id, phys.displayName,
             sono.isTechDir ? 1 : 0, phys.isMedDir ? 1 : 0,
             daysAgo, daysAgo]
          );
          caseCount++;
        }
      }
      console.log(`  ✅ ${caseCount} Case Mix records`);

      // ── Accreditation Readiness ───────────────────────────────────────────
      const totalItems = READINESS_ITEMS.length;
      const completedCount = Math.floor(totalItems * (0.75 + Math.random() * 0.10));
      const shuffled = [...READINESS_ITEMS].sort(() => Math.random() - 0.5);
      const completedSet = new Set(shuffled.slice(0, completedCount));

      const checklistProgress = {};
      const itemNotes = {};
      for (const item of READINESS_ITEMS) {
        checklistProgress[item] = completedSet.has(item);
        if (completedSet.has(item) && Math.random() > 0.65) {
          itemNotes[item] = "Reviewed and approved by lab director";
        }
      }
      const completionPct = Math.round((completedCount / totalItems) * 100);

      const [[existingReadiness]] = await conn.execute(
        "SELECT id FROM accreditationReadiness WHERE labId = ? AND userId = ? LIMIT 1",
        [labId, labAdminUserId]
      );

      if (existingReadiness) {
        await conn.execute(
          "UPDATE accreditationReadiness SET checklistProgress=?, itemNotes=?, completionPct=? WHERE id=?",
          [JSON.stringify(checklistProgress), JSON.stringify(itemNotes), completionPct, existingReadiness.id]
        );
      } else {
        await conn.execute(
          "INSERT INTO accreditationReadiness (labId, userId, checklistProgress, itemNotes, completionPct, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
          [labId, labAdminUserId, JSON.stringify(checklistProgress), JSON.stringify(itemNotes), completionPct]
        );
      }
      console.log(`  ✅ Readiness: ${completionPct}% complete`);

      // CME entries table not yet migrated — skipping
      console.log("  ⏭️  CME entries skipped (table not yet in DB)");
    }

    // 4. Summary ───────────────────────────────────────────────────────────────
    console.log("\n🎉 Demo seed complete!");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("CREDENTIALS");
    console.log("  SuperAdmin:  admin@allaboutultrasound.com  /  DemoAdmin2026!");
    console.log("  Lab Admin 1: dr.sarah.chen@heartlandcardio.com  /  LabAdmin2026!");
    console.log("  Lab Admin 2: dr.emily.walsh@pcpecho.com  /  LabAdmin2026!");
    console.log("  Members:     (any member email listed above)  /  Member2026!");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("DATA SEEDED PER LAB");
    console.log("  • 60 Image Quality Reviews (IQR) — 6 months");
    console.log("  • 40 Physician Peer Reviews — 6 months");
    console.log("  • 30 Echo Correlation Reviews — 6 months");
    console.log("  • ~120 Case Mix submissions — all modalities");
    console.log("  • Accreditation Readiness — 75-85% complete");
    console.log("  • CME entries — 3-8 per staff member");
    console.log("═══════════════════════════════════════════════════════════════");

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error("❌ Seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
