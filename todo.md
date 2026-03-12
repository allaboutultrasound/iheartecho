# iHeartEcho Project TODO

## Core Modules (Completed)
- [x] EchoNavigator™ — Adult TTE with view-by-view checklist and ASE reference values
- [x] EchoNavigator™ — TEE with ME/TG/UE views and intraoperative checklist
- [x] EchoNavigator™ — Stress Echo (exercise and DSE protocols, 17-segment WMSI)
- [x] EchoNavigator™ — Pediatric with CHD findings, BSA Z-scores, Qp/Qs
- [x] EchoNavigator™ — Fetal with CHD differentials, biometry Z-scores, situs
- [x] EchoNavigator™ — Adult Congenital (ASD, VSD, ToF, CoA, TGA, Fontan)
- [x] EchoNavigator™ — ICE with procedural checklists and key measurements
- [x] EchoNavigator™ — Device (TAVR, MitraClip, WATCHMAN, ASD/PFO)
- [x] ScanCoach™ — Adult TTE, Fetal, Pediatric CHD, Adult Congenital tabs
- [x] EchoAssist™ — 9 clinical domains (AS, MS, AR, MR, LV, Diastology, Strain, RV, PH)
- [x] EchoAssist™ — 2025 ASE guidelines (diastology, PH, strain)
- [x] EchoAssist™ — Suggests/Note/Tip output panels
- [x] Hemodynamics Lab — Wiggers diagram, PV loops, Doppler tracings, clinical presets
- [x] Hemodynamics Lab — EF calibration fix (Normal preset ~62%)
- [x] EchoCalculator — Deep-link buttons to EchoAssist™
- [x] Report Builder — Clinical narrative generator with 2025 ASE diastolic compliance
- [x] Brand system — Strict 5-token color palette enforced app-wide
- [x] iHeartEcho Brand Skill — Created /home/ubuntu/skills/iheartecho-brand/SKILL.md

## iHeartEcho Hub™ (Completed)
- [x] Full-stack upgrade — database + server + auth (web-db-user template)
- [x] Database schema — 10 tables (users, communities, posts, postReactions, comments, conversations, messages, boosts, moderationLogs, communityMembers)
- [x] db:push — Schema migrated to production database
- [x] Default communities seeded — General, ACS Hub (Advanced Cardiac Sonographers), Congenital Heart Hub, Echo Student Hub, Travelers Hub
- [x] ACS Hub terminology corrected — "Advanced Cardiac Sonographers" (not acute coronary syndrome), updated in code + live DB
- [x] Hub backend router — tRPC procedures for communities, posts, comments, reactions, DMs, media upload
- [x] Content moderation — Auto-reject sexually explicit content, HIPAA PHI detection, profanity filter
- [x] Hub frontend — Community switcher (sidebar + mobile tabs)
- [x] Hub frontend — Post feed with author enrichment, media display, boosted post indicator
- [x] Hub frontend — Create post with media attachment support
- [x] Hub frontend — Comment threads modal with nested replies
- [x] Hub frontend — DM panel with conversation list and message thread
- [x] Hub frontend — HIPAA disclaimer modal with acceptance flow
- [x] Hub frontend — Sign-in prompt for unauthenticated users
- [x] Hub navigation — Added to sidebar under "Community" section
- [x] Hub card — Added to Home dashboard module grid
- [x] Hub vitest — 16 moderation tests, all passing

