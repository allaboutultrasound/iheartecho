-- ============================================================
-- iHeartEcho Demo School Seed Script
-- Creates: 1 school org, 12 demo students, 4 courses,
--          20 modules, 8 assignments, progress records,
--          competencies, and analytics data.
-- Owner (userId=1) is set as education_admin of the school.
-- ============================================================

-- ─── 1. Demo Student Users ────────────────────────────────────────────────────
-- Insert 12 demo students (isDemo=true so they are visually flagged in admin UI)
INSERT INTO users (name, email, role, displayName, specialty, credentials, yearsExperience, location, isPremium, isDemo, emailVerified, createdAt, updatedAt, lastSignedIn) VALUES
  ('Sarah Mitchell',    'sarah.mitchell@demo.iheartecho.com',    'user', 'Sarah Mitchell',    'Cardiac Sonographer',        'RDCS, RVT',    3,  'Boston, MA',    true,  true, true, NOW() - INTERVAL 90 DAY, NOW(), NOW() - INTERVAL 1 DAY),
  ('James Okafor',      'james.okafor@demo.iheartecho.com',      'user', 'James Okafor',      'Echo Technologist',          'RDCS',         1,  'Chicago, IL',   false, true, true, NOW() - INTERVAL 85 DAY, NOW(), NOW() - INTERVAL 2 DAY),
  ('Priya Nair',        'priya.nair@demo.iheartecho.com',        'user', 'Priya Nair',        'Cardiac Sonographer',        'RDCS, ACS',    5,  'Houston, TX',   true,  true, true, NOW() - INTERVAL 80 DAY, NOW(), NOW() - INTERVAL 1 DAY),
  ('Marcus Williams',   'marcus.williams@demo.iheartecho.com',   'user', 'Marcus Williams',   'Echo Student',               '',             0,  'Atlanta, GA',   false, true, true, NOW() - INTERVAL 75 DAY, NOW(), NOW() - INTERVAL 3 DAY),
  ('Elena Vasquez',     'elena.vasquez@demo.iheartecho.com',     'user', 'Elena Vasquez',     'Vascular Sonographer',       'RVT',          4,  'Miami, FL',     true,  true, true, NOW() - INTERVAL 70 DAY, NOW(), NOW() - INTERVAL 1 DAY),
  ('David Chen',        'david.chen@demo.iheartecho.com',        'user', 'David Chen',        'Cardiac Sonographer',        'RDCS',         2,  'Seattle, WA',   false, true, true, NOW() - INTERVAL 65 DAY, NOW(), NOW() - INTERVAL 4 DAY),
  ('Aisha Thompson',    'aisha.thompson@demo.iheartecho.com',    'user', 'Aisha Thompson',    'Fetal Echo Specialist',      'RDMS, RDCS',   6,  'New York, NY',  true,  true, true, NOW() - INTERVAL 60 DAY, NOW(), NOW() - INTERVAL 1 DAY),
  ('Ryan Kowalski',     'ryan.kowalski@demo.iheartecho.com',     'user', 'Ryan Kowalski',     'Echo Technologist',          'RDCS',         2,  'Denver, CO',    false, true, true, NOW() - INTERVAL 55 DAY, NOW(), NOW() - INTERVAL 5 DAY),
  ('Fatima Al-Rashid',  'fatima.alrashid@demo.iheartecho.com',   'user', 'Fatima Al-Rashid',  'Pediatric Echo Specialist',  'RDCS, RDMS',   7,  'Dallas, TX',    true,  true, true, NOW() - INTERVAL 50 DAY, NOW(), NOW() - INTERVAL 1 DAY),
  ('Tyler Brooks',      'tyler.brooks@demo.iheartecho.com',      'user', 'Tyler Brooks',      'Echo Student',               '',             0,  'Phoenix, AZ',   false, true, true, NOW() - INTERVAL 45 DAY, NOW(), NOW() - INTERVAL 6 DAY),
  ('Mei-Ling Zhang',    'meiling.zhang@demo.iheartecho.com',     'user', 'Mei-Ling Zhang',    'Cardiac Sonographer',        'RDCS, ACS',    4,  'San Francisco, CA', true, true, true, NOW() - INTERVAL 40 DAY, NOW(), NOW() - INTERVAL 2 DAY),
  ('Carlos Mendez',     'carlos.mendez@demo.iheartecho.com',     'user', 'Carlos Mendez',     'Echo Technologist',          'RDCS',         3,  'Los Angeles, CA', false, true, true, NOW() - INTERVAL 35 DAY, NOW(), NOW() - INTERVAL 3 DAY);

-- ─── 2. Educator Org (Demo School) ───────────────────────────────────────────
INSERT INTO educatorOrgs (name, slug, tier, billingStatus, maxEducators, maxStudents, description, contactEmail, contactName, institutionType, ownerUserId, createdAt, updatedAt) VALUES
  ('iHeartEcho Academy — Demo School', 'iheartecho-demo', 'school', 'active', 5, 50,
   'A comprehensive echo training program covering adult TTE/TEE, pediatric, fetal, POCUS, and vascular ultrasound. This is a demo school for platform demonstration purposes.',
   'admin@iheartecho.com', 'Platform Administrator', 'school_university', 1, NOW() - INTERVAL 90 DAY, NOW());

-- Store the org ID in a variable for subsequent inserts
SET @orgId = LAST_INSERT_ID();

-- ─── 3. Owner as Education Admin Member ──────────────────────────────────────
INSERT INTO educatorOrgMembers (orgId, userId, orgRole, status, addedByUserId, joinedAt, createdAt, updatedAt) VALUES
  (@orgId, 1, 'education_admin', 'active', 1, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY, NOW());

