import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check user 1 membership
const [membership] = await conn.execute(`
  SELECT m.userId, m.orgId, m.orgRole, m.status, o.name as orgName
  FROM educatorOrgMembers m 
  JOIN educatorOrgs o ON o.id = m.orgId 
  WHERE m.userId = 1
`);
console.log('User 1 org memberships:');
for (const m of membership) {
  console.log(`  Org: "${m.orgName}" | Role: ${m.orgRole} | Status: ${m.status}`);
}

// Check all student memberships
const [students] = await conn.execute(`
  SELECT m.userId, m.orgRole, m.status, u.name
  FROM educatorOrgMembers m
  JOIN users u ON u.id = m.userId
  WHERE m.orgId = 1
  ORDER BY m.orgRole, u.name
`);
console.log('\nAll org members:');
for (const s of students) {
  console.log(`  ${s.name} | Role: ${s.orgRole} | Status: ${s.status}`);
}

// Summary
const [[summary]] = await conn.execute(`
  SELECT 
    (SELECT COUNT(*) FROM educatorOrgMembers WHERE orgId = 1 AND status = 'active') AS active_members,
    (SELECT COUNT(*) FROM educatorCourses WHERE orgId = 1) AS courses,
    (SELECT COUNT(*) FROM educatorAssignments WHERE orgId = 1) AS assignments,
    (SELECT COUNT(*) FROM educatorStudentProgress WHERE orgId = 1) AS progress_records,
    (SELECT COUNT(*) FROM educatorStudentCompetencies WHERE orgId = 1) AS competency_records,
    (SELECT COUNT(*) FROM educatorAnnouncements WHERE orgId = 1) AS announcements
`);
console.log('\nDemo School Data Summary:');
console.log(`  Active members: ${summary.active_members}`);
console.log(`  Courses: ${summary.courses}`);
console.log(`  Assignments: ${summary.assignments}`);
console.log(`  Progress records: ${summary.progress_records}`);
console.log(`  Competency records: ${summary.competency_records}`);
console.log(`  Announcements: ${summary.announcements}`);

await conn.end();
