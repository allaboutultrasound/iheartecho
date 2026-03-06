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