-- ─── 4. Add education_admin role to owner in userRoles ───────────────────────
INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt) VALUES
  (1, 'education_admin', 1, NOW());
INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt) VALUES
  (1, 'education_manager', 1, NOW());

-- ─── 5. Demo Students as Org Members ─────────────────────────────────────────
-- Get student user IDs (they were just inserted, so they are the last 12 rows)
-- We'll use a subquery approach to get them by email
INSERT INTO educatorOrgMembers (orgId, userId, orgRole, status, addedByUserId, joinedAt, createdAt, updatedAt)
SELECT @orgId, id, 'education_student', 'active', 1, createdAt, createdAt, NOW()
FROM users WHERE email LIKE '%@demo.iheartecho.com';

-- Add education_student role to all demo students
INSERT IGNORE INTO userRoles (userId, role, assignedByUserId, createdAt)
SELECT id, 'education_student', 1, NOW() FROM users WHERE email LIKE '%@demo.iheartecho.com';

-- ─── 6. Courses ───────────────────────────────────────────────────────────────
INSERT INTO educatorCourses (orgId, createdByUserId, title, description, category, status, sortOrder, estimatedMinutes, createdAt, updatedAt) VALUES
  (@orgId, 1, 'Adult TTE Fundamentals', 'Master the complete adult transthoracic echocardiography protocol. Covers standard views, measurements, and ASE 2025 guideline-based interpretation for LV/RV function, valvular disease, and diastology.', 'Adult Echo', 'published', 1, 480, NOW() - INTERVAL 85 DAY, NOW()),
  (@orgId, 1, 'POCUS Essentials for Clinicians', 'Point-of-care ultrasound fundamentals for emergency and critical care settings. Covers FAST exam, cardiac POCUS, lung ultrasound, and procedural guidance.', 'POCUS', 'published', 2, 360, NOW() - INTERVAL 80 DAY, NOW()),
  (@orgId, 1, 'Fetal Echocardiography Basics', 'Introduction to fetal cardiac anatomy, normal and abnormal findings, biometry Z-scores, and CHD differentials. Designed for sonographers entering fetal echo practice.', 'Fetal Echo', 'published', 3, 420, NOW() - INTERVAL 75 DAY, NOW()),
  (@orgId, 1, 'Vascular Ultrasound Registry Prep', 'Comprehensive vascular ultrasound review covering carotid duplex, lower extremity arterial/venous, abdominal aorta, and renal artery protocols. Aligned with ARDMS RVT exam outline.', 'Vascular Ultrasound', 'published', 4, 540, NOW() - INTERVAL 70 DAY, NOW());

-- Store course IDs
SET @course1 = (SELECT id FROM educatorCourses WHERE orgId = @orgId AND title = 'Adult TTE Fundamentals');
SET @course2 = (SELECT id FROM educatorCourses WHERE orgId = @orgId AND title = 'POCUS Essentials for Clinicians');
SET @course3 = (SELECT id FROM educatorCourses WHERE orgId = @orgId AND title = 'Fetal Echocardiography Basics');
SET @course4 = (SELECT id FROM educatorCourses WHERE orgId = @orgId AND title = 'Vascular Ultrasound Registry Prep');

-- ─── 7. Modules ───────────────────────────────────────────────────────────────
-- Course 1: Adult TTE (5 modules)
INSERT INTO educatorModules (courseId, orgId, title, description, moduleType, sortOrder, estimatedMinutes, isRequired, status, createdAt, updatedAt) VALUES
  (@course1, @orgId, 'Standard TTE Views & Probe Positioning', 'Parasternal, apical, subcostal, and suprasternal views with probe orientation and patient positioning tips.', 'lesson', 1, 60, true, 'published', NOW() - INTERVAL 84 DAY, NOW()),
  (@course1, @orgId, 'LV Systolic Function Assessment', 'Biplane Simpson method, M-mode EF, visual estimation, and GLS introduction. ASE 2025 normal ranges.', 'lesson', 2, 75, true, 'published', NOW() - INTERVAL 83 DAY, NOW()),
  (@course1, @orgId, 'Valvular Disease: AS & MR Grading', 'Guideline-based severity grading for aortic stenosis and mitral regurgitation using integrated approach.', 'lesson', 3, 90, true, 'published', NOW() - INTERVAL 82 DAY, NOW()),
  (@course1, @orgId, 'Diastolic Function & Filling Pressures', 'E/A ratio, tissue Doppler, E/e'' ratio, LA volume index, and TR velocity for diastolic grading.', 'lesson', 4, 75, true, 'published', NOW() - INTERVAL 81 DAY, NOW()),
  (@course1, @orgId, 'Adult TTE Case Studies', 'Ten clinical cases covering common pathologies: AS, MR, dilated CMP, HCM, pericardial effusion, and RV failure.', 'case_study', 5, 120, true, 'published', NOW() - INTERVAL 80 DAY, NOW());

