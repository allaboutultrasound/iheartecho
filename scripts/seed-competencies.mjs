import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get org ID
const [[orgRow]] = await conn.execute("SELECT id FROM educatorOrgs WHERE slug = 'iheartecho-demo'");
const orgId = orgRow.id;
console.log('orgId:', orgId);

// Get competency IDs
const [comps] = await conn.execute("SELECT id, title FROM educatorCompetencies WHERE orgId = ? ORDER BY id", [orgId]);
console.log('Competencies:', comps.map(c => `${c.id}: ${c.title}`).join('\n'));

// Get student user IDs
const [students] = await conn.execute("SELECT id, name FROM users WHERE email LIKE '%demo.iheartecho.com' ORDER BY id");
console.log('Students:', students.map(s => `${s.id}: ${s.name}`).join('\n'));

const compMap = {};
for (const c of comps) compMap[c.title] = c.id;

const studentMap = {};
for (const s of students) studentMap[s.name] = s.id;

// Check if competency records already exist
const [existing] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorStudentCompetencies WHERE orgId = ?", [orgId]);
console.log('Existing competency records:', existing[0].cnt);

if (existing[0].cnt > 0) {
  console.log('Competency records already exist, skipping...');
} else {
  const c1 = compMap['Standard TTE Protocol Completion'];
  const c2 = compMap['LV Systolic Function Assessment'];
  const c3 = compMap['Valvular Disease Grading'];
  const c5 = compMap['Cardiac POCUS — Emergency Views'];
  const c7 = compMap['Fetal Cardiac Anatomy — 4-Chamber View'];
  const c8 = compMap['CHD Recognition — Septal Defects'];
  const c9 = compMap['Conotruncal Abnormality Recognition'];
  const c10 = compMap['Carotid Duplex Protocol'];
  const c11 = compMap['Lower Extremity Arterial Duplex'];
  const c12 = compMap['Lower Extremity Venous DVT Protocol'];

  const s1 = studentMap['Sarah Mitchell'];
  const s3 = studentMap['Priya Nair'];
  const s5 = studentMap['Elena Vasquez'];
  const s7 = studentMap['Aisha Thompson'];
  const s9 = studentMap['Fatima Al-Rashid'];
  const s11 = studentMap['Mei-Ling Zhang'];

  const records = [
    [orgId, s1, c1, 4, 'Excellent probe technique. Consistently obtains high-quality parasternal and apical views.', 1],
    [orgId, s1, c2, 4, 'Accurate biplane Simpson measurements. Good correlation with visual EF.', 1],
    [orgId, s1, c5, 2, 'Working on subxiphoid view consistency.', 1],
    [orgId, s3, c1, 5, 'Outstanding performance. Top of cohort.', 1],
    [orgId, s3, c2, 5, 'Exceptional accuracy. Recommended for advanced echo rotation.', 1],
    [orgId, s3, c3, 4, 'Correctly grades AS and MR severity using integrated approach.', 1],
    [orgId, s3, c5, 4, 'Rapid and accurate. Ready for independent POCUS in clinical setting.', 1],
    [orgId, s5, c10, 5, 'Exceptional carotid technique. Accurate stenosis grading per NASCET.', 1],
    [orgId, s5, c11, 5, 'Accurate ABI measurements and waveform interpretation.', 1],
    [orgId, s5, c12, 4, 'Thorough DVT protocol. Correctly identifies compressibility criteria.', 1],
    [orgId, s7, c7, 5, 'Exceptional fetal echo skills. Consistently obtains all required views.', 1],
    [orgId, s7, c8, 5, 'Accurately identifies VSD, ASD, and AVSD with correct hemodynamic assessment.', 1],
    [orgId, s7, c9, 4, 'Strong performance on ToF and TGA identification.', 1],
    [orgId, s9, c1, 4, 'Excellent technique. Strong knowledge of ASE guidelines.', 1],
    [orgId, s9, c7, 5, 'Outstanding fetal echo performance. Highly recommended for fetal echo rotation.', 1],
    [orgId, s9, c8, 5, 'Accurate and confident CHD identification.', 1],
    [orgId, s11, c1, 4, 'Good protocol adherence. Consistent image quality.', 1],
    [orgId, s11, c5, 3, 'Competent POCUS performance. Ready for supervised clinical use.', 1],
  ];

  for (const [oId, uId, cId, level, notes, assessorId] of records) {
    await conn.execute(
      `INSERT INTO educatorStudentCompetencies (orgId, userId, competencyId, achievedLevel, notes, assessedByUserId, assessedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW())`,
      [oId, uId, cId, level, notes, assessorId]
    );
  }
  console.log(`Inserted ${records.length} competency records`);
}

// Check if announcements already exist
const [existingAnn] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorAnnouncements WHERE orgId = ?", [orgId]);
console.log('Existing announcements:', existingAnn[0].cnt);

if (existingAnn[0].cnt > 0) {
  console.log('Announcements already exist, skipping...');
} else {
  const announcements = [
    [orgId, 1, 'Welcome to iHeartEcho Academy — Spring 2026!', 'Welcome to our Spring 2026 cohort! You have been enrolled in 4 courses covering Adult TTE, POCUS, Fetal Echo, and Vascular Ultrasound. Please complete the Adult TTE Fundamentals course first as it is the prerequisite for advanced modules. Good luck!', true],
    [orgId, 1, 'Spring 2026 Assignment Deadlines Posted', 'All Spring 2026 assignment due dates have been posted. Please check your Student Dashboard for individual deadlines. Adult TTE Fundamentals is due in 30 days, POCUS Essentials in 45 days.', true],
    [orgId, 1, 'Remediation Assignments Issued', 'Three students have received individual remediation assignments. Please check your dashboard for details. Remediation must be completed before the next clinical rotation sign-off session.', false],
    [orgId, 1, 'Competency Check-Off Sessions — March 2026', 'Competency check-off sessions are scheduled for the last week of March. Students who have completed all required modules will be contacted individually to schedule their check-off.', false],
  ];

  for (const [oId, creatorId, title, content, isPinned] of announcements) {
    await conn.execute(
      `INSERT INTO educatorAnnouncements (orgId, createdByUserId, title, content, isPinned, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW() - INTERVAL 30 DAY, NOW())`,
      [oId, creatorId, title, content, isPinned ? 1 : 0]
    );
  }
  console.log(`Inserted ${announcements.length} announcements`);
}

// Summary
const [[progCount]] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorStudentProgress WHERE orgId = ?", [orgId]);
const [[compCount]] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorStudentCompetencies WHERE orgId = ?", [orgId]);
const [[annCount]] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorAnnouncements WHERE orgId = ?", [orgId]);
const [[memberCount]] = await conn.execute("SELECT COUNT(*) as cnt FROM educatorOrgMembers WHERE orgId = ?", [orgId]);

console.log('\n=== Demo School Summary ===');
console.log(`Org ID: ${orgId}`);
console.log(`Members: ${memberCount.cnt}`);
console.log(`Progress records: ${progCount.cnt}`);
console.log(`Competency records: ${compCount.cnt}`);
console.log(`Announcements: ${annCount.cnt}`);

await conn.end();