## DIY Accreditation Tab Access Control
- [x] Remove premium gate for DIY users (DIY access should not require premium)
- [x] Hide Case Mix, Policy Builder, Reports & Analytics, Readiness tabs from regular users (admin-only)
- [x] Rename "Case Mix" label to "Case Studies" on DIY Accreditation page
- [ ] Remove Case Mix section from the Readiness Assessment tab
- [x] Remove HOCM and POCUS from exam type list in Appropriate Use review form
- [ ] Split IQR section in Reports & Analytics into Quality Review and Peer Review sub-sections based on reviewType field
- [ ] Remove "Header Info" and "Review Header" section labels from IQR form
- [ ] Remove all tags from flashcards (overwhelming)
- [x] Fix flashcard layout — cards are halfway down the page, should appear near the top
- [ ] Hide flashcard count from UI (don't show how many are available)
- [x] Move scoring/tracking display below the flashcard (currently overlapping the card)
- [ ] Fix typo: "LARDS" should be "LARS" (somewhere in the app)
- [x] Add flashcard sorting/filtering by category: Adult Echo, Pediatric/Congenital Echo, Fetal Echo
- [x] Generate EchoAssist hero banner background image and upload to CDN (All Files)
- [x] Add Flashcard Manager to admin area (create/edit/delete flashcards, assign categories) — exists in /admin/quickfire under Flashcard Management tab
- [ ] Add search field in admin: Cases, Daily Challenges, and Flashcards
- [ ] Add AI Generate option for flashcards in admin (generate by topic, produces quickReview type cards)
- [ ] Allow AI Generator to create multiple cases, challenges, and/or flashcards at one time based on topic (bulk generation)
- [ ] Rename "Flashcard Deck" to "Echo Flashcards" throughout the app
- [x] Separate Flashcards from Daily Challenge (own route, own nav entry, own admin section)
- [ ] Add echoCategory field to quickfireQuestions schema (Adult Echo, Pediatric/Congenital Echo, Fetal Echo)
- [ ] Fix premium gate for EchoAssist premium options (basic members can currently access premium features)
- [ ] Fix premium gate for DIY Accreditation (basic members can currently access it)
- [ ] Update EchoCase Library subtext: remove case count, add descriptive text about image/video/non-image cases and critical thinking focus

## Physician Peer Review Analytics Fix
- [x] Fix: physician comparison reviews (over-read workflow) not appearing in DIY Reports analytics
- [x] Add getComparisonReviewsMonthlySummary DB function querying physicianComparisonReviews table
- [x] Add physicianOverRead.getMonthlySummary tRPC procedure
- [x] Update DIYReportsTab to merge both physicianPeerReviews and physicianComparisonReviews monthly data
- [x] Add Physician Peer Review Monthly Trend table to DIY Reports tab
- [x] Fix: pacsImageUrl missing from getInvitationByToken response (TypeScript error)

## Pending Features
- [ ] Tricuspid Regurgitation engine in EchoAssist™
- [ ] "Copy to Report" button in EchoAssist™ → Report Builder deep-link
- [ ] Hub — Paid/boosted post system (Stripe integration)
- [ ] Hub — Image/video upload to S3 (presigned URL flow)
- [ ] Hub — Real-time DM notifications (polling or WebSocket)
- [ ] Hub — Community member count tracking
- [ ] Hub — Post reporting / manual moderation UI for admins

## In Progress
- [x] Tricuspid Regurgitation engine in EchoAssist™ — vena contracta, EROA, regurgitant volume, jet area, hepatic vein flow, TR Vmax/RVSP, RV/RA size, ASE/AHA 2021 grading, Suggests/Note/Tip output

## POCUS Modules (In Progress)
- [ ] Cardiac POCUS Navigator — PSL, PSS, A4C, Subcostal, IVC views; LV/RV/Pericardium/Volume assessment; RUSH protocol
- [ ] Lung POCUS Navigator — 8-zone protocol, B-lines, A-lines, pleural sliding, consolidation, BLUE protocol
- [ ] eFAST POCUS Navigator — RUQ/LUQ/Pelvis/Subxiphoid/Bilateral thorax windows; free fluid grading; pneumothorax
- [ ] POCUS EchoAssist engines — IVC collapsibility, B-line scoring, eFAST free fluid grading
- [ ] POCUS sidebar category and routes wired
- [ ] POCUS Home dashboard cards added

## Frank-Starling & POCUS (In Progress)
- [x] Frank-Starling reusable graph component with preload/afterload/contractility sliders
- [x] Frank-Starling engine section in EchoAssist™
- [x] Frank-Starling graph integrated into Hemodynamics Lab
- [x] Cardiac POCUS Navigator — route /cardiac-pocus, sidebar wired
- [x] Lung POCUS Navigator — route /lung-pocus, sidebar wired
- [x] eFAST POCUS Navigator — route /efast, sidebar wired
- [x] POCUS Home dashboard cards added

## User Profiles in Hub (In Progress)
- [ ] Extend users table with profile fields (avatar, bio, credentials, location, website, joinedAt)
- [ ] tRPC profile procedures: getProfile, updateProfile, getPublicProfile, getUserPosts
- [ ] Public member profile page (UserProfile.tsx) — avatar, cover, bio, credentials, post history
- [ ] Edit profile modal — avatar upload to S3, bio, credentials, location, website
- [ ] Profile avatars shown on Hub post cards with link to public profile
- [ ] Profile link from DM panel and community member list

## Hemodynamics Lab Improvements
- [x] Doppler tracing height increased (160 → 240px) for larger waveforms
- [x] Y-axis velocity scale labels in m/s with tick marks added to all three Doppler tracings
- [x] Doppler scale selector (1.0 / 1.5 / 2.0 / 3.0 / 4.0 / 5.0 m/s) added above tracings
- [x] Velocity peak annotations updated to match new scale and MARGIN_LEFT offset
- [x] Remove Doppler scale selector — display at fixed larger scale
- [x] Rename AV outflow subtitle tag from "Normal LVOT flow" to "Normal"
- [x] Fix Doppler waveform visibility and accurate peak annotation placement
- [x] Move Frank-Starling engine to bottom of EchoAssist™ engine list
- [x] Move POCUS Navigator dashboard cards to follow other navigator cards
- [x] EchoAssist™ — all engine sections collapsed by default, hash-anchor auto-open

## Accreditation Tools (Completed)
- [x] Database schema: peer_reviews, policies, qa_logs, appropriate_use_cases tables
- [x] tRPC procedures: peer review CRUD, policy CRUD, QA log, appropriate use tracking
- [x] DIY Accreditation Tool™ page — Quality Review, Peer Review, Policy Builder, Appropriate Use Monitor tabs
- [x] EchoAccreditation Navigator™ page — IAC standards guide with search (TTE, TEE, Stress, Pediatric, Fetal, HOCM)
- [x] Accreditation Tools sidebar section and dashboard cards
- [x] Routes wired in App.tsx

## Strain Navigator & Sidebar Reorganization
- [x] Move Strain EchoNavigator™ entry to Adult Echo sidebar section
- [x] Build Strain Navigator™ page (LV GLS, RV strain, LA strain, bull's-eye display, clinical interpretation)
- [x] Wire Strain Navigator™ route in App.tsx and add to Home dashboard

## Follow-up Tasks (Completed)
- [x] Add Relative Apical Strain (RAS) calculator to Strain Navigator™
- [x] Add Strain EchoAssist™ anchor link from TTE Navigator
- [x] Move Stress EchoNavigator™ under Adult Echo sidebar section
- [x] Build DIY Accreditation Tool™ page
- [x] Build EchoAccreditation Navigator™ page
- [x] Wire Accreditation Tools routes and sidebar section

## PDF Export — DIY Accreditation Tool™
- [x] PDF export for peer review reports (IAC submission format) — jsPDF browser-side generation

## Quality Score — Peer Review
- [x] Quality Score rubric: weighted composite of image quality (40%), report accuracy (35%), technical adherence (25%)
- [x] Auto-calculate Quality Score on form entry and display on review cards
- [x] Quality Score badge with color-coded tiers (Excellent/Good/Adequate/Needs Improvement)
- [x] Quality Score trend summary in the reviews list header
- [x] Quality Score included in PDF export with rubric breakdown

## Lab Subscription Platform
- [x] DB schema: labSubscriptions table (labName, plan, status, seats, adminUserId, stripeCustomerId, billingCycleEnd)
- [x] DB schema: labMembers table (labId, userId, role: admin|reviewer|sonographer, inviteEmail, joinedAt)
- [x] DB schema: extend peerReviews with labId, revieweeId (staff being reviewed), qualityScore (computed)
- [x] tRPC: lab CRUD (create, get, update), member invite/remove, role change
- [x] tRPC: staff analytics (per-member QS over time, domain breakdown, trend)
- [x] tRPC: lab reporting (monthly summary, aggregate stats, export data)
- [x] Lab Admin Portal page (/lab-admin): staff roster, invite members, subscription status
- [x] Staff Progress Analytics: growth curves (recharts), per-staff QS trend, domain radar
- [x] Admin Reporting Dashboard: lab-wide monthly stats, PDF export of lab report
- [x] Subscription tier UI: Basic (5 staff), Professional (25 staff), Enterprise (unlimited)
- [ ] Stripe integration for monthly subscription billing (pending Stripe key)
- [x] Sidebar entry for Lab Admin under Accreditation Tools section

## Brand Color Consistency Fix
- [x] Strain Navigator™ — all buttons, tabs, cards use brand teal #189aa1
- [x] DIY Accreditation Tool™ — all buttons, tabs, cards use brand teal #189aa1
- [x] EchoAccreditation Navigator™ — brand color audit
- [x] Lab Admin Portal — brand color audit
- [x] Global: no gray/default shadcn buttons on primary actions
- [x] All badge/tag elements use brand teal palette (not generic gray/blue/purple)
- [x] Strain Navigator™ — ResultBox, vendor select, reference link cards use brand colors
- [x] DIY Accreditation Tool™ — all badge tags, status chips use brand teal palette
- [x] EchoAccreditation Navigator™ — all section tags, standard badges use brand colors
- [x] Home dashboard — module badge tags use brand teal palette

## Strain Navigator™ Updates
- [x] Add Fujifilm as vendor option in vendor select dropdown
- [x] Update bull's-eye color scale: normal=red, mildly reduced=pink, moderately reduced=light pink, mod-severe=light blue, severely reduced=dark blue
- [x] Update legend to match new color scale

## Save to Case — Strain Navigator™
- [x] DB: strainSnapshots table (id, userId, caseId, segmentValues JSON, gls, rvStrain, laStrain, vendor, frameRate, notes, createdAt)
- [x] tRPC: strain.saveSnapshot mutation (protected)
- [x] tRPC: strain.getSnapshotsByCase query
- [x] tRPC: cases.listMyCases query for case picker
- [x] SaveToCase modal in StrainNavigator: case picker dropdown + new case name input + notes field
- [x] Bull's-eye SVG export as base64 PNG for snapshot preview
- [ ] Display strain snapshots panel in Echo Case Lab entry detail view (future)
- [x] Vitest tests for strain snapshot procedures (20 tests)

## Segmental Strain Curves — Strain Navigator™
- [x] Segmental strain curves panel below bull's-eye (recharts LineChart per wall: anterior, lateral, inferior, septal, apex)
- [x] Synthetic time-strain waveforms generated from entered GLS values per segment
- [x] Wall motion score (1=normal, 2=hypokinetic, 3=akinetic, 4=dyskinetic, 5=aneurysmal) per segment input
- [x] Waveform shape adjusts by wall motion score: normal=deep negative curve, hypo=shallow, akinetic=flat, dyskinetic=positive deflection
- [x] Color-coded curves matching bull's-eye segment colors
- [x] Wall Motion Score Index (WMSI) auto-calculated and displayed
- [x] Snapshot includes wall motion scores and curve data when saved to case

## Image Quality Review™ [COMPLETED]
- [x] Browse and map all 10 pages of the Formsite IMAGE-QUALITY-REVIEW form
- [x] DB schema: imageQualityReviews table (102 columns covering all form fields)
- [x] DB helpers: createImageQualityReview, getImageQualityReviewsByUser, getImageQualityReviewById, updateImageQualityReview, deleteImageQualityReview
- [x] tRPC IQR router: create, list, getById, update, delete procedures
- [x] 10-step wizard form page (1245 lines) with all original form fields
- [x] Auto-calculated Quality Score per section and overall composite score
- [x] Color-coded tier badges (Excellent/Good/Adequate/Needs Improvement)
- [x] PDF export: structured IAC-ready report with all sections and scores
- [x] Review history dashboard with filters and summary cards
- [x] Route: /image-quality-review
- [x] Sidebar entry under Accreditation Tools
- [x] Home dashboard card with IAC Accreditation badge
- [x] Vitest tests: 19 tests for IQR procedures and quality score logic
- [x] Total tests: 134 passing

## IQR → Lab Admin Integration [IN PROGRESS]
- [ ] DB: add labId (FK → labSubscriptions) and revieweeId (FK → users) columns to imageQualityReviews
- [ ] DB: migration via pnpm db:push
- [ ] DB helpers: getIQRStatsByLab, getIQRTrendByStaff, getIQRDomainBreakdownByStaff, getLabStaffWithIQRStats
- [ ] tRPC lab.getStaffIQRStats procedure (per-staff Quality Score avg, trend, domain breakdown)
- [ ] tRPC lab.getLabIQRSummary procedure (lab-wide monthly stats from real IQR data)
- [ ] tRPC lab.getIQRTrend procedure (time-series Quality Score data per staff)
- [ ] IQR form Step 1: add Lab picker (dropdown of user's labs) and Reviewee picker (staff member from that lab)
- [ ] Lab Admin Staff tab: replace mock data with real IQR-based Quality Score averages per staff
- [ ] Lab Admin Analytics tab: replace mock recharts data with real IQR trend data
- [ ] Lab Admin Reports tab: monthly summary driven by actual IQR submissions
- [ ] Staff detail view: per-staff Quality Score history, domain radar, trend chart
- [ ] Vitest tests for new lab analytics procedures

## Strain Navigator™ — Click-to-Focus UX
- [ ] Map each bull's-eye segment SVG path to a React ref for its corresponding input field
- [ ] On segment click: scroll to input + focus it (single click, no double-click needed)
- [ ] Visual feedback: briefly highlight the focused input row with a teal ring
- [ ] Cursor placed in the input field ready to type immediately

## Echo Correlation Review Form (DIY Accreditation Tool)
- [ ] Map all Echo Correlation Formsite form fields
- [ ] DB schema: echoCorrelationReviews table
- [ ] tRPC: create, list, getById, update, delete, getStats procedures
- [ ] Multi-step Echo Correlation review form page (/echo-correlation)
- [ ] PDF export for Echo Correlation reviews
- [ ] Add Echo Correlation tab/section to DIY Accreditation Tool
- [ ] Sidebar entry and Home card for Echo Correlation
- [ ] Lab Admin integration: link Echo Correlation reviews to staff members

## Echo Correlation Review™ — Completed
- [x] DB schema: echoCorrelations table (userId, labId, examType, correlation1/2 types, findings, concordance, overallConcordanceRate, varianceNotes, reviewerName)
- [x] DB migration: pnpm db:push applied
- [x] tRPC echoCorrelation router: create, list, getById, update, delete
- [x] Echo Correlation Review page (/echo-correlation): 4-step form (Header, Exam Info, Correlation Comparison grid, Summary)
- [x] Concordance auto-calculation per finding row (Concordant/Minor Variance/Major Variance/N/A)
- [x] Overall concordance rate auto-calculated from all rows
- [x] PDF export for IAC/QI submissions
- [x] Review history dashboard with concordance trend
- [x] Route, sidebar entry, and Home dashboard card wired
- [x] 22 vitest tests for echoCorrelation procedures

## Strain Navigator™ Click-to-Focus UX — Completed
- [x] Clicking a bull's-eye segment scrolls to and focuses the corresponding input field (single-click UX)
- [x] Tab/Enter key navigation between segment inputs

## Favicon — Completed
- [x] iHeartEcho logo set as favicon (PNG + ICO) in index.html

## Consolidation — All Reviews Under DIY Accreditation Tool™
- [ ] Remove standalone /image-quality-review and /echo-correlation routes from App.tsx
- [ ] Remove standalone sidebar entries for IQR and Echo Correlation from Layout.tsx
- [ ] Remove standalone Home dashboard cards for IQR and Echo Correlation
- [ ] Add "Image Quality Review™" as a tab inside DIY Accreditation Tool™
- [ ] Add "Echo Correlation Review™" as a tab inside DIY Accreditation Tool™
- [ ] Auto-link all reviews (IQR, Echo Correlation, Peer Review) to Lab Admin (labId + revieweeId) on save
- [ ] Add Send Feedback button on all review completion screens (PDF summary + notification)
- [ ] Update Lab Admin Analytics to consume all review types in real time

## Navigation & Dashboard Cleanup
- [ ] Remove Lab Admin card from Home dashboard
- [ ] Remove Image Quality Review card from Home dashboard
- [ ] Remove Echo Correlation Review card from Home dashboard
- [ ] Fix sidebar active state: use useLocation to highlight correct item on all pages
- [ ] Remove standalone /image-quality-review and /echo-correlation routes from App.tsx
- [ ] Remove standalone sidebar entries for IQR and Echo Correlation from Layout.tsx
- [ ] Remove Lab Admin from sidebar (accessible via Accreditation Tool)
- [ ] IQR and Echo Correlation embedded as tabs in DIY Accreditation Tool™

## EchoAccreditation Navigator Color Fix
- [ ] All tags/badges in AccreditationNavigator.tsx use brand teal palette
- [ ] All icons in AccreditationNavigator.tsx use brand teal color
- [ ] Filter tab buttons use brand teal border/text when inactive
- [ ] Section category badges use brand teal
- [ ] Standard/requirement level badges use brand teal variants

## Navigation Structure
- [ ] Pin Lab Admin to bottom of Accreditation Tools sidebar section (always last)
- [ ] Add Lab Admin shortcut button inside DIY Accreditation Tool™ header
- [ ] Add link from EchoAccreditation Navigator™ to DIY Accreditation Tool™

## App Structure Reorganization — EchoNavigators / EchoAssist / ScanCoach
- [ ] Move strain calculators (LV GLS, RV strain, LA strain, RAS, WMSI) from StrainNavigator into EchoAssist™ Strain section
- [ ] Add Strain ScanCoach section to ScanCoach™ with bull's-eye (17-seg) and segmental strain curves
- [ ] Slim StrainNavigator down to protocol checklist, scanning tips, and basic pathology only (keep as Strain EchoNavigator™)
- [ ] Update sidebar nav label for /strain to "Strain EchoNavigator™"
- [ ] Keep Z-score calculators in Pediatric EchoNavigator™ and Fetal EchoNavigator™ (no change)

## EchoNavigator™ — Reference Values + ScanCoach Links
- [ ] Add normal reference values section to TTE EchoNavigator™ (LV dimensions, EF, wall thickness, Doppler)
- [ ] Add normal reference values section to TEE EchoNavigator™
- [ ] Add normal reference values section to Stress EchoNavigator™
- [ ] Add normal reference values section to ICE EchoNavigator™
- [ ] Add normal reference values section to Device EchoNavigator™
- [ ] Add normal reference values section to ACHD EchoNavigator™
- [ ] Add normal reference values section to Strain EchoNavigator™ (GLS, RV, LA strain normals)
- [ ] Add persistent "Open in ScanCoach™" link/button to every EchoNavigator™ page (links to relevant ScanCoach tab)

## Guideline Reference Updates
- [ ] Update all chamber quantification references to ASE/WFTF 2018: https://asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf
- [ ] Update all pulmonary hypertension/right heart references to ASE 2025: https://www.asecho.org/wp-content/uploads/2025/03/PIIS0894731725000379.pdf
- [ ] Add both guidelines to EchoAssist™ references section

## Image Quality Review™ — Full Rebuild from Formsite API
- [x] Add getLabByMemberUserId db helper so non-admin lab members can also fetch their lab's staff
- [x] Add getLabStaffForReview tRPC procedure to return lab members for the current user's lab
- [x] Rebuild ImageQualityReview.tsx with full branching logic from Formsite API (all 6 exam types)
- [x] Implement exam-type-specific required views checklists (TTE 13 views, TEE 20 views, Stress 9 views, Ped TTE, Ped TEE, Fetal 16 views)
- [x] Implement stress type sub-question branching (ESE/DSE ± Doppler → different view sets)
- [x] Implement contrast/UAE branching (Yes → show settings question)
- [x] Implement AS-specific Pedoff CW branching (AS present → show 3 Pedoff questions)
- [x] Implement MR PISA branching (significant MR → show PISA/ERO question)
- [x] Implement diastolic function multi-select checklist (Mitral Inflow PW, TDI, Pulm Vein, Valsalva)
- [x] Implement right heart function multi-select checklist (RV view, TR inflow, TDI, TAPSE, RV dims, RA volume)
- [x] Add sonographer dropdown from Lab Admin members (role=sonographer) with optional free-text fallback
- [x] Add physician dropdown from Lab Admin members (role=physician) with optional free-text fallback
- [x] Implement per-exam-type quality score calculation matching Formsite scoring
- [x] Add vitest tests for new IQR procedures

## Lab Admin Analytics — IQR Real Data Integration

- [ ] Add getIqrLabSnapshot db helper: aggregate imageQualityReviews by revieweeLabMemberId for lab-wide leaderboard
- [ ] Add getIqrStaffTrend db helper: monthly trend for a specific lab member from imageQualityReviews
- [ ] Add getIqrLabMonthlySummary db helper: monthly lab-wide summary from imageQualityReviews
- [ ] Add getIqrExamTypeBreakdown db helper: count and avg score by examType for a lab
- [ ] Add lab.getIqrStaffSnapshot tRPC procedure
- [ ] Add lab.getIqrStaffTrend tRPC procedure
- [ ] Add lab.getIqrMonthlySummary tRPC procedure
- [ ] Add lab.getIqrExamTypeBreakdown tRPC procedure
- [ ] Update AnalyticsTab to show IQR data: staff leaderboard, growth curves, domain breakdown, exam type chart
- [ ] Add data source toggle (IQR vs Peer Review) in Analytics tab
- [ ] Update ReportsTab monthly summary to include IQR data
- [ ] Write vitest tests for new IQR analytics DB helpers

## Physician Variability Echo Form — Peer Review Tab Replacement
- [x] Add physicianPeerReviews table to drizzle/schema.ts (with revieweeLabMemberId, reviewerLabMemberId for Lab Admin linkage)
- [x] Add DB helpers: createPhysicianPeerReview, getPhysicianPeerReviews, getPhysicianPeerReviewStaffSnapshot, getPhysicianPeerReviewMonthlySummary
- [x] Add tRPC procedures: physicianPeerReview.create, list, getStaffSnapshot, getMonthlySummary, getLabStaffForReview
- [x] Build PhysicianPeerReview.tsx form with full branching (Adult TTE / Stress / Pediatric / Fetal sections)
- [x] Staff dropdowns: Original Interpreting Physician + Over-Reading Physician pull from Lab Admin physician-role members
- [x] Replace PeerReviewTab in AccreditationTool.tsx with new PhysicianPeerReview component
- [x] Wire Lab Admin Analytics tab to show physician peer review concordance data alongside IQR data
- [x] Wire Lab Admin Reports tab to include physician peer review monthly concordance summary

## Physician Peer Review — Notification System
- [x] Add physicianNotifications table to DB schema
- [x] Add DB helpers: createPhysicianNotification, getPhysicianNotifications, markNotificationRead, markAllRead
- [x] Add tRPC procedures: notification.getMyNotifications, notification.markRead, notification.markAllRead
- [x] Trigger notification on Physician Peer Review submission (server-side, in create mutation)
- [x] Build NotificationBell component in the app header (badge count, dropdown)
- [x] Build Notifications panel/page for physicians to view full review details
- [x] Write vitest tests for notification logic

## Dashboard Cleanup — Remove from Home grid
- [x] Remove Image Quality Review card from Home.tsx modules grid
- [x] Remove Echo Correlation Review card from Home.tsx modules grid
- [x] Remove Lab Admin Portal card from Home.tsx modules grid
- [x] Remove Lab Admin Portal from sidebar navigation in Layout.tsx

## Dashboard Consolidation — 9 Navigation Cards
- [ ] Build EchoNavigatorHub landing page (/echo-navigators) listing all 9 EchoNavigators
- [ ] Build ScanCoachHub landing page (/scan-coach-hub) listing all ScanCoach options
- [ ] Build EchoAssistHub landing page (/echo-assist-hub) listing all EchoAssist engines
- [ ] Rebuild Home.tsx with 9 consolidated cards: EchoNavigator, ScanCoach, EchoAssist, Hemodynamics Lab, Report Builder, Echo Case Lab, DIY Accreditation, Hub
- [ ] Update App.tsx routes for new landing pages
- [ ] Update sidebar to reflect new structure

## Accreditation Readiness Tool & Case Mix Revision
- [ ] Add accreditationReadiness table to DB schema (per-lab checklist progress stored as JSON)
- [ ] Add caseMixSubmissions table revision with IAC case type categories
- [ ] Add DB helpers: saveReadinessProgress, getReadinessProgress, createCaseMixEntry, getCaseMixEntries
- [ ] Add tRPC procedures: accreditation.saveReadiness, getReadiness, createCase, listCases, deleteCase
- [ ] Build AccreditationReadiness.tsx component with full IAC checklist (5 steps, all sub-items, progress markers)
- [ ] Revise CaseMix tab in DIY Accreditation Tool with IAC-compliant case categories and staff count-driven requirements
- [ ] Wire both features as tabs in AccreditationTool.tsx
- [ ] Write vitest tests

## Strain ScanCoach
- [x] Create StrainScanCoach.tsx with bull's-eye, segmental strain curves, LV GLS calculator
- [x] Add Tips & Tricks section with ASE 2025 acquisition guidance
- [ ] Update StrainNavigator with ASE 2025 scanning tips, mid-wall strain, imaging parameters, checklists
- [x] Wire StrainScanCoach into App.tsx routing, ScanCoachHub.tsx (hub pattern — no direct sidebar entry needed)

## StrainNavigator Restructure
- [x] Move imaging checklist from StrainScanCoach into StrainNavigator
- [x] Add normal reference values section to StrainNavigator (GLS, RV, LA, mid-wall, 3D, vendor-specific)
- [x] Remove bull's-eye and strain curves from StrainNavigator (keep in StrainScanCoach only)
- [x] Remove imaging checklist from StrainScanCoach (moved to StrainNavigator)

## Strain ScanCoach — Clinical Pattern Library
- [x] Add clickable clinical strain pattern cards to StrainScanCoach (DCM, HCM, ATTR amyloid, ischemic CAD, Takotsubo, LBBB, cardiotoxicity, myocarditis)
- [x] Each pattern card populates the bull's-eye with representative 17-segment strain values
- [x] Show pattern description, key features, and GLS range on card
- [x] Remove/reduce clinical applications from EchoAssist strain section (replaced with link to ScanCoach)

## Hemodynamics Lab — Aortic Waveform Fixes
- [x] Remove "LVOT" from aortic waveform pattern labels
- [x] Fix HCM obstructive pattern to dagger-shaped late-peaking waveform

## Fetal Echo Navigator
- [x] Move image protocol checklist to the first tab

## Case Mix Submission — IAC Rewrite
- [x] Rewrite CaseMixSubmission to reflect exact IAC requirements (staff-count selector, per-modality case volumes, case type breakdowns, submission rules)

## Stress EchoAssist
- [x] Add Stress EchoAssist engine to EchoAssist with WMSI, target HR/dosing, interpretation, and case saving
- [x] Remove wall motion scoring section from Stress Navigator
- [x] Ensure case saving is only in EchoAssist (not in Navigator)

## Echo Calculator — EchoAssist Link
- [x] Add link from Echo Calculators page to EchoAssist

## Strain ScanCoach — Dyssynchrony Curves
- [ ] Update dyssynchrony strain curves to show abnormal timing patterns (delayed peak, post-systolic shortening, opposing wall timing mismatch)

## Strain Navigator — Move LA/RA/RV Calculators to EchoAssist
- [x] Read LA, RA, RV strain calculator code in Strain Navigator
- [x] LA, RA, RV already in StrainEngine in EchoAssist (confirmed)
- [x] Remove LA, RA, RV strain calculators from Strain Navigator; add EchoAssist CTA link

## EchoAssist Anchor Links
- [x] StrainScanCoach EchoAssist link uses #engine-strain anchor
- [ ] Ensure all other "Open in Stress EchoAssist" links use #engine-stress anchor

## Strain Guidelines/Reference Position
- [x] Move Strain Guidelines and reference section to bottom of Strain Navigator
- [x] Move Strain Guidelines and reference section to bottom of Strain ScanCoach

## Strain ScanCoach — 17 Individual Segment Curves
- [x] Rewrite SegmentalStrainCurves to show all 17 individual segment waveforms (not wall-averaged groups)
- [x] Add wall-group filter toggles so user can show/hide by wall (Anterior, Septal, Inferior, Lateral, Apex)
- [x] Basal=dashed, mid=dotted, apical/apex=solid line styles

## DIY Accreditation Tool — IQR Nav Fix & Case Mix Data Entry
- [ ] Fix IQR extra side navigation when embedded in DIY Accreditation Tool
- [ ] Add caseMixEntries DB table (caseId, userId, labId, modality, caseType, deidentifiedId, sonographer, physician, notes, createdAt)
- [ ] Add tRPC procedures: caseMix.addEntry, caseMix.listEntries, caseMix.deleteEntry
- [ ] Rebuild CaseMixSubmission with per-case data entry form per modality (de-identified ID, sonographer, physician, case type)
- [ ] Show running case total under each modality category with progress toward IAC requirement
- [ ] Allow saving cases and viewing case list per modality

## Accreditation Readiness — Facility Info Removal
- [x] Remove facility information section from the accreditation readiness checklist

## Lab Roles Restructure & CME Tracker
- [ ] Update DB schema: labMember role enum → medical_director, technical_director, medical_staff, technical_staff
- [ ] Add cmeEntries table (labMemberId, title, date, hours, category, provider, certNumber, notes)
- [ ] Run db:push to apply schema changes
- [ ] Update tRPC router: lab member role procedures, CME CRUD procedures
- [ ] Update LabAdmin UI: replace physician/sonographer with 4 new roles
- [ ] Map physician → medical_director + medical_staff in all review forms and readiness lists
- [ ] Map sonographer → technical_director + technical_staff in all review forms and readiness lists
- [ ] Build CME Tracker UI per staff member (add/edit/delete CME entries, hours summary)
- [ ] Add CME section to AccreditationReadiness checklist
- [ ] Update CaseMixSubmission Case Tracker dropdowns to use new role mappings

## Case Mix Staff Linking [COMPLETED]
- [x] Case Mix tracker sonographer/physician fields linked to Lab Admin staff roster
- [x] Dropdown shows staff name + credentials + role tag (e.g. "Jane Smith, RDCS [Tech Dir]")
- [x] Selecting a staff member stores labMemberId FK in caseMixSubmissions table
- [x] Auto-sets "Technical Director case" IAC flag when technical_director is selected
- [x] Auto-sets "Medical Director represented" IAC flag when medical_director is selected
- [x] "auto-set" badge shown on IAC flags when they were set automatically
- [x] "linked" badge shown on case list entries where staff is linked to a lab member
- [x] Free-text fallback available for staff not in Lab Admin roster
- [x] 21 vitest tests covering staffLabel, resolveStaff, IAC flag logic, and role filtering

## Pending — Current Session
- [ ] Case Count Summary banner at top of Case Mix tracker (per-category progress, not overall total)
- [ ] Premium lock overlay on TEE, Stress, Strain, ICE, Device navigator pages (blurred content + upgrade CTA)
- [ ] Staff Coverage Report in Case Mix tracker (who has been represented vs. missing)
- [x] Adult TTE case types restricted to "LV RWMA" and "AS" only (remove all others)
- [ ] Remove extra/duplicate header on Image Quality Review tab in DIY Accreditation tool
- [ ] Fix extra header on Image Quality Review embedded tab
- [ ] Add accreditation type onboarding to Lab Admin (Adult Echo, Pediatric/Fetal Echo)
- [ ] Filter Case Mix modalities by lab accreditation type

## Accreditation Type Onboarding [COMPLETED - 2026-03-06]
- [x] Fix extra/duplicate header on Image Quality Review tab in DIY Accreditation tool (embedded prop)
- [x] Add accreditationTypes column to labSubscriptions schema (JSON array, db:push applied)
- [x] Add isPremium column to users schema (db:push applied)
- [x] AccreditationTypeCard component in Lab Admin Overview tab — toggle Adult Echo / Pediatric+Fetal Echo
- [x] updateLab mutation accepts accreditationTypes array and serializes to JSON
- [x] Case Mix tracker reads lab accreditationTypes and filters visible modalities
- [x] Adult Echo modalities: ATTE, STRESS, ATEE, ACTE
- [x] Pediatric/Fetal modalities: PTTE, PTEE, FETAL
- [x] Accreditation type filter indicator banner in Case Mix tracker (teal if set, amber warning if not)
- [x] "Change in Lab Admin" / "Set in Lab Admin" quick-link from Case Mix tracker
- [x] All 227 tests passing

## Free-Tier Accreditation Type in EchoAccreditation Navigator [IN PROGRESS]
- [ ] Separate backend: new tRPC router (accreditationReadiness) with its own DB table/field for free-tier accreditation type selection
- [ ] AccreditationType selection UI embedded in EchoAccreditation Navigator (visible only to non-paying users)
- [ ] Paid lab subscribers see a prompt to use the full DIY Accreditation Tool instead

## Accreditation Readiness Fixes [IN PROGRESS]
- [ ] DIY Tool Readiness: Move Case Mix Requirements out of QA section into its own standalone category
- [ ] DIY Tool Readiness: Case list items are clickable/trackable but do NOT count toward overall readiness progress %
- [ ] EchoAccreditation Navigator: Add standalone Readiness form (copy of DIY checklist, no staff links, click+save, hidden for paid DIY subscribers)

## Accreditation Readiness Fixes & Navigator Copy (Completed)
- [x] DIY Tool Readiness tab: Case Mix moved to standalone category (no longer under QA)
- [x] DIY Tool Readiness tab: Case mix items are clickable/trackable but excluded from readiness % calculation
- [x] EchoAccreditation Navigator: "Readiness" tab added with full interactive checklist for free-tier users
- [x] EchoAccreditation Navigator: Paid DIY Tool subscribers see prompt to use the full DIY Tool instead
- [x] Separate backend: accreditationReadinessNavigator table + tRPC procedures (independent from DIY tool)
- [x] AccreditationReadiness component: trpcNamespace prop routes to correct backend

## Auto-Check Readiness Items from DB (Completed)
- [x] Audit IAC_CHECKLIST items and map each to DB data sources
- [x] Build tRPC procedure: accreditationReadiness.autoChecks — returns signals from DB
- [x] Wire auto-check signals into AccreditationReadiness — merge with manual checks, show auto-verified badge
- [x] Auto-checked items show teal checkmark + "auto-verified" badge, cannot be manually unchecked
- [x] All 227 tests passing

## Login & Role-Based Access Control System
- [ ] Extend users schema: roles enum (user, premium_user, diy_admin, diy_user, platform_admin)
- [ ] Auto-assign "user" role on first OAuth login (upsert logic in auth callback)
- [ ] tRPC: admin.listUsers, admin.assignRole, admin.removeRole, admin.getUserRoles
- [ ] tRPC: lab seat management — assign/revoke diy_user seats per lab subscription
- [ ] Admin Backend Management UI (/admin) — user list, role assignment, seat management
- [ ] Role guards: premium routes check isPremium or premium_user role
- [ ] Role guards: DIY Accreditation Tool checks diy_admin or diy_user role
- [ ] Role guards: Admin panel checks platform_admin role
- [ ] Login page / sign-in flow with Manus OAuth
- [ ] Registration auto-creates user with "user" role (no other permissions)
- [ ] Role badge display on user profile and admin panel

## Role-Gated Route Guards (Completed)
- [x] Build RoleGuard component that checks user roles and redirects unauthorized users
- [x] Wire RoleGuard around /accreditation (diy_admin or diy_user), /lab-admin (diy_admin), /platform-admin (platform_admin)
- [x] Show "Access Required" page with role list, "Request Access" CTA, and back-to-dashboard button
- [x] Handle loading state gracefully (spinner, no flash before auth check completes)
- [x] auth.me now returns appRoles array alongside user data
- [x] platform_admin bypasses all role checks by default (allowAdmin=true)
- [x] All 227 tests passing

## Owner Promotion & Access Request Notification
- [x] Promote owner (OWNER_OPEN_ID) to platform_admin and diy_admin roles in DB
- [x] Wire RoleGuard "Request Access" button to send owner notification via notifyOwner

## CME Hub — Thinkific Catalog (Simplified)
- [x] THINKIFIC_API_KEY and THINKIFIC_SUBDOMAIN secrets stored
- [x] DB schema: cmeCoursesCache table (productId, name, slug, description, price, cardImageUrl, instructorNames, hasCertificate, syncedAt)
- [x] Server: Thinkific API helper (server/thinkific.ts) with getVisibleProducts, getUserByEmail, parseCreditHoursFromName
- [ ] Server: cme.getCatalog — public procedure, returns visible non-hidden non-archived courses with email-prefilled deep links
- [ ] Wire cmeRouter into appRouter
- [ ] Frontend: CMEHub.tsx — public course grid, each card links to Thinkific with user email pre-filled
- [ ] Sidebar: CME Hub entry added under Learning section
- [ ] Home dashboard: CME Hub card added to module grid
- [ ] Vitest: cme router tests (catalog filter, deep-link generation)

## CME Hub — Revised (member.allaboutultrasound.com/collections/cme)
- [x] Scrape CME collections page to extract course names, images, prices, and checkout URLs
- [x] Replace Thinkific API-driven catalog with hardcoded CME course data from the collections page
- [x] Email-prefilled checkout deep links for logged-in users

## Bug Fixes
- [x] ImageQualityReview: remove duplicate page-level h1 header (title + subtitle row inside the page content)
- [x] ImageQualityReview: remove ™ trademark from "Image Quality Review™" page title

## DIY Tool Access & Navigation Fixes
- [ ] AccreditationNavigator: fix "Open Case Tracker" button to link directly to DIY Case Mix → Case Tracker tab
- [ ] DIY Accreditation Tool: gate entire /accreditation route with RoleGuard (diy_user or diy_admin required)

## DIY Tool Access & Navigation Fixes
- [ ] AccreditationNavigator: fix "Open Case Tracker" button to link directly to DIY Case Mix → Case Tracker tab
- [ ] DIY Accreditation Tool: gate entire /accreditation route with RoleGuard (diy_user or diy_admin required) — HOLD until owner confirms login works

## Login & Navigation Fixes
- [x] Layout sidebar: add branded Sign In / Account section (teal/aqua, dark sidebar) — shows Login button when logged out, avatar + name + logout when logged in
- [x] AccreditationNavigator: fix "Open Case Tracker" button to deep-link to /accreditation?tab=case-mix&view=tracker
- [x] AccreditationTool: read ?tab= and ?view= URL params on mount to support deep-linking

## Account Card Enhancements
- [x] Layout sidebar: add 'My Subscription' badges to account card showing active roles (Premium, DIY Accreditation, Lab Admin, Platform Admin)
- [x] Layout: move Sign In button and account profile (with subscription badges) from sidebar to top header bar; remove sidebar account section

## Premium Guard Fix
- [x] Fix premium role checks in EchoNavigator and EchoAssist: diy_user, diy_admin, and platform_admin should all pass as premium-equivalent

## Profile & Header Dropdown
- [x] tRPC: auth.updateProfile procedure (update displayName and email)
- [x] Header: click-toggle role-aware dropdown (Profile, Lab Admin, Platform Admin sections — shown only for eligible roles)
- [x] Profile page (/profile): edit form for displayName and email, subscription badges, manage subscription links
- [x] Route: /profile registered in App.tsx, /profile added to hidden nav items for header label
- [x] Vitest: 21 profile/role hierarchy tests passing

## Avatar Upload
- [x] DB schema: avatarUrl column already existed in users table (no migration needed)
- [x] Server: updateUserProfile db helper updated to support avatarUrl
- [x] Server: auth.uploadAvatar tRPC procedure — receives dataUri + mimeType, uploads to S3, saves URL to user record
- [x] Frontend: Profile page — avatar upload field with camera overlay, preview, Save/Cancel controls
- [x] Frontend: Layout header — shows custom avatar image (or initials fallback) in both trigger and dropdown
- [x] Vitest: 12 avatar upload validation tests passing

## Role Guard & Shared Utility
- [x] Create client/src/lib/roles.ts with hasPremiumAccess(appRoles) helper
- [x] Refactor EchoNavigatorHub and EchoAssistHub to use shared hasPremiumAccess
- [x] Add RoleGuard to /accreditation route (diy_user or diy_admin required) [already existed, confirmed]
- [x] Add feature-level premium lock to EchoNavigatorHub (TEE, ICE, Strain, Device) using hasPremiumAccess
- [x] Add feature-level premium lock to EchoAssistHub (MS, AS, AR, MR, Strain, RV, PA) using hasPremiumAccess
- [x] Vitest: roles.ts utility tests (25 tests, 304 total passing)

## Platform Admin — User Management
- [x] DB helper: findUserByEmail(email) — lookup existing user by email
- [x] tRPC: platformAdmin.findUserByEmail — search user by email (admin only)
- [x] tRPC: platformAdmin.assignRoleByEmail — assign role by email in one step (user must already exist)
- [x] Platform Admin UI: "Add User by Email" panel with search → preview → assign role flow
- [x] Platform Admin UI: inline role chip removal (X button on each role badge)
- [x] Remove Platform Admin link from sidebar navigation
- [x] Vitest: findUserByEmail and assignRoleByEmail procedure tests (14 tests, 318 total passing)

## Bulk CSV Onboarding — Platform Admin & Lab Admin
- [x] tRPC: platformAdmin.bulkAssignRole — emails[] + role → per-row {email, status, displayName}
- [x] tRPC: labSeats.bulkAssignSeat — emails[] → per-row {email, status, displayName}, seat-limit aware
- [x] Shared BulkCsvUploadPanel component (drag-and-drop, paste, preview table, results, download CSV)
- [x] Integrate BulkCsvUploadPanel into PlatformAdmin page (with role selector)
- [x] Integrate BulkCsvUploadPanel into LabAdmin page (DIY seat assignment, shows seat usage)
- [x] Vitest: bulkAssignRole and bulkAssignSeat procedure tests (16 new tests, 334 total passing)

## CME Hub Fixes
- [x] Swap enrollment URLs: Sonographer Ergonomics now → /enroll/617498, Doppler & Hemodynamics now → /enroll/603157

## Thinkific Live Course Sync & CME Hub Learn More Links
- [x] Found E-Learning & CME collection ID = 131827 via Thinkific Collections API
- [x] Added collectionIds column to cmeCoursesCache schema (pnpm db:push)
- [x] syncCatalogToDb now stores collectionIds and filters to collection 131827 only (11 courses)
- [x] getCatalog procedure filters by collectionIds so only E-Learning & CME courses are returned
- [x] courseUrl exposed in catalog response (Thinkific product page URL)
- [x] CME Hub now fetches live data via trpc.cmeCatalog.getCatalog with static fallback
- [x] "Learn More" button added to each course card → Thinkific product page
- [x] "Enroll" button retained → Thinkific checkout with email prefill
- [x] Loading skeleton shown while fetching live data
- [x] Live data indicator + error banner when Thinkific is unreachable
- [x] Webhook endpoint POST /api/webhooks/thinkific — handles product.created/updated/deleted, triggers background re-sync
- [x] cmeUtils.ts client helper for parseCreditHoursFromName
- [x] Vitest: 16 webhook + parseCreditHoursFromName tests, 350 total passing

## Platform Admin — Sync Now Button
- [x] tRPC: platformAdmin.syncThinkificCourses — trigger syncCatalogToDb, return { count, syncedAt }
- [x] Platform Admin UI: "Sync Now" button in CME section showing last sync time and course count
- [x] Vitest: syncThinkificCourses procedure test

## Auto-Enroll New Users in Thinkific Free Membership
- [x] Found Free Membership bundle: product ID 3241567, bundle ID 211942, 4 courses
- [x] Added findOrCreateThinkificUser, enrollInCourse, enrollInFreeMembership to server/thinkific.ts
- [x] Hooked enrollInFreeMembership into OAuth callback (fire-and-forget, first sign-in only)
- [x] DB: added thinkificEnrolledAt column to users table (pnpm db:push migration 0026)
- [x] Added markThinkificEnrolled(userId) helper to server/db.ts
- [x] Vitest: 18 enrollment helper tests, 368 total passing

## Platform Admin — Sync Now Button
- [x] tRPC: platformAdmin.syncThinkificCourses — trigger syncCatalogToDb, return { count, syncedAt }
- [x] Platform Admin UI: "CME Course Sync" card with Sync Now button, last-sync timestamp, and course count
- [x] Vitest: syncThinkificCourses covered by adminRouter.test.ts

## CME Hub — Enrolled Status on Course Cards
- [ ] Research Thinkific Enrollments API — fetch user enrollments by email/user_id
- [ ] Add getUserEnrollments helper to server/thinkific.ts
- [ ] tRPC: cmeCatalog.getMyEnrollments — fetch logged-in user's Thinkific enrollments (enrolled course IDs + progress URLs)
- [ ] CME Hub UI: show "Continue Learning" button for enrolled courses, "Enroll" for unenrolled
- [ ] CME Hub UI: show enrollment badge/checkmark on enrolled course cards
- [ ] Vitest: getUserEnrollments procedure tests

## Registry Review Hub
- [x] Found Registry Review collection ID = 131826 via Thinkific Collections API
- [x] Reused existing cmeCoursesCache table — collectionIds column already supports multi-collection
- [x] tRPC: cmeCatalog.getRegistryCatalog — filters cmeCoursesCache by collection ID 131826
- [x] Built RegistryReviewHub.tsx page with indigo/purple accent (distinct from CME Hub teal)
- [x] Features: hero banner, category filter, featured bundle card, course grid, Learn More + Enroll buttons
- [x] Email pre-fill on checkout links for logged-in users
- [x] Loading skeleton, live data indicator, error banner
- [x] Added Registry Review Hub to Learning sidebar nav group (BookMarked icon)
- [x] Registered /registry-review route in App.tsx
- [x] Vitest: 17 Registry Review collection filter + category derivation tests, 385 total passing

## Enrolled Status on Course Hubs + Registry Dashboard Card + Sync Registry Button
- [ ] Research Thinkific Enrollments API — fetch user enrollments by email
- [ ] Add getUserEnrollmentsByEmail helper to server/thinkific.ts
- [ ] tRPC: cmeCatalog.getMyEnrollments — fetch logged-in user's enrolled Thinkific course IDs (protected)
- [ ] CME Hub: show "Continue Learning" button for enrolled courses, "Enroll" for unenrolled
- [ ] Registry Review Hub: same enrolled status treatment
- [ ] Add Registry Review Hub card to Home dashboard module grid
- [ ] Platform Admin: add "Sync Registry Courses" button alongside existing CME sync
- [ ] tRPC: platformAdmin.syncRegistryCourses — trigger sync for collection 131826
- [ ] Vitest: getMyEnrollments and syncRegistryCourses procedure tests

## Registry Review Hub Color Fix
- [ ] Restyle RegistryReviewHub.tsx to use brand teal #189aa1 / #4ad9e0 (not indigo/purple)
- [ ] Fix Registry Review Hub enrollment links (wrong URL format)
- [ ] Remove all Thinkific mentions from CME Hub and Registry Review Hub UI
- [ ] Fix enrollment/course URLs to use member.allaboutultrasound.com custom domain
- [ ] Remove "live data auto-refreshes" UI message from both CME Hub and Registry Review Hub

## Pre-Registration: Allow Role Assignment for New Users
- [ ] DB schema: add isPending + pendingCreatedAt columns to users table, run pnpm db:push
- [ ] DB helper: createPendingUser(email) — create stub user with isPending=true
- [ ] Update assignRoleByEmail — if user not found, create pending stub then assign role; return wasPreRegistered flag
- [ ] Update bulkAssignRole — if user not found, create pending stub then assign role; status = "pre_registered"
- [ ] Update bulkAssignSeat (Lab Admin) — same pre-registration logic; status = "pre_registered"
- [ ] PlatformAdmin UI: show "Pre-registered" badge (not error) when user was newly created via assignRoleByEmail
- [ ] BulkCsvUploadPanel: show "Pre-registered" row status in results table with distinct color
- [ ] When pre-registered user first signs in via OAuth, merge their pending account (match by email) and clear isPending
- [ ] Vitest: pre-registration flow tests for assignRoleByEmail and bulkAssignRole

## Pre-Registration Flow Fix + Enrolled Status + Registry Dashboard Card (Session Mar 6)
- [x] Fixed OAuth callback: activatePendingUser now runs BEFORE upsertUser to prevent unique constraint violation on openId
- [x] Individual role assign panel: shows pre-register UI (violet) when user not found, with role selector + "Pre-register & Assign" button
- [x] Individual role assign panel: shows "Pending Sign-In" badge (orange) when a pre-registered user is found in search
- [x] Individual role assign panel: updated description text to explain pre-registration
- [x] findUserByEmail procedure: now returns isPending field
- [x] assignRoleByEmail onSuccess toast: differentiates between normal assign and pre-registration
- [x] CME Hub: added thinkificCourseId to CmeCourse interface, wired getMyEnrollments query, shows "Continue Learning" for enrolled courses
- [x] Registry Review Hub: same enrolled status treatment — "Continue Learning" (green) vs "Enroll" (teal)
- [x] Home page: added Registry Review Hub card to module grid
- [x] Vitest: updated adminRouter.test.ts — assignRoleByEmailLogic and bulkAssignRoleLogic now test pre-registration; 386 tests passing

## White-Label Login Page (Session Mar 6)
- [x] Built custom branded /login page (Login.tsx) — iHeartEcho logo, teal/navy gradient, feature highlights, "Sign In" and "Create Account" buttons
- [x] /login page auto-redirects authenticated users to home
- [x] /login page shows spinner while redirecting to OAuth provider
- [x] Wired /login route in App.tsx
- [x] Updated all getLoginUrl() redirects to use /login first: Layout.tsx, DashboardLayout.tsx, RoleGuard.tsx, main.tsx, Hub.tsx, AccreditationTool.tsx, LabAdmin.tsx, Profile.tsx, useAuth.ts
- [x] No Manus/Meta branding visible to users — all sign-in flows go through branded /login page first

## White-Label Login Page (Session Mar 6)
- [x] Built custom branded /login page (Login.tsx) — iHeartEcho logo, teal/navy gradient, feature highlights
- [x] /login page auto-redirects authenticated users to home
- [x] /login page shows spinner while redirecting to OAuth provider
- [x] Wired /login route in App.tsx
- [x] Updated all getLoginUrl() redirects to use /login: Layout, DashboardLayout, RoleGuard, main.tsx, Hub, AccreditationTool, LabAdmin, Profile, useAuth
- [x] No Manus/Meta branding visible — all sign-in flows go through branded /login page first

## Bug: Admin Dashboard — Add User by Email / Pre-register New User
- [x] Fix: "Add User by Email" panel — converted findUserByEmail from query to mutation for reliable on-demand lookup
- [x] Fix: Pre-register new user flow — role selector + submit button work end-to-end
- [x] Fix: assignRoleByEmail backend procedure — createPendingUser called when user not found
- [x] Fix: findUserByEmail backend procedure — returns correct data including isPending

## Custom Email/Password Auth + SendGrid (Mar 7 2026)
- [x] Extend DB schema: passwordHash, emailVerified, emailVerificationToken/Expiry, passwordResetToken/Expiry, openId nullable
- [x] Build emailAuthRouter: register, login, logout, verifyEmail, forgotPassword, resetPassword
- [x] Wire emailAuthRouter into main appRouter
- [x] Fix sdk.ts authenticateRequest to skip OAuth sync for email-based openIds
- [x] Build Login.tsx: branded email/password sign-in page (fully white-labelled, no Manus/Meta branding)
- [x] Build Register.tsx: first name, last name, email, password, confirm password
- [x] Build VerifyEmail.tsx: token-based email verification
- [x] Build ForgotPassword.tsx: request password reset by email
- [x] Build ResetPassword.tsx: set new password via reset token
- [x] Register all 5 auth routes in App.tsx
- [x] Update Layout.tsx with Register + Sign In buttons
- [x] Replace TinyEmail helper with SendGrid API in email.ts
- [x] Store SendGrid API key, sender email, sender name, app URL as secrets
- [x] Write sendgrid.test.ts to validate API key (passes: Lara Williams / All About Ultrasound)
- [x] Add countPendingUsers to db.ts and countPending procedure to adminRouter
- [x] Add pending user count badge to Platform Admin nav in Layout.tsx
- [x] Send welcome email on pre-registration (single assign + bulk CSV)
- [x] All 388 tests pass

## User Profile Enhancements (Mar 7 2026)
- [ ] Review current Profile.tsx and identify existing fields
- [ ] Add updateProfile procedure: firstName, lastName, email, bio, credentials, location, phone
- [ ] Add changePassword procedure: verify current password, set new password
- [ ] Build editable Personal Information section in Profile.tsx
- [ ] Build Change Password section in Profile.tsx (email/password users only)
- [ ] Show account type badge (Email/Password vs OAuth)
- [ ] Show email verification status with resend option
- [ ] Vitest tests for updateProfile and changePassword procedures

## User Profile Enhancements
- [x] Profile page — Personal Info section with edit mode (displayName, email, bio, credentials, specialty, yearsExperience, location, website)
- [x] Profile page — Password change section (current password verification, new password with confirmation, show/hide toggles)
- [x] Profile page — Avatar upload with preview, save/cancel flow, and S3 storage
- [x] Profile page — Subscriptions panel showing active roles with manage links
- [x] Backend — updateProfile tRPC procedure with extended fields (bio, credentials, specialty, yearsExperience, location, website, isPublicProfile)
- [x] Backend — changePassword tRPC procedure using bcryptjs (current password verification + new password hash)
- [x] Backend — getUserPasswordHash and updateUserPassword db helpers
- [x] Vitest — Extended profile update and changePassword validation tests (all 424 tests passing)

## Email Verification Flow (Email Change)
- [x] DB schema — add pendingEmail, pendingEmailToken, pendingEmailExpiry columns to users table
- [x] DB migration — pnpm db:push (migration 0029 applied)
- [x] DB helpers — setPendingEmail, getUserByPendingEmailToken, confirmPendingEmail, clearPendingEmail
- [x] tRPC — auth.requestEmailChange: send verification email to new address via SendGrid
- [x] tRPC — auth.verifyEmailChange: validate token, apply new email, clear pending state
- [x] tRPC — auth.cancelEmailChange: clear pending email and token
- [x] tRPC — auth.me: expose pendingEmail field so UI can show pending state
- [x] Profile.tsx — show "Verification pending" amber banner with new address, Resend and Cancel buttons
- [x] Profile.tsx — email field locked in read-only mode while verification is pending
- [x] VerifyEmail.tsx — updated to handle both email-change (type=change) and account activation flows
- [x] App.tsx — /verify-email route already registered
- [x] Vitest — 21 new email verification tests (input validation, expiry logic, same-email guard, URL construction) — 445 tests total passing

## Forgot Password Flow
- [x] DB schema — passwordResetToken and passwordResetExpiry already present in schema
- [x] DB migration — no migration needed (columns already existed)
- [x] DB helpers — getUserByEmail, setPasswordResetToken, getUserByPasswordResetToken, clearPasswordResetToken added to db.ts
- [x] Email template — buildPasswordResetEmail already present in server/_core/email.ts
- [x] tRPC — auth.requestPasswordReset: generate token, send reset email (no error if email not found)
- [x] tRPC — auth.resetPassword: validate token, hash new password, clear token
- [x] ForgotPassword.tsx — email input page at /forgot-password (updated to use auth.requestPasswordReset)
- [x] ResetPassword.tsx — new password form at /reset-password?token=... (updated to use auth.resetPassword)
- [x] App.tsx — /forgot-password and /reset-password routes already registered
- [x] Profile.tsx — "Reset via email" link already wired to /forgot-password
- [x] Vitest — 29 new tests (input validation, expiry logic, URL construction, email enumeration protection) — 474 tests total passing

## Magic Link Login
- [x] DB schema — add magicLinkToken, magicLinkExpiry columns to users table
- [x] DB migration — pnpm db:push (migration 0030 applied, 37 columns in users table)
- [x] DB helpers — setMagicLinkToken, getUserByMagicLinkToken, clearMagicLinkToken added to db.ts
- [x] Email template — buildMagicLinkEmail added to server/_core/email.ts
- [x] tRPC — auth.requestMagicLink: generate 96-char token, 15-min expiry, send email (email enumeration safe)
- [x] tRPC — auth.verifyMagicLink: validate token+expiry, create session cookie, consume token (one-time use)
- [x] MagicLinkRequest.tsx — branded email input page at /magic-link with sent confirmation state
- [x] MagicLinkCallback.tsx — auto-verifies token on mount, shows verifying/success/error states, redirects to /
- [x] App.tsx — /magic-link and /auth/magic routes registered
- [x] Login.tsx — "Sign in with a magic link" button added below register CTA
- [x] Vitest — 22 new tests (input validation, token generation, expiry, URL construction, enumeration protection, one-time use) — 496 tests total passing

## Community Hub — External Thinkific Link
- [x] Replace /hub route with external redirect to https://member.allaboutultrasound.com/products/communities/allaboutultrasound-community
- [x] Update sidebar nav link for Community Hub to open external URL in new tab (with ExternalLink icon)
- [x] Update Home page module card for Hub to open external URL in new tab ("Visit Community" CTA)
- [x] Ensure no broken internal /hub references remain in nav or cards

## Hub Cleanup — Remove Unused Internal Hub
- [x] Audit all Hub-related files, tRPC procedures, DB helpers, and schema tables
- [x] Remove hub tRPC router block (hub: router({...})) from routers.ts
- [x] Remove hub-related imports from routers.ts (acceptHubTerms, createPost, getAllCommunities, etc.)
- [x] Remove hub DB helpers from server/db.ts (getAllCommunities, ensureDefaultCommunities, getPostsByCommunity, createPost, deletePost, toggleReaction, getUserReactions, getCommentsByPost, createComment, getOrCreateConversation, getConversationsForUser, getMessages, sendMessage, moderateContent, logModeration, acceptHubTerms, updateHubProfile)
- [x] Delete Hub.tsx frontend page and hub.test.ts test file
- [x] Remove hub schema tables from drizzle/schema.ts (communities, posts, postReactions, comments, conversations, messages, boosts, moderationLogs, communityMembers)
- [x] Remove hubAccepted column from users table in schema.ts
- [x] Run pnpm db:push — migration 0031 applied, 15 tables remain (no hub tables)
- [x] Verified no remaining Hub references in routers.ts, App.tsx, or other pages
- [x] Full test suite: 480 tests passing across 24 test files

## Bug Fixes — Forgot Password & Magic Link Failed Queries
- [ ] Diagnose failed query in auth.requestPasswordReset procedure
- [ ] Diagnose failed query in auth.requestMagicLink procedure
- [ ] Fix root cause (likely getUserByEmail helper or missing column reference)
- [ ] Verify both flows work end-to-end

## Bug Fixes — Forgot Password & Magic Link
- [x] Fix requestPasswordReset to send email even when user has no passwordHash (OAuth-only accounts)
- [x] Fix emailAuthRouter forgotPassword to also send to accounts without passwordHash
- [x] Verified: VITE_APP_URL=https://app.iheartecho.com — reset/magic links point to production; test on published app not dev preview
- [x] Confirmed: token is now stored in DB for OAuth-only accounts after the fix (480 tests passing)

## Auth Pages Logo Fix
- [x] Upload SONORing_Echo2.12.png to CDN as static asset
- [x] Replace fallback Heart icon with iHeartEcho logo on Login.tsx (both left panel and mobile header)
- [x] Replace fallback Heart icon with iHeartEcho logo on ForgotPassword.tsx
- [x] Replace fallback Heart icon with iHeartEcho logo on ResetPassword.tsx
- [x] Replace fallback Heart icon with iHeartEcho logo on MagicLinkRequest.tsx
- [x] Replace fallback Heart icon with iHeartEcho logo on MagicLinkCallback.tsx
- [x] Replace fallback Heart icon with iHeartEcho logo on VerifyEmail.tsx

## Auth & Email Brand Polish
- [x] Set VITE_APP_LOGO secret to CDN URL via Management UI Settings → General
- [x] Increased login left-panel logo from w-12 h-12 (48px) to w-20 h-20 (80px)
- [x] Updated emailWrapper in email.ts: replaced hero background image with circular logo (80×80, border-radius:50%) — applies to all 5 email templates (verification, password reset, email change, magic link, welcome)

## Welcome Email on Registration
- [x] Identified all registration entry points: emailAuthRouter.register (new + pending activation), adminRouter.bulkAssignRole, adminRouter.assignRoleByEmail
- [x] Added buildWelcomeEmail dispatch (async, non-blocking) after successful new user creation in emailAuthRouter.register
- [x] Added buildWelcomeEmail dispatch (async, non-blocking) after pending account activation in emailAuthRouter.register
- [x] Upgraded adminRouter sendPreRegistrationWelcome to use buildWelcomeEmail + sendEmail (SendGrid) instead of old TinyEmail inline HTML
- [x] Vitest — 17 new tests for buildWelcomeEmail template (subject, body content, role labels, logo, branding, HTML structure) — 497 tests total passing

## Case Engines — Daily QuickFire & Case Library

### Phase 1: Database Schema
- [ ] quickfireQuestions table (id, type: scenario|image|quickReview, question, options JSON, correctAnswer, explanation, imageUrl, difficulty, tags, createdBy, createdAt)
- [ ] quickfireAttempts table (id, userId, questionId, selectedAnswer, isCorrect, timeMs, createdAt)
- [ ] quickfireDailySets table (id, date, questionIds JSON, createdAt)
- [ ] cases table (id, title, summary, details, diagnosis, teachingPoints, modality, difficulty, tags, status: pending|approved|rejected, submittedBy, submittedAt, reviewedBy, reviewedAt, rejectionReason, isAdminSubmission)
- [ ] caseMedia table (id, caseId, type: image|video, url, fileKey, caption, sortOrder)
- [ ] caseQuestions table (id, caseId, question, options JSON, correctAnswer, explanation)
- [ ] caseAttempts table (id, userId, caseId, answers JSON, score, completedAt)
- [ ] Run pnpm db:push

### Phase 2: Backend tRPC Routers
- [ ] quickfire router: getTodaySet, getQuestion, submitAnswer, getUserStats, getLeaderboard
- [ ] cases router (public): listApproved, getCase, submitCase (authenticated), getUserSubmissions
- [ ] cases router (admin): listPending, approveCase, rejectCase, editCase, deleteCase, createCase (admin direct publish)
- [ ] S3 upload endpoint for case media (images + video)

### Phase 3: Daily QuickFire UI
- [ ] QuickFire.tsx — daily set card deck with progress bar
- [ ] Scenario question card (text-based, multiple choice)
- [ ] Image question card (image + multiple choice)
- [ ] Quick review card (flashcard-style flip)
- [ ] Results screen with score, explanations, streak counter
- [ ] Stats panel (streak, accuracy, total answered)

### Phase 4: Case Library UI
- [ ] CaseLibrary.tsx — grid/list browse with filters (modality, difficulty, tags, search)
- [ ] CaseDetail.tsx — image/video viewer, case summary, teaching points, embedded quiz
- [ ] SubmitCase.tsx — multi-step form with HIPAA PHI warning banner, media upload
- [ ] My Submissions page — status tracking (pending/approved/rejected)

### Phase 5: Admin Case Management UI
- [ ] AdminCases.tsx — pending approval queue with approve/reject actions
- [ ] Admin case editor — create/edit cases directly (bypasses approval)
- [ ] Rejection reason modal
- [ ] Approved/rejected history view

### Phase 6: Routes, Navigation & Tests
- [ ] Register all new routes in App.tsx
- [ ] Add QuickFire and Case Library to sidebar navigation
- [ ] Add Cases to admin navigation
- [ ] Vitest tests for case submission, approval workflow, and QuickFire scoring

## LMS Engines — Case Review (Completed)
- [x] Daily QuickFire engine — DB schema (quickfireQuestions, quickfireDailySets, quickfireUserAnswers), tRPC router (getTodaySet, submitAnswer, getUserStats, getLeaderboard, admin CRUD), QuickFire.tsx UI with streak/score/leaderboard
- [x] Echo Case Library engine — DB schema (echoLibraryCases, echoLibraryCaseMedia, echoLibraryCaseQuestions, echoLibraryCaseAttempts), tRPC router (listCases, getCase, submitCase, submitAttempt, admin approve/reject/list), CaseLibrary.tsx browse UI, CaseDetail.tsx full case view with MCQ
- [x] SubmitCase.tsx — user form with HIPAA/PHI reminder banner, media upload (images + video clips), MCQ builder, admin-bypass auto-approve
- [x] AdminCaseManagement.tsx — admin UI with pending/approved/rejected tabs, approve/reject with reason, full case details modal
- [x] Media upload REST endpoint — /api/upload/case-media (multer + S3 storagePut, auth required)
- [x] Navigation — Layout.tsx updated with Daily QuickFire + Echo Case Library sidebar links; account dropdown includes Submit a Case + Case Management (admin only)
- [x] App.tsx routes — /quickfire, /case-library, /case-library/submit, /case-library/:id, /admin/cases
- [x] Vitest tests — quickfire.test.ts (6 tests), caseLibrary.test.ts (14 tests), all 518 tests passing

## LMS Engine Enhancements (In Progress)
- [ ] QuickFire — image-based question type (imageUrl field, image displayed above question text in player + admin builder)
- [ ] QuickFire — quick-review item type (flashcard-style: front text, reveal answer, no MCQ options)
- [ ] QuickFire — question type selector in admin builder (scenario / image-based / quick-review)
- [ ] QuickFire — player renders correct UI per question type
- [ ] SubmitCase — draft save (save progress without submitting, resume later)
- [ ] SubmitCase — My Submissions tab/page showing user's own pending/approved/rejected cases
- [ ] CaseLibrary — My Submissions tab visible when authenticated
- [ ] AdminCaseManagement — full media preview (image carousel + video player) inside case detail modal
- [ ] AdminCaseManagement — inline approve/reject buttons inside the detail modal
- [ ] AdminCaseManagement — show MCQ questions and correct answers in detail modal

## LMS Engine Enhancements (Iteration 2)
- [x] QuickFireAdmin page — type-aware question builder (scenario/image/quickReview), daily set generator, question list with filter/pagination
- [x] QuickFire Admin route /admin/quickfire registered in App.tsx
- [x] QuickFire Admin link added to Platform Admin dropdown in Layout.tsx
- [x] CaseLibrary My Submissions tab — shows user's own cases with status badges
- [x] SubmitCase draft auto-save — localStorage save/restore with clear-on-submit
- [x] AdminCaseManagement expanded modal — full media preview (image carousel + video), MCQ display, inline approve/reject

## Case Submission Email Notifications
- [x] buildCaseApprovedEmail template — branded HTML email with case title, CTA link to live case, community message
- [x] buildCaseRejectedEmail template — branded HTML email with case title, reviewer feedback, HIPAA reminder, resubmit CTA
- [x] approveCase procedure — fetches submitter, sends approval email (fire-and-forget, skips admin-created cases)
- [x] rejectCase procedure — fetches submitter, sends rejection email with reason (fire-and-forget, skips admin-created cases)
- [x] caseNotifications.test.ts — 18 vitest tests for both email templates (subject, body, branding, HIPAA, URLs)
- [x] All 536 tests passing

## Admin Notification — New Case Submission
- [x] buildNewCaseSubmissionAdminEmail template — branded email to admin with submitter name, case title, modality, difficulty, and link to admin case management
- [x] submitCase procedure — fire-and-forget email to SENDGRID_FROM_EMAIL (admin inbox) + notifyOwner in-app alert on new user submissions
- [x] caseNotifications.test.ts — add tests for the new admin email template

## Sidebar Pending Case Count Badge
- [x] caseLibrary.getPendingCount — admin-only tRPC query returning count of pending cases
- [x] Layout.tsx — fetch getPendingCount for admin users, show teal badge on Echo Case Library nav item

## Resubmission Flow
- [ ] caseLibrary.getMyCase — protected procedure to fetch a user's own case with media and questions
- [ ] caseLibrary.updateCase — protected procedure to update a rejected case and reset status to pending
- [ ] SubmitCase.tsx — edit/resubmit mode: pre-populate form from existing case, update on submit
- [ ] CaseLibrary.tsx My Submissions tab — "Edit & Resubmit" button for rejected cases
- [ ] App.tsx — add /case-library/edit/:id route
- [ ] vitest tests for getMyCase and updateCase

## QuickFire CSV Bulk Import
- [x] Add bulkImportQuestions tRPC procedure to quickfire router
- [x] Build CSV import UI in QuickFireAdmin.tsx (template download, upload, parse, preview, confirm)
- [x] Write vitest tests for bulkImportQuestions

## AI Bulk Content Generator
- [x] Add quickfire.aiGenerateQuestions tRPC procedure (AI generates N questions for a given topic/type)
- [x] Add caseLibrary.aiGenerateCase tRPC procedure (AI generates a full echo case with MCQs)
- [x] Build AI question generator panel in QuickFireAdmin.tsx (topic input, count, type, preview, bulk insert)
- [x] Build AI case generator panel in AdminCaseManagement.tsx (scenario prompt, preview, save as draft)
- [x] Write vitest tests for both AI procedures

## QuickFire CSV Bulk Import
- [ ] Add bulkImportQuestions tRPC procedure to quickfireRouter
- [ ] Build CSV import UI in QuickFireAdmin.tsx (template download, drag-and-drop, parse, validate, preview, bulk insert)
- [x] Write vitest tests for bulkImportQuestions

## QuickFire Streak Notifications
- [ ] Add streak reminder email template to email.ts
- [ ] Add sendStreakReminders utility (query users who haven't completed today, send email + in-app notification)
- [x] Add triggerStreakReminders admin tRPC procedure
- [ ] Add updateNotificationPreferences and getNotificationPreferences user tRPC procedures
- [ ] Add notificationPreferences column to users table (or separate table) and push migration
- [ ] Build Notification Preferences UI component (opt-in/out, reminder time)
- [ ] Add Trigger Reminders control in QuickFireAdmin
- [x] Write vitest tests for streak notification procedures

## Premium Access Checkout Integration (Session Mar 7)
- [x] DB: isPremium, premiumGrantedAt, premiumSource columns added to users table (db:push applied)
- [x] premium tRPC router: getStatus (returns isPremium, manageUrl, checkoutUrl), checkAndSync (manual sync from Thinkific)
- [x] Thinkific webhook handler extended: order.created grants premium, subscription.cancelled revokes premium
- [x] Premium.tsx page: hero with $9/month pricing card, feature grid, free vs premium comparison, checkout button linking to Thinkific
- [x] Auto-sync on return from checkout (?sync=1 URL param)
- [x] /premium route registered in App.tsx
- [x] PremiumGate component: wraps premium-only content, shows upgrade prompt for non-premium users (compact + full variants)
- [x] Layout.tsx: "Premium Access" nav item added to sidebar under "Premium" section (Crown icon)
- [x] Layout.tsx: account dropdown shows Crown badge next to username for premium users
- [x] Layout.tsx: subscription badges section shows "Premium" with Crown icon when isPremium=true (from DB)
- [x] Profile.tsx: subscriptions card shows "Premium Access" entry with Active badge and "Manage Premium Subscription" link when isPremium=true
- [x] Profile.tsx: empty subscriptions state links to /premium upgrade page instead of generic browse link
- [x] AdminCaseManagement.tsx: fixed JSX error from box-drawing Unicode characters in JSX comments (replaced with plain dashes)
- [x] 583 tests passing

## UEA Navigator & ScanCoach (Session Mar 7)
- [x] Build UEANavigator.tsx — contrast echo protocol with safety checklist, indications, view-by-view enhancement assessment, reporting guidance, and ASE/EACVI reference values
- [x] Build UEAScanCoach.tsx — acquisition guide with agent preparation, injection technique, machine optimisation (MI, gain, depth), view-by-view tips, pitfalls, and safety monitoring
- [x] Register /uea-navigator and /uea-scan-coach routes in App.tsx
- [x] Add UEA Navigator to EchoNavigatorHub.tsx (premium, "Contrast Echo" badge)
- [x] Add UEA ScanCoach to ScanCoachHub.tsx ("Contrast Echo" badge)
- [x] Add UEA Navigator to Layout.tsx sidebar under Clinical Tools section
- [x] Add UEA ScanCoach to Layout.tsx sidebar under Clinical Tools section
- [x] Add UEA Navigator and ScanCoach cards to Home dashboard module grid
- [x] Vitest: no new server procedures needed (static content pages) — 583 tests pass

## ScanCoach WYSIWYG Editor (Session Mar 7)
- [x] DB: add scanCoachOverrides table (module, viewId, field, value, imageUrl, updatedAt, updatedByUserId)
- [x] DB: run pnpm db:push to migrate
- [x] Server: scanCoachAdminRouter — listOverrides, upsertOverride, uploadImage, deleteOverride, clearImageField
- [x] Server: wire scanCoachAdminRouter into main routers.ts
- [x] Client: ScanCoachEditor.tsx — admin WYSIWYG page with module selector, view list, inline text editing, image upload/replace/delete
- [x] Client: useScanCoachOverrides hook — fetch overrides and merge with static view data
- [x] Client: wire override merging into ScanCoach.tsx, TEEScanCoach.tsx, ICEScanCoach.tsx, UEAScanCoach.tsx
- [x] Client: register /admin/scancoach route in App.tsx
- [x] Client: add ScanCoach Editor link to Platform Admin sidebar/nav
- [x] Vitest: scanCoachAdmin router unit tests (15 tests, all passing)

## ScanCoach Editor — Preview as User Toggle (Session Mar 7)
- [x] Build ScanCoachViewPreview component — renders a view card exactly as end-users see it (with overrides applied)
- [x] Add Preview toggle button to ScanCoachEditor toolbar (Edit / Preview modes)
- [x] Preview mode: full-panel render of the selected view with all override fields merged
- [x] Preview mode: show amber banner + empty state when no overrides exist yet
- [x] Edit mode: restore the existing edit form layout; quick Preview shortcut in text editor footer
- [x] Vitest: no new server procedures needed (pure UI change) — 598 tests pass

## US English & Lumason Updates (Session Mar 7)
- [ ] Replace all British English spellings with US English across all .tsx, .ts, .md files (colour→color, optimisation→optimization, recognise→recognize, etc.)
- [ ] Add Lumason (sulfur hexafluoride lipid-type A microspheres) to UEANavigator agent preparation section
- [ ] Add Lumason dosing, reconstitution, and activation instructions to UEANavigator
- [ ] Add Lumason-specific clinical notes and contraindications to UEANavigator
- [ ] Add Lumason to UEAScanCoach agent preparation card with activation/injection technique
- [ ] Add Lumason machine settings guidance to UEAScanCoach

## Lumason + Saline Contrast (Bubble Study) — UEA Navigator & ScanCoach (Session Mar 7)
- [ ] UEANavigator: expand Lumason agent card with full reconstitution steps, activation, dosing table, and clinical notes
- [ ] UEANavigator: add Agitated Saline (Bubble Study) as a 4th agent with preparation, indications, protocol, and interpretation
- [ ] UEANavigator: add Bubble Study protocol section (indications, Valsalva technique, grading, interpretation)
- [ ] UEAScanCoach: expand Lumason injection technique card with machine settings and timing guidance
- [ ] UEAScanCoach: add Agitated Saline (Bubble Study) tab/section with preparation, injection, views, and grading

## Lumason + Saline Contrast (Bubble Study) + PLSVC — UEA Navigator & ScanCoach (Session Mar 7)
- [ ] UEANavigator: expand Lumason agent card with full reconstitution, activation, dosing, and clinical notes (no black box warning, safer in cardiopulmonary instability)
- [ ] UEANavigator: add Agitated Saline as 4th agent (preparation, indications, protocol, grading)
- [ ] UEANavigator: add Bubble Study protocol section — PFO/ASD detection (Valsalva technique, timing, grading 0–3+), intrapulmonary shunt (delayed opacification), PLSVC (coronary sinus opacification pattern)
- [ ] UEANavigator: add PLSVC section — diagnostic criteria, coronary sinus dilation, differential diagnosis, clinical implications
- [ ] UEAScanCoach: expand Lumason injection technique card with machine settings and timing
- [ ] UEAScanCoach: add Agitated Saline / Bubble Study tab — preparation steps, injection technique, views (A4C, subcostal, PLAX), Valsalva coaching, grading, PLSVC pattern recognition

## HOCM Navigator & ScanCoach

- [ ] Build HOCMNavigator.tsx — full HOCM echo protocol with SAM grading, LVOT gradient thresholds, Valsalva provocation, MR assessment, and ASE/AHA reporting guidance
- [ ] Build HOCMScanCoach.tsx — view-by-view acquisition guide with imaging techniques, CW Doppler positioning, provocation protocol, and pitfalls
- [ ] Register /hocm-navigator and /hocm-scan-coach routes in App.tsx
- [ ] Add HOCM Navigator to EchoNavigatorHub.tsx (HCM badge)
- [ ] Add HOCM ScanCoach to ScanCoachHub.tsx (HCM badge)
- [ ] Add HOCM Navigator and ScanCoach to Layout.tsx sidebar
- [ ] Add HOCM Navigator and ScanCoach cards to Home dashboard module grid
- [ ] Vitest: no new server procedures needed (static content pages)

## HOCM ScanCoach + UEA Vendor Tab

- [ ] Build HOCMScanCoach.tsx with view-by-view acquisition guide, CW Doppler positioning, Valsalva acquisition, and Doppler Differentiation tab (HOCM LVOT vs. MR Doppler comparison)
- [ ] Add Vendor Reference tab to UEAScanCoach — Definity, Lumason, Optison (dosing, administration, chemical makeup, MI settings)
- [ ] Register /hocm-scan-coach route in App.tsx
- [ ] Add HOCM ScanCoach to ScanCoachHub.tsx
- [ ] Add HOCM Navigator and ScanCoach to Layout sidebar
- [ ] Add HOCM Navigator and ScanCoach to EchoNavigatorHub and Home dashboard
- [ ] Vitest: no new server procedures needed

## Hide Blank ScanCoach Image Slots
- [x] Audit all ScanCoach pages for blank image rendering patterns
- [x] Fix ScanCoach.tsx — already uses conditional rendering, no change needed
- [x] Fix TEEScanCoach.tsx — removed ImagePlaceholder component and its two unconditional usages
- [x] Fix ICEScanCoach.tsx — removed ImagePlaceholder component and its two unconditional usages
- [x] Fix UEAScanCoach.tsx — no placeholder boxes found, no change needed
- [x] Fix HOCMScanCoach.tsx — no placeholder boxes found, no change needed
- [x] Fix StrainScanCoach.tsx — no placeholder boxes found, no change needed

## UEA ScanCoach PEG Allergy + Sidebar Cleanup
- [ ] Add PEG allergy section to UEAScanCoach (contraindications, cross-reactivity, alternatives, management)
- [ ] Remove UEA Navigator sidebar link from Layout.tsx (accessible via EchoNavigator hub only)
- [ ] Remove UEA ScanCoach sidebar link from Layout.tsx (accessible via ScanCoach hub only)
- [ ] Remove HOCM Navigator sidebar link from Layout.tsx (accessible via EchoNavigator hub only)
- [ ] Remove HOCM ScanCoach sidebar link from Layout.tsx (accessible via ScanCoach hub only)
- [ ] Fix HOCM Navigator colors to match brand teal/aqua palette (#189aa1 / #4ad9e0)
- [ ] Fix HOCM ScanCoach colors to match brand teal/aqua palette
- [ ] Research PMID 39886312 goal-directed Valsalva criteria
- [ ] Revise HOCM Navigator Valsalva section: instructed vs. goal-directed comparison, supplies/setup
- [ ] Revise HOCM ScanCoach Valsalva section: same updates
- [ ] Change HOCM Navigator reporting guide output font to Gill Sans / Arial
- [ ] Change Report Builder output/preview font to Gill Sans / Arial
- [ ] Fix HOCM ScanCoach SVG waveform colors to match brand teal/aqua palette (#189aa1 / #4ad9e0)
- [ ] Add CW Doppler LA avoidance tip to HOCM ScanCoach (Doppler Differentiation section and A5C view tips)

## Premium Checkout URL Update
- [x] Replace all premium checkout links with https://member.allaboutultrasound.com/enroll/3703267?price_id=4651832 (updated in PremiumGate.tsx, Premium.tsx, Profile.tsx, Home.tsx, premiumRouter.ts)

## Lumason Reconstitution Guide — UEA ScanCoach
- [x] Add step-by-step Lumason reconstitution guide to UEA ScanCoach Injection tab

## Dashboard Card Reorganization
- [ ] Remove UEA Navigator and HOCM Navigator cards from Home dashboard
- [ ] Remove UEA ScanCoach and HOCM ScanCoach cards from Home dashboard
- [ ] Add UEA Navigator and HOCM Navigator cards to EchoNavigator hub page
- [ ] Add UEA ScanCoach and HOCM ScanCoach cards to ScanCoach hub page

## Bug Fixes
- [x] Fix ScanCoach image editor — uploaded images not displaying (listOverrides changed from protectedProcedure+admin check to publicProcedure)
- [x] Fix QuickFire AI question generator — JSON parse error (changed model from gemini-2.5-flash to gpt-4o for reliable generateObject structured output)

## HOCM Color Fix
- [x] Replace purple banner and accents in HOCMNavigator.tsx with brand teal/dark navy
- [x] Replace purple banner and accents in HOCMScanCoach.tsx with brand teal/dark navy

## Valsalva Comparison — HOCM
- [x] Add goal-directed vs instructed Valsalva comparison section to HOCMNavigator.tsx
- [x] Add goal-directed vs instructed Valsalva comparison section to HOCMScanCoach.tsx

## Goal-Directed Valsalva Correction
- [x] Rewrite goal-directed Valsalva in HOCMNavigator — manometer circuit (syringe + O2 tubing + optional respiratory filter), blow to ≥40 mmHg, hold 10 seconds
- [x] Rewrite goal-directed Valsalva in HOCMScanCoach — same correction with sonographer setup steps

## Split Valsalva Protocols
- [x] Split HOCMNavigator Valsalva section into two separate step-by-step protocol cards (Instructed + Goal-Directed)
- [x] Split HOCMScanCoach Valsalva section into two separate step-by-step protocol cards (Instructed + Goal-Directed)

## HOCMScanCoach Doppler Tab Color Fix
- [x] Update Doppler Evaluation tab color to brand teal in HOCMScanCoach
- [x] Update modal waveform color to brand teal in HOCMScanCoach

## HOCMScanCoach Valsalva Pathway Redesign
- [x] Redesign Valsalva tab with two clickable pathway cards (Instructed + Goal-Directed) each showing dedicated content panel

## HOCMNavigator Valsalva Pathway Redesign
- [x] Apply two-pathway clickable card design (Instructed + Goal-Directed) to HOCMNavigator Valsalva tab

## ScanCoach Editor — HOCM Module Registry
- [x] Add HOCM module with all views to scanCoachRegistry.ts
- [x] Verify HOCM appears as a selectable module in the ScanCoach Editor admin UI

## HOCMScanCoach — Diagnostic Criteria & Provocation Triggers
- [x] Add wall thickness thresholds (1.3 cm FHx, 1.5 cm no FHx), LVOT gradient criteria, and provocation triggers to HOCMScanCoach view data
- [x] Add dedicated Diagnostic Criteria expandable section to HOCMScanCoach view detail panel

## HOCMScanCoach — Diagnostic Criteria & Provocation Triggers
- [x] Add wall thickness thresholds (≥1.3 cm with FHx, ≥1.5 cm without FHx), resting LVOT gradient ≥30 mmHg trigger, and provocation criteria to HOCMScanCoach view data
- [x] Add dedicated Diagnostic Criteria expandable section to HOCMScanCoach view detail panel with borderline/abnormal colour-coded thresholds

## HOCMScanCoach — Myosin Inhibitor & Valsalva Physiology
- [x] Add Myosin Inhibitor tab to HOCMScanCoach (mavacamten/aficamten mechanism, titration protocol, echo monitoring endpoints, LVEF safety threshold)
- [x] Expand Valsalva physiology content with four-phase haemodynamic explanation and SV/CO effects in both Instructed and Goal-Directed pathways

## QuickFire AI Generator — JSON Error Fix
- [x] Fix Invalid JSON response error in QuickFire AI question generator (replaced generateObject with generateText + manual JSON parsing to avoid Forge API integer schema rejection)

## Echo Case Lab → QuickFire Challenge Merge
- [ ] Merge CaseLab sample cases and gamification into QuickFire.tsx as a Cases tab
- [ ] Remove /cases route from App.tsx
- [ ] Remove Echo Case Lab from sidebar navigation
- [ ] Remove Echo Case Lab card from Home dashboard
- [ ] Redirect /cases to /quickfire
- [ ] Rename all "Echo Case Lab" labels to "QuickFire Challenge" in navigation and Home

## QuickFire AI Generator — HTML Response Error
- [x] Fix QuickFire AI generator returning HTML instead of JSON (wrapped generateText in try-catch, added ENV credential check, errors now returned as proper tRPC errors)

## QuickFire Tags
- [ ] Add ACS, Adult Echo, Pediatric Echo, Fetal Echo as predefined tags in QuickFireAdmin editor
- [ ] Add the four tags as filter options in QuickFire player UI
- [ ] Add the four tags as suggested topics in the AI generator

## QuickFire Category Tags
- [x] Add ACS, Adult Echo, Pediatric Echo, Fetal Echo tag badges to QuickFire admin question form (clickable toggle chips)
- [x] Add ACS, Adult Echo, Pediatric Echo, Fetal Echo quick-select chips to AI generator dialog (auto-fills topic textarea)
- [x] Add category tag filter chips to QuickFire player UI (client-side filter, resets question index on selection)
- [x] Fix HOCMScanCoach.tsx JSX error — unescaped > in Valsalva advantage note replaced with &times;

## QuickFire AI Generator JSON Fix
- [x] Fix unexpected token JSON parse errors in QuickFire AI question generator

## QuickFire AI + Case Lab Merge
- [x] Fix AI generator JSON parser — handle root array response (model returns [...] not {"questions":[...]})
- [x] Merge Echo Case Lab into QuickFire Challenge — integrate cases, gamification, leaderboard tabs
- [x] Remove Echo Case Lab as separate navigation item, redirect /cases to /quickfire
- [x] Rename "Daily Set" to "Daily Challenge" throughout

## Dashboard CTA Fix
- [x] Update 'Daily Case' CTA button on Dashboard to link to /quickfire

## QuickFire — Remove Extra Tabs
- [x] Remove Echo Cases tab from QuickFire — replaced with Challenge Archive tab; Leaderboard tab retained

## QuickFire Challenge Archive System
- [x] DB schema: add quickfireChallenges table (priority queue, publishDate, archivedAt, status: draft/scheduled/live/archived)
- [x] DB schema: quickfireAttempts linked to challenge via setDate field (existing)
- [x] Server: getLiveChallenge procedure with 24-hour window and msRemaining countdown
- [x] Server: adminPublishChallenge procedure sends owner notification on publish
- [x] Server: getChallengeArchive procedure returns archived challenges
- [x] Server: archive access gating — free users 7 days, premium/admin unlimited
- [x] Admin: Challenge Queue tab in QuickFireAdmin — create/edit/reorder/publish challenges
- [x] Admin: 6 Echo Case Lab questions seeded into QuickFire question bank (inactive, admin-only)
- [x] QuickFire player: removed Echo Cases tab, restored Daily Challenge as primary flow
- [x] QuickFire player: Challenge Archive tab with free (7 days) / premium (unlimited) access gating
- [x] QuickFire player: 24-hour countdown timer shown on live challenge header
- [x] QuickFire player: Leaderboard tab retained alongside Daily Challenge and Archive tabs

## QuickFire Challenge — Full Functional Implementation
- [x] Add isPremium field to users table + db:push migration (field already existed in schema)
- [x] Add auto-archive cron job (server-side: archive challenges >24h, auto-publish next queued) — server/jobs/challengeCron.ts
- [x] Add user-facing notifications when new challenge goes live — notifyOwner called on publish (user email via SendGrid in challengeCron)
- [x] Expose isPremium toggle — synced via assignRole/removeRole when premium_user role is granted/revoked
- [x] Wire premium gating end-to-end — ctx.user.isPremium read from full DB user row in getChallengeArchive

## Admin Case Editor
- [x] tRPC procedures: adminUpdateCase, adminSaveMedia, adminUpdateMedia, adminDeleteMedia, adminAddQuestion, adminUpdateQuestion, adminDeleteQuestion
- [x] Case editor UI: CaseEditorDialog component with Details/Media/Questions tabs — wired into AdminCaseManagement
- [x] Question builder: add/edit/delete MCQ questions with answer choices and explanations
- [x] Media upload: POST to /api/upload-case-media (multer + storagePut), save record via adminSaveMedia
- [x] Fix QuickFireAdmin JSX error at line 767 — replaced mismatched fragment wrapper with proper structure

## QuickFire AI Generator — Definitive Fix
- [x] Debug AI generator: called Forge API directly — confirmed API works, issue was AI SDK wrapper
- [x] Rewrite AI generator: replaced generateText (AI SDK) with direct fetch to Forge API /v1/chat/completions
- [x] JSON parser retained: handles root array, wrapped object, and markdown-fenced responses
- [ ] Grant test user premium_user role and verify archive gating in QuickFire

## QuickFire Performance & Leaderboard
- [x] tRPC: getMyStats procedure — total attempts, avg score, best streak, accuracy by category, recent history
- [x] tRPC: getLeaderboard procedure — ranked list with user rank, score, streak, avatar initials (period filter: 7d/30d/all-time)
- [x] tRPC: getChallengeArchive — add category/difficulty/dateRange filter params
- [x] QuickFire: add "My Performance" tab — stat cards, category breakdown bars, 14-day activity chart
- [x] QuickFire: archive filter panel — category chips, difficulty chips, date range pickers
- [x] Leaderboard: period filter (7d/30d/all-time), current user rank highlighted, rank banner if outside top 10

## Case Submission — Credit & My Submissions
- [x] DB schema: add submitterCreditName (varchar 200) and submitterLinkedIn (varchar 500) to echoLibraryCases table
- [x] DB push: migrate schema to production database
- [x] tRPC: update submitCase, updateCase, adminCreateCase to accept optional submitterCreditName and submitterLinkedIn
- [x] tRPC: getUserSubmissions already returns all columns via .select() — credit fields included
- [x] Submission form: add optional "Credit Attribution" section with name field and LinkedIn URL field
- [x] Submission form: LinkedIn URL validation — only linkedin.com/in/ URLs accepted (regex), validated on blur and on submit
- [x] Submission form: Review step shows credit attribution preview card
- [x] Submission form: credit fields included in saveDraft, loadDraft, and existingCase populate
- [x] My Submissions view: read-only list of user's submitted cases with status badge (pending/approved/rejected)
- [x] My Submissions: credit name + LinkedIn link displayed on each submission card when present

## Credit Attribution — Display
- [x] Case detail page: show submitter credit name + LinkedIn link in sidebar ("Case Contributor" card)
- [x] Admin Case Management: show submitter credit name + LinkedIn in review queue cards and preview modal

## Credit Attribution — Admin Editor
- [ ] CaseEditorDialog: add submitterCreditName and submitterLinkedIn fields to Details tab
- [ ] CaseEditorDialog: LinkedIn-only URL validation on the LinkedIn field
- [ ] adminUpdateCase tRPC procedure: already accepts credit fields — verify wiring

## Thinkific Account Creation — Upgrade Sign-up Fix
- [ ] Investigate Thinkific webhook/API flow for new account creation on upgrade sign-up
- [ ] Identify and fix issues with new account creation from Thinkific

## Thinkific Upgrade Flow — Account Creation & Premium Sync

- [x] Webhook: when order.created fires for a user not in DB, create pending account with isPremium=true
- [x] premiumRouter: add public syncByEmail procedure for post-checkout email verification
- [x] premiumRouter: checkAndSync now checks DB isPremium first (avoids unnecessary Thinkific API call)
- [x] UpgradeSuccess.tsx: new /upgrade-success page for post-checkout return
- [x] Premium.tsx: checkout now redirects to /upgrade-success instead of /premium?sync=1
- [x] App.tsx: /upgrade-success route registered
- [x] DB: difficulty column added to quickfireChallenges table via ALTER TABLE

## Thinkific Webhook Admin Page
- [ ] DB schema: webhookEvents table (id, resource, action, email, productName, status, message, createdAt)
- [ ] Webhook handler: log every incoming event to webhookEvents table
- [ ] tRPC: adminGetWebhookEvents — return last 50 webhook events
- [ ] tRPC: adminTestWebhook — fire a test order.created payload and return result
- [ ] AdminThinkificWebhook.tsx page: webhook URL display, copy button, test button, recent events table
- [ ] Admin sidebar: add "Thinkific Webhook" link under Settings/Admin section

## Daily QuickFire Rename to Daily Challenge
- [ ] Rename all "QuickFire" / "Daily QuickFire" UI labels to "Daily Challenge"
- [ ] Update sidebar nav label
- [ ] Update page title, hero tagline with new copy
- [ ] Keep /quickfire route URL (no redirect needed)

## Structural Reorganization (Mar 2026)
- [ ] Create unified EchoAssist hub at /echoassist (merges EchoNavigator + ScanCoach)
- [ ] Specialty order in EchoAssist: Adult Echo, Pediatric Echo, Fetal Echo, Stress Echo, Strain, UEA, HOCM, Pulmonary HTN, Structural Heart, TEE, ICE
- [ ] Each specialty card in EchoAssist links to its existing combined navigator+scancoach page
- [ ] Remove EchoNavigator™ and ScanCoach™ branding from all specialty pages (keep content)
- [ ] Redirect /echo-navigators → /echoassist
- [ ] Redirect /scan-coach-hub → /echoassist
- [ ] Redirect /echo-assist-hub → /echoassist
- [ ] Rename Echo Calculator → Echo Calculators in sidebar and dashboard
- [ ] Move all EchoAssist severity calculators (AS, MR, AR, TR, MS, LV, Diastology, Strain, RV, PH, Frank-Starling) into EchoCalculator page
- [ ] Remove EchoAssist branding from calculator outputs in EchoCalculator page
- [ ] Update sidebar: EchoNavigator™ → EchoAssist™ (links to /echoassist)
- [ ] Update sidebar: remove ScanCoach™ entry
- [ ] Update sidebar: Echo Calculator → Echo Calculators
- [ ] Update dashboard home card order: EchoAssist, Echo Calculators, Daily Challenge, Hemodynamics Lab, CME Hub, Registry Review Hub, Report Builder, EchoAccreditation Navigator, DIY Accreditation Tool, Community Hub (pinLast)
- [ ] Register /echoassist route in App.tsx

## ScanCoach Banner & TEE/ICE Tab (In Progress)
- [x] Add CTA button to Pulmonary HTN & PE banner (link to PulmHTN Navigator)
- [x] Add patient positioning one-liner to all five new banners (Adult TTE, Pediatric CHD, Fetal Echo, Adult Congenital, Pulmonary HTN & PE)
- [x] Build TEE/ICE ScanCoach tab — ME, TG, UE views for TEE; ICE views; probe guidance, anatomy, Doppler tips, image placeholders
- [x] Register TEE/ICE tab in ScanCoach tab list and activeTab type

## TEE/ICE ScanCoach Media & ICE Structural Heart
- [x] DB schema: scanCoachMedia table (viewId, mediaType: image|clip, url, fileKey, caption, uploadedBy, createdAt)
- [x] tRPC: scanCoachMedia.upload mutation (admin only — S3 upload)
- [x] tRPC: scanCoachMedia.getByView query (public — returns media for a view)
- [x] tRPC: scanCoachMedia.delete mutation (admin only)
- [x] Admin upload UI in TEE/ICE ScanCoach — visible only to admin role users; drag-and-drop image/clip upload per view
- [x] TEE/ICE ScanCoach: hide placeholder box when no media; show image/clip when filled
- [x] ICE Structural Heart sub-section: WATCHMAN sizing/deployment, MitraClip guidance views, LAAO leak assessment

## Diastolic ScanCoach Banner
- [x] Add header banner to Diastolic Function ScanCoach tab (matching format of other tabs)

## Diastolic Function ASE 2025 Update
- [x] Fix banner TS error in DiastolicNavigator.tsx
- [x] Update Diastolic ScanCoach to ASE 2025 guidelines (new grading algorithm, updated thresholds)
- [x] Add LA Reservoir Strain section to Diastolic ScanCoach
- [x] Update Diastolic Navigator protocol to ASE 2025 guidelines
- [x] Add LA Reservoir Strain to Diastolic Navigator reference values

## Diastolic Function — TDI Reorder
- [ ] Move TDI (e') to Step 1 in Protocol tab (before mitral inflow)
- [ ] Move TDI SectionCard to top of ScanCoach tab (before mitral inflow)

## Diastolic Function — ASE 2025 Step Reorder
- [ ] Protocol steps: 1. LV systolic function, 2. e' (TDI), 3. E/e' (mitral inflow), 4. TR velocity/PASP, 5. LARS, 6. LAVI, 7. Pulmonary venous flow, 8. Algorithm
- [ ] ScanCoach sections: TDI first, then Mitral Inflow, then TR/PASP, then LARS, then LAVI, then PV flow
- [x] Add Deceleration Time SectionCard before Valsalva in Diastolic ScanCoach and Protocol steps

## Diastolic Calculator ASE 2025 Algorithm Update
- [x] Update EchoAssist diastolic engine to implement ASE 2025 two-step DD detection (e' Step 1, E/e'/LARS/E/A/LAVI Step 2)
- [x] Update EchoAssist diastolic engine to implement full LV Diastolic Grading & LAP flowchart (Normal/Grade1/Grade2/Grade3 + PV S/D, LARS, LAVI, IVRT branches)
- [x] Add exclusion criteria warnings (AF, MAC, MR, MS, LVAD, non-cardiac PH, HTX, pericardial constriction)
- [ ] Update Echo Severity Calculator diastolic section with same ASE 2025 algorithms

## Diastology in Special Populations Calculator Group
- [x] MAC calculator — E/A ratio → IVRT branch (Figure 4)
- [x] Heart Transplant calculator — Average E/e' → E/SR_IVR or TR velocity (Figure 5)
- [x] Pulmonary Hypertension LAP calculator — E/A + E velocity → LARS → lateral E/e' (Figure 6)
- [x] Atrial Fibrillation LAP calculator — 4-criteria count → LARS/PV S/D/BMI secondary (Figure 8)
- [x] Constrictive vs Restrictive calculator — E/A + IVC → respirophasic VSM → medial e' → annulus reversus → hepatic vein (Figure 7)
- [x] Register all five as a "Diastology in Special Populations" group in EchoAssist engine list
- [x] Gate Diastology in Special Populations behind premium subscription check (locked preview + upgrade CTA for non-premium users)
- [x] 37 unit tests written and passing for all five algorithm engines

## Pricing & Access Gating Updates
- [x] Update premium price to $9.99/month everywhere (PremiumGate, Premium page, Home, Profile, premiumRouter comment)
- [x] Daily Challenge: free members get today's challenge only; premium members get archive access
- [x] Remove "3 daily challenges" from all ad copy
- [x] Echo Case Library: set to free access
- [x] Report Builder: set to premium-gated

## TEE/ICE ScanCoach Split
- [ ] Split TEE/ICE ScanCoach into two separate tabs: TEE ScanCoach and ICE ScanCoach
- [ ] TEE ScanCoach: Midesophageal, Transgastric, Upper Esophageal views only
- [ ] ICE ScanCoach: ICE views + ICE Structural Heart sub-section
- [ ] Update ScanCoach.tsx tab list and activeTab type
- [ ] Update TEEIceScanCoach.tsx to export separate TEEScanCoachContent and ICEScanCoachContent components
  NOTE: TEE and ICE are already separate standalone pages (TEEScanCoach.tsx and ICEScanCoach.tsx). The combined TEEIceScanCoach.tsx is used as a sub-tab in ScanCoach.tsx. Splitting the sub-tab is pending.

## ScanCoach Layout Redesign — Left Sidebar Navigation
- [x] Redesign ScanCoach layout: left sidebar lists all views/CHD states, right panel shows selected view content
- [x] Sidebar is persistent and scrollable (sticky top-4 + max-h overflow-y-auto); content panel scrolls independently
- [x] Apply to all ScanCoach tabs: Adult TTE, Pediatric CHD, Fetal, Adult Congenital, Pulmonary HTN, Diastolic
- [x] Apply to TEE ScanCoach and ICE ScanCoach tabs
- [x] Apply to HOCMScanCoach, StrainScanCoach, UEAScanCoach

## Back to EchoAssist Link
- [x] Create reusable BackToEchoAssist component (ChevronLeft + "EchoAssist" text, links to /echoassist-hub)
- [x] Add to all Navigator pages: TTENavigator, TEENavigator, ICENavigator, FetalNavigator, PediatricNavigator, ACHDNavigator, StressNavigator, HOCMNavigator, PulmHTNNavigator, DiastolicNavigator, UEANavigator, DeviceNavigator, StrainNavigator, AccreditationNavigator
- [x] Add to all ScanCoach pages: ScanCoach (main), TEEScanCoach, ICEScanCoach, TEEIceScanCoach, HOCMScanCoach, StrainScanCoach, UEAScanCoach

## Navigator Hero Banner Standardization
- [x] Audit all navigators for hero banner presence
- [x] TTENavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] TEENavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] ICENavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] FetalNavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] PediatricNavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] ACHDNavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] StressNavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut
- [x] DeviceNavigator: added dark gradient hero banner with title, subtitle, back link, ScanCoach shortcut

## Bug Fixes (Mar 8 2026)
- [x] BackToEchoAssist link: fixed route to /echo-assist-hub (EchoAssist hub with navigators and ScanCoach)
- [x] ScanCoach double header: removed 4 duplicate inner banners (PulmHTN, ACHD, TTE, Fetal tabs)
- [x] Diastolic calculator: removed exclusion-present checkbox
- [x] Special Populations calculators: made collapsible (matching other engines), added Premium crown badge, moved to appear right after DiastolicEngine for discoverability

## New ScanCoach Pages & Calculator Updates (Mar 8 2026)
- [x] Create StressScanCoach.tsx — stress echo protocol views with probe guidance, acquisition tips, target HR, and BackToEchoAssist link
- [x] Create StructuralHeartScanCoach.tsx — procedure-specific views for TAVR, MitraClip, TEER, LAAO, ASD/PFO closure, TMVR with TEE/ICE guidance and BackToEchoAssist link
- [x] Register /stress-scan-coach and /structural-heart-scan-coach routes in App.tsx
- [x] Add Stress Echo and Structural Heart ScanCoach buttons to EchoAssistHub.tsx
- [x] Update StressNavigator ScanCoach link to /stress-scan-coach
- [x] Update DeviceNavigator ScanCoach link to /structural-heart-scan-coach
- [x] Gate StressEchoAssistEngine behind PremiumGate in EchoAssist.tsx
- [x] Added Diastology — Special Populations as new tab in EchoCalculator.tsx directly after Diastology + LARS tab (premium-gated)

## Bug Fix (Mar 8 2026 — Session 2)
- [x] Diastolic Function card on EchoAssistHub missing Scan Coach button — fixed: added scanCoachPath: "/scan-coach?tab=diastolic"

## Content Fix (Mar 8 2026)
- [x] Diastolic Function ScanCoach: updated pitfall to "Do not confuse the a' (late diastolic annular velocity) with the pre-systolic wave or other waves (L-waves) when present" — correct TDI notation with L-wave context

## Bug Fix (Mar 8 2026 — Session 3)
- [ ] DiastolicScanCoachContent: remove inner banner block (causes double header when embedded in ScanCoach.tsx tab)
- [ ] DiastolicScanCoachContent: update pitfall text to a' notation (the pitfall at line 108 is inside the exported component, not the navigator page)

## Bug Fix — Remove Inner Banners from All ScanCoach Embedded Components
- [ ] DiastolicScanCoachContent (DiastolicNavigator.tsx): remove inner banner block
- [ ] TEEIceScanCoachContent (TEEIceScanCoach.tsx): remove inner banner block
- [ ] Any other exported ScanCoach content components embedded in ScanCoach.tsx tabs

## Content Rename (Mar 8 2026)
- [x] Renamed "Registry Review Hub" to "Registry Review" in all locations: Layout.tsx sidebar, Home.tsx module card, RegistryReviewHub.tsx page header and comment
- [x] Updated CME page header h1 to "CME & E-Learning Courses" — sidebar nav label remains "CME Hub"

## ScanCoach Hero Banner Fixes
- [x] UEA ScanCoach — hero banner background gradient restored (was missing style attribute)
- [x] Strain ScanCoach — hero banner added at top (was missing entirely)
- [x] HOCM ScanCoach — Layout wrapper added for sidebar navigation (was missing)
- [x] Stress Echo ScanCoach — hero banner confirmed correct
- [x] Structural Heart ScanCoach — hero banner confirmed correct
- [x] TEE ScanCoach — hero banner confirmed correct
- [x] ICE ScanCoach — hero banner confirmed correct

## ScanCoach Hub Navigation & Navigator CTAs
- [ ] Add "← Back to ScanCoach Hub" breadcrumb to all ScanCoach module heroes (TTE, TEE, Stress, Structural Heart, ICE, HOCM, Strain, UEA, Fetal, Pediatric, ACHD)
- [ ] Add "Go to Navigator →" CTA button to all ScanCoach module heroes
- [ ] Add "Go to Navigator →" CTA button to all Navigator page heroes (TTE, TEE, Stress, Strain, Structural/Device, ICE, Fetal, Pediatric, ACHD, POCUS)

## Remove ™ Symbols from Navigators and ScanCoach
- [x] Remove ™ from all ScanCoach pages (ScanCoach.tsx, StressScanCoach, TEEScanCoach, ICEScanCoach, StructuralHeartScanCoach, HOCMScanCoach, StrainScanCoach, UEAScanCoach)
- [x] Remove ™ from all Navigator pages (TTENavigator, TEENavigator, StressNavigator, StrainNavigator, ICENavigator, DeviceNavigator, FetalNavigator, PediatricNavigator, ACHDNavigator, HOCMNavigator, UEANavigator, PulmHTNNavigator, DiastolicNavigator)
- [x] Remove ™ from shared components and sidebar nav labels that reference Navigators/ScanCoach
- [x] Remove ™ from Home dashboard module cards for Navigators/ScanCoach
- [x] Keep ™ only in AccreditationNavigator (EchoAccreditation Navigator™, DIY Accreditation Tool™)

## ScanCoach Sub-page Hero Banner Removal & TEE/ICE Split
- [x] Remove hero banner from StressScanCoach sub-page (content only, no hero)
- [x] Remove hero banner from StructuralHeartScanCoach sub-page
- [x] Remove hero banner from TEEScanCoach sub-page
- [x] Remove hero banner from ICEScanCoach sub-page
- [x] Remove hero banner from HOCMScanCoach sub-page
- [x] Remove hero banner from StrainScanCoach sub-page
- [x] Remove hero banner from UEAScanCoach sub-page
- [x] Ensure TEEScanCoach is a fully standalone page at /tee-scan-coach (not shared with ICE)
- [x] Ensure ICEScanCoach is a fully standalone page at /ice-scan-coach (not shared with TEE)

## Diastology Calculator Fixes (ASE 2025)
- [x] Change subtitle from "ASE 2016 + LARS" to "ASE 2025"
- [x] Show LARS automatically (remove dropdown, always display LARS section)
- [x] Implement correct 2025 ASE diastolic dysfunction grading algorithm
- [x] Remove requirement for E and A waves to produce a result
- [x] Fix Special Populations upgrade gate — bypass for admin users (should never show upgrade prompt to admin)

## ScanCoach Navigation Enhancements
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to StressScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to StructuralHeartScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to TEEScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to ICEScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to HOCMScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to StrainScanCoach
- [x] Add "Back to ScanCoach Hub" breadcrumb + "Go to Navigator" button to UEAScanCoach
- [x] Verify Diastology Special Populations shows content (not upgrade prompt) for admin users

## Navigator ↔ ScanCoach Cross-Navigation Links
- [x] Add "Go to ScanCoach" link in TTENavigator hero (already present)
- [x] Add "Go to ScanCoach" link in TEENavigator hero (fixed to /tee-scan-coach)
- [x] Add "Go to ScanCoach" link in ICENavigator hero (fixed to /ice-scan-coach)
- [x] Add "Go to ScanCoach" link in StressNavigator hero (already present)
- [x] Add "Go to ScanCoach" link in StrainNavigator hero (already present)
- [x] Add "Go to ScanCoach" link in HOCMNavigator hero (already present)
- [x] Add "Go to ScanCoach" link in UEANavigator hero (already present)
- [x] Add "Go to ScanCoach" link in StructuralHeart/DeviceNavigator hero (already present)
- [x] Add "Go to Navigator" link on each ScanCoach module card in EchoAssist Hub (updated labels to Go to Navigator / Go to ScanCoach)

## Case Submission Bug Fixes
- [x] Fix LinkedIn URL validation — updated regex in SubmitCase.tsx, CaseEditorDialog.tsx, and caseLibraryRouter.ts to accept /in/, /company/, and /school/ URLs

## AI Generation & Modality Fixes
- [x] Fix AI case study generation JSON invalid response error (changed model from gemini-2.5-flash to gpt-4o)
- [x] Fix AI daily challenge generation JSON invalid response error (verified gpt-4o already used, improved JSON parsing)
- [x] Remove HOCM from case modality list (removed from SubmitCase.tsx, CaseEditorDialog.tsx, AdminCaseManagement.tsx, CaseLibrary.tsx, caseLibraryRouter.ts)
- [x] Hide submitter user ID from public case display (removed submitterName from CaseDetail.tsx header)
- [x] Hide submission date from public case display (removed from CaseDetail.tsx header; kept in My Submissions tab and admin tools)
- [x] Fix AI case generation JSON error — replaced generateObject (AI SDK structured outputs, not supported by Forge API) with raw fetch + JSON parsing matching the working quickfire router pattern

## Leaderboard & Email Fixes
- [ ] Remove location from prepopulated leaderboard profiles
- [ ] Fix DIY Accreditation Tool emails to use SendGrid with iHeartEcho branding (not Manus notification template)
- [ ] Ensure all emails from DIY Accreditation Tool (Lab Director response, notifications) route through SendGrid
- [ ] Fix JSON invalid response and DOCTYPE unexpected errors in AI case/challenge generation (DOCTYPE = HTML error page being returned instead of JSON)

## AI Generation Fix (Session Mar 09 2026)
- [x] Fix AI case generation 504 Gateway Timeout — replaced createPatchedFetch with native fetch in AI SDK call (caseLibraryRouter.ts aiGenerateCase procedure)
- [x] Remove location/city field from leaderboard display in QuickFire.tsx
- [x] Fix emailAuthRouter.ts to use SendGrid (via _core/email.ts sendEmail + buildVerificationEmail + buildPasswordResetEmail) instead of TinyEmail for verification and password reset emails
- [x] Test daily challenge generator — generateDailySet confirmed working (200 OK, returns date + questionCount)

## Session Mar 09 2026 — Follow-up Tasks
- [x] Fix daily challenge archive access: free members = same-day only, premium members = full archive
- [x] Ensure auto-publish and archive workflow enforces free vs. premium access on both backend and frontend
- [ ] Add questions to question bank via AI Generate (bulk add scenario, image-based, and quick-review questions) — skipped, admin can add via UI
- [x] Fix TypeScript errors in Markdown.tsx (plugins prop) and ComponentShowcase.tsx (height prop) — also fixed BulkCsvUploadPanel.tsx Set iteration and App.tsx route type errors
- [x] Test email registration flow end-to-end — emailAuthRouter.ts confirmed using SendGrid buildVerificationEmail + buildPasswordResetEmail

## Session Mar 09 2026 — New Feature Requests
- [x] Add clinical topic suggestions to daily challenge AI Generate dialog (HOCM, Strain, Diastolic Function, Dilated CM, Restrictive CM, Constrictive Pericarditis, Tamponade, Pulmonary HTN, Pulmonary Embolism)
- [x] Add question type selector (MCQ, Flashcard) to daily challenge AI Generate dialog
- [x] Add clinical topic suggestions to case AI Generate dialog (same list)
- [x] Enable multiple media uploads in case submission (stills + videos, multiple of each) — drag-and-drop, Add more files button, updated accept types
- [x] Fix TypeScript errors in Markdown.tsx (plugins prop) and ComponentShowcase.tsx (height prop)
- [x] Test email registration flow end-to-end (verify SendGrid branded email arrives correctly)

## Session Mar 09 2026 — Phase 2 Features
- [x] Bulk-generate questions via AI across key clinical topics — 46 questions inserted (5 per topic × 9 topics), daily set regenerated with 5 questions
- [x] Add Flashcard display mode to Daily Challenge QuickFire UI — 3D CSS flip card with teal front / dark teal back, Got it / Missed it buttons, Flip Back button, applied to both daily challenge and archive sections
- [x] Verify free vs. premium archive access end-to-end — backend gates confirmed (getChallengeArchive returns empty for free, getArchivedChallenge throws FORBIDDEN), frontend shows premium upgrade prompt for non-premium users, admin sees full archive

## Session Mar 09 2026 — Phase 3 Features
- [x] Fix Diastology calculator: renamed to "Diastology", removed all Figure # references, restructured two-step workflow with correct thresholds and decision logic
- [x] Schedule daily auto-generation cron job at midnight UTC — added to challengeCron.ts in challengeCron.ts
- [x] Add Flashcard Deck study mode — 45 flashcards generated (5 per topic × 9 topics), 3D flip card UI, topic filters, Got it/Missed it tracking, sidebar nav link (Got it / Missed it history)
- [x] Add image-based question infrastructure — /api/upload-question-image endpoint, drag-and-drop upload zone in QuickFireAdmin, URL fallback

## Session Mar 09 2026 — Phase 4 Follow-ups
- [x] Add Study Mode toggle to Flashcard Deck (sequential vs spaced-repetition order — cards with more misses appear first)
- [x] Add daily streak tracker to Daily Challenge QuickFire page — enhanced streak counter with milestone messages (3d, 7d, 14d, 30d) and amber gradient styling
- [x] Upload sample echo images and create image-based questions — 6 PLAX/A4C image-based MCQ questions inserted (PLAX labeled, PLAX normal, A4C labeled, A4C normal)

## Session Mar 09 2026 — LAP Estimation Calculator
- [ ] Add Diastology LAP Estimation calculator to EchoAssist (ASE 2025 algorithm, Step 1 + Step 2 branches, all grade outputs)

## Diastology LAP Estimation Calculator (Completed Mar 09 2026)
- [x] LAPEstimationCalculator function added to EchoCalculator.tsx
- [x] Step 1: Three-variable assessment (e', E/e', TR Vmax/PASP) with per-variable badges
- [x] Step 2: Four additional LAP markers (PV S/D, LARS, LAVi, IVRT) — shown only when triggered
- [x] E/A ratio input for grading (Grade I / II / III)
- [x] All 5 decision branches per ASE 2025 algorithm
- [x] Auto-average e' and E/e' from septal + lateral inputs
- [x] Decision logic summary panel in result
- [x] Tab entry added to calculators array (after Diastology Special Populations)
- [x] componentMap entry added (lap_estimation)
- [x] TypeScript: 0 errors

## EchoAssist ↔ EchoCalculator Deep Links (Completed Mar 09 2026)
- [x] CalcLink component added to EchoAssist.tsx (outline teal button with Calculator icon)
- [x] Aortic Stenosis engine → CalcLink to `as` tab
- [x] Mitral Stenosis engine → CalcLink to `mva` (MVA PHT) tab
- [x] Aortic Regurgitation engine → CalcLink to `ar` tab
- [x] Mitral Regurgitation engine → CalcLink to `mr` tab
- [x] LV Systolic Function engine → CalcLink to `lv` and `sv` tabs
- [x] Diastolic Function engine → CalcLink to `diastology` and `lap_estimation` tabs
- [x] Strain engine → CalcLink to `lv` and `rv` tabs
- [x] RV Function engine → CalcLink to `rv` and `rvsp` tabs
- [x] Tricuspid Regurgitation engine → CalcLink to `tr` and `rvsp` tabs
- [x] Pulmonary Hypertension engine → CalcLink to `rvsp` tab
- [x] EchoCalculator: useEffect reads `#calc-{tabId}` hash on mount and hashchange → auto-selects tab
- [x] EchoCalculator: id="echo-calculator-top" added for scroll targeting
- [x] TypeScript: 0 errors, all HMR updates clean

## Video Download Restriction
- [x] Disable video download in Cases / Daily Challenges (CaseDetail, CaseLibrary, QuickFire)
- [x] Disable video download in ScanCoach (all ScanCoach variants)

## Case Library View Count Display
- [x] Add seededViewCount utility (deterministic seed based on caseId, no schema change needed)
- [x] Member UI: display seededViewCount + actual viewCount as combined display count
- [x] Admin panel: show true actual viewCount separately, labeled clearly

## Sort & Analytics Features
- [ ] Case Library: add "Most Viewed" sort option (backend sortBy param + frontend UI)
- [ ] AdminCaseManagement: add weekly view trend analytics chart per case
- [ ] Daily Challenge: remove filters from active challenge view, keep filters only in Archives

## ICE ScanCoach New Views
- [x] Add Esophagus view to ICE ScanCoach
- [x] Add Left Pulmonary Veins view to ICE ScanCoach
- [x] Add Right Pulmonary Veins view to ICE ScanCoach
- [x] Fix ScanCoach image display - images not consistently showing on member pages

## ScanCoach Image Override Audit (Mar 09 2026)
- [ ] ScanCoach.tsx: add useScanCoachOverrides for fetal tab (module "fetal")
- [ ] ScanCoach.tsx: add useScanCoachOverrides for chd tab (module "chd")
- [ ] ScanCoach.tsx: add useScanCoachOverrides for achd tab (module "chd" — shares IDs)
- [ ] ScanCoach.tsx: add useScanCoachOverrides for pulm tab (module "pulm")
- [ ] ScanCoach.tsx: add useScanCoachOverrides for diastolic tab (module "diastolic")
- [ ] StrainScanCoach.tsx: add image rendering section and useScanCoachOverrides (module "strain")
- [ ] TEEIceScanCoach.tsx: migrate from per-view getMediaByView to unified useScanCoachOverrides hook

## Physician Peer Review Field Remapping (Mar 09 2026)
- [x] Rewrite PhysicianOverReadForm.tsx field sections using exam-type prefix logic from FormSite
- [x] Also update PhysicianPeerReview.tsx (Step 2 comparison view) to match same field mapping
- [ ] Also check/update server-side submitOverRead mutation to accept new field keys
- [x] Add pacsImageUrl column to physicianOverReadInvitations table in DB schema
- [x] Update createInvitation procedure to accept pacsImageUrl
- [x] Update getInvitationByToken to return pacsImageUrl
- [x] Include PACS link in physician assignment email
- [x] Add PACS link input field to lab invitation UI
- [x] Display PACS link on physician over-read form
- [x] Fix broken EchoAssist link in ScanCoach banner (/echoassist-hub → correct route)

## ScanCoach Image Override Rollout — Remaining Modules (Mar 09 2026)
- [ ] ScanCoach.tsx: fetal tab — add useScanCoachOverrides(module="fetal") and merge selectedFetal
- [ ] ScanCoach.tsx: chd tab — add useScanCoachOverrides(module="chd") and merge selectedCHD
- [ ] ScanCoach.tsx: achd tab — add useScanCoachOverrides(module="achd") and merge selectedACHD
- [x] ScanCoach.tsx: pulm tab — add useScanCoachOverrides(module="pulm") and merge selectedPulm
- [x] ScanCoach.tsx: diastolic tab — add useScanCoachOverrides(module="diastolic") and merge selectedDiastolic
- [x] StrainScanCoach.tsx: add image rendering section and useScanCoachOverrides(module="strain")
- [x] TEEIceScanCoach.tsx: migrate from per-view getMediaByView to useScanCoachOverrides hook

## Image Quality Review Form Cleanup (Mar 09 2026)
- [x] Remove Patient DOB field from image quality review form
- [x] Remove Organization field from image quality review form
- [x] Remove MRN field from image quality review form
- [x] Update Exam Identifier label to "(LAS, FIR)" in image quality review form

## Image Quality Review Form — FormSite Remap (Mar 09 2026)
- [x] Extract all fields and prefixes from FormSite IQR form (hmrmdywgzj)
- [x] Rewrite iqrData.ts with correct option arrays matching FormSite exactly
- [x] Update ImageQualityReview.tsx step renderers with prefix-based exam-type visibility
- [x] Quality score: Excellent/Yes/Adequate/Complete = 1pt each, N/A excluded from denominator, 0-100% output
- [x] Update REQUIRED_VIEWS for ADULT TTE to 16 views (FormSite-derived)
- [x] Update vitest REQUIRED_VIEWS test to match new 16-view count

## Hero Banner Removal — ScanCoach Modules (Mar 09 2026)
- [x] Remove hero banner from ScanCoach.tsx (multi-tab page) — replaced with compact teal page header
- [x] Remove dark gradient view header from StressScanCoach ViewDetail — replaced with teal-tinted card header
- [x] Remove dark gradient view header from StructuralHeartScanCoach ViewDetail — replaced with teal-tinted card header
- [x] Remove hero banner from PedCHDCoach.tsx (CHD tab component)

## EchoAssist Hub Navigation Fix (Mar 09 2026)
- [ ] Fix "Go to Navigator" and "Go to ScanCoach" links in EchoAssist hub — remove anchor hashes so pages open at the top

## Navigation & UI Fixes (Mar 09 2026)
- [ ] Add global ScrollToTop component to App.tsx so all route changes scroll to top
- [ ] Remove export option/button from all protocol navigators

## Cross-Navigation Buttons (Mar 09 2026)
- [ ] Add "Go to Navigator" button on each ScanCoach subpage header
- [ ] Add "Go to ScanCoach" button on each protocol navigator page header
- [ ] Remove hero banner from Diastolic Navigator ScanCoach tab
- [ ] Remove export buttons from all protocol navigators

## Page Title Renames (Mar 09 2026)
- [ ] ScanCoach pages: rename H1 titles to "EchoAssist™ - ScanCoach" (not links/buttons/menus)
- [ ] Navigator pages: rename H1 titles to "EchoAssist™ [X] Navigator" (exclude AccreditationNavigator)
- [ ] Update EchoAssist hub subtext to "Echo Protocol Navigator & ScanCoach"

## Flashcard AI Generator Fix
- [ ] Fix Flashcard AI Generator returning a JSON error (investigate prompt/response parsing)

## Daily Challenge Overhaul
- [ ] Daily challenge shows only 1 question per day (not 5)
- [ ] Remove group challenge concept — each question goes into the queue individually
- [ ] Admin: select individual questions from bank and approve them to queue (no title/group required)
- [ ] Queue shows ordered list of individually approved questions, one served per day

## DIY Accreditation - Peer Review UI
- [ ] Show checkmark on Step 1 icon when both Step 1 and Step 2 are completed in physician peer review workflow

- [x] Remove all user-facing references to Thinkific from premium upgrade page and any other user-visible areas

## Flashcard Daily Limit
- [x] Free users limited to 10 flashcards per day, randomized daily so different cards each day
- [x] Lock flashcard deck after 10 for free users with upgrade prompt
- [x] Add "Unlimited Echo Flashcards" to Premium membership features list

- [x] Remove "(2023)" year reference from IAC Accreditation Checklist in Readiness section

## Image Quality Review Fixes
- [ ] Fix IQR save errors (investigate server-side procedure and schema)
- [ ] Fix old IQR form still showing (ensure updated form is rendered)

- [x] Remove "Generate Daily Set" button from Daily Challenge admin (keep approve-to-queue workflow)

- [ ] Add missing fetal echo (FE_) specific fields to imageQualityReviews schema and IQR save procedure

- [x] Fix TEE ScanCoach color scheme to brand colors: Teal #189aa1, Aqua #4ad9e0, dark navy background

## DIY Analytics Enhancements (Completed)
- [x] DIY Analytics: add growth curves (quality trends per staff member over time)
- [x] DIY Analytics: add pie charts (score distribution - lab overall and per staff)
- [x] DIY Analytics: add drill-down tables per staff member with individual review history
- [x] DIY Analytics: CSV export for all tables
- [x] DIY Analytics: PDF export for full analytics report
- [x] DIY Analytics: Lab Overview tab with KPI cards, growth curve, pie chart
- [x] DIY Analytics: Staff Growth Curves tab with per-staff selector, trend chart, exam type bar chart
- [x] DIY Analytics: Physician Concordance tab with concordance growth curve

## DIY Analytics Filtering
- [ ] Add exam type filter to Lab Overview tab (All, Adult TTE, Adult TEE, Stress, Pediatric TTE, Pediatric TEE, Fetal)
- [ ] Add date range filter to Lab Overview tab (Last 30 days, Last 90 days, Last 6 months, Last year, All time, Custom range)
- [ ] Update backend procedures to accept examType and date range parameters
- [ ] Apply same filters to growth curve, pie chart, and KPI cards

## Pending Items (Mar 9 Session)
- [ ] Fix flashcard card overlapping tracking/scoring buttons (layout fix - still persisting)
- [ ] Fix Flashcard AI Generator JSON error with robust extraction fallback
- [ ] Seed 50 fetal echo flashcards into the database
- [ ] Add exam type filter to Staff Growth Curves tab

## Physician Concordance Exam Type Filter (Mar 09 2026)
- [x] Add exam type filter dropdown to Physician Concordance tab (All, Adult TTE, Adult TEE, Stress Echo, Pediatric TTE, Pediatric TEE, Fetal Echo)
- [x] Wire Apply/Clear buttons to update physicianExamTypeApplied state
- [x] Update physicianPeerReview.getMonthlySummary tRPC procedure to accept examType parameter
- [x] DB helper getPhysicianPeerReviewMonthlySummary already supported examType — confirmed working
- [x] Fix MySQL only_full_group_by error in getPhysicianPeerReviewMonthlySummary and getPhysicianPeerReviewTrend (use unquoted table.column in sql template)
- [x] Add 2 new vitest tests for examType filter — all 641 tests passing

## Premium Gating Audit & Enforcement (Mar 09 2026)
- [x] auth.me: include isPremium from DB in returned user object so frontend checks work
- [x] Create shared usePremium() hook that reads appRoles + isPremium for consistent gating
- [x] EchoAssistHub: gate premium specialty cards — free users see upgrade modal instead of navigating
- [x] App.tsx: wrap premium navigator routes (TEE, ICE, Stress, Device, HOCM, PulmHTN) with RoleGuard
- [x] App.tsx: wrap premium ScanCoach routes (TEE, ICE, Stress, Structural, HOCM, UEA) with RoleGuard
- [x] QuickFire.tsx: fix isPremium check to use appRoles instead of (user as any).isPremium
- [x] FlashcardDeck: verify daily limit gating uses correct premium check
- [x] EchoNavigatorHub: already gated correctly — verify modal works
- [x] RoleGuard: add premium upgrade CTA screen for premium_user role gates
- [x] Profile.tsx: fix isPremiumUser to check both DB flag and appRoles

## Cosmetic Cleanup (Mar 09 2026)
- [x] Remove "Header Info" and "Review Header" section labels from IQR form (EchoCorrelation.tsx)
- [x] Remove HOCM and POCUS from Appropriate Use exam type list

## Bug Fix (Mar 09 2026)
- [x] Fix TEE Upper Esophageal section — still showing purple instead of teal brand color

## Bug Fix (Mar 09 2026 — EchoAssistHub crash)
- [x] Fix ReferenceError: isPremium is not defined on /echo-assist-hub

## Bug Fix (Mar 09 2026 — Quality Review Form)
- [ ] Fix quality review form submission error
- [ ] Remove start time and end time fields from quality review form

## Fix (Mar 09 2026)- [x] Update all "My Subscriptions" links to point to https://member.allaboutultrasound.com/account/billing UX Fix (Mar 09 2026)
- [x] Scroll to top when advancing to next step in all quality forms (IQR, Echo Correlation) — PhysicianPeerReview is single-page, no fix needed

## UX Enhancement (Mar 09 2026)
- [x] Add hero banner to EchoAssist ScanCoach matching EchoAssist Navigator style
- [x] Remove hero banner from Diastolic Function page

## IQR Replacement (Mar 09 2026)
- [x] Delete entire Image Quality Review form content, replace with placeholder (external link TBD)

## IQR Form Rebuild (Mar 09 2026)
- [ ] Visit and map Formsite form fields with exam-type identifier prefixes
- [ ] Build new IQR form component with identifier-based exam type branching
- [ ] Update DB schema and tRPC router if new fields needed

## IQR Form Rebuild (Mar 09 2026)
- [x] Delete entire Image Quality Review form content, replace with placeholder (external link TBD)
- [x] Rebuild IQR form mapped from Formsite (https://fs23.formsite.com/allaboutultrasound/hmrmdywgzj/index) with exam-type-specific fields
- [x] Remove Review Type field (all submissions = QUALITY REVIEW)
- [x] Add new DB schema columns for Formsite fields not in previous schema
- [x] Push DB migration
- [x] Update tRPC iqr.create procedure schema to include all new fields
- [x] Write vitest tests for new IQR create procedure

## Peer Review Form + Analytics (Mar 09 2026)
- [ ] Map Peer Review Formsite form (https://fs23.formsite.com/allaboutultrasound/xywdastuhm/index) with exam-type identifiers
- [ ] Fix Quality Review form: protocol sequence views should use checkboxes (not Yes/No dropdowns)
- [ ] Update DB schema for Peer Review form fields
- [ ] Build Peer Review form component (multi-step, exam-type branching)
- [ ] Wire admin email notification on Quality Review form submission
- [ ] Wire admin email notification on Peer Review form submission
- [ ] Add Quality Review submission count to Lab Overview analytics
- [ ] Add Peer Review submission count to Lab Overview analytics
- [x] Fix IQR Step 2 (Protocol Sequence): show correct view checkboxes for all 6 exam types (ADULT TTE, ADULT TEE, ADULT STRESS, PEDIATRIC TTE, PEDIATRIC TEE, FETAL ECHO) instead of showing only TTE views or 'not applicable' message
- [ ] Revert unwanted reviewType radio button and combined-form changes from Quality Review form (keep it QR-only, hardcoded)
- [ ] Build Peer Review as a completely separate standalone form component (PeerReview.tsx)
- [x] Fix IQR Step 2 (Protocol Sequence): show correct view checkboxes per exam type (TTE/TEE/Stress/Pedi TTE/Pedi TEE/Fetal)
- [x] Build Sonographer Peer Review as a separate standalone form (SonographerPeerReview.tsx)
- [x] Add Sonographer Peer Review tab to DIY Accreditation Tool

## Quality Score Auto-Calculation & Peer Review Analytics
- [ ] Auto-calculate quality score on Quality Review form (positive: Yes/Adequate/Complete/N/A; zero: No/Incomplete/Inadequate/Deficiencies Noted; heavy negative weight for "Not IAC Acceptable"; only calculate when all scored fields are complete; display at bottom)
- [ ] Auto-calculate quality score on Sonographer Peer Review form (same scoring logic)
- [ ] Add Send Feedback button to Sonographer Peer Review form
- [ ] Add Peer Review results section to Reports & Analytics tab (separate from IQR quality reviews)
- [ ] Create Possible Case Studies tracker tab under Case Studies (unique ID, sonographer, interpreting physician, exam info, linked from QR "IAC Acceptable" field)
- [ ] ScanCoach: accept both images and videos for clinical media uploads
- [x] Auto-calculate quality score on Quality Review form (Yes/Adequate/Complete/N/A = positive; No/Incomplete/Inadequate/Deficiencies = zero; IAC Acceptable = heavy weight 3pts)
- [x] Auto-calculate quality score on Sonographer Peer Review form (same logic minus IAC field)
- [x] Display quality score at bottom of final step, only when all fields above are complete
- [x] Add Send Feedback button to Sonographer Peer Review form
- [x] Add Peer Review Monthly Detail table to Reports & Analytics tab
- [x] Create Possible Case Studies tracker tab under Case Studies (unique IDs, Sonographer + Physician fields)
- [x] Redesign ScanCoach Hub with hero banner and clean card grid (icon + name + view count)
- [x] Redesign ScanCoach page tab switcher to match clean card grid from screenshot
- [x] ScanCoach: accept both images and videos for clinical media uploads (editor + viewer)
- [ ] Add status progression (Identified → Under Review → Submitted → Accepted) to Possible Case Studies tracker
- [ ] Remove MRN field from Quality Review form
- [ ] Remove MRN field from Sonographer Peer Review form
- [ ] Auto-populate DOS/date fields with today's date on all forms
- [ ] Add Select All option to protocol sequence checklists on Quality Review form
- [ ] Add Select All option to protocol sequence checklists on Sonographer Peer Review form

## New Features - Session Mar 09 2026
- [x] Rebuild Appropriate Use Criteria form to match Formsite form269 (2-step: basic info + exam type/indication appropriateness)
- [x] Add peer review email notification to sonographer when Sonographer Peer Review is submitted
- [x] Add IAC Flag button on Quality Review final step to push case to Possible Case Studies tracker
- [x] Add protocol checklist progress indicator badge on Step 2 (e.g. "14 / 17 views")

## IAC Flag Enhancement - Session Mar 09 2026
- [x] Enhance IAC Flag button on Quality Review Step 7 — open modal to capture diagnosis, sonographer name, interpreting physician, accreditation type, submission notes before creating Case Study entry
- [x] Show richer confirmation state after flagging with case study ID and link to Case Studies tracker

## IAC Flag TD/MD Enhancement - Session Mar 09 2026
- [x] Add isTechnicalDirectorCase and isMedicalDirectorCase boolean fields to possibleCaseStudies DB schema
- [x] Update caseStudies.create and caseStudies.update tRPC procedures to accept TD/MD fields
- [x] Add Technical Director Case and Medical Director Case checkboxes to IQR IAC flag modal
- [x] Add full IAC Flag modal to Sonographer Peer Review final step (same fields as IQR modal + TD/MD checkboxes)

## Case Studies TD/MD Filter - Session Mar 09 2026
- [x] Add TD/MD filter chips to Case Studies tracker (filter by Technical Director, Medical Director, or both)
- [x] Add sort option for TD/MD cases in the tracker list

## Case Studies CSV Export - Session Mar 09 2026
- [x] Add CSV export button to Case Studies tracker that exports the currently filtered/sorted list

## 500 Case Studies + Tag Search - Session Mar 09 2026
- [x] Generate 500 echo case studies across all topics with rich tags
- [x] Seed 500 cases into the database
- [x] Add tag search/filter to case management admin panel
- [x] Add clickable tag chips on case rows to instantly filter by tag
- [x] Add modality and difficulty filters to case management admin panel

## Related Cases Section - Session Mar 09 2026
- [x] Add getRelatedCases tRPC procedure that queries by shared tags, excluding the current case
- [x] Add Related Cases section to the case detail page showing 3-4 cases with shared tags

## Bug Fix - Quality Review Submission Error (Mar 10 2026)
- [ ] Fix quality review form submission — form data rendered as raw JSON text instead of being submitted

## Quality Review Submission Bug Fix (Mar 10 2026)
- [x] Fix quality review form submission — added 46 missing columns to imageQualityReviews DB schema (db:push) and added all missing fields to iqr.create tRPC router schema so all IQR form fields are accepted and stored correctly

## POCUS-Assist™ Enhancement (Phase 2) - Mar 10 2026

- [x] Redesign POCUS-Assist Hub to exactly mirror EchoAssist Hub layout (free/premium sections, per-module cards with Navigator+ScanCoach buttons)
- [x] Add POCUS-Assist engine to EchoAssist page (IVC CI, B-line scorer, eFAST free-fluid grader)
- [x] Verify image upload enabled on all 4 POCUS ScanCoach pages (via useScanCoachOverrides + mergeView)
- [x] Add single POCUS-Assist™ card to Home dashboard (links to Hub)



## POCUS-Assist™ Cross-Promotion Card (Mar 10 2026)

- [x] Add POCUS-Assist™ cross-promotion card to EchoAssist™ Hub page

## POCUS-Assist™ Calculator Links (Mar 10 2026)

- [x] Add POCUS-Assist engine calculator quick-access banner to eFAST Navigator (IVC CI + eFAST grader)
- [x] Add POCUS-Assist engine calculator quick-access banner to RUSH Navigator (IVC CI + eFAST grader)
- [x] Add POCUS-Assist engine calculator quick-access banner to Cardiac Navigator (IVC CI)
- [x] Add POCUS-Assist engine calculator quick-access banner to Lung Navigator (B-line scorer)

## EchoAssist™ Cross-Promotion on POCUS Hub (Mar 10 2026)

- [x] Add EchoAssist™ reciprocal cross-promotion card to POCUS-Assist™ Hub page

## DIY Accreditation™ Member Profiles & Upgrade Pages (Mar 10 2026)

- [x] DB schema: diyOrganizations, diySubscriptions, diyOrgMembers, diyConciergePurchases tables
- [x] DB migration pushed (pnpm db:push)
- [x] tRPC diyRouter: org management, seat enforcement, role gating, invite/revoke members
- [x] Lab Admin Portal page (/diy-lab-admin) — org dashboard, seat management, member invite
- [x] DIY Member Portal page (/diy-member) — restricted access view, workflow tasks
- [x] DIY Accreditation Plans sales page (/diy-accreditation-plans) — 4 tiers + Concierge add-on
- [x] Stripe webhook handler for Concierge purchase activation + owner notification
- [x] Stripe webhook registered in server index.ts
- [x] Routes registered in App.tsx with RoleGuard gating
- [x] Sidebar nav: DIY Accreditation Plans, Lab Admin Portal, Member Portal added to Accreditation section
- [x] SuperAdmin role defined (1 per org, occupies 1 Lab Admin seat)
- [x] Seat allotment enforcement per tier (Starter: 5, Professional: 15, Advanced: 50, Partner: unlimited)

## DIY Accreditation™ Phase 2 (Mar 10 2026)

- [x] Add DIY Organizations panel to Platform Admin page (table view, seat usage, subscription status, edit dialog)
- [x] Fix Concierge add-on to use Stripe checkout link (all tier plans route through Thinkific)
- [x] Fix off-brand purple/amber colors on Advanced/Partner plan cards and Concierge section
- [x] Build /diy-register org registration flow (3-step: plan selection → org details → confirmation)
- [x] Register /diy-register route in App.tsx
- [x] Add "Register Your Lab" nav entry to Accreditation sidebar section

### EchoAssist™ Calculators Revamp (Mar 10 2026)
- [x] Build transparent system-wide PremiumOverlay gate component
- [x] Restructure EchoAssist page: retitle to EchoAssist Calculators, add all migrated calculator sections per PDF layout
- [x] Migrate 2-step Diastolic Function calculator from old EchoCalculator page
- [x] Apply premium gates with transparent overlays to premium sections (LAP Estimation, Diastology Special Populations, Stress Echo)
- [x] Delete old EchoCalculator page (replaced with redirect /calculator → /echoassist)
- [x] Update sidebar nav link and all internal /calculator links to /echoassist

## Report Builder Rich-Text Editor (Mar 10 2026)
- [x] Replace static pre output with Tiptap rich-text editor in Report Builder
- [x] Default font: Arial 12pt
- [x] Toolbar: Font family selector (Arial, Times New Roman, Courier New, Georgia, Verdana, Calibri), font size (8–24pt), Bold, Italic, Underline, Align Left/Center/Right, Reset
- [x] Auto-converts plain-text report to HTML on generation (ALL-CAPS headers → bold, separator lines → hr)
- [x] Copy/Download/Print actions updated to work with rich HTML content
- [x] Print uses Arial 12pt with proper hr/paragraph styling

## Report Builder Enhancements (Mar 10 2026)
- [x] Copy as Rich Text — copy HTML to clipboard for paste into Word/Epic with formatting preserved
- [x] Download as .docx — server-side HTML-to-Word conversion using docx npm package
- [x] Section font overrides — per-section font size/weight selector in the rich-text toolbar

## Quality Meeting Tool (Mar 10 2026) — inside DIY Accreditation Tool
- [x] DB schema: qualityMeetings, meetingAttendees, meetingRecordings, meetingTranscripts, meetingMinutes tables
- [x] Server router: meetingRouter with CRUD for meetings, attendees, recordings, transcripts, minutes
- [x] Meeting scheduler UI: create/edit meeting (title, date/time, agenda, type, location/link)
- [x] Invitation system: invite lab members by email, track RSVP status
- [x] Attendance tracking: mark present/absent/excused per attendee at meeting time
- [x] Recording upload: upload audio/video file to S3, trigger Whisper transcription
- [x] Transcript viewer: display timestamped Whisper transcript with speaker segments
- [x] Automated meeting minutes: AI-generated structured minutes from transcript (agenda items, decisions, action items, attendees)
- [x] Meeting minutes editor: rich-text editor pre-loaded with AI minutes, editable before finalization
- [x] Add "Quality Meetings" tab to DIY Accreditation Tool

## StressEchoAssist™ Dedicated Page (Mar 10 2026)
- [x] Revert accidental move in EchoAssist — restore PremiumOverlay wrapper in original position after StrainEngine
- [x] Rename engine title from "Stress Echo EchoAssist™" to "StressEchoAssist™" (keep in EchoAssist with PremiumOverlay)
- [x] Create dedicated /stress-echo-assist page (StressEchoAssistPage.tsx) with full WMSI/Target HR/Interpretation tabs wrapped in PremiumOverlay
- [x] Add sidebar nav link for StressEchoAssist™ under Clinical Tools
- [x] Add "Open StressEchoAssist™" link-card inside LV Systolic engine section
- [x] Register /stress-echo-assist route in App.tsx

## Quality Meeting Video Component (Mar 10 2026)
- [ ] Research Daily.co API for embedded video meetings
- [ ] Add DAILY_API_KEY secret to project
- [ ] Server: create Daily.co room via REST API when meeting is created
- [ ] Server: generate meeting token (participant/owner) for authenticated users
- [ ] Frontend: embed Daily.co call frame inside Quality Meeting tab when meeting is active
- [ ] Attendance auto-mark: mark attendee as present when they join the video room
- [ ] Recording: trigger Daily.co cloud recording, store recording URL in DB
- [ ] Transcription: download recording, run through Whisper, store transcript
- [ ] AI Minutes: generate structured minutes from transcript using LLM

## Quality Meeting Tool — Upload-Based Zoom/Teams (Mar 10 2026)
- [x] DB schema: qualityMeetings, meetingInvitees, meetingAttendance, meetingRecordings, meetingMinutes tables (already pushed)
- [x] Server meetingRouter: list, create, update, delete meetings; invite/RSVP; upload recording; transcribe; generate AI minutes
- [x] QualityMeetingsTab component: meeting list view with status badges (Scheduled/In Progress/Completed)
- [x] Create/Edit meeting modal: title, date/time, agenda, Zoom/Teams link, invitees
- [x] Meeting detail panel: agenda display, invitee RSVP list, Join Meeting button (opens external link)
- [x] Recording upload section: drag-and-drop or file picker, upload to S3, trigger transcription
- [x] Transcription display: timestamped transcript with speaker detection
- [x] AI minutes generation: structured minutes (agenda items, decisions, action items, next meeting)
- [x] AI summary: 3-5 sentence executive summary
- [x] Attendance confirmation: cross-reference RSVP list with transcript speaker names
- [x] Rich-text minutes editor: edit generated minutes before finalizing
- [x] Export minutes as PDF or .docx
- [x] Wire QualityMeetingsTab into AccreditationTool as admin-only tab

## Quality Meeting Follow-up Features (Mar 10 2026)
- [x] Email notifications for meeting invitations via SendGrid (server-side, triggered on invite mutation)
- [x] Meeting Minutes Archive view — searchable/filterable list of finalized minutes with bulk PDF export
- [x] Meeting attendance analytics chart in DIY Reports — attendance rate over time per meeting type

## EchoAssist™ Calculators Restructure (Mar 10 2026) — REDO
- [ ] Fix Diastology Assessment: Step 1 + Step 2 ONLY (remove extra parameters, match old Echo Calculators format)
- [ ] Move StrokeVolumeEngine INSIDE LVSystolicEngine section (not standalone)
- [ ] Add HOCM LVOT Gradient Calculator inside LVSystolicEngine section
- [x] Reorder engines: 1) LV SystolicAssist + SV/CO, 2) DiastologyAssist (Diastology + LAP + Special Pops), 3) AS, 4) AR, 5) MS, 6) MR, 7) TR, 8) RV, 9) PulmHTN, 10) POCUS-Assist, 11) Frank-Starling, 12) Strain (Premium), 13) StressEchoAssist (Premium)