-- Course 2: POCUS (4 modules)
INSERT INTO educatorModules (courseId, orgId, title, description, moduleType, sortOrder, estimatedMinutes, isRequired, status, createdAt, updatedAt) VALUES
  (@course2, @orgId, 'Cardiac POCUS: PLAX, PSAX, A4C, Subxiphoid', 'Four standard cardiac POCUS views with clinical decision-making frameworks for emergency settings.', 'lesson', 1, 60, true, 'published', NOW() - INTERVAL 79 DAY, NOW()),
  (@course2, @orgId, 'Lung Ultrasound: A-lines, B-lines & Consolidation', 'Systematic lung ultrasound protocol for pneumothorax, pulmonary edema, and pneumonia.', 'lesson', 2, 60, true, 'published', NOW() - INTERVAL 78 DAY, NOW()),
  (@course2, @orgId, 'FAST Exam & Abdominal POCUS', 'Focused Assessment with Sonography in Trauma plus abdominal POCUS for free fluid and aorta screening.', 'lesson', 3, 75, true, 'published', NOW() - INTERVAL 77 DAY, NOW()),
  (@course2, @orgId, 'POCUS-Guided Procedures', 'Ultrasound guidance for central line placement, thoracentesis, paracentesis, and pericardiocentesis.', 'lesson', 4, 90, false, 'published', NOW() - INTERVAL 76 DAY, NOW());

-- Course 3: Fetal Echo (5 modules)
INSERT INTO educatorModules (courseId, orgId, title, description, moduleType, sortOrder, estimatedMinutes, isRequired, status, createdAt, updatedAt) VALUES
  (@course3, @orgId, 'Fetal Cardiac Anatomy & Normal Findings', 'Normal fetal heart anatomy, situs, 4-chamber view, outflow tracts, and arch patterns.', 'lesson', 1, 75, true, 'published', NOW() - INTERVAL 74 DAY, NOW()),
  (@course3, @orgId, 'CHD Recognition: VSD, ASD & AVSD', 'Identifying septal defects, AV canal defects, and hemodynamic significance.', 'lesson', 2, 90, true, 'published', NOW() - INTERVAL 73 DAY, NOW()),
  (@course3, @orgId, 'Conotruncal Abnormalities: ToF, TGA & DORV', 'Outflow tract anomalies with segmental analysis and differential diagnosis approach.', 'lesson', 3, 90, true, 'published', NOW() - INTERVAL 72 DAY, NOW()),
  (@course3, @orgId, 'Fetal Biometry Z-Scores & Measurements', 'Cardiac biometry reference ranges, Z-score calculation, and growth assessment.', 'lesson', 4, 60, true, 'published', NOW() - INTERVAL 71 DAY, NOW()),
  (@course3, @orgId, 'Fetal Echo Case Review', 'Six fetal echo cases with CHD differentials and counseling considerations.', 'case_study', 5, 90, false, 'published', NOW() - INTERVAL 70 DAY, NOW());

-- Course 4: Vascular (6 modules)
INSERT INTO educatorModules (courseId, orgId, title, description, moduleType, sortOrder, estimatedMinutes, isRequired, status, createdAt, updatedAt) VALUES
  (@course4, @orgId, 'Carotid Duplex Protocol & Stenosis Grading', 'NASCET criteria, velocity thresholds, plaque characterization, and reporting standards.', 'lesson', 1, 90, true, 'published', NOW() - INTERVAL 69 DAY, NOW()),
  (@course4, @orgId, 'Lower Extremity Arterial Duplex', 'ABI interpretation, segmental pressures, waveform analysis, and PAD severity grading.', 'lesson', 2, 75, true, 'published', NOW() - INTERVAL 68 DAY, NOW()),
  (@course4, @orgId, 'Lower Extremity Venous Duplex & DVT', 'DVT protocol, compressibility criteria, augmentation, and chronic vs acute thrombus.', 'lesson', 3, 75, true, 'published', NOW() - INTERVAL 67 DAY, NOW()),
  (@course4, @orgId, 'Abdominal Aorta & Mesenteric Vessels', 'AAA screening, iliac artery assessment, celiac/SMA/IMA evaluation.', 'lesson', 4, 60, true, 'published', NOW() - INTERVAL 66 DAY, NOW()),
  (@course4, @orgId, 'Renal Artery Duplex & Transplant Assessment', 'Renal artery stenosis criteria, resistive index, and transplant renal artery protocol.', 'lesson', 5, 60, false, 'published', NOW() - INTERVAL 65 DAY, NOW()),
  (@course4, @orgId, 'Vascular Registry Exam Practice Questions', 'Timed practice set of 50 ARDMS RVT-style questions with detailed rationales.', 'quiz', 6, 90, true, 'published', NOW() - INTERVAL 64 DAY, NOW());

-- ─── 8. Assignments ───────────────────────────────────────────────────────────
-- Get student IDs for individual assignments
SET @s1 = (SELECT id FROM users WHERE email = 'sarah.mitchell@demo.iheartecho.com');
SET @s2 = (SELECT id FROM users WHERE email = 'james.okafor@demo.iheartecho.com');
SET @s3 = (SELECT id FROM users WHERE email = 'priya.nair@demo.iheartecho.com');
SET @s4 = (SELECT id FROM users WHERE email = 'marcus.williams@demo.iheartecho.com');
SET @s5 = (SELECT id FROM users WHERE email = 'elena.vasquez@demo.iheartecho.com');
SET @s6 = (SELECT id FROM users WHERE email = 'david.chen@demo.iheartecho.com');
SET @s7 = (SELECT id FROM users WHERE email = 'aisha.thompson@demo.iheartecho.com');
SET @s8 = (SELECT id FROM users WHERE email = 'ryan.kowalski@demo.iheartecho.com');
SET @s9 = (SELECT id FROM users WHERE email = 'fatima.alrashid@demo.iheartecho.com');
SET @s10 = (SELECT id FROM users WHERE email = 'tyler.brooks@demo.iheartecho.com');
SET @s11 = (SELECT id FROM users WHERE email = 'meiling.zhang@demo.iheartecho.com');
SET @s12 = (SELECT id FROM users WHERE email = 'carlos.mendez@demo.iheartecho.com');

