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
