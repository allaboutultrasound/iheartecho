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