-- Org-wide assignments (all students)
INSERT INTO educatorAssignments (orgId, assignedByUserId, title, description, courseId, targetType, dueAt, passingScore, maxAttempts, status, createdAt, updatedAt) VALUES
  (@orgId, 1, 'Adult TTE Fundamentals — Spring 2026', 'Complete all modules in the Adult TTE Fundamentals course by the due date. Passing score: 80%.', @course1, 'org_wide', NOW() + INTERVAL 30 DAY, 80, 3, 'active', NOW() - INTERVAL 60 DAY, NOW()),
  (@orgId, 1, 'POCUS Essentials — Spring 2026', 'Complete all POCUS modules. Required for clinical rotation sign-off.', @course2, 'org_wide', NOW() + INTERVAL 45 DAY, 75, 3, 'active', NOW() - INTERVAL 55 DAY, NOW()),
  (@orgId, 1, 'Fetal Echo Basics — Spring 2026', 'Complete fetal echo course. Required for fetal echo rotation eligibility.', @course3, 'org_wide', NOW() + INTERVAL 60 DAY, 75, 3, 'active', NOW() - INTERVAL 50 DAY, NOW()),
  (@orgId, 1, 'Vascular Registry Prep — Spring 2026', 'Complete vascular course in preparation for ARDMS RVT exam.', @course4, 'org_wide', NOW() + INTERVAL 90 DAY, 85, 3, 'active', NOW() - INTERVAL 45 DAY, NOW());

-- Individual remediation assignments
INSERT INTO educatorAssignments (orgId, assignedByUserId, title, description, courseId, targetType, targetUserIds, dueAt, passingScore, maxAttempts, status, createdAt, updatedAt) VALUES
  (@orgId, 1, 'LV Function Remediation — James Okafor', 'Remediation assignment: review LV systolic function module and retake assessment.', @course1, 'individual', JSON_ARRAY(@s2), NOW() + INTERVAL 14 DAY, 80, 5, 'active', NOW() - INTERVAL 10 DAY, NOW()),
  (@orgId, 1, 'Carotid Protocol Review — Tyler Brooks', 'Review carotid duplex module before clinical competency check-off.', @course4, 'individual', JSON_ARRAY(@s10), NOW() + INTERVAL 7 DAY, 80, 5, 'active', NOW() - INTERVAL 7 DAY, NOW()),
  (@orgId, 1, 'POCUS Cardiac Views — Marcus Williams', 'Complete cardiac POCUS module with passing score before next lab session.', @course2, 'individual', JSON_ARRAY(@s4), NOW() + INTERVAL 10 DAY, 75, 5, 'active', NOW() - INTERVAL 5 DAY, NOW()),
  (@orgId, 1, 'Fetal CHD Case Review — Ryan Kowalski', 'Review fetal echo case studies before fetal rotation.', @course3, 'individual', JSON_ARRAY(@s8), NOW() + INTERVAL 21 DAY, 75, 5, 'active', NOW() - INTERVAL 3 DAY, NOW());

-- ─── 9. Student Progress Records ─────────────────────────────────────────────
-- Get module IDs for progress records
SET @m1_1 = (SELECT id FROM educatorModules WHERE courseId = @course1 AND sortOrder = 1);
SET @m1_2 = (SELECT id FROM educatorModules WHERE courseId = @course1 AND sortOrder = 2);
SET @m1_3 = (SELECT id FROM educatorModules WHERE courseId = @course1 AND sortOrder = 3);
SET @m1_4 = (SELECT id FROM educatorModules WHERE courseId = @course1 AND sortOrder = 4);
SET @m1_5 = (SELECT id FROM educatorModules WHERE courseId = @course1 AND sortOrder = 5);
SET @m2_1 = (SELECT id FROM educatorModules WHERE courseId = @course2 AND sortOrder = 1);
SET @m2_2 = (SELECT id FROM educatorModules WHERE courseId = @course2 AND sortOrder = 2);
SET @m2_3 = (SELECT id FROM educatorModules WHERE courseId = @course2 AND sortOrder = 3);
SET @m2_4 = (SELECT id FROM educatorModules WHERE courseId = @course2 AND sortOrder = 4);
SET @m3_1 = (SELECT id FROM educatorModules WHERE courseId = @course3 AND sortOrder = 1);
SET @m3_2 = (SELECT id FROM educatorModules WHERE courseId = @course3 AND sortOrder = 2);
SET @m3_3 = (SELECT id FROM educatorModules WHERE courseId = @course3 AND sortOrder = 3);
SET @m4_1 = (SELECT id FROM educatorModules WHERE courseId = @course4 AND sortOrder = 1);
SET @m4_2 = (SELECT id FROM educatorModules WHERE courseId = @course4 AND sortOrder = 2);
SET @m4_3 = (SELECT id FROM educatorModules WHERE courseId = @course4 AND sortOrder = 3);
SET @m4_4 = (SELECT id FROM educatorModules WHERE courseId = @course4 AND sortOrder = 4);