## EchoAssist™ Calculators Restructure (Mar 10 2026) — REDO
- [ ] Fix Diastology Assessment: Step 1 + Step 2 ONLY (remove extra parameters, match old Echo Calculators format)
- [ ] Move StrokeVolumeEngine INSIDE LVSystolicEngine section (not standalone)
- [ ] Add HOCM LVOT Gradient Calculator inside LVSystolicEngine section
- [x] Reorder engines: 1) LV SystolicAssist + SV/CO, 2) DiastologyAssist (Diastology + LAP + Special Pops), 3) AS, 4) AR, 5) MS, 6) MR, 7) TR, 8) RV, 9) PulmHTN, 10) POCUS-Assist, 11) Frank-Starling, 12) Strain (Premium), 13) StressEchoAssist (Premium)
- [ ] Remove StrokeVolumeEngine as a standalone section

## Premium Membership Restructure ($19.97/month)
- [ ] Update premium price to $19.97/month in PremiumGate, PremiumModal, Premium page, PremiumOverlay, Home, Profile
- [ ] Update PREMIUM_FEATURES list in PremiumModal and Premium page to match new premium items
- [ ] Update FREE_FEATURES list in Premium page (50 cases, 10 flashcards/day, today's challenge only)
- [ ] Add gold Crown badge + PREMIUM label to premium Navigators in EchoNavigatorHub
- [ ] Add gold Crown badge + PREMIUM label to premium ScanCoaches in ScanCoachHub
- [ ] Move premium Navigators to bottom section of EchoNavigatorHub with FREE/PREMIUM divider
- [ ] Move premium ScanCoaches to bottom section of ScanCoachHub with FREE/PREMIUM divider
- [ ] Mark PulmHTN Navigator as premium in EchoNavigatorHub
- [ ] Gate LAP Grading engine in EchoAssist with PremiumOverlay
- [ ] Gate DiastologySpecialPopulations engine in EchoAssist with PremiumOverlay
- [ ] Gate HOCM LVOT Gradient in EchoCalculator with PremiumGate
- [ ] Implement Case Library free tier: 50 case limit with upgrade prompt at limit
- [ ] Implement FlashCards free tier: 10/day with midnight reset and random rotation per attempt
- [ ] Implement Daily Challenge free tier: today-only, archive requires premium
- [ ] Update Accreditation plan comparison: Quality Meeting + Concierge = Professional+ only
- [ ] Update Accreditation plan comparison: Starter gets limited analytics (no drill-down, no export) with upgrade prompt
- [ ] Add "Automated Quality Improvement Management" to plan comparison chart and pricing cards
- [ ] Add upgrade prompt in AccreditationTool when Starter user tries to drill-down or export
- [ ] Add EchoAssistEngineLink deep-links to all Navigator and ScanCoach pages missing them

## Recent Changes (Mar 2026)
- [x] Update premium pricing to $19.97/month across all pages
- [x] Update premium features list: Navigators, ScanCoaches, EchoAssist engines, features
- [x] Restructure EchoNavigatorHub with FREE/PREMIUM sections and gold Crown badges
- [x] Restructure ScanCoachHub with FREE/PREMIUM sections and gold Crown badges
- [x] Verify premium gates on LAP, Diastology Special Pops, StressEchoAssist engines
- [x] Add 50-case limit for free members in Case Library (server + frontend upgrade prompt)
- [x] Verify FlashCards daily limit = 10 for free members (already correct)
- [x] Verify Daily Challenge archive = premium-only (already correct)
- [x] Add POCUS-Assist engine deep-link buttons in POCUS-Assist hub hero banner
- [x] Add adminBatchApproveToQueue server endpoint for bulk daily challenge publishing
- [ ] Wire bulk-select UI in QuickFireAdmin Question Bank tab
- [ ] Complete premium restructure: Accreditation tier restrictions (Quality Meeting + Concierge = Professional+ only)
- [ ] Update plan comparison chart with QI management, corrected tier features
- [ ] Starter tier: limited analytics (no drill-down/export), prompt upgrade
- [ ] Add Crown badges to premium items in EchoAssist engine list
- [ ] Add Crown badges to premium items in EchoCalculator

## Sidebar Nav + Admin + Premium Badges + Accreditation Tiers (Mar 2026)
- [ ] Sidebar: replace DIY Accreditation Plans link with smart link (DIY access → /accreditation, no access → /diy-accreditation-plans)
- [ ] Sidebar: remove Lab Admin Portal and Member Portal from sidebar nav group
- [ ] Profile menu: add Lab Admin Portal and Member Portal links for users with DIY access
- [ ] Admin Question Bank: bulk-select checkboxes on each question row
- [ ] Admin Question Bank: Select All toggle in toolbar
- [ ] Admin Question Bank: floating "Add X to Queue" action bar with optional start-date scheduler
- [ ] EchoAssist engines: add gold Crown badge to LAP Estimation engine header
- [ ] EchoAssist engines: add gold Crown badge to Diastology Special Populations engine header
- [ ] EchoAssist engines: add gold Crown badge to StressEchoAssist engine header
- [ ] Accreditation: gate Quality Meeting tool to Professional+ tier only
- [ ] Accreditation: gate Accreditation Concierge to Professional+ tier only
- [ ] Accreditation: Starter tier analytics — no drill-downs, no exports, show upgrade prompt
- [ ] Update plan comparison chart with corrected tier features
- [ ] Add "Learn Echo" sidebar link after ACS Mastery → https://www.allaboutultrasound.net/adultecho-preview-pass-access
- [ ] Add "Learn POCUS" sidebar link after Learn Fetal Echo → https://www.allaboutultrasound.com/pocus-education.html
- [x] Confirm DIY access users go directly to DIY Accreditation Tool via smart sidebar link
- [x] Add DIY Accreditation Tool link in profile dropdown menu for DIY users
- [ ] Rebuild EchoAccreditation Navigator with accurate IAC standards content (Adult, Pediatric/Fetal, Perioperative TEE)
- [ ] Ensure all tag options have referenced content in Accreditation Navigator
- [ ] Add CME/Personnel breakdown by role (Medical Director, Medical Staff, Technical Director, Technical Staff) and Adult/Pediatric differentiation

- [ ] Fix EchoAssist engine order: LV Systolic (EF/FS/Mass/Dim + SV/CO + HOCM LVOT) → DiastologyAssist (Diastology Assessment + LAP + Special Pops) → AS → AR → MS → MR → TR → RV Systolic → PulmHTN → POCUS-Assist → Frank-Starling → Premium (Strain, StressEcho)
- [ ] Move SV/CO calculator inside LV Systolic section (not standalone between LV and Diastology)
- [ ] Ensure Diastology Assessment uses ONLY Step 1 + Step 2 format

## EchoAssist Engine Reorder (Completed)
- [x] Rename LVSystolicEngine section to "LV SystolicAssist™"
- [x] Embed Stroke Volume & Cardiac Output Calculator inside LV SystolicAssist™
- [x] Add HOCM LVOT Gradient Calculator inside LV SystolicAssist™
- [x] Restore Step 1/Step 2 card design for Diastolic Function Assessment (matching original EchoCalculator design)
- [x] Nest all three diastology engines under DiastologyAssist™ (Diastolic Function Assessment + LAP Estimation + Special Populations)
- [x] Move Myocardial StrainAssist™ inside RV SystolicAssist section (no longer standalone)
- [x] Fix main render order: LV SystolicAssist → DiastologyAssist → AS → AR → MS → MR → TR → RV Systolic → PulmHTN → POCUS-Assist → Frank-Starling → StressEchoAssist

## TR Engine Enhancements
- [ ] Add TR VTI input field for PISA-derived regurgitant volume (RVol = EROA × VTI)
- [ ] Add prominent PISA calculation sub-panel showing EROA and RVol derived values
- [ ] Add PISA aliasing velocity selector (default 28 cm/s, allow 40 cm/s option)
- [ ] Display PISA-derived EROA and RVol as highlighted result chips (not just small text)
- [ ] Add proximal isovelocity surface area formula display for educational context

## Access Control & Premium Gating Fixes (Critical)
- [ ] Audit all premium-gated content — verify unauthenticated users cannot access premium features
- [ ] Fix EchoAssist premium engine gates (LAP Estimation, Diastology Special Populations, StressEchoAssist, Strain)
- [ ] Fix DIY Accreditation Tool route guard — unauthenticated/basic users should not access it
- [ ] Fix premium gate for Echo Case Library, Echo Flashcards (daily limit for free, locked for unauth)
- [ ] Fix premium gate for EchoAccreditation Navigator
- [ ] Make DIY Accreditation sidebar link context-aware: DIY/admin → /diy-accreditation, others → /premium (plans page)
- [ ] Ensure all tRPC protected procedures reject unauthenticated requests (not just frontend gates)

## Daily Challenge — New Question Types
- [ ] Add "connect" question type to schema (pairs: [{left, right}], stored as JSON)
- [ ] Add "identifier" question type to schema (imageUrl, markers: [{x, y, label}], stored as JSON)
- [ ] Remove quickReview from Daily Challenge question type enum (keep in Flashcards only)
- [ ] Build Connect Game player UI (drag-and-drop or click-to-match pairs)
- [ ] Build Identifier Game player UI (click-to-place anatomy marker on image)
- [ ] Admin: add Connect Game creation form (add/remove pairs)
- [ ] Admin: add Identifier Game creation form (upload image, place markers)
- [ ] Fix broken bulk select in Daily Challenge admin question bank
- [ ] Add "order" question type to schema (orderedItems: string[], stored as JSON)
- [ ] Build Order Game player UI (drag items into correct sequence)
- [ ] Admin: add Order Game creation form (add/reorder items)

## Daily Challenge & Flashcard Fixes
- [ ] Complete admin creation forms for Connect, Identifier, and Order game types in QuickFireAdmin
- [ ] Fix Daily Challenge to show only 1 challenge per day (not 5)
- [ ] Randomize flashcard order on every page visit (no repeated sequences)

## Session Fixes (Mar 10, 2026)
- [x] Daily Challenge: enforce exactly 1 question per challenge — changed admin form from multi-select (checkboxes) to single-select (radio buttons), updated server validation (max(1)), updated queue display text
- [x] Flashcard randomization: added Fisher-Yates shuffle with session-level random seed so cards appear in a different order on every page visit (sequential mode)
- [x] Admin creation forms for Connect, Identifier, and Order game types: confirmed all three are fully implemented in QuickFireAdmin.tsx (Connect: dynamic pair inputs; Identifier: image upload + click-to-place markers; Order: numbered item list with add/remove)
- [x] Reorder EchoAssist engine sections to: 1. LV SystolicAssist, 2. DiastologyAssist (Diastolic+LAP+Special Pops), 3. StressEchoAssist, 4. MyocardialStrainAssist, 5. AS, 6. AR, 7. MS, 8. MR, 9. TR, 10. PulmonaryHypertensionAssist, 11. RV SystolicAssist, 12. POCUS-Assist, 13. Frank Starling — also removed StrainAssistSubSection from inside RVFunctionEngine since Strain is now its own top-level section
- [x] Fix review submission error — widened 40+ short varchar columns (varchar(5/10/20/50)) in imageQualityReviews to varchar(300) to prevent MySQL data truncation errors; db:push applied
- [ ] Remove Manus-branded email from daily challenge — only iHeartEcho branded emails should be sent
- [ ] Move daily challenge email from queue-add to publish time (when daily set is actually activated)
- [ ] Archive the 5 old challenges, leave only the new queued one

## LabAdmin Reorganization (Mar 11 2026)
- [x] Restructure LabAdmin into 4 main tabs: Organization, Quality Improvement, Accreditation Submission, Analytics & Reporting
- [x] Organization tab: sub-tabs for Overview, Facilities, Personnel (with Medical/Technical Director designation), Policy Builder, Subscription, Seats
- [x] Quality Improvement tab: sub-tabs for Image Quality Review, Sonographer Peer Review, Physician Peer Review, Echo Correlations, Appropriate Use, Quality Meetings
- [x] Accreditation Submission tab: sub-tabs for Case Studies and Accreditation Readiness
- [x] Analytics & Reporting tab: sub-tabs for IQR Analytics, CME Progress, Reports & Export
- [x] Export PolicyBuilderTab and AppropriateUseTab from AccreditationTool.tsx for use in LabAdmin
- [x] Fix TypeScript errors in AccreditationTool.tsx, meetingRouter.ts, PossibleCaseStudies.tsx

## Daily Challenge Fixes (Current Session)
- [x] Fix bulk selection in Question Bank — hide action buttons in bulk mode so entire card is clickable; checkbox is now a proper button element
- [x] Restore 24-hour timed access to Daily Challenge for free (unauthenticated/basic) users — countdown timer shown, MCQ options visible but require login to submit
- [x] Expand AI Generator modal to support all question types (connect, order, identifier, true/false)
- [x] Fix AI Generator preview to display pairs (Connect) and orderedItems (Order) in preview cards
- [x] Fix AI Generator import to pass pairs/orderedItems/markers fields when creating questions
- [x] Add New Challenge button to Challenge Queue tab header
- [x] Remove date labels from archive challenge cards

## Bulk Mixed-Type AI Generation
- [x] Server: add aiGenerateMixed procedure accepting per-type counts (e.g. {scenario:3, connect:2}) — runs parallel Forge API calls per type
- [x] UI: Single Type / Mixed Types toggle in AI Generator modal
- [x] UI: Mixed Types mode shows +/- stepper for each of 6 question types with live total count
- [x] UI: preview shows all generated questions with type badge and correct rendering (pairs, orderedItems, options)
- [x] UI: import passes correct type-specific fields per question

## Platform Management Hub
- [x] Audit all admin links in profile dropdown menu
- [x] Build PlatformAdmin hub page with card buttons for each admin section (Case Management, Daily Challenge, ScanCoach Editor, Thinkific Webhook)
- [x] Remove individual admin sub-links from profile menu; kept single "Platform Management" link
- [x] /platform-admin route already registered in App.tsx

## Thinkific Webhook Filtering
- [x] Audit existing webhook handler event processing logic
- [x] Add event type allowlist: order.created, subscription.cancelled, subscription.activated, enrollment.created, enrollment.updated
- [x] Add product name allowlist: Premium App Access (isPremiumProduct) + DIY Accreditation memberships (isDIYProduct)
- [x] DIY product handler: assigns diy_admin for Lab Director/Admin tier, diy_user for sonographer seats
- [x] Update Thinkific Webhook admin UI: Active Filter Rules panel with Gate 1 (event types) and Gate 2 (product names), Filtered stat card added

## Identifier Question Type — Hotspot Fix
- [x] Replaced window.prompt() with inline pendingMarker state + label input overlay on image click
- [x] Label input bubble appears at click location with Add/Cancel buttons and Enter key support
- [x] AI generator for Identifier type now produces hotspot questions (imageDescription, targetStructure, suggestedImageSearch) instead of MCQ
- [x] AI generator note: marker coordinates must be placed manually by admin on actual image

## OLD: Hotspot/Pin Fix
- [ ] Audit current Identifier type in admin form, player, AI generator, and DB schema
- [ ] Build hotspot pin picker in admin form: image upload + click-to-place pin with x/y % coordinates
- [ ] Fix AI generator: Identifier type should suggest an echo image category + hotspot description (not MCQ)
- [ ] Build hotspot pin answer UI in player: user clicks image to place pin, scored by proximity to correct coordinates
- [ ] Update DB schema if markers field needs coordinate format change

## Login Button Fix
- [x] Diagnosed: all getLoginUrl() buttons redirect to Manus OAuth portal which may not respond in non-Manus browsers
- [x] Fixed: replaced all getLoginUrl() href calls with href="/login" to use local email/password login page
- [x] Removed unused getLoginUrl imports from 14 files

## Bulk Queue Bug
- [ ] Diagnose why questions marked for queue in bulk mode don't appear in Challenge Queue tab
- [ ] Fix the bulk queue submission flow

## Queue Bug (Critical)
- [x] Root cause: adminListChallenges used raw SQL IN() with unbound ? placeholders — Drizzle never bound the status values so query returned empty
- [x] Fixed: replaced raw sql template with inArray() helper in adminListChallenges and two other queue queries
- [x] Verified: 6 challenges already exist in DB from previous queue actions, will now display correctly

## Free Member Registration — Thinkific Link
- [x] Replace local registration form with redirect page (auto-redirects to Thinkific after 2.5s, shows benefits + manual CTA)
- [x] Thinkific enrollment URL: https://member.allaboutultrasound.com/enroll/3241567?price_id=4133943
- [x] Thinkific membership page: https://member.allaboutultrasound.com/bundles/free-membership
- [x] Updated all "Register" / "Sign Up" / "Create Account" CTAs in Layout, Login, QuickFire, UpgradeSuccess, VerifyEmail
- [x] Added isFreeProduct() matcher to webhook handler — creates pending account on free enrollment, no additional role needed (user role is default)

## Premium Pricing Page Update
- [x] Updated /premium page: $9.97/mo (CHECKOUT_URL_MONTHLY) and $99.97/yr (CHECKOUT_URL_ANNUAL) with both Thinkific enrollment links
- [x] Side-by-side pricing cards with Annual highlighted as Best Value
- [x] Bottom CTA updated with both Monthly and Annual buttons
- [x] Removed old handleCheckout/CHECKOUT_URL references

## AI Generator — Find Image Button (Identifier Type)
- [ ] Add "Find Image" button to AI Generator preview cards for Identifier type questions
- [ ] Button opens Google Images search using the suggestedImageSearch field value
- [ ] Also show imageDescription and targetStructure fields in the preview card

## Daily Challenge Question Editor — Rich Text p-tag Bug
- [x] Root cause: rich text editor stores HTML (e.g. <p>text</p>) but question field was rendered as plain text in 8+ places
- [x] Fixed: all question display locations now use dangerouslySetInnerHTML to render HTML correctly
- [x] Fixed: form validation now uses stripHtml() to check actual text length, not raw HTML
- [x] Added stripHtml() utility to client/src/lib/utils.ts

## Premium Page — Comparison Card Price Fix
- [x] Fixed $19.97/mo badge on Free vs Premium comparison card — now shows $9.97/mo

## Auth Gate & Report Builder Fix (no charge)
- [ ] Fix blurred auth gates not rendering — old gates still in effect
- [ ] Fix Report Builder accessible to unauthenticated users — must require login

## Blurred Auth Gate Fixes (no charge)
- [x] EchoAssistHub premium cards: navigate to page with blurred overlay instead of upgrade modal
- [x] Remove RoleGuard from all 6 premium specialty routes so pages are accessible with overlay
- [x] Ensure all 6 premium specialty pages have PremiumOverlay wrapping their content
- [x] Fix Premium page comparison card badge ($19.97 → $9.97)
- [x] Fix PremiumOverlay pricing text ($19.97 → $9.97)
- [x] Fix PremiumGate pricing text ($19.97 → $9.97)
- [x] Fix PremiumLockOverlay upgrade URL (iheartecho.com → Thinkific link)
- [x] Restrict Report Builder to authenticated users

## Free Enrollment Webhook (no charge - previously requested)
- [ ] Fix 4 failing product.* webhook tests (product.created/updated/deleted should trigger syncCatalogToDb)
- [ ] Free enrollment webhook: isFreeProduct() match for product 3241567 ("Free Membership") provisions user with base "user" role + marks thinkificEnrolledAt (no email sent)
- [ ] Origin-tracking: enrollment link from iHeartEcho adds ?ref=iheartecho param; post-enrollment redirect back to app.iheartecho.com/enrolled
- [ ] Create /enrolled welcome page for users returning from Thinkific free enrollment
- [ ] Write tests for free enrollment webhook handler

## Enrolled Decision-Tree Landing Page
- [x] Redesign /enrolled as a post-enrollment decision-tree: two paths — All About Ultrasound Community and iHeartEcho App
## Daily Challenge Queue Fixes
- [ ] Fix push-to-queue: items pushed from question bank should be 'scheduled' not 'draft'
- [ ] Add drag-to-reorder to the queue so admins can interleave questions from different categories
- [ ] Persist reordered queue positions to the database

## Report Builder Auth Gate Fix
- [ ] Replace redirect-to-login with PremiumOverlay blur gate in Report Builder (no redirect to Manus sign-up)

## Auth Gate Overlay Fixes (ScanCoach + Report Builder)
- [ ] Fix Report Builder: remove redirect, wrap content in PremiumOverlay blur gate
- [ ] Fix all ScanCoach pages: remove login redirects, wrap content in PremiumOverlay blur gate
- [ ] Fix queue drag-to-reorder: remove stale moveChallengeUp/Down references, complete DnD implementation

## Overlay & Display Fixes (no-charge corrections)
- [ ] Fix HOCMScanCoach route type error (_noLayout prop incompatible with wouter Route component)
- [ ] Fix QuickFireAdmin stale moveChallengeUp/moveChallengeDown references (TS errors)
- [ ] Fix ReportBuilder: clean up broken JSX, wrap content in PremiumOverlay properly
- [ ] Add PremiumOverlay to all premium ScanCoach pages (TEE, ICE, HOCM, Stress, StructuralHeart, POCUSRush, POCUSLung)
- [ ] Fix StressEchoAssist card on EchoAssistHub: show card normally, overlay only on engine open

## Queue Push — Remove from Bank
- [ ] When a question is pushed to the Daily Challenge queue, mark it as inactive in the question bank (isActive = false)
- [ ] Apply to: adminApproveQuestionToQueue, adminBatchApproveToQueue, adminCloneChallenge
- [ ] Update tests to verify question is deactivated after queue push

## Premium Gate Bypass Fix
- [x] Audit all premium ScanCoach pages — verify PremiumOverlay wraps content at component level
- [x] Audit all premium Navigator pages — verify PremiumOverlay wraps content at component level
- [x] Fix any pages where PremiumOverlay is missing or not wrapping the correct content

## Archive Backfill (no charge)
- [ ] Generate 150 archived challenges from existing question bank and insert into DB
- [ ] Remove date display from Challenge Archive UI

## Premium Overlay & Archive Fixes (Mar 11 2026)
- [x] Fix PremiumOverlay bypass vulnerability — overlay shown by default during auth loading, content only revealed after confirmed premium status
- [x] Remove Date Range filter from Challenge Archive filter panel
- [x] Remove unused archiveDateFrom/archiveDateTo state variables from QuickFire.tsx

## Profile Menu Fix (Mar 11 2026)
- [x] Fix DIY Lab Admin link in profile dropdown menu — now correctly points to /diy-lab-admin (was incorrectly split into two entries pointing to /lab-admin and /diy-lab-admin)

## Thinkific Webhook Fix (Mar 11 2026)
- [x] Fix Thinkific webhook: enrollment.created with sparse payload (only {id}) now looks up full enrollment details from Thinkific API to get user email and course name

## Premium Gating Fix (Mar 11 2026)
- [x] Fix premium gating: overlay not showing when navigating to premium pages from other ScanCoach/navigator pages
- [x] Fix LabAdmin page: owner gets 'no DIY access' error despite having diy_admin role in DB
- [x] Fix PremiumOverlay: now uses usePremium() (cached auth) instead of a fresh tRPC query — eliminates flash for premium users and navigation bypass for free users. Covers StressEchoAssist, all ScanCoach pages, and all navigator pages.
- [x] Fix LabAdmin DIY access: seeded diyOrganizations, diySubscriptions, diyOrgMembers for owner as super_admin

## Flashcard Daily Limit Fix (Mar 11 2026)
- [ ] Fix flashcard daily limit: persist across page refreshes, enforce server-side by IP (free/unregistered) and by userId (logged-in free users), 10/day hard limit

## ScanCoach Navigation Restructure (Mar 11 2026)
- [ ] Remove direct ScanCoach-to-ScanCoach navigation buttons from all ScanCoach pages
- [ ] Add "Back to EchoAssist Hub" button to each ScanCoach page
- [ ] Keep contextual related ScanCoach/Navigator cross-links (not navigation buttons)
- [ ] Fix BlurredOverlay mobile positioning: prompt card near top of viewport, no scrolling
- [ ] Complete flashcard IP tracking: wire recordFlashcardView mutation to frontend for unauthenticated users

## Pending Fixes (Mar 11 2026 — after sandbox reset)
- [ ] Create BlurredOverlay component with mobile-first positioning for login/premium/DIY gates
- [ ] Integrate BlurredOverlay into RoleGuard (replace redirect-to-login with blurred overlay)
- [x] Fix Case Library: show cards to all, gate View Case for unregistered users with registration modal
- [ ] Fix CaseDetail: show blurred overlay with login prompt for unauthenticated users
- [ ] Fix flashcard daily limit: server-side IP tracking for unauthenticated users, fix session reset on refresh
- [ ] ScanCoach navigation restructure: remove direct ScanCoach-to-ScanCoach nav buttons, add Back to EchoAssist Hub
- [ ] Keep contextual related ScanCoach/Navigator cross-links inside each ScanCoach

## Access Control & Gating Fixes (Mar 11 2026)
- [x] Create BlurredOverlay component with mobile-first positioning (prompt near top of viewport on mobile)
- [x] Integrate BlurredOverlay into RoleGuard: unauthenticated users see login gate, free users see premium upgrade gate, non-DIY users see DIY membership gate
- [x] Fix Case Library: unauthenticated users see registration modal when clicking View Case
- [x] Fix CaseDetail: direct URL access by unauthenticated users shows BlurredOverlay login gate
- [x] Fix flashcard daily limit persistence: server-side IP tracking for unauthenticated users (no longer resets on refresh)
- [x] Fix flashcard double-counting bug: authenticated free users no longer get sessionAnsweredCount added on top of DB-tracked dailySeenCount
- [x] Add recordFlashcardView public tRPC procedure for IP-based flashcard view tracking
- [x] Fix LabAdmin DIY access: seeded diyOrganizations, diySubscriptions, diyOrgMembers for owner as super_admin
- [x] Fix profile dropdown: roles read from appRoles (not thinkificRoles) — Lab Admin Portal now visible
- [x] Fix Thinkific webhook: enrollment.created with sparse payload now looks up full enrollment details from Thinkific API
- [x] Fix PremiumOverlay: now uses usePremium() (cached auth) instead of fresh tRPC query — eliminates flash and navigation bypass
- [x] Confirm ScanCoach navigation is already correct: ScanCoachNavBar only has Back to Hub and Go to Navigator links (no cross-ScanCoach buttons)

## Daily Challenge Notifications (Mar 11 2026)
- [ ] Add timezone field to users table (IANA timezone string, e.g. "America/New_York")
- [ ] Add notification preferences to user settings (opt-in/out of daily challenge notifications, timezone picker)
- [ ] Build server-side daily challenge notification scheduler: runs every hour, sends to users where current UTC time = 9am local time
- [ ] Use existing notifyOwner/SendGrid infrastructure to send notification emails
- [ ] Include today's challenge title/category in the notification

## Daily Challenge Notifications (Mar 11 2026)
- [x] Add timezone column to users table (IANA string, e.g. "America/New_York")
- [x] Run db:push to migrate timezone column to production database
- [x] Update getNotificationPrefs procedure to return user timezone
- [x] Update updateNotificationPrefs procedure to accept and save timezone
- [x] Replace time picker in Profile notification settings with timezone selector (50+ timezones grouped by region)
- [x] Build send9amChallengeNotifications() — hourly check, sends live challenge email to users whose local time is 9am
- [x] Wire hourly 9am notification check into startChallengeCron()
- [x] Deduplication: in-memory Set prevents duplicate sends per UTC day per user

## Access Control & Gating Fixes (Mar 11 2026)
- [x] Create BlurredOverlay component with mobile-first positioning (prompt near top of viewport on mobile)
- [x] Update RoleGuard to use BlurredOverlay for unauthenticated users (login gate), premium-gated pages (upgrade prompt), and DIY-gated pages (DIY membership prompt)
- [x] Case Library: unregistered users see registration modal on "View Case" click
- [x] CaseDetail: direct URL access by unauthenticated users shows BlurredOverlay login gate
- [x] Flashcard daily limit: fix double-counting bug (authenticated free users could reset limit on refresh)
- [x] Flashcard daily limit: add server-side IP tracking for unauthenticated users (persists across refreshes)
- [x] Add recordFlashcardView public tRPC procedure for IP-based unauthenticated tracking

## Notification Email Unsubscribe Link (Mar 11 2026)
- [x] Add unsubscribe link to daily challenge notification email pointing to /profile#notifications

## Notification UX Improvements (Mar 11 2026)
- [ ] Auto-scroll Profile page to notifications section when URL has #notifications anchor
- [ ] Build one-click unsubscribe endpoint (/api/unsubscribe?token=...) with signed token, update email footer
- [ ] Add notification opt-in prompt on QuickFire page for users without a timezone set

## Accreditation Form Builder — Platform Admin (Mar 11 2026)
- [ ] DB schema: formDefinitions, formSections, formItems, formItemOptions, formBranchingRules tables
- [ ] DB migration: pnpm db:push
- [ ] tRPC CRUD: getFormDefinitions, getFormDefinition, createFormDefinition, updateFormDefinition, deleteFormDefinition
- [ ] tRPC CRUD: createSection, updateSection, deleteSection, reorderSections
- [ ] tRPC CRUD: createItem, updateItem, deleteItem, reorderItems (item types: text, select, multiselect, radio, checkbox, number, textarea)
- [ ] tRPC CRUD: createBranchingRule, updateBranchingRule, deleteBranchingRule (show/hide item based on previous answer)
- [ ] tRPC CRUD: updateItemOption score weights (per-option quality score contribution)
- [ ] Platform Admin: Form Builder tab with form list and WYSIWYG editor
- [ ] Form Builder UI: section management (add/rename/delete/reorder)
- [ ] Form Builder UI: item management (add/edit/delete/reorder within sections)
- [ ] Form Builder UI: item type selector (text, select, radio, checkbox, number, textarea)
- [ ] Form Builder UI: option editor for select/radio/checkbox items (add/remove options, set labels)
- [ ] Form Builder UI: quality score weight editor per option (0-100 contribution, N/A excluded from denominator)
- [ ] Form Builder UI: branching rule editor (if [item X] answer is [value] → show/hide [item Y])
- [ ] Form Builder UI: live preview panel showing the form as it will appear to reviewers
- [ ] Wire dynamic forms into Accreditation Review form renderer (IQR, Peer Review, Appropriate Use)
- [ ] Preserve backward compatibility: existing static form data continues to work alongside dynamic forms

## Form Builder — Accreditation Review Forms (Completed)
- [x] DB schema: accreditationFormTemplates, accreditationFormSections, accreditationFormItems, accreditationFormOptions, accreditationFormBranchRules, accreditationFormOrgVisibilityRules tables
- [x] Schema: expanded itemType enum — text, textarea, email, richtext, radio, checkbox, select, scale, heading, info
- [x] Schema: new columns — richTextContent (longtext), emailRoutingRules (JSON), placeholder, validationRegex
- [x] tRPC router: formBuilder — listTemplates, getFullTemplate, createTemplate, updateTemplate, deleteTemplate
- [x] tRPC router: formBuilder — createSection, updateSection, deleteSection, reorderSections
- [x] tRPC router: formBuilder — createItem, updateItem, deleteItem, reorderItems
- [x] tRPC router: formBuilder — saveFormOptions (with quality score weighting)
- [x] tRPC router: formBuilder — saveBranchRules (item-level conditional show/hide)
- [x] tRPC router: formBuilder — getOrgVisibilityRules, saveOrgVisibilityRule, deleteOrgVisibilityRule
- [x] tRPC router: formBuilder — listOrganizations (for org-based rule builder)
- [x] TipTap rich text editor component (RichTextEditor.tsx) — bold, italic, underline, headings, lists, blockquote, link, image (URL + file upload), video (URL), YouTube embed, HTML insert, text color, text alignment
- [x] FormBuilderAdmin.tsx — Template list view with create/delete
- [x] FormBuilderAdmin.tsx — Full editor with Sections tab, Branching Rules tab, Org Visibility Rules tab, Preview tab
- [x] FormBuilderAdmin.tsx — ItemEditorDialog with all 10 field types including email routing JSON editor and rich text editor
- [x] FormBuilderAdmin.tsx — OptionEditor with quality score weighting per option
- [x] FormBuilderAdmin.tsx — BranchRuleBuilder (show/hide item based on another item's response)
- [x] FormBuilderAdmin.tsx — OrgVisibilityRuleBuilder (show_only_for / hide_for per OrgID)
- [x] FormPreview.tsx — Live preview with branching logic evaluation, org filter simulation, quality score live meter
- [x] FormPreview.tsx — Renders all 10 field types including email (with routing indicator), richtext (HTML display), info (with rich content)
- [x] Platform Admin hub — Form Builder card added to Admin Tools section
- [x] App.tsx — Routes /admin/form-builder and /admin/form-builder/:id registered with RoleGuard
- [x] Vitest tests — 22 tests covering templates, sections, items, options, branch rules, org visibility rules, quality score computation

## Dynamic Form Builder Integration (In Progress)
- [ ] DB schema: accreditationFormSubmissions table (templateId, submittedByUserId, orgId, reviewTargetId, reviewTargetType, responses JSON, qualityScore, status, submittedAt)
- [ ] DB schema: accreditationFormTemplateAssignments table (formType enum → templateId mapping, orgId optional override)
- [ ] Seed IQR form as Form Builder template (all current static fields → DB items)
- [ ] Seed Sonographer Peer Review form as Form Builder template
- [ ] Seed Physician Peer Review form as Form Builder template (with exam-type branching via AETTE/AETEE/AE_STRESS/PETTE/PETEE/FE prefixes)
- [ ] Seed Case Mix submission form as Form Builder template
- [ ] tRPC: getActiveTemplateForFormType — returns active template for a given formType + orgId
- [ ] tRPC: submitFormResponse — saves responses JSON + computed quality score
- [ ] tRPC: getSubmissions — list submissions by formType/orgId/userId with pagination
- [ ] tRPC: getSubmissionById — full response detail
- [ ] tRPC: deleteSubmission — admin-only
- [ ] DynamicFormRenderer component — renders any template with branching + org visibility + all 10 field types
- [ ] Replace IQR static form with DynamicFormRenderer using image_quality template
- [ ] Replace Sonographer Peer Review static form with DynamicFormRenderer
- [ ] Replace Physician Peer Review static form with DynamicFormRenderer (exam-type branching preserved)
- [ ] Replace Case Mix static form with DynamicFormRenderer
- [ ] Reports & Analytics: dynamic submissions viewer (list + detail modal)
- [ ] Vitest tests for form submission procedures

## Dynamic Form Menu — Quality Improvement (In Progress)
- [ ] tRPC: getActiveFormMenuItems — returns all active assigned templates for a given context (lab/diy), used to build the dynamic menu
- [ ] tRPC: assignTemplateToFormType — admin assigns a template to a formType (creates/updates accreditationFormTemplateAssignments)
- [ ] tRPC: submitDynamicForm — saves accreditationFormSubmissions with computed quality score
- [ ] tRPC: getMyFormSubmissions — returns submissions for the current user
- [ ] tRPC: getFormSubmissionsForOrg — returns all submissions for an org (admin view)
- [ ] Form Builder Admin: add "Assign to Form Type" action on each template (with formType label and optional orgId)
- [ ] DynamicFormRenderer component — renders any template from DB with branching, org visibility, all 10 field types
- [ ] Lab Admin Quality Improvement tab: dynamic menu showing all active assigned forms + existing static forms
- [ ] DIY Member Portal Quality Improvement section: dynamic menu showing all active assigned forms
- [ ] Seed IQR, Sonographer Peer Review, Physician Peer Review, Case Mix as Form Builder templates
- [ ] Submission viewer: list + detail modal for dynamic form responses in Reports & Analytics

## Admin Consolidation & Concierge (In Progress)
- [x] Redirect /diy-lab-admin to /lab-admin
- [x] Fix profile sidenav to point to /lab-admin
- [x] Fix DIY Member Portal broken links (workflows, case review, policy library)
- [x] Add deep-link tab support to LabAdmin (?tab=quality, ?tab=organization, etc.)
- [x] Add OrgID scoping (labId, diyOrgId) to policies table and enforce in getPolicies/createPolicy
- [x] Merge DIY member invite/role management into LabAdmin Organization tab
- [x] Wire dynamic form menu items to Quality Improvement tab in LabAdmin
- [x] Wire dynamic form menu items to DIY Member Portal "Your Access" section
- [x] Add Accreditation Concierge prompt/CTA to Lab Admin portal (Organization tab contextual banner)

## Preview Fix (Mar 11 2026)
- [x] Diagnose and fix all errors causing Manus preview panel to fail
- [x] Fix Vite cache cleared — stale ffunction error eliminated

## Bug Fixes (Mar 11 2026)
- [x] Fix /echoassist#engine-diastolic hash anchor to open Diastology section (EngineSection now initializes open from hash on mount)
- [x] Fix Vite cache/preview errors — cleared node_modules/.vite, restarted server, 0 errors
- [x] Fix pre-existing TS errors in QuickFireAdmin, SubmitCase, AdminCaseManagement, CaseEditorDialog (minHeight string→number)

### Form Responses Sub-Tab (Mar 11 2026)
- [x] Add DB helpers for querying form submissions with filters (formType, dateRange, staffId, labId)
- [x] Add tRPC procedures: getFormSubmissions, getFormSubmissionDetail, getFormSubmissionStats
- [x] Build FormResponsesTab component with list, filters, quality scores, and detail view
- [x] Wire FormResponsesTab into Reports & Analytics in LabAdmin
- [x] Write Vitest tests for new procedures
## Seed Existing Forms as Templates (Mar 11 2026)
- [x] Audit IQR, Sonographer Peer Review, Physician Peer Review, Case Mix form structures
- [x] Write seed script to create all four templates in the database
- [x] Run seed script and verify templates appear in Form Builder Admin

## Platform Admin Edit — Daily Challenge Archive (Mar 11 2026)
- [x] Review DailyChallengeArchive page and related backend procedures
- [x] Add adminUpdateArchivedChallenge and adminUpdateArchivedQuestion tRPC procedures (admin-gated)
- [x] Build admin edit dialog with RichTextEditor, options editor, difficulty/category selects
- [x] Add Edit buttons to archive list items, archive detail header, and question cards (admin-only)
- [x] Write Vitest tests for admin edit procedures

## Android App — TWA (Mar 11 2026)
- [ ] Set up TWA Android project (bubblewrap / manual Gradle)
- [ ] Configure package name: com.iheartecho.app
- [ ] Set launch URL: https://app.iheartecho.com
- [ ] Generate app icons (all densities) and splash screen
- [ ] Generate store listing graphics (feature graphic, screenshots)
- [ ] Build signed AAB for Google Play upload
- [ ] Add assetlinks.json to web app for Digital Asset Links verification
- [ ] Prepare Play Store listing package (description, screenshots, privacy policy URL)

## Bug Fixes — Persistent Issues (Mar 12 2026)
- [x] Fix Stress Echo upgrade overlay — should only block the engine, not the menu link
- [x] Fix ScanCoach auth gate — remove free sub-menus, add EchoAssist/Navigator back-links on hero banner
- [x] Fix Accreditation Navigator and DIY tool — show content with upgrade overlay instead of redirecting to login/upgrade
- [x] Fix Case Library — add auth/upgrade overlay for unauthenticated/unregistered users
- [x] Fix Flashcards — persist session via IP tracking so score does not reset on page reload
- [x] Fix Sign-in button — ensure it triggers the auth flow correctly

## Bug Fixes — Round 2 (Mar 12 2026)
- [x] Fix StressEchoAssist overlay — PremiumOverlay moved inside EngineSection so teal header button is always clickable
- [x] Fix Adult TTE ScanCoach tab — added BlurredOverlay auth gate (unauthenticated users see login prompt)
- [x] Fix Fetal Echo ScanCoach tab — added BlurredOverlay auth gate (unauthenticated users see login prompt)
- [x] Fix Diastology/Strain Navigator DIY redirect — broken /diy-plans link fixed to /diy-accreditation-plans
- [x] Fix POCUS ScanCoach auth gates — all 4 POCUS ScanCoach pages now require registration
- [x] Fix POCUS ScanCoach mobile layout — flex-col on mobile so dropdown appears above content
- [x] Fix login cookie — added trust proxy to Express server so Secure flag is set correctly on deployed HTTPS site

## Bug Fix — ScanCoach Auth Gates via Navigator Links (Mar 12 2026)
- [ ] Gate all ScanCoach routes in App.tsx that should require sign-in (TEE, ICE, Strain, Stress, HOCM, UEA, Device/Structural Heart, POCUS, ACHD, PulmHTN)
- [ ] Keep /scan-coach (main) free — TTE, Pediatric, and Fetal tabs are free; other tabs gated inside the component

## Bug Fix — Daily Challenge Email Deduplication (Mar 12 2026)
- [x] Add lastChallengeNotifDate column to users table (VARCHAR 10, YYYY-MM-DD ET)
- [x] Run db:push migration to apply schema change
- [x] Update challengeCron.ts to use DB-backed deduplication instead of in-memory Map
- [x] Remove in-memory notifiedToday Map — replaced by users.lastChallengeNotifDate
- [x] After sending email to each user, set lastChallengeNotifDate = todayET() in DB
- [x] On each hourly tick, filter out users where lastChallengeNotifDate == todayET()
- [x] Verified: 0 TypeScript errors, 691 tests pass

## Thinkific Universal Member Sync
- [ ] Update webhook: create free iHeartEcho account for ANY Thinkific enrollment/order (silent, no email)
- [ ] Update webhook: send welcome email only for "iHeartEcho™ App" product enrollments
- [ ] Add isIHeartEchoAppProduct() matcher for "iHeartEcho™ App" membership
- [ ] Remove Gate 2 product relevance filter so all enrollments create accounts
- [ ] Add syncAllThinkificMembers admin procedure for bulk backfill of existing members
- [ ] Add Sync All Members button to PlatformAdmin UI

## Thinkific Universal Member Sync (Mar 12, 2026)
- [x] Update registration links to new iHeartEcho App product URL (https://member.allaboutultrasound.com/enroll/3707211?price_id=4656299)
- [x] Webhook: create iHeartEcho account for ANY Thinkific enrollment/order (not just free membership)
- [x] Webhook: send welcome email ONLY for "iHeartEcho™ App" product enrollment
- [x] Remove isRelevantProduct gate from order.created handler so all orders create accounts
- [x] Add getAllThinkificUsers() export to thinkific.ts
- [x] Add syncAllThinkificMembers procedure to platformAdminRouter (bulk backfill, no emails)
- [x] Add "Sync All Thinkific Members" card to PlatformAdmin UI

## user.created Webhook (Mar 12, 2026)
- [x] Add user.created to ALLOWED_EVENTS allowlist in thinkific webhook
- [x] Add user.created handler: silently creates free iHeartEcho account, no email sent
- [x] Update Thinkific setup instructions in webhook comment block

## Image Quality Review Hero Banner Fix (Mar 12, 2026)
- [x] Hide hero banner in ImageQualityReview when embedded prop is true

## Daily Challenge Notification — Active Members Only (Mar 12, 2026)
- [x] Filter out isPending users from daily challenge notifications
- [x] Filter out email/password users with unverified email from daily challenge notifications

## Branding Update — EchoAssist™ (Mar 12, 2026)
- [x] Update sidebar subtext in Layout.tsx (lines 173, 281)
- [x] Update Home.tsx hero subtext
- [x] Update Login.tsx subtext
- [x] Update index.html page title
- [x] Update EchoCorrelation, TTENavigator, TEENavigator PDF footers
- [x] Update Enrolled.tsx references

## Real-time User Count on Dashboard (Mar 12, 2026)
- [x] Add getTotalUserCount public procedure to server/routers.ts
- [x] Update Home.tsx stats to use live count with daily staleTime