-- Sarah Mitchell (s1) — High performer, nearly complete on all courses
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s1, @course1, @m1_1, 'completed', 95, 3840, NOW() - INTERVAL 55 DAY, NOW() - INTERVAL 55 DAY, NOW()),
  (@orgId, @s1, @course1, @m1_2, 'completed', 92, 4200, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY, NOW()),
  (@orgId, @s1, @course1, @m1_3, 'completed', 88, 5100, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 45 DAY, NOW()),
  (@orgId, @s1, @course1, @m1_4, 'completed', 91, 4500, NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 40 DAY, NOW()),
  (@orgId, @s1, @course1, @m1_5, 'completed', 94, 6800, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY, NOW()),
  (@orgId, @s1, @course2, @m2_1, 'completed', 90, 3600, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s1, @course2, @m2_2, 'completed', 87, 3900, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY, NOW()),
  (@orgId, @s1, @course2, @m2_3, 'in_progress', NULL, 1800, NULL, NOW() - INTERVAL 5 DAY, NOW()),
  (@orgId, @s1, @course3, @m3_1, 'completed', 89, 4500, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s1, @course4, @m4_1, 'completed', 93, 5400, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, NOW()),
  (@orgId, @s1, @course4, @m4_2, 'in_progress', NULL, 2100, NULL, NOW() - INTERVAL 3 DAY, NOW());

-- James Okafor (s2) — Struggling with LV function, remediation assigned
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s2, @course1, @m1_1, 'completed', 78, 4500, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY, NOW()),
  (@orgId, @s2, @course1, @m1_2, 'failed', 62, 5400, NULL, NOW() - INTERVAL 45 DAY, NOW()),
  (@orgId, @s2, @course1, @m1_2, 'failed', 68, 4800, NULL, NOW() - INTERVAL 35 DAY, NOW()),
  (@orgId, @s2, @course1, @m1_3, 'not_started', NULL, 0, NULL, NOW() - INTERVAL 40 DAY, NOW()),
  (@orgId, @s2, @course2, @m2_1, 'completed', 82, 3900, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s2, @course2, @m2_2, 'in_progress', NULL, 1200, NULL, NOW() - INTERVAL 10 DAY, NOW());

-- Priya Nair (s3) — Top performer, ahead of schedule
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s3, @course1, @m1_1, 'completed', 98, 3200, NOW() - INTERVAL 58 DAY, NOW() - INTERVAL 58 DAY, NOW()),
  (@orgId, @s3, @course1, @m1_2, 'completed', 96, 3800, NOW() - INTERVAL 53 DAY, NOW() - INTERVAL 53 DAY, NOW()),
  (@orgId, @s3, @course1, @m1_3, 'completed', 94, 4900, NOW() - INTERVAL 48 DAY, NOW() - INTERVAL 48 DAY, NOW()),
  (@orgId, @s3, @course1, @m1_4, 'completed', 97, 4200, NOW() - INTERVAL 43 DAY, NOW() - INTERVAL 43 DAY, NOW()),
  (@orgId, @s3, @course1, @m1_5, 'completed', 95, 6200, NOW() - INTERVAL 38 DAY, NOW() - INTERVAL 38 DAY, NOW()),
  (@orgId, @s3, @course2, @m2_1, 'completed', 93, 3400, NOW() - INTERVAL 33 DAY, NOW() - INTERVAL 33 DAY, NOW()),
  (@orgId, @s3, @course2, @m2_2, 'completed', 91, 3700, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY, NOW()),
  (@orgId, @s3, @course2, @m2_3, 'completed', 89, 4300, NOW() - INTERVAL 23 DAY, NOW() - INTERVAL 23 DAY, NOW()),
  (@orgId, @s3, @course2, @m2_4, 'completed', 88, 5100, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY, NOW()),
  (@orgId, @s3, @course3, @m3_1, 'completed', 92, 4600, NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 13 DAY, NOW()),
  (@orgId, @s3, @course3, @m3_2, 'completed', 90, 5200, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY, NOW()),
  (@orgId, @s3, @course4, @m4_1, 'completed', 95, 5100, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, NOW()),
  (@orgId, @s3, @course4, @m4_2, 'in_progress', NULL, 2400, NULL, NOW() - INTERVAL 2 DAY, NOW());

-- Marcus Williams (s4) — New student, just started
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s4, @course1, @m1_1, 'completed', 74, 5200, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s4, @course1, @m1_2, 'in_progress', NULL, 900, NULL, NOW() - INTERVAL 5 DAY, NOW()),
  (@orgId, @s4, @course2, @m2_1, 'in_progress', NULL, 600, NULL, NOW() - INTERVAL 3 DAY, NOW());

-- Elena Vasquez (s5) — Vascular specialist, excelling in vascular course
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s5, @course1, @m1_1, 'completed', 85, 3900, NOW() - INTERVAL 55 DAY, NOW() - INTERVAL 55 DAY, NOW()),
  (@orgId, @s5, @course1, @m1_2, 'completed', 83, 4400, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY, NOW()),
  (@orgId, @s5, @course1, @m1_3, 'completed', 80, 5000, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 45 DAY, NOW()),
  (@orgId, @s5, @course4, @m4_1, 'completed', 97, 4800, NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 40 DAY, NOW()),
  (@orgId, @s5, @course4, @m4_2, 'completed', 95, 4200, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY, NOW()),
  (@orgId, @s5, @course4, @m4_3, 'completed', 93, 4500, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s5, @course4, @m4_4, 'completed', 91, 3800, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY, NOW()),
  (@orgId, @s5, @course2, @m2_1, 'completed', 88, 3600, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s5, @course2, @m2_2, 'in_progress', NULL, 1500, NULL, NOW() - INTERVAL 7 DAY, NOW());

-- David Chen (s6) — Average progress, consistent
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s6, @course1, @m1_1, 'completed', 82, 4100, NOW() - INTERVAL 50 DAY, NOW() - INTERVAL 50 DAY, NOW()),
  (@orgId, @s6, @course1, @m1_2, 'completed', 79, 4700, NOW() - INTERVAL 44 DAY, NOW() - INTERVAL 44 DAY, NOW()),
  (@orgId, @s6, @course1, @m1_3, 'in_progress', NULL, 2200, NULL, NOW() - INTERVAL 10 DAY, NOW()),
  (@orgId, @s6, @course2, @m2_1, 'completed', 84, 3800, NOW() - INTERVAL 38 DAY, NOW() - INTERVAL 38 DAY, NOW()),
  (@orgId, @s6, @course2, @m2_2, 'completed', 81, 4000, NOW() - INTERVAL 32 DAY, NOW() - INTERVAL 32 DAY, NOW()),
  (@orgId, @s6, @course2, @m2_3, 'in_progress', NULL, 1100, NULL, NOW() - INTERVAL 8 DAY, NOW());

-- Aisha Thompson (s7) — Fetal echo specialist, excelling in fetal course
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s7, @course3, @m3_1, 'completed', 99, 4000, NOW() - INTERVAL 55 DAY, NOW() - INTERVAL 55 DAY, NOW()),
  (@orgId, @s7, @course3, @m3_2, 'completed', 97, 5000, NOW() - INTERVAL 48 DAY, NOW() - INTERVAL 48 DAY, NOW()),
  (@orgId, @s7, @course3, @m3_3, 'completed', 95, 5200, NOW() - INTERVAL 41 DAY, NOW() - INTERVAL 41 DAY, NOW()),
  (@orgId, @s7, @course1, @m1_1, 'completed', 88, 3700, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY, NOW()),
  (@orgId, @s7, @course1, @m1_2, 'completed', 86, 4200, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY, NOW()),
  (@orgId, @s7, @course1, @m1_3, 'completed', 84, 4800, NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 21 DAY, NOW()),
  (@orgId, @s7, @course2, @m2_1, 'completed', 90, 3500, NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY, NOW()),
  (@orgId, @s7, @course2, @m2_2, 'in_progress', NULL, 1800, NULL, NOW() - INTERVAL 4 DAY, NOW());

-- Ryan Kowalski (s8) — Inconsistent, needs fetal remediation
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s8, @course1, @m1_1, 'completed', 77, 4600, NOW() - INTERVAL 48 DAY, NOW() - INTERVAL 48 DAY, NOW()),
  (@orgId, @s8, @course1, @m1_2, 'completed', 75, 5100, NOW() - INTERVAL 42 DAY, NOW() - INTERVAL 42 DAY, NOW()),
  (@orgId, @s8, @course2, @m2_1, 'completed', 80, 3900, NOW() - INTERVAL 36 DAY, NOW() - INTERVAL 36 DAY, NOW()),
  (@orgId, @s8, @course3, @m3_1, 'completed', 71, 4800, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s8, @course3, @m3_2, 'failed', 58, 5500, NULL, NOW() - INTERVAL 22 DAY, NOW()),
  (@orgId, @s8, @course3, @m3_2, 'in_progress', NULL, 1500, NULL, NOW() - INTERVAL 5 DAY, NOW());

-- Fatima Al-Rashid (s9) — Pediatric/fetal expert, strong across the board
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s9, @course1, @m1_1, 'completed', 94, 3300, NOW() - INTERVAL 57 DAY, NOW() - INTERVAL 57 DAY, NOW()),
  (@orgId, @s9, @course1, @m1_2, 'completed', 92, 3900, NOW() - INTERVAL 51 DAY, NOW() - INTERVAL 51 DAY, NOW()),
  (@orgId, @s9, @course1, @m1_3, 'completed', 90, 4700, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 45 DAY, NOW()),
  (@orgId, @s9, @course1, @m1_4, 'completed', 93, 4100, NOW() - INTERVAL 39 DAY, NOW() - INTERVAL 39 DAY, NOW()),
  (@orgId, @s9, @course3, @m3_1, 'completed', 98, 3800, NOW() - INTERVAL 33 DAY, NOW() - INTERVAL 33 DAY, NOW()),
  (@orgId, @s9, @course3, @m3_2, 'completed', 96, 4900, NOW() - INTERVAL 27 DAY, NOW() - INTERVAL 27 DAY, NOW()),
  (@orgId, @s9, @course3, @m3_3, 'completed', 94, 5100, NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 21 DAY, NOW()),
  (@orgId, @s9, @course2, @m2_1, 'completed', 89, 3600, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, NOW()),
  (@orgId, @s9, @course2, @m2_2, 'completed', 87, 3900, NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY, NOW()),
  (@orgId, @s9, @course4, @m4_1, 'in_progress', NULL, 2000, NULL, NOW() - INTERVAL 3 DAY, NOW());

-- Tyler Brooks (s10) — New student, minimal progress, carotid remediation
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s10, @course1, @m1_1, 'completed', 70, 5800, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s10, @course4, @m4_1, 'failed', 55, 6200, NULL, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s10, @course4, @m4_1, 'in_progress', NULL, 1200, NULL, NOW() - INTERVAL 5 DAY, NOW());

-- Mei-Ling Zhang (s11) — Strong performer, well-rounded
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s11, @course1, @m1_1, 'completed', 91, 3500, NOW() - INTERVAL 52 DAY, NOW() - INTERVAL 52 DAY, NOW()),
  (@orgId, @s11, @course1, @m1_2, 'completed', 89, 4000, NOW() - INTERVAL 46 DAY, NOW() - INTERVAL 46 DAY, NOW()),
  (@orgId, @s11, @course1, @m1_3, 'completed', 87, 4900, NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 40 DAY, NOW()),
  (@orgId, @s11, @course1, @m1_4, 'completed', 90, 4200, NOW() - INTERVAL 34 DAY, NOW() - INTERVAL 34 DAY, NOW()),
  (@orgId, @s11, @course2, @m2_1, 'completed', 88, 3700, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY, NOW()),
  (@orgId, @s11, @course2, @m2_2, 'completed', 86, 4100, NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 22 DAY, NOW()),
  (@orgId, @s11, @course2, @m2_3, 'completed', 84, 4600, NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY, NOW()),
  (@orgId, @s11, @course3, @m3_1, 'completed', 92, 4300, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, NOW()),
  (@orgId, @s11, @course4, @m4_1, 'in_progress', NULL, 1700, NULL, NOW() - INTERVAL 4 DAY, NOW());

-- Carlos Mendez (s12) — Steady progress, mid-level
INSERT INTO educatorStudentProgress (orgId, userId, courseId, moduleId, status, score, timeSpentSeconds, completedAt, createdAt, updatedAt) VALUES
  (@orgId, @s12, @course1, @m1_1, 'completed', 83, 4200, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 45 DAY, NOW()),
  (@orgId, @s12, @course1, @m1_2, 'completed', 80, 4700, NOW() - INTERVAL 38 DAY, NOW() - INTERVAL 38 DAY, NOW()),
  (@orgId, @s12, @course1, @m1_3, 'completed', 78, 5300, NOW() - INTERVAL 31 DAY, NOW() - INTERVAL 31 DAY, NOW()),
  (@orgId, @s12, @course2, @m2_1, 'completed', 85, 3800, NOW() - INTERVAL 24 DAY, NOW() - INTERVAL 24 DAY, NOW()),
  (@orgId, @s12, @course2, @m2_2, 'in_progress', NULL, 1400, NULL, NOW() - INTERVAL 8 DAY, NOW()),
  (@orgId, @s12, @course4, @m4_1, 'completed', 81, 5000, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY, NOW()),
  (@orgId, @s12, @course4, @m4_2, 'in_progress', NULL, 1600, NULL, NOW() - INTERVAL 6 DAY, NOW());

-- ─── 10. Competencies ─────────────────────────────────────────────────────────
INSERT INTO educatorCompetencies (orgId, createdByUserId, title, description, category, maxLevel, isRequired, sortOrder, createdAt, updatedAt) VALUES
  (@orgId, 1, 'Standard TTE View Acquisition', 'Ability to obtain all standard parasternal, apical, subcostal, and suprasternal views with diagnostic image quality.', 'Adult Echo', 5, true, 1, NOW() - INTERVAL 85 DAY, NOW()),
  (@orgId, 1, 'LV Systolic Function Measurement', 'Accurate biplane Simpson EF measurement and visual estimation with appropriate documentation.', 'Adult Echo', 5, true, 2, NOW() - INTERVAL 85 DAY, NOW()),
  (@orgId, 1, 'Valvular Disease Grading', 'Guideline-based severity grading for AS, MR, AR, and TR using integrated approach.', 'Adult Echo', 5, true, 3, NOW() - INTERVAL 85 DAY, NOW()),
  (@orgId, 1, 'Diastolic Function Assessment', 'Accurate diastolic grading using E/A, tissue Doppler, and LA volume index.', 'Adult Echo', 5, true, 4, NOW() - INTERVAL 85 DAY, NOW()),
  (@orgId, 1, 'Cardiac POCUS — Focused Views', 'Ability to obtain focused cardiac POCUS views and identify critical findings in emergency settings.', 'POCUS', 5, true, 5, NOW() - INTERVAL 80 DAY, NOW()),
  (@orgId, 1, 'Fetal 4-Chamber View & Outflow Tracts', 'Obtain diagnostic 4-chamber view and both outflow tracts in fetal echo examination.', 'Fetal Echo', 5, true, 6, NOW() - INTERVAL 75 DAY, NOW()),
  (@orgId, 1, 'Carotid Duplex Protocol', 'Complete carotid duplex examination with accurate velocity measurements and stenosis grading.', 'Vascular Ultrasound', 5, true, 7, NOW() - INTERVAL 70 DAY, NOW()),
  (@orgId, 1, 'DVT Protocol — Lower Extremity Venous', 'Complete bilateral lower extremity venous duplex with compression and augmentation technique.', 'Vascular Ultrasound', 5, true, 8, NOW() - INTERVAL 70 DAY, NOW());

-- ─── 11. Student Competency Records ──────────────────────────────────────────
-- Get competency IDs
SET @comp1 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 1);
SET @comp2 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 2);
SET @comp3 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 3);
SET @comp4 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 4);
SET @comp5 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 5);
SET @comp6 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 6);
SET @comp7 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 7);
SET @comp8 = (SELECT id FROM educatorCompetencies WHERE orgId = @orgId AND sortOrder = 8);

INSERT INTO educatorStudentCompetencies (orgId, userId, competencyId, achievedLevel, notes, assessedByUserId, assessedAt, createdAt, updatedAt) VALUES
  -- Sarah Mitchell: strong across the board
  (@orgId, @s1, @comp1, 4, 'Consistently obtains high-quality views. Ready for independent practice.', 1, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s1, @comp2, 4, 'Accurate biplane measurements. Minor coaching needed on off-axis views.', 1, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY, NOW()),
  (@orgId, @s1, @comp3, 3, 'Good understanding of AS grading. MR quantification still developing.', 1, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s1, @comp5, 3, 'Competent cardiac POCUS views. Lung ultrasound in progress.', 1, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, NOW()),
  (@orgId, @s1, @comp7, 4, 'Excellent carotid technique. Meets independent practice threshold.', 1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, NOW()),
  -- Priya Nair: top performer
  (@orgId, @s3, @comp1, 5, 'Expert-level view acquisition. Serves as peer mentor.', 1, NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 35 DAY, NOW()),
  (@orgId, @s3, @comp2, 5, 'Excellent accuracy. Consistently within 3% of reference standard.', 1, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY, NOW()),
  (@orgId, @s3, @comp3, 4, 'Strong integrated grading approach. Excellent clinical correlation.', 1, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY, NOW()),
  (@orgId, @s3, @comp4, 4, 'Accurate diastolic grading. Handles complex/indeterminate cases well.', 1, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s3, @comp5, 4, 'Strong POCUS skills. Reliable in emergency settings.', 1, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, NOW()),
  -- James Okafor: struggling with LV function
  (@orgId, @s2, @comp1, 3, 'Adequate view quality. Needs improvement on parasternal long axis.', 1, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s2, @comp2, 1, 'Significant difficulty with biplane Simpson. Remediation assigned.', 1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, NOW()),
  (@orgId, @s2, @comp5, 2, 'Basic cardiac POCUS views obtained. Needs more supervised practice.', 1, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, NOW()),
  -- Aisha Thompson: fetal echo expert
  (@orgId, @s7, @comp6, 5, 'Outstanding fetal echo skills. Expert-level CHD identification.', 1, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY, NOW()),
  (@orgId, @s7, @comp1, 4, 'Strong adult TTE skills despite fetal echo focus.', 1, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY, NOW()),
  (@orgId, @s7, @comp5, 3, 'Competent cardiac POCUS. Lung ultrasound developing.', 1, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY, NOW()),
  -- Elena Vasquez: vascular expert
  (@orgId, @s5, @comp7, 5, 'Expert carotid duplex. Excellent stenosis grading accuracy.', 1, NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 22 DAY, NOW()),
  (@orgId, @s5, @comp8, 5, 'Expert DVT protocol. Handles complex chronic thrombus cases.', 1, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY, NOW()),
  (@orgId, @s5, @comp1, 3, 'Competent adult TTE. Continuing to develop echo skills.', 1, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY, NOW()),
  -- Fatima Al-Rashid: pediatric/fetal expert
  (@orgId, @s9, @comp6, 5, 'Expert fetal echo. Handles complex CHD cases independently.', 1, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s9, @comp1, 4, 'Strong adult TTE. Excellent image quality.', 1, NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY, NOW()),
  (@orgId, @s9, @comp2, 4, 'Accurate LV measurements. Consistent technique.', 1, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY, NOW()),
  -- Marcus Williams: new student
  (@orgId, @s4, @comp1, 1, 'Early learner. Basic views obtained with significant coaching.', 1, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY, NOW()),
  -- Tyler Brooks: needs carotid remediation
  (@orgId, @s10, @comp7, 1, 'Carotid protocol incomplete. Velocity measurements inaccurate. Remediation assigned.', 1, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY, NOW()),
  (@orgId, @s10, @comp1, 2, 'Basic TTE views obtained. Needs more supervised scanning time.', 1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, NOW()),
  -- Mei-Ling Zhang: strong performer
  (@orgId, @s11, @comp1, 4, 'Excellent view acquisition. Consistent image quality.', 1, NOW() - INTERVAL 28 DAY, NOW() - INTERVAL 28 DAY, NOW()),
  (@orgId, @s11, @comp2, 4, 'Accurate LV measurements. Good technique.', 1, NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 22 DAY, NOW()),
  (@orgId, @s11, @comp3, 3, 'Good valvular grading. AS grading strong; MR developing.', 1, NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY, NOW()),
  (@orgId, @s11, @comp5, 3, 'Competent cardiac POCUS.', 1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY, NOW()),
  -- Carlos Mendez: steady
  (@orgId, @s12, @comp1, 3, 'Good view quality. Consistent improvement noted.', 1, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY, NOW()),
  (@orgId, @s12, @comp2, 3, 'Adequate LV measurements. Needs more practice with foreshortened views.', 1, NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY, NOW()),
  (@orgId, @s12, @comp7, 3, 'Competent carotid protocol. Stenosis grading improving.', 1, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY, NOW());

-- ─── 12. Announcements ────────────────────────────────────────────────────────
INSERT INTO educatorAnnouncements (orgId, createdByUserId, title, content, isPinned, createdAt, updatedAt) VALUES
  (@orgId, 1, 'Welcome to iHeartEcho Academy — Spring 2026!', 'Welcome to the Spring 2026 cohort! All four courses are now live. Please complete the Adult TTE Fundamentals course first as it forms the foundation for all other modules. Reach out with any questions.', true, NOW() - INTERVAL 60 DAY, NOW()),
  (@orgId, 1, 'Reminder: POCUS Essentials Due Date Approaching', 'The POCUS Essentials course is due in 45 days. Please ensure you are on track. Students who have not started Module 1 should begin this week.', false, NOW() - INTERVAL 14 DAY, NOW()),
  (@orgId, 1, 'New: Vascular Registry Prep Course Now Available', 'The Vascular Ultrasound Registry Prep course is now published and available. This course is aligned with the ARDMS RVT exam outline and includes 50 practice questions.', false, NOW() - INTERVAL 7 DAY, NOW());

-- ─── Done ─────────────────────────────────────────────────────────────────────
SELECT 'Demo school seeded successfully!' AS result;
SELECT @orgId AS demo_org_id;
SELECT COUNT(*) AS demo_students FROM users WHERE email LIKE '%@demo.iheartecho.com';
