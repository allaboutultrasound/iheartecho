# iHeartEcho Project TODO

## Recently Completed
- [x] Magic link only login (removed OAuth/password)
- [x] Spam/junk folder reminder on login page
- [x] POCUS added as 5th challenge/interest category (DB, router, QuickFireAdmin, EmailAdmin, Profile, cron)
- [x] ACS description changed to "Advanced Cardiac Sonographer" everywhere
- [x] Accreditation Subscription branding (replaced "Premium" on DIY Accreditation)
- [x] ECG-Assist™ trademark added in EchoAssistHub
- [x] Daily Challenge category icons: teal lucide icons (Heart/ACS, Stethoscope/Adult Echo, Baby/Pediatric, Activity/Fetal, Scan/POCUS)
- [x] Custom PNG icons integrated for Fetal Echo (ultrasound fetus) and POCUS (probe) — CDN hosted, shown in category cards and prefs toggle
- [x] QuickFireAdmin challenge edit flow fixed — linked question now pinned at top of picker (visible even if inactive/off-page), with search box and correct pre-selection
- [x] Emoji picker added to RichTextEditor toolbar
- [x] Fetal Echo ASE labels replaced with generic "Guideline-Based" language
- [x] POCUS category wired in QuickFire prefs panel and CATS array

## Pending Features
- [x] Fix: Premium users prompted to upgrade when attempting to print (premium gate check broken for active premium_user role)
- [ ] Tricuspid Regurgitation engine in EchoAssist™
- [ ] "Copy to Report" button in EchoAssist™ → Report Builder deep-link
- [ ] Hub — Paid/boosted post system (Stripe integration)
- [ ] Hub — Real-time DM notifications (polling or WebSocket)
- [ ] Remove all tags from flashcards (overwhelming)
- [ ] Hide flashcard count from UI
- [ ] Add search field in admin: Cases, Daily Challenges, and Flashcards
- [ ] Add AI Generate option for flashcards in admin
- [ ] Allow AI Generator to create multiple cases/challenges/flashcards at once (bulk generation)
- [ ] Rename "Flashcard Deck" to "Echo Flashcards" throughout the app
- [ ] Fix premium gate for EchoAssist premium options
- [ ] Fix premium gate for DIY Accreditation
- [ ] Remove Case Mix section from the Readiness Assessment tab
- [ ] Split IQR section in Reports & Analytics into Quality Review and Peer Review sub-sections
- [ ] Remove "Header Info" and "Review Header" section labels from IQR form
- [ ] Fix typo: "LARDS" should be "LARS"
- [ ] User profile pages in Hub (avatar, bio, credentials)
- [ ] POCUS EchoAssist engines (IVC collapsibility, B-line scoring, eFAST)
- [ ] Add emoji to email subject line field in EmailAdmin

## Daily Challenge Permanent Fix (2026-03-15)
- [x] Fix: getLiveChallenge returns null for unauthenticated users when no live challenge exists — now calls ensureTodaySet as fallback, then synthesises from today's set if still empty
- [x] Fix: getTodaySet self-heals inactive questions — auto-activates any inactive question IDs in the stored daily set instead of silently returning empty
- [x] Fix: getLiveChallenge no longer does full table scan (was fetching ALL active questions) — now fetches by ID directly and auto-activates any inactive ones
- [x] Fix: one-time SQL update to re-derive categories from linked question IDs for all existing queue entries (55 corrected)
- [x] Tests: parseDailySetIds, autoActivateQuestions, getLiveChallenge DB-unavailable guard added to quickfire.test.ts

## Magic Link Browser Fix
- [ ] Force magic link email to open in default browser, not in-app mail browser
- [ ] Show difficulty badges (Advanced/Intermediate/Beginner) on challenge queue, archive, and question bank items in QuickFireAdmin
- [ ] Full question editor accessible from challenge queue and archive rows (view full question, edit text/options/answer key, add/replace images)
- [ ] When a challenge is deleted from the queue, reactivate the linked question(s) so they return to the question bank
- [ ] Soft-delete trash system for question bank: deletedAt column, 30-day recovery window, auto-purge after 30 days
- [ ] Trash tab in QuickFireAdmin with restore and permanent delete actions
- [ ] Question numbering system (QID): unique auto-assigned ID displayed on every question in bank/queue/archive
- [ ] Duplicate prevention in challenge queue: block adding a question already in an active/scheduled challenge
- [ ] Copy & Edit action in question bank: creates a new question pre-filled with the original's content and a new unique QID
- [ ] Filter Quick Review (QR) type questions out of Question Bank and challenge queue picker — QR questions only visible in Flashcard Management tab
- [ ] Server-side: exclude type=quickReview from listAllQuestions unless explicitly requested
- [x] Fix: HTML tags (e.g. <p>) showing in challenge queue question titles — strip HTML for display
- [x] Fix: Challenges created via queue should default to "scheduled" status, not "draft"
- [x] Daily challenge: display one question per category (ACS, Adult Echo, Pediatric Echo, Fetal Echo, POCUS) — fixed POCUS key mapping bug and inline player key lookup
- [ ] Admin queue: show all currently live challenges (not just scheduled), with a distinct "Live" badge
- [ ] Admin queue: Unpublish button on live challenges to move them back to scheduled status
- [x] Add ACS and POCUS categories to flashcard UI filter and admin creation
- [x] Generate and integrate Case Library hero banner (image/video/scenario theme, teal/navy)
- [x] Generate and integrate Flashcards hero banner (flashcard/learning theme, teal/navy)
- [x] Daily Challenge banner: "Start Today's Challenge" and "View Archive" buttons scroll to anchor in page content
- [x] Sidebar nav scroll position preserved on navigation (no longer resets to top on every click)
- [x] Hemodynamics Lab hero banner — same echocardiography tablet image as EchoAssist Hub
- [x] Hemodynamics Lab hero banner — same echocardiography tablet image as EchoAssist Hub
- [x] Daily Challenge queue: running category tally at the top showing count per category
- [x] Challenge Archive: add category filter (ACS, Adult Echo, Pediatric Echo, Fetal Echo, POCUS)
- [ ] Daily Challenge admin: fix edit question functionality in the queue (edit button not working)
- [ ] Daily Challenge: fix auto-assignment of questions (should not prompt user to select questions)
- [x] AI question generator: fix invalid JSON error when generating large batches (truncated response)
- [x] Question bank edit dialog: add "Save & Add to Queue" button that saves question and creates scheduled challenge entry
- [x] AI question generator: add duplicate detection — pass existing question summaries to the AI prompt so it generates only new unique content
- [x] Add WMV to accepted video upload formats
- [x] Image-based questions: accept WMV, MP4, and GIF formats in addition to still images (JPEG, PNG, WEBP)
- [x] Fix AI generator: category/echoCategory not saved on insert (always defaults to Adult Echo)
- [x] User question submission: DB schema fields (submitter name, LinkedIn URL, submission status, submitted_by)
- [x] User question submission: server-side procedures (public submit, admin list pending, admin approve/reject)
- [x] User question submission: user-facing form (name, LinkedIn URL, category required, MCQ Scenario / MCQ Image+Video only)
- [x] User question submission: admin approval queue tab in question bank
- [ ] User question submission: notify platform admins on new submission
- [x] User question submission: gamification — award bonus Echo Ninja points when submitted question is approved
- [x] Fix SEO on home page (/): add proper title (30-60 chars), meta description (50-160 chars), and keywords

## EducatorAssist Platform
- [x] DB schema: educator orgs, memberships, tiers, courses, modules, assignments, competencies, student progress (13 tables)
- [x] DB migration: push schema changes (all 14 educator tables + platformFeatureFlags exist in DB)
- [x] Add educator roles to appRoleEnum: education_manager, education_admin, education_student
- [x] tRPC educatorRouter: org management, enrollment, course/module CRUD, assignment CRUD, competency tracking, analytics (30+ procedures)
- [x] Marketing pages: /educator-assist (pricing + features) — platform_admin and education_manager gate
- [x] EducatorAdmin dashboard: /educator-admin (course builder, student roster, assignments, analytics, template library)
- [x] Student Member dashboard: /student-dashboard (my courses, assignments, progress, competencies, leaderboard)
- [x] Education Manager view: accessible via /educator-admin with elevated role access (cross-org analytics, reporting)
- [x] Platform Admin: assign education_manager role to users (via existing adminRouter role assignment)
- [x] Sidebar nav: add EducatorAssist entry in account dropdown (visible only to relevant roles)
- [x] RoleGuard: add education_manager, education_admin, education_student to AppRole type
- [x] Visibility toggle: platformFeatureFlags table + educatorPlatformVisible flag controls public visibility
- [x] EducatorAssist Template Library: DB schema (educatorTemplates table — ARDMS category, content type, S3 URL, view-only flag)
- [x] EducatorAssist Template Library: tRPC procedures (uploadTemplate, listTemplates, getTemplate, deleteTemplate)
- [x] EducatorAssist Template Library: Upload UI for Education Manager / Platform Admin
- [x] EducatorAssist Template Library: Browse/view UI for Educator Admin (view-only, no download, no edit)
- [x] EducatorAssist Template Library: ARDMS content categories (Adult Echo, Pediatric Echo, Fetal Echo, General Ultrasound, Vascular Ultrasound)
- [x] Route registration: /educator-assist, /educator-admin, /student-dashboard registered in App.tsx with RoleGuard
- [x] TypeScript: zero compilation errors across all educator platform files

## Bug Fixes (Mar 14 2026)
- [x] Flashcard hero banner: remove card count display
- [x] Flashcard editor: category type not showing in admin editor
- [x] AI flashcard generator: add duplicate detection (pass existing summaries to prompt)
- [x] ScanCoach WYSIWYG editor: replaced plain Textarea with RichTextEditor for description field
- [x] ScanCoach image saving: fixed — handleSaveText now preserves existing image URLs instead of overwriting with null
- [x] Daily Challenge queue: show category totals at top
- [x] Daily Challenge queue: add category filter buttons
- [x] Daily Challenge queue: add direct question edit button on each queue row
- [x] Daily Challenge icons: restored SVG overlay over teal circle base for Fetal Echo and POCUS (custom SVG components)
- [x] Flashcard admin: show per-category card count summary at top of Flashcard Management tab
- [x] Flashcards: add ACS and POCUS as echoCategory options (admin filter, editor form, user-facing category filter, server procedure, getFlashcardCategoryCounts)
- [x] Daily Challenge: POCUS live challenge not displaying — fixed by adding adminRefreshTodaySet procedure + Refresh Today button in admin queue
- [ ] Cases admin: add drag-and-drop file upload to all image/media/file fields in the case editor

## Drag-and-Drop File Upload (Mar 14 2026)
- [ ] Build reusable DragDropUploadZone component (drag-over highlight, file type/size validation, progress indicator)
- [ ] Cases admin: replace all file input fields with DragDropUploadZone (case image, case media/video, supplemental files)
- [ ] Daily Challenges admin: replace question image/media input fields with DragDropUploadZone
- [ ] Flashcards admin: replace flashcard image/media input fields with DragDropUploadZone

## Rich Text Editor Upgrades (Mar 14 2026)
- [ ] Daily Challenge question editor: upgrade explanation/rationale field to RichTextEditor (WYSIWYG)

## Rich Text & HTML Rendering Fixes (Mar 14 2026)
- [x] Daily Challenge question editor: explanation field already uses RichTextEditor — confirmed
- [x] Flashcard editor: front (question) and back (answer/explanation) already use RichTextEditor — confirmed
- [x] Question bank inline explanation previews: upgraded from plain text to dangerouslySetInnerHTML (3 locations)
- [x] All admin text fields audit: all 7 RichTextEditor instances confirmed (challenge description, question text, quick-review answer, explanation, AI topic, flashcard front, flashcard back)

## Video Autoplay & Loop (Mar 14 2026)
- [ ] Find all <video> elements across the platform
- [ ] Add loop, autoPlay, muted attributes to all video elements (muted required for autoplay in browsers)
- [ ] Ensure video players in ScanCoach, Cases, Daily Challenges, and any other pages loop automatically

## Flag Case for Review (Mar 14 2026)
- [ ] DB schema: add flaggedForReview boolean + flagNote text columns to echoCases table
- [ ] DB migration: push schema changes
- [ ] tRPC: add flagCase procedure (toggle flag + optional note)
- [ ] AdminCaseManagement: add flag button (bookmark icon) on each case row
- [ ] AdminCaseManagement: add "Flagged" filter tab to show only flagged cases
- [ ] AdminCaseManagement: show flag note in flagged view
- [ ] Write vitest tests for flagCase procedure

## Video Playback Fix (Mar 14 2026)
- [ ] Audit all video elements for missing autoPlay/loop/muted/playsInline
- [ ] Fix video attributes platform-wide
- [ ] Verify videos play in browser

## Educator Assist Dashboard Button Styling (Mar 14 2026)
- [ ] Darken button backgrounds on the Educator Assist dashboard

## Educator Course Edit Bug (Mar 14 2026)
- [x] Fix course edit option not working in Educator dashboard
- [x] Fix course edit button - add click handler and edit dialog with pre-filled form
- [x] Add edit/assign/review actions to Competencies tab in Educator Admin

## WMV Video Playback (Mar 14 2026)
- [x] Add WMV detection and unsupported-format fallback UI with download link across all video players

## Platform Admin Duplicate Key Bug (Mar 14 2026)
- [x] Fix duplicate React key 'user' error on /platform-admin page

## Branding Update (Mar 14 2026)
- [x] Replace "Clinical Companion" with "Clinical Intelligence" across all source files

## Profile Nav Menu Fix (Mar 14 2026)
- [x] Move Accreditation Manager into the first ACCREDITATION section, remove duplicate section

## Full Platform Mobile Responsiveness (Mar 14 2026)
- [x] Fix QuickFireAdmin mobile layout (header overflow, tabs, filter pills, question cards)
- [x] Fix PlatformAdmin mobile layout (user list, role management, stats)
- [x] Fix AdminCaseManagement mobile layout (case list, media viewer, dialogs)
- [x] Fix EducatorAdmin mobile layout (tabs, course cards, competency cards)
- [x] Fix AccreditationManager mobile layout (org table, stats, dialogs)
- [x] Fix DIY LabAdmin mobile layout (already responsive — confirmed)
- [x] Fix DiyMember portal mobile layout (already responsive — confirmed)
- [x] Fix CaseLibrary mobile layout (stats grid fixed, rest already responsive)
- [ ] Fix CaseDetail mobile layout (media carousel, findings tabs)
- [ ] Fix ScanCoach mobile layout (view cards, video player)
- [ ] Fix TTENavigator and TEENavigator mobile layout
- [ ] Fix EchoAssist and EchoAssist Calculators mobile layout

## Challenge Live Status Fix (Mar 14 2026)
- [x] Restore today's challenges to live status after refresh reset them
- [x] Fix refreshTodaySet logic — adminRefreshTodaySet now auto-rebuilds immediately after reset

## POCUS Category Bug (Mar 14 2026)
- [x] Fix POCUS category not sticking in daily challenge queue (per-category query fix)
- [x] Promote POCUS challenge live for today

## Icon Size Fix (Mar 14 2026)
- [x] Increase SVG icon size for Fetal Echo and POCUS category icons

## Case Library Media Guarantee (Mar 14 2026)
- [x] Ensure positions 2 and 4 (1-indexed) in the Case Library page 1 always show cases with media (when media cases exist for that query)

## Case Library MCQ Generation (Mar 14 2026)
- [ ] Add at least 2 MCQ questions to every approved case missing them (skip cases with 2+ questions)

## Leaderboard Expansion (Mar 14 2026)
- [ ] Add userPoints and userActivityLog tables to DB schema
- [ ] Add tRPC procedures: awardPoints, getLeaderboard, getUserPointHistory
- [ ] Wire points on case submission (award points when case is submitted)
- [ ] Wire points on flashcard usage (award points per flashcard session/card viewed)
- [ ] Build dedicated /leaderboard page with full rankings, filters, and stats
- [ ] Add /leaderboard to sidebar nav (below Daily Challenge)
- [ ] Keep leaderboard embedded in Daily Challenge page
- [ ] Add points/activity log panel to Platform Admin user profile detail view

- [x] Add mobile-only "Get App" prompt component (iOS + Android, button says "Get App")
- [x] Ensure PWA manifest has correct icons and theme color for home screen install
- [ ] Remove billing issue prompt from ever showing
- [ ] Update PWA manifest start_url and id to use app.iheartecho.com custom domain
- [ ] Fix daily challenge categories showing "No question available today"
- [ ] Fix QuickFireAdmin mobile layout: tab bar overflow and question card layout
- [ ] Fix QuickFireAdmin mobile tab nav: wrap tabs on mobile so Bank/Queue/Archive/Trash are all accessible
- [ ] Fix EchoAssist Hub page: ACHD card has wrong beige/brown colors - should use teal brand
- [ ] Fix video looping - add loop attribute to all video elements across the app
- [x] Get App prompt: session-only dismissal — reappears each dashboard visit, only hides permanently when installed
- [x] Activate all questions in DB (set isActive=1 for all non-deleted questions)
- [x] Remove "Show Inactive" toggle and deactivate button from QuickFireAdmin question bank
- [x] Fix today's daily set to include active POCUS question
- [ ] Wire leaderboard points into Daily Challenge submit flow (award points on correct answer)
- [ ] Wire leaderboard points into flashcard usage (award points per card viewed, not per correct)
- [ ] Wire leaderboard points into case submissions
- [ ] Verify trash-only deletion enforced - remove any remaining activate/deactivate logic from codebase

## Leaderboard Points Wiring (Mar 14 2026)
- [x] Wire awardPoints into submitAnswer (daily challenge correct = 10 pts, streak bonus = 5 pts)
- [x] Wire awardPoints into submitFlashcardReview (1 pt per card viewed, usage-based not correctness)
- [x] Wire awardPoints into submitCase (20 pts for case submission by non-admin users)
- [x] Wire awardPoints into approveCase (50 pts bonus when case is approved)
- [x] Remove Inactive badge from flashcard management tab in QuickFireAdmin
- [x] Change flashcard delete confirm text from "Deactivate" to "Move to Trash"
- [x] Activate all questions in DB (set isActive=1 for all non-deleted questions)
- [x] Remove Show Inactive toggle from QuickFireAdmin question bank
- [x] Seed leaderboard with pre-populated display entries (realistic names/credentials/points via virtual entries)
- [x] Update enrolled split-decision page: add iHeartEcho logo+text to IHE card, AAUS logo+text to AAUS card
- [x] Fix POCUS daily challenge not showing live question in public UI — activated all non-deleted questions in DB (isActive=TRUE)
- [x] Fix Daily Challenge button icon in dashboard hero (should be Trophy, not BookOpen)

## Accreditation Navigator Rebuild (Mar 14 2026)
- [x] Download and parse IAC Adult Echo 2025 PDF standards
- [x] Download and parse IAC Pediatric Echo 2025 PDF standards
- [x] Download and parse IAC PeriOp TEE 2025 PDF standards
- [x] Rebuild AccreditationNavigator with correct tabs: Equipment, Facility, Medical Director, Medical Staff, Technical Director, Technical Staff, CME, Case Study Submissions, Quality Measures, Application Submission
- [x] Wire filters: Adult TTE, Adult TEE, Stress → Adult 2025 standards; Pediatric TTE, Pediatric TEE, Fetal → Pediatric 2025 standards; PeriOp TEE → PeriOp 2025 standards
- [x] Add server-side guard in adminRefreshTodaySet to auto-activate questions with isActive drift

## Accreditation Navigator Checklist Mode (Mar 14 2026)
- [x] DB schema: accreditationChecklist table (userId, accreditationType, sectionKey, checked, updatedAt)
- [x] DB migration: push schema changes (created via SQL directly)
- [x] tRPC: getChecklist(accreditationType) — returns all checked sectionKeys for the user
- [x] tRPC: toggleChecklistItem(accreditationType, sectionKey, checked) — upsert checked state
- [x] tRPC: bulkToggle for check-all/uncheck-all operations
- [x] tRPC: getAll — returns grouped checklist across all accreditation types for summary panel
- [x] UI: Checklist Mode toggle button on AccreditationNavigator header
- [x] UI: In checklist mode, each section card shows a checkbox (checked state persisted per user per accreditation type)
- [x] UI: Green border highlight on checked sections
- [x] UI: Per-tab readiness score (X of Y sections checked) shown in tab bar when checklist mode is on
- [x] UI: Overall readiness panel showing % complete per accreditation type across all tabs
- [x] UI: Per-filter tab progress bar in content area
- [x] UI: Readiness scores isolated per accreditation type (Adult TTE, Adult TEE, Stress, Ped TTE, Ped TEE, Fetal, PeriOp TEE)
- [x] UI: Unauthenticated users see checklist mode with localStorage fallback + sign-in prompt
- [x] Write vitest tests for checklist DB helpers (9 tests, all passing)

## Leaderboard Placeholder Update (Mar 14 2026)
- [x] Update placeholder point values to realistic non-rounded numbers (top = 4952)
- [x] Ensure real users bypass placeholders when their points exceed highest placeholder value

## Leaderboard Point Scoping Fix (Mar 14 2026)
- [x] Virtual leaderboard: use realistic non-rounded point values (top = 4952, others like 3563, 4587)
- [x] Virtual leaderboard: real users bypass all placeholders when their points exceed 4952
- [x] Single-point flashcard events (flashcard_card_viewed = 1 pt): only count in flashcardPoints and totalPoints — not in challengePoints or casePoints
- [x] Challenge category leaderboard: virtual entries use challenge-only point scale (v.challengePoints)
- [x] Case category leaderboard: virtual entries use case-only point scale (v.casePoints)

## POCUS Challenge Error Fix (Mar 14 2026)
- [x] Fix React error #31 in POCUS challenge — options stored as [{text:"..."}] objects; added normalizeOptions() helper
- [x] Fix POCUS question 180001 options in DB to plain strings
- [x] Fix completion score denominator to use enabledCatsWithQ (categories with actual questions)
- [x] Fix tallyRemaining to use enabledCatsWithQ.length as base

## Daily Challenge Bug Fixes (Mar 14 2026)
- [x] Fix POCUS question React error #31 when starting question — normalizeOptions() added to all 7 parse sites
- [x] Fix completion score showing wrong total — denominator now uses enabledCatsWithQ (categories with actual questions)

## ScanCoach Premium Gate (Mar 14 2026)
- [x] Gate Fetal Echo ScanCoach views behind premium subscription (upgrade prompt + premium badge)
- [x] Gate Pediatric Echo ScanCoach views behind premium subscription (upgrade prompt + premium badge)
- [x] Add Crown badge marker on all premium ScanCoach tab buttons (fetal, chd, pulm, strain, hocm, tee, ice, uea)
- [x] Show upgrade prompt with feature list when non-premium user tries to access gated ScanCoach views
- [x] Ensure logged-out users also see the gate (prompt to sign in + upgrade)

## Daily Challenge Bug Fixes (Mar 15 2026)
- [x] Fix duplicate completion summary: suppress legacy alreadyCompleted block when category-based allDoneDaily is true
- [x] Fix HTML rendering in explanations: use dangerouslySetInnerHTML for explanation field in main player and archive player

## Leaderboard Bug Fix (Mar 15 2026)
- [x] Fix leaderboard ranking: ties in correct count broken by accuracy (higher accuracy ranks higher)
- [x] Fix rank display: competition ranking — tied users (same correct + same accuracy) share the same rank number, next rank skips accordingly

## ScanCoach Premium Badge Additions (Mar 15 2026)
- [x] Add premium crown badge to Diastolic Function ScanCoach tab
- [x] Add premium crown badge to Adult Congenital ScanCoach tab
- [x] Gate Diastolic Function and Adult Congenital ScanCoach content behind premium subscription

## SoundBytes™ Feature (Mar 15 2026)
- [x] Add soundBytes and soundByteViews tables to drizzle schema
- [x] Push database migration (tables created directly via SQL)
- [x] Add server procedures: list (with category filter), getById, recordView, admin CRUD, adminViewerStats
- [x] Build SoundBytes member page with category filter tabs, video player, rich text body, premium gate
- [x] Build SoundBytesAdmin page with create/edit/delete/publish and per-video view analytics
- [x] Add SoundBytes admin card to PlatformAdmin
- [x] Add sidebar nav link (Volume2 icon) above CME Hub
- [x] Add dashboard card between Daily Challenge and Hemodynamics Lab
- [x] Wire /soundbytes and /admin/soundbytes routes in App.tsx
- [x] Generate SoundBytes hero banner (text-free sound wave + cardiac ECG waveform, teal/navy)

## SoundBytes™ Discussions (Mar 15 2026)
- [x] Add soundByteDiscussions DB table (id, soundByteId, userId, body, status: pending/approved/rejected, createdAt)
- [x] Create DB table via SQL migration
- [x] Add server procedures: submitDiscussion (protected), listApprovedDiscussions (public), adminListPending, adminApprove, adminReject, adminDeleteDiscussion
- [x] Build Discussions section on SoundBytes detail/player view (submit form + approved comments list)
- [x] Build admin approval queue tab in SoundBytesAdmin (pending list with approve/reject actions)
- [x] Show pending count badge on admin approval queue tab

## SoundBytes™ Enhancements (Mar 15 2026)
- [x] Add thumbnailUrl field to soundBytes table and schema
- [x] Update soundBytesRouter to include thumbnailUrl in all CRUD procedures
- [x] Update SoundBytesAdmin create/edit form with thumbnail URL input field
- [x] Update SoundBytes member page card grid to show thumbnail image
- [x] Add soundByteDiscussionReplies DB table (id, discussionId, userId, body, createdAt)
- [x] Add reply server procedures: submitReply (admin only), listReplies, adminDeleteReply
- [x] Build reply UI in SoundBytes member page (show replies under each approved comment)
- [x] Build reply form in SoundBytesAdmin approval queue (admin can reply from approval panel)
- [x] Add notifyOwner call in submitDiscussion procedure when new comment is submitted

## Enrolled Page Fix (Mar 15 2026)
- [x] Remove iHeartEcho logo + name from top header on Enrolled page
- [x] Move iHeartEcho logo + "iHeartEcho™" text into the iHeartEcho card header
- [x] Add AAUS logo + "All About Ultrasound™" text into the AAUS card header

## SoundBytes™ Native File Upload (Mar 15 2026)
- [x] Add server-side tRPC procedure: soundBytes.adminUploadMedia (base64 upload to S3, returns URL)
- [x] SoundBytesAdmin: add drag-drop/click upload zone for video file (alongside existing URL field)
- [x] SoundBytesAdmin: add drag-drop/click upload zone for thumbnail image (alongside existing URL field)
- [x] Show upload progress indicator and preview after upload

## SoundBytes™ Phantom View Count (Mar 15 2026)
- [x] Add getPhantomViews(id, realViews) helper: seeded phantom count shown until real views exceed 3092
- [x] Update soundBytes.list and soundBytes.getById public responses to include phantomViews field
- [x] Update SoundBytes public UI to display phantomViews instead of real view count
- [x] Keep real view count visible only in SoundBytesAdmin analytics

## SoundBytes™ Free Tier Access (Mar 15 2026)
- [x] Server: tag first 4 published SoundBytes (by sort order) with isFree: true in list response
- [x] Server: update getById to allow free registered users to access isFree items (no premium check)
- [x] Public UI: show "Free" badge on first 4 items; remove lock/premium gate for those items
- [x] Public UI: keep premium gate on items 5+ for non-premium users

## Case Library & SoundBytes™ Updates (Mar 15 2026)
- [x] Add ECG category to SoundBytes (schema enum, router, admin form, public category filter)
- [x] Add ECG category to Cases (schema enum, router, admin form, public category filter)
- [x] Add categorySortOrder field to cases table for per-category position placement
- [x] Admin: add per-category sort position input in Case Library admin (CaseEditorDialog — Category Position field)
- [x] Server: tag first 6 cases per category as isFree in list/getById responses
- [x] Public Case Library UI: show Free badge on free cases; lock premium cases for free registered users
- [x] Public Case Library UI: free users can open and view the first 6 cases per category

## Accreditation Sales Landing Page (Mar 15 2026)
- [ ] Build /accreditation-pro sales page: combined Accreditation Navigator + DIY Accreditation Tool ad copy
- [ ] Include sign-up CTAs linking to plans page (no prices shown)
- [ ] Accreditation Navigator section: note it is included with Premium subscription
- [ ] Register route in App.tsx
- [ ] Deliver public URL for the page

## Accreditation Sales Page Seat Copy Fix (Mar 15 2026)
- [ ] Update DIY Accreditation plan seat descriptions on /accreditation-pro: Starter (1 admin, 3 seats total), Professional (3 admins, 15 seats total), Advanced (5 admins, 50 seats total), Partner (10 admins, unlimited seats)

## Accreditation Seat Fix (Mar 15 2026)
- [x] Confirmed server (diyRouter.ts) and plans page seat values are correct for all tiers
- [x] Fixed sales page /accreditation-pro seat copy: Starter (1 admin, 4 members, 5 total), Professional (2 admins, 13 members, 15 total), Advanced (5 admins, 45 members, 50 total), Partner (10 admins, unlimited)

## Question Bank Queue Category Bug (Mar 15 2026)
- [x] Investigate: questions added to queue revert to Adult Echo category instead of maintaining original category
- [x] Fix category preservation in queue add flow: adminBatchApproveToQueue had hardcoded "Adult Echo"; adminApproveQuestionToQueue mapped General to Adult Echo; both now use question.category with echoCategory fallback
- [x] Verify fix works for all category types (722 tests pass)

## Daily Challenge Questions Not Showing - Permanent Fix (Mar 15 2026)
- [x] Root cause analysis: getLiveChallenge returns questions:[] despite live challenges existing
- [x] Fix: getLiveChallenge now calls ensureTodaySet as fallback when no live challenge exists
- [x] Fix: getTodaySet self-heals inactive questions — auto-activates instead of silently dropping
- [x] Fix: getLiveChallenge no longer does full table scan — fetches by ID directly
- [x] Add vitest tests: parseDailySetIds, autoActivateQuestions, DB-unavailable guard
- [x] Verify fix: 730 tests pass, dev server healthy

## Case View Count Fix
- [x] Diagnose inaccurate case view counts in platform admin — root cause: getCase incremented viewCount on every call including admin previews, and had no deduplication for repeat member views
- [x] Fix: admin views now logged with isAdminView=true and do NOT increment viewCount
- [x] Fix: authenticated member views deduplicated per user per UTC calendar day (same case opened twice in a day = 1 view)
- [x] Fix: getViewTrends analytics now excludes admin views from weekly trend chart
- [x] Schema: added userId and isAdminView columns to caseViewEvents table (migration applied)

## Add ICE Modality to Cases
- [x] Add ICE to modality enum in drizzle/schema.ts (MySQL ALTER TABLE applied)
- [x] Add ICE to all Zod enums in caseLibraryRouter.ts (listCases, submitCase, updateCase, listAllCases, aiGenerateCase)
- [x] Add ICE to CaseLibrary.tsx MODALITIES filter list and MODALITY_COLORS (cyan badge)
- [x] Add ICE to CaseEditorDialog.tsx modality selector
- [x] Add ICE to AdminCaseManagement.tsx modality filter dropdown, AI generate selector, and MODALITY_COLORS
- [x] Add ICE to SubmitCase.tsx MODALITIES list

## Admin Case Edit Scroll Fix (Mar 15 2026)
- [x] Fix: editing a case in AdminCaseManagement resets scroll to top — root cause: Radix Dialog focus-return scrolls the trigger button into view on close
- [x] Fix: save window.scrollY before opening editor/preview dialogs, restore via double-rAF after close
- [x] Fix: same scroll preservation applied to both the Edit (pencil) and Preview (eye) dialogs

## AI Generate Question in Case Editor (Mar 15 2026)
- [x] Add tRPC procedure: caseLibrary.aiGenerateQuestion — takes caseId + optional focusArea, generates MCQ from case data (title, modality, difficulty, clinical history, diagnosis, teaching points, tags) using gpt-4o via Forge API; avoids duplicating existing questions
- [x] Add "AI Generate" button in CaseEditorDialog Questions tab (alongside "Add Question" button)
- [x] Show generated question pre-filled in QuestionEditor for admin review/edit before saving
- [x] Loading state shown during generation; Regenerate button available after first generation
- [x] AI panel dismissible with X button; clears state on dialog close
- [x] All 730 tests pass

## Duplicate User Account Bug Fix (Mar 16 2026)
- [x] Root cause: race condition between Thinkific user.signup and enrollment.created webhooks firing 3ms apart — both passed getUserByEmail check before either INSERT completed
- [x] Root cause 2: getUserByEmail was case-sensitive (eq() exact match) — Thinkific email casing differences could bypass the existing-user check
- [x] Fix: getUserByEmail now uses LOWER() for case-insensitive match, prefers real accounts over pending stubs via ORDER BY isPending ASC
- [x] Fix: createPendingUser now checks for existing row (any casing) BEFORE inserting — idempotent, returns existing id if found
- [x] Cleanup: merged duplicate rows for mbrentmatthew@gmail.com (id 1291563 kept, 1291564 deleted, roles consolidated)
- [x] All 730 tests pass

## DB-Level Unique Email Index (Mar 16 2026)
- [x] Bulk dedup: found 111 duplicate email groups (3249 initially reported was a query artifact); deleted 114 duplicate user rows, roles reassigned to surviving rows
- [x] Created UNIQUE INDEX users_email_lower_unique ON users ((LOWER(email))) — case-insensitive, DB-enforced
- [x] Verified: duplicate insert of same email with different casing correctly rejected with ER_DUP_ENTRY
- [x] All 730 tests pass

## Merge Duplicate Accounts Tool (Mar 16 2026)
- [x] Add tRPC procedure: platformAdmin.findDuplicatesByEmail — returns all user rows for a given email (case-insensitive), includes roles, pending status, created/lastSignedIn dates
- [x] Add tRPC procedure: platformAdmin.mergeUsers — takes survivorId + duplicateIds, reassigns all FK references across all tables (userRoles, quickfireAttempts, quickfireDailySets, echoLibraryProgress, caseViewEvents, caseRatings, peerReviews, physicianOverReadRequests, labSeats, labSeatAssignments, userNotifications, echoReportDrafts, userCmeProgress, labAccreditationSubmissions), then deletes duplicates
- [x] Build MergeAccountsPanel UI in PlatformAdmin.tsx — email search, row cards with account details (roles, pending status, created/last sign-in), survivor selection with star highlight, confirmation dialog with merge summary, success/error toasts
- [x] Inserted between AddUserByEmailPanel and Bulk CSV section in PlatformAdmin page
- [x] All 730 tests pass

## ACS Description Update (Mar 16 2026)
- [x] Profile interests: updated ACS description from "Acute care echo, ICU echo..." to "Advanced Cardiac Sonographer — advanced echo protocols, hemodynamic assessment, structural heart, and complex cardiac imaging."

## Member Count Floor Display (Mar 16 2026)
- [x] Home.tsx: member count now displays 15,174 as a floor — shows real-time actual count only when it surpasses 15,174; shows 15,174 immediately on page load (no "..." flash) while the live query resolves

## Welcome Email with Magic Link (Mar 16 2026)
- [x] Add buildWelcomeWithMagicLinkEmail template to email.ts (72-hour magic link, role-aware content)
- [x] Add generateWelcomeMagicLink(userId, email) helper to db.ts
- [x] Update Thinkific webhook grantAccess to send welcome email for all direct iHeartEcho subscriptions (free, premium, DIY accreditation/education) — exclude All About Ultrasound free membership
- [x] Only send on order.created and enrollment.created (not updated/activated re-activations)
- [x] Add isDirectIHeartEchoProduct() filter function to clearly distinguish iHE direct vs AAU free
- [x] Write tests for new welcome email logic and product filter

## SoundBytes Per-Category 1-Video Gate (Mar 16 2026)
- [x] Replace global isFree flag (first 4 items) with per-category first-item logic: first video in each category is free, rest are locked
- [x] Track watched categories in client state; after watching 1 video per category, show upgrade modal/prompt instead of playing next
- [x] Update FreeUserGrid to show first item per category as playable, rest locked
- [x] Add upgrade prompt modal that fires when a free user tries to play a second video in a category they already watched one in
- [x] Update banner copy to reflect new "1 per category" rule
- [x] Write tests for per-category gate logic

## SoundBytes Upgrade Modal A/B Test (Mar 16 2026)
- [x] Create useAbTest hook that deterministically assigns variant A or B per user (stored in localStorage)
- [x] Variant A (control): current modal copy — no pricing callout
- [x] Variant B (pricing): adds "Most popular: Annual Premium" callout with price, savings badge, and CTA
- [x] Track variant impression and CTA click events via analytics (trpc mutation or analytics endpoint)
- [x] Add admin view to see A/B test results (impressions, clicks, CTR per variant)
- [x] Write tests for variant assignment, determinism, and event tracking
- [x] Add small "growing library — check back weekly" notice to SoundBytes page
- [x] Swap SVG icons for Adult Echo and ECG categories in SoundBytes
- [x] Fix bug: edits to live challenge questions not displaying after save
- [x] Lower refetchInterval on getTodaySet and getLiveChallenge from 5 minutes to 60 seconds
- [x] Fix duplicate completion card bug: legacy getLiveChallenge "0/1" card renders alongside new getTodaySet "2/5" card
- [x] Fix "View Archive" button in daily challenge banner — scrolls to tab bar and activates archive tab
- [ ] Add progress bar to Adult Echo Navigator showing sections completed / total
- [ ] Progress bar should update as user checks off items in each section
- [x] Fix case library cards showing raw HTML tags in description preview
- [x] Add has-questions / no-questions marker to admin case management list
- [x] Fix HTML stripping in CaseDetail.tsx related cases preview
- [x] Add sortBy/sortDir params to listAllCases router (question count, title, date, views)
- [x] Add column sort UI to admin case list with clickable sort headers/buttons
- [x] Default sort: question count ascending (no-questions cases at top)
- [x] Fix: cases with questions incorrectly showing "No questions" badge in admin list
- [x] Add media icon indicator to admin case row (show icon if has media, dimmed if no media)
- [x] Add question count selector (1-10) to AI case generator dialog

## Question Edit & Daily Challenge Bugs (Mar 17 2026)
- [x] Fix: edited challenge questions still showing old content to users — added getLiveChallenge.invalidate() to updateMutation and updateArchivedQuestionMutation
- [x] Fix: today's daily challenge — ECONNRESET was transient (recovered); daily set confirmed correct in DB; getLiveChallenge now fully invalidated on question edit

## Admin Daily Challenge Refresh Controls (Mar 17 2026)
- [x] Add adminRefreshAllCategories tRPC procedure that calls ensureTodaySet for every category
- [x] Add "Refresh All" button in QuickFireAdmin queue header (rebuilds today's set for all 5 categories)
- [x] Add per-category "Refresh" icon button in the category tally row (rebuilds today's set for that category only)
- [x] Trigger a full refresh of all categories immediately via the new procedure

## Challenge Summary Card Bug (Mar 17 2026)
- [x] Fix: alreadyCompleted card showed "1/1" in no-category mode (legacy getLiveChallenge had 1 question) — fixed to only show when activeCategory is set; category grid handles the no-category completed state
- [x] Fix: per-category completed card title updated to "{Category} Complete!" instead of "Today's Challenge Complete!"

## Stale Challenge Display Bug (Mar 17 2026)
- [x] Investigate: users still seeing yesterday's challenge questions and results after refresh
- [x] Fix: adminRefreshTodaySet and adminRefreshCategory were resetting live challenges to 'scheduled' (re-picked same ones) — fixed to ARCHIVE them so ensureTodaySet advances to next in queue

## User Question Submission — Media Upload (Mar 17 2026)
- [x] Create /api/upload-user-question-media endpoint (authenticated users, no WMV, images ≤20MB, videos ≤200MB)
- [x] Add videoUrl field to submitUserQuestion tRPC schema and DB insert
- [x] Add image/video upload UI to SubmitQuestionTab with drag-drop zone, preview, and remove button
- [x] Show attached media (image/video) in admin Submissions review panel

## Admin Email Notification — User Question Submission (Mar 17 2026)
- [x] Add notifyOwner() call in submitUserQuestion mutation so admins get an immediate in-app notification
- [x] Send admin email via SendGrid when a user submits a question for review (include question preview, submitter name, category, difficulty)

## IAC 2025 Accreditation Checklist Update (Mar 17 2026)
- [x] Download and parse IAC 2025 Echocardiography Accreditation Checklist PDF
- [x] Map all checklist items to 6 areas: Facility, Equipment, CME, Staff, Policies, Case Studies
- [x] Update IAC_CHECKLIST data in AccreditationReadiness.tsx to exactly match 2025 PDF items (Facility, Equipment, Staff, CME, Policies, Case Studies)
- [x] Standards Navigator (AccreditationNavigator) remains separate — organized by IAC standard topic with checklist mode toggle
- [x] DIY Accreditation Tool → Readiness tab now shows IAC 2025 Accreditation Readiness Checklist with 6 areas
- [x] Updated header title to "IAC 2025 Accreditation Readiness Checklist" with updated subtitle

## Accreditation Checklist Improvements (Mar 17 2026)
- [x] Remove Case Mix section from Readiness Assessment tab — N/A: Case Studies is now Step 6 in the IAC 2025 checklist (caseMixStep), already correctly integrated
- [x] CME auto-verification: upgraded getReadinessAutoChecks to check actual hour totals (MD: 30h total/15h echo; Medical Staff: 15h/5h echo; Tech: 15h) against IAC 2025 thresholds
- [x] Print Checklist PDF button: added "Print Checklist" button to header (calls window.print()); print CSS hides nav/sidebar and formats checklist cleanly

## User Submission Confirmation Email (Mar 17 2026)
- [x] Add buildUserSubmissionConfirmationEmail template to email.ts (branded HTML, submission summary card, "What Happens Next" steps)
- [x] Wire confirmation email into submitUserQuestion procedure (fire-and-forget, sends to ctx.user.email)
- [x] Email includes: QID, category, difficulty, question preview, image/video flags, estimated review timeline (5-7 business days), "Submit Another Question" CTA

## Challenge Player Media Display (Mar 17 2026)
- [x] Show imageUrl/videoUrl in challenge player — already implemented (lines 1745-1766 in QuickFire.tsx); today's Adult Echo question (id:60006) has an imageUrl and it renders correctly

## SoundBytes Gating Change (Mar 18 2026)
- [x] SoundBytes: change free-tier gate from 1 video per category to 1 video total across all categories

## Meta Pixel (Mar 18 2026)
- [x] Add Meta Pixel (ID: 1114076277535971) to index.html head

## Meta Pixel Event Tracking (Mar 18 2026)
- [x] Fire fbq('track', 'Lead') on upgrade CTA click in SoundBytes upgrade modal
- [x] Fire fbq('track', 'ViewContent', { content_name: 'SoundBytes' }) when free user opens a video
- [x] Verify pixel fires correctly in browser

## Daily Challenge Completion View (Mar 18 2026)
- [x] After completion banner, replace question display with category status cards (green=correct, orange=incorrect)

## Clickable Completion Status Cards (Mar 18 2026)
- [x] Make completed category status cards clickable to review answer/explanation

## Hero Banner Images (Mar 19 2026)
- [x] Upload daily-challenge-banner-v3_AAUS.webp to CDN
- [x] Upload caselibrary-banner-final_AAUS.webp to CDN
- [x] Apply daily challenge banner to Daily Challenge (QuickFire) hero section
- [x] Apply case library banner to Case Library hero section
- [x] Add banner quick-links to dashboard hero (Daily Challenge, Case Library, Flashcards, SoundBytes)

## MPI / Tei Index Addition (Mar 20 2026)
- [x] Add MPI (Tei Index) calculator to Adult Echo module (EchoCalculator.tsx)
- [x] Add MPI scan coach entry to Adult Echo module (ScanCoach.tsx)
- [x] Add MPI (Tei Index) calculator to Fetal Echo module (FetalEchoAssist already has Tei Index engine)
- [x] Add MPI scan coach entry to Fetal Echo module (FetalNavigator.tsx)

## GuidelinesAssist™ (Mar 20 2026)
- [x] Research all current ASE guidelines and compile measurement cut-off values
- [x] Build GuidelinesAssist page with topic cards, accordion sub-topics, measurement tables
- [x] Add sidenav link (just below EchoAssist)
- [x] Add dashboard card
- [x] Add cross-links to EchoAssist calculators, navigators, and ScanCoach

## GuidelinesAssist™ Print Reference Card (Mar 20 2026)
- [ ] Print Reference Card: premium-only feature — show icon to all users, prompt upgrade for free users
- [ ] Print Reference Card: premium users get clean single-page print view of measurement table + grading algorithm

## GuidelinesAssist™ Branding & Print Feature (Mar 20 2026)
- [x] Remove all "ASE" references from visible UI — use "Guideline-Based" / "Current Guidelines" language; keep "ASE" only in disclaimer
- [x] Remove year badges (e.g. "ASE 2025") from guideline cards — replace with "Current Guidelines" or "Updated"
- [x] Add premium-gated Print Reference Card feature — show icon to all, upgrade prompt for free users, print for premium
- [x] Remove "Updated 2025" from GuidelinesAssist™ search/filter chips

## Admin Queue Fixes (Mar 21 2026)
- [x] Fix admin submissions queue not clearing after approval/rejection — replaced refetch() with optimistic cache update (onMutate removes item immediately, onError rolls back via refetch)
- [x] Add Randomize Queue button — Fisher-Yates shuffle per category, persisted via adminReorderChallenges, purple button in queue header

## Flashcard AI Generator Bug (Mar 21 2026)
- [x] Fix: AI flashcard generator inserts into question bank instead of flashcards table — removed quickReview from Question Bank AI generator (Single Type + Mixed Types), hid top-level AI Generate button on Flashcard tab

## Flashcard Duplicate Prevention (Mar 21 2026)
- [x] Pass existing flashcard question summaries to AI generator prompt — aiGenerateQuestions already had dedup for quickReview type; added same dedup to aiGenerateMixed per-type
- [x] Server: added getFlashcardSummaries admin procedure returning all active flashcard texts for client-side comparison
- [x] Client: added visual ⚠ duplicate badge in flashcard AI preview when generated card matches existing deck (exact or substring match)

## Engagement Dashboard (Mar 21 2026)
- [ ] Audit existing schema for engagement tracking tables
- [ ] Add engagement_events table (userId, feature, action, metadata, createdAt)
- [ ] Add server procedures: trackEvent, getEngagementSummary, getMemberEngagement, getMemberDrilldown
- [ ] Build EngagementDashboard page (platform admin only) with overview stats, charts, member table, drill-down modal
- [ ] Wire event tracking calls in flashcard, daily challenge, and case library user flows

## Daily Challenge Tag Fix (Mar 21 2026)
- [x] Remove tags display from user-facing daily challenge question view (keyword tags hidden; only category + difficulty badges shown)
- [x] Fix AI generator prompts (both aiGenerateQuestions and aiGenerateMixed) to use broad topic tags only, never answer/diagnosis tags

## Live Member Count (Mar 21 2026)
- [x] Updated DISPLAY_OFFSET from 3392 to 3997 in stats.userCount procedure (real DB count + 3997 shown publicly)

## Engagement Dashboard (Mar 21 2026)
- [x] Server: getEngagementOverview procedure (platform admin) — totals + 30-day daily activity chart data
- [x] Server: getEngagementMemberList procedure — per-user summary rows with challenge/flashcard/case counts + last active
- [x] Server: getEngagementMemberDrilldown procedure — full activity breakdown for one user
- [x] Client: EngagementDashboard page with KPI cards, 30-day line chart, member table, drill-down modal
- [x] Register /admin/engagement route and add nav link in PlatformAdmin admin tools grid

## Engagement Dashboard Bug Fix (Mar 21 2026)
- [ ] Fix 404 on /admin/engagement route
- [ ] Fix missing Engagement Dashboard card in PlatformAdmin tools grid

## Engagement Dashboard Data Fix (Mar 21 2026)
- [x] Fix engagement dashboard showing no analytics data - fixed Drizzle ORM bug (JS || instead of or()) in getMemberList where clause; added error display to surface query errors in UI

## Engagement Dashboard Query Fix 2 (Mar 21 2026)
- [x] Fix: dailyFlashcard chart now uses quickfireAttempts with type=quickReview (removed invalid userPointsLog activityType='flashcard_session' query)

## Daily Challenge Image Card Generator (Mar 21 2026)
- [x] Query today's scheduled daily challenge questions grouped by category (adminGetCardGeneratorData procedure)
- [x] Build admin image card generator page at /admin/card-generator with branded 1080x1080 Q&A cards per category
- [x] Enable individual card download (PNG) via html-to-image library
- [x] Add Card Generator card to PlatformAdmin tools grid

## Card Generator Logo Fix (Mar 21 2026)
- [x] Replace heart placeholder in card header with actual iHeartEcho logo image (icon-192 CDN URL with teal glow border)

## Card Generator Redesign (Mar 21 2026)
- [x] Remove category tag and difficulty level badge from image cards
- [x] Add teal color pops to card design (radial glows, accent bars, letter bubbles, glow effects)
- [x] Use hero image (trophy area) as background element in cards
- [x] Fix syntax error (middot encoding issue) in ChallengeCardGenerator.tsx

## Card Generator Visual Redesign (Mar 21 2026)
- [x] Full visual redesign of Q&A cards: CardShell with layered backgrounds, dot grid, geometric accents, TealDivider, glowing answer box, premium typography

## Card Generator Batch Download (Mar 21 2026)
- [ ] Install JSZip for batch card export
- [ ] Add Download All Questions button (zips all question cards)
- [ ] Add Download All Answers button (zips all answer cards)

## Card Generator Hero Fix + Batch Download (Mar 21 2026)
- [x] Fix: use daily challenge hero image (daily-challenge-banner-v3) in card background
- [x] Add Download All Questions button (JSZip batch export)
- [x] Add Download All Answers button (JSZip batch export)
- [x] Consolidate spacing on card generator page (tighter header, smaller gaps, compact info bar, max-w-5xl)
- [x] Update card header wordmark: "iHeartEcho" white + "EchoAssist" aqua (#4ad9e0) on same line, "Daily Challenge" subtext in teal (#189aa1)

## Card Generator Spacing + Social Post (Mar 21 2026)
- [ ] Fix card generator page spacing (tighter layout, better proportions)
- [ ] Add Create Social Post section per category with question caption, answer caption, and copy button
- [ ] Include required hashtags: #iHeartEcho #AllAboutUltrasound #LoveEcho #Echocardiography #DailyChallange #EchoChallenge #CardiacUltrasound #CardiacSonographer #Cardiology

## Menu Links Admin (Mar 26 2026)
- [x] Add menuLinkConfig table to DB schema for ACS Mastery, Learn Echo, Learn Fetal Echo, Learn POCUS URLs
- [x] Add getMenuLinks (public) and updateMenuLinks (admin) tRPC procedures
- [x] Add Menu Links section to Platform Admin panel with editable URL fields
- [x] Wire Layout.tsx sidenav to read links from DB with hardcoded fallbacks
- [x] Move MenuLinksPanel to top of Platform Admin page
- [x] Add learnVascularUrl to menuLinkConfig DB schema and server router
- [x] Add Learn Vascular sidenav link in Layout.tsx (before Learn POCUS)
- [x] Add Learn Vascular field to MenuLinksPanel in Platform Admin (before Learn POCUS)

## Navigator Editor (Mar 26 2026)
- [x] Investigate Navigator static content structure across all navigator pages
- [x] Build navigatorProtocolOverrides DB table and server procedures
- [x] Create NavigatorEditor page with pre-loaded items, edit/delete/add/reorder
- [x] Fix ScanCoach editor to pre-populate fields with static content when no override exists
- [x] Wire Navigator pages to use DB overrides (TTE, TEE, Fetal, POCUS Cardiac, UEA)

## Navigator DB Override Fixes (Mar 26 2026)
- [x] Fix: TTE Navigator showing only 1 view — deleted bad partial DB override row (only A3C was saved), restored full static 17-view protocol
- [x] Fix: TEENavigator circular reference bug — was passing `protocol` to itself; now correctly passes `teeProtocol` static fallback
- [x] Fix: UEANavigator circular reference bug — was passing `protocol` to itself; now correctly passes `viewProtocol` static fallback
- [x] Fix: FetalNavigator unused hook call removed — fetalProtocol is a flat item list, not ProtocolSection[]; FetalProtocolChecklist uses fetalProtocol directly
- [x] Fix: TEENavigator ViewSection type — added required `probe` field; added `probe` to all 11 teeProtocol entries (using position value)
- [x] Fix: UEANavigator ViewSection type — added required `probe` field; added `probe` to all 8 viewProtocol entries (using window value)
- [x] Fix: useNavigatorProtocol hook — updated ProtocolSection interface to include optional extended fields (id, position, angle, depth, clinicalUse, window, tips, normalFindings, abnormalFindings, pearls) to support all navigator types without type errors
- [x] Fix: UEANavigator tips/normalFindings/abnormalFindings — use `?? []` fallback for safe rendering when sections come from DB (which won't have these fields)
- [x] Fix: TEENavigator positionColors index — use `section.position ?? ""` to avoid undefined index type error
- [x] Navigator Editor: added UEA (Contrast Echo) Navigator to MODULES list and STATIC_DEFAULTS (4 sections: PLAX, A4C, A2C, A3C/APLAX)

## Navigator Editor Partial-Save Bug Fix (Mar 26 2026)
- [x] Clear bad partial TTE DB override rows (again — user saved one section)
- [x] Fix useNavigatorProtocol hook: merge DB overrides with static defaults (DB rows override matching sections; unmatched static sections still show)
- [x] Fix Navigator Editor save logic: always save ALL sections when user clicks Save (not just dirty/modified ones) — RESOLVED via hook merge strategy instead; per-section save is now safe
- [x] Fix Navigator Editor useEffect load logic: now merges DB rows with static defaults (same strategy as hook), so opening Editor after a partial save shows all sections correctly
- [x] Fix useNavigatorProtocol staleTime: set to 0 so Navigator pages always reflect latest DB state immediately after a save

## SectionId Matching Audit (Mar 27 2026)
- [x] Audit all DB sectionIds vs STATIC_DEFAULTS sectionIds for every module (TTE, TEE, POCUS Cardiac, HOCM, Fetal, UEA)
- [x] Audit all static navigator page id fields vs STATIC_DEFAULTS sectionIds (TTENavigator, TEENavigator, POCUSCardiacNavigator, UEANavigator)
- [x] Fix any mismatches found — added psax_mv+ivc to pocus_cardiac, provocation+mitral+diastology+rvstudy to hocm, psax_mv+psax_pm+psax_apex+subcostal to uea STATIC_DEFAULTS

## Navigator Editor Drag-and-Drop (Mar 27 2026)
- [x] Install @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (already installed)
- [x] Add drag handle to section rows with DnD section reordering (updates sortOrder in DB on drop)
- [x] Add drag handle to sub-item rows with DnD item reordering within each section (SortableChecklistItem component)
- [x] Persist reordered sortOrder to DB on drop (sections and items)
- [x] Visual feedback: opacity fade on dragged item, cursor-grab handle

## Navigator Editor: Add ICE, Diastology, Pulm HTN Modules (Mar 27 2026)
- [ ] Audit ICENavigator, DiastologyNavigator, PulmHTNNavigator for section IDs and structure
- [ ] Add ice, diastology, pulm_htn to Navigator Editor MODULES list
- [ ] Add ice, diastology, pulm_htn STATIC_DEFAULTS with all sections matching navigator page IDs

## Navigator Editor: Section Reorder Persistence + New Mo- [x] Add ICE, Diastology, Pulm HTN to Navigator Editor MODULES list and STATIC_DEFAULTS
- [x] Fix: section drag-and-drop reorder does not persist — auto-save sortOrder to DB immediately on drop (upsert all sections on drag-end)
- [x] Add ICE, Diastology, Pulm HTN to Navigator Editor MODULES list and STATIC_DEFAULTS
## EchoAssist Hub: UltrasoundAssist CTA (Mar 27 2026)
- [x] Add UltrasoundAssist CTA section to bottom of EchoAssist hub page (app.allaboutultrasound.com)

## EchoAssist Hub CTA Cleanup (Mar 27 2026)
- [x] Remove Vascular ScanCoach button from UltrasoundAssist CTA section

## EchoAssist Hub CTA Copy Update (Mar 27 2026)
- [x] Update UltrasoundAssist CTA description to reference AIUM, SVU and ultrasound society guidelines

## Home/Hub: EchoAssist Calculators Button (Mar 27 2026)
- [x] Add EchoAssist™ Calculators button to Adult Echo card (matching PediatricEchoAssist™ Calculators button style)

## MechanicalSupportAssist™ Module (Mar 27 2026)
- [x] MechanicalSupportNavigator.tsx — premium Navigator with 5 device tabs (LVAD, ECMO, Impella, LifeVest, ICD/CRT-D)
- [x] MechanicalSupportScanCoach.tsx — premium ScanCoach with view-by-view acquisition protocols for all 5 devices
- [x] App.tsx routes: /mechanical-support-navigator and /mechanical-support-scan-coach (RoleGuard premium)
- [x] EchoNavigatorHub: MechanicalSupportAssist™ Navigator added to premium navigators list (MCS badge, purple)
- [x] ScanCoachHub: MCS Devices added to premium coaches list (15 views, routes to /mechanical-support-scan-coach)
- [x] EchoAssistHub: MechanicalSupportAssist™ added to specialties list (premium, links to Navigator + ScanCoach)
- [x] Home.tsx: MechanicalSupportAssist™ module card added (purple, premium, interests: adultEcho + acs)

## MechanicalSupportAssist™ Editor Registration (Mar 27 2026)
- [x] NavigatorEditor: add MechanicalSupportAssist™ as a selectable module (LVAD, ECMO, Impella, LifeVest, ICD tabs)
- [x] ScanCoachEditor: add MechanicalSupportAssist™ ScanCoach as a selectable module (all device views)

## Impella Sub-Tabs (Mar 27 2026)
- [x] MechanicalSupportNavigator: replace single Impella tab with sub-tabs for 2.5, CP, 5.5, ECP, RP — each with dedicated protocol checklist
- [x] MechanicalSupportScanCoach: add per-device Impella sub-tabs with device-specific acquisition views
- [x] NavigatorEditor: add per-device Impella static defaults
- [x] ScanCoach registry + server MODULE_VALUES: add per-device Impella module keys

## Learn Pediatric Echo Sidenav Link (Mar 28 2026)
- [x] Add "Learn Pediatric Echo" sidenav link before "Learn Fetal Echo" (URL: https://www.allaboutultrasound.net/pediatric-echo-cross-training-2cfdb)
- [x] Add "Learn Pediatric Echo" to admin menu links editor

## MechanicalSupportAssist™ Gating Fix (Mar 30 2026)
- [x] Fix gating in MechanicalSupportNavigator: change from accreditation to premium
- [x] Fix gating in MechanicalSupportScanCoach: change from accreditation to premium
- [x] Fix EchoAssist Hub card label/badge for MechanicalSupportAssist to show Premium (not Accreditation)

## LVAD Aortic Outflow Cannula Views (Mar 30 2026)
- [x] MechanicalSupportNavigator: add PLAX and High Parasternal Aortic Outflow Cannula checklist items to LVAD post-implant section
- [x] MechanicalSupportScanCoach: add PLAX Aortic Outflow Cannula and High Parasternal Aortic Outflow Cannula view cards to LVAD ScanCoach

## Editor Pre-Population Fix (Mar 30 2026)
- [x] NavigatorEditor: pre-populate each section's edit fields with current saved text (DB override or static default); persist display after save
- [x] ScanCoachEditor: pre-populate each view's edit fields with current saved text (DB override or static default); persist display after save

## ScanCoach Editor Blank Fields Fix (Mar 30 2026)
- [x] Diagnose why getStaticViewContent returns empty for most views in ScanCoachEditor
- [x] Fix static content registry so all text fields pre-populate with actual content when a view is selected

## ScanCoach Editor Static Content Fix (Mar 30 2026)
- [x] Added all missing static content entries to scanCoachStaticContent.ts for: mcs_lvad (6 views), mcs_ecmo (3 views), mcs_impella_cp (13 views), mcs_lifevest (2 views), mcs_icd (3 views), fetal (12 views), pulm (7 views), diastolic (6 views), strain (13 views)
- [x] ScanCoach Editor fields now pre-populate with actual content instead of blank placeholders for all modules

## HOCM-Assist™ Relabeling (Apr 1 2026)
- [x] Relabel all HOCM card titles and descriptions to "HOCM-Assist™" across EchoAssistHub, EchoNavigatorHub, ScanCoachHub, sidenav, HOCMNavigator, HOCMScanCoach, NavigatorEditor, scanCoachRegistry, ScanCoach.tsx BlurredOverlay, and Premium.tsx
- [x] Clinical content references to the condition (HOCM gradients, pathophysiology, checklist details) left unchanged

## Reference Image Placeholder Fix (Apr 1 2026)
- [x] Confirmed: all reference image slots in ScanCoach and Navigator pages are already correctly gated — only render when actual media URL exists; no changes needed

## ScanCoach Billing Tab (Apr 1 2026)
- [x] Add Billing Codes card to TTE ScanCoach views with CPT codes (93306/93307/93308/93320/93325/93356 per view)
- [x] Add Billing Codes card to TEE ScanCoach views with CPT codes (93312/93313/93314/93315/93316/93317/93318/93319 per view)
- [x] Add Billing Codes card to Strain ScanCoach with CPT codes (93306 + 93356 add-on)
- [x] NOT added to HOCM-Assist™, Diastology, Pulm HTN, Fetal, Pediatric, POCUS, MCS, or other non-billable modules
- [x] Remove MPI / Tei Index view from TTE ScanCoach (was added without being requested)

## Editor → DB → Live UI Pipeline Fix
- [x] Audit ScanCoach editor save path: tRPC upsertOverride writes to DB correctly
- [x] Audit Navigator editor save path: tRPC upsertSection writes to DB correctly
- [x] Audit useScanCoachOverrides: confirmed reads from DB with staleTime:0, merges with static defaults
- [x] Audit Navigator live UI: identified 5 navigators NOT wired to useNavigatorProtocol
- [x] ScanCoach pipeline confirmed working end-to-end for all modules using useScanCoachOverrides
- [x] Wire MechanicalSupportNavigator to useNavigatorProtocol for all 9 MCS device modules
- [x] Wire HOCMNavigator to useNavigatorProtocol
- [x] Fix NavigatorEditor STATIC_DEFAULTS sectionIds to match live page section IDs (mcs_lvad, mcs_ecmo, mcs_lifevest, mcs_icd)
- [x] Populate all 319 ScanCoach static content entries (all modules, no duplicates, probePosition field added)
- [x] Populate all missing ScanCoach static content entries (achd, chd, ecg, hocm, ice, mcs_impella_25/55/ecp/rp, pocus_lung, pocus_rush, stress, structural, uea)
- [ ] Wire FetalNavigator to useNavigatorProtocol (requires data-driven restructure of fetalProtocol)
- [ ] Wire DiastolicNavigator to useNavigatorProtocol (requires converting inline JSX to data array)
- [ ] Wire PulmHTNNavigator to useNavigatorProtocol (requires converting inline JSX to data array)
- [ ] Wire ICENavigator to useNavigatorProtocol (requires adding id fields to ICE_VIEWS)

## ScanCoach Editor WYSIWYG Fix (Apr 1 2026)
- [ ] Audit why CoA saved changes don't appear in live CHD ScanCoach UI
- [ ] Fix CHD ScanCoach live UI to read DB overrides via useScanCoachOverrides
- [ ] Align ScanCoach Editor registry for CHD to exactly mirror live UI views (pre-op, post-op, etc.)
- [ ] Ensure editor fields (description, tips, pitfalls, etc.) match exactly what is shown in live UI

## ScanCoach WYSIWYG Editor Rebuild (Apr 1 2026)
- [ ] Audit all ScanCoach page section structures (TTE, TEE, CHD, HOCM, Stress, Structural, ICE, POCUS, etc.)
- [ ] Rebuild ScanCoach Editor to render the live UI layout with inline editable fields for each section
- [ ] Fix CHD stage-level override merging (mergeCHDView must apply to selectedStage, not selectedDefect)
- [ ] Ensure all editable fields in editor exactly match what is rendered in live UI
- [ ] Ensure saved changes reflect immediately in live UI for all modules

## CHD ScanCoach WYSIWYG Editor Fix (Apr 1 2026)
- [x] Root cause: PedCHDCoach applied DB overrides to selectedDefect but rendered selectedStage — overrides never appeared in live UI
- [x] Fix: added selectedStageMerged computed value using mergeCHDView on stage.id
- [x] Fix: replaced all selectedStage.overview/keyViews/keyMeasurements/doppler/normalCriteria/redFlags/tips render references with selectedStageMerged
- [x] Fix: extended applyOverride in useScanCoachOverrides to map DB columns to CHD stage fields (description→overview, howToGet→keyViews, measurements→keyMeasurements, structures→doppler, pitfalls→normalCriteria, criticalFindings→redFlags)
- [x] Fix: added CHD_FIELD_LABELS mapping to ScanCoachEditor — editor now shows WYSIWYG labels (Overview, Key Views, Key Measurements, Doppler Protocol, Normal/Acceptable Criteria, Red Flags, Clinical Tips) when chd module is selected
- [x] Verified: CHD static content already uses correct DB column names; editor pre-populates correctly for all CHD stage views
- [x] Verified: CHD_STAGE_TO_DEFECT mapping covers all stage IDs (coa-diagnosis, coa-postop, etc.)
- [x] Verified: URL param deep-linking (?defect=coa&stage=coa-diagnosis) already works in PedCHDCoach

## WYSIWYG Editor Labels — All Modules (Apr 1 2026)
- [x] Audit all ScanCoach modules: map live UI section names to DB column names
- [x] Update ScanCoach Editor to show WYSIWYG labels per module — TTE, TEE, UEA, MCS field label maps added via getFieldLabels()
- [x] Fix useScanCoachOverrides field mapping for MCS (howToGet→acquisition, structures→whatToSee) and UEA (tips→contrastTips, criticalFindings→clinicalPearls)
- [x] Wire MechanicalSupportScanCoach to useScanCoachOverrides — mergedDeviceViews and mergedImpellaViews now apply DB overrides to all MCS views
- [x] Update ScanCoachViewPreview badge labels and Active Overrides badges to use WYSIWYG module-specific names

## HOCM ScanCoach Editor Fix (Apr 1 2026)
- [x] Fix: HOCM ScanCoach editor does not show the outflow cannula view — added 7 missing views (psax_pap, valsalva_pos, cw_lvot, pw_lvot, mr_jet, sam_plax, sam_zoom) to HOCMScanCoach.tsx
- [x] Added dev-mode validateViewsAgainstRegistry() call to HOCMScanCoach.tsx for ongoing sync checking

## Single Source-of-Truth for ScanCoach & Navigator Editors (Apr 1 2026)
- [x] Audit: ScanCoach editor sources view list from scanCoachRegistry.ts (already single source of truth for editor)
- [x] Audit: Navigator editor had STATIC_DEFAULTS hardcoded inline in NavigatorEditor.tsx
- [x] ScanCoach: added validateViewsAgainstRegistry() to scanCoachRegistry.ts — call in each ScanCoach page to detect sync issues at dev time
- [x] Navigator: extracted STATIC_DEFAULTS to navigatorProtocolDefaults.ts as NAVIGATOR_PROTOCOL_DEFAULTS; NavigatorEditor.tsx now imports from it
- [x] Fix: HOCM outflow cannula views (cw_lvot, pw_lvot, sam_plax, sam_zoom, etc.) added to live page
- [x] Pattern established: add to scanCoachRegistry.ts or navigatorProtocolDefaults.ts → auto-appears in editor; add to live page → dev-mode warning if not in registry

## ScanCoach Media Upload Fix (Apr 3 2026)
- [x] Fix: uploading media (image/video) in ScanCoach editor returns "unexpected JSON" error
  - Root cause: base64 JSON payload exceeded express.json 50MB limit, returning non-JSON 413 response
  - Fix: created /api/upload-scancoach-media multipart route (server/routes/uploadScanCoachMedia.ts)
  - Fix: ImageUploadZone now uploads via FormData fetch instead of base64 tRPC mutation
  - Fix: server route auto-upserts DB override; client invalidates query cache after upload

## Multipart Upload Migration — Site-Wide (Apr 3 2026)
- [x] Audit all base64/readAsDataURL/tRPC file upload points across the site
- [x] Created /api/upload generic multipart route (server/routes/uploadGeneric.ts)
- [x] Created client uploadFile() helper (client/src/lib/uploadFile.ts)
- [x] Profile.tsx avatar: migrated from base64 tRPC to multipart + updateAvatarUrl mutation
- [x] SoundBytesAdmin.tsx video/thumbnail: migrated from base64 tRPC to multipart uploadFile()
- [x] TEEIceScanCoach.tsx view media: migrated from base64 tRPC to multipart uploadFile()
- [x] uploadViewMedia tRPC procedure: updated to accept url (not base64Data)
- [x] RichTextEditor inline image: left as-is (client-only base64 preview, never sent to server)
- [x] BulkCsvUploadPanel: left as-is (reads CSV text, not binary upload)
- [x] ChallengeCardGenerator: left as-is (client-only ZIP generation)
- [x] QuickFireAdmin, QuickFire, SubmitCase: already using multipart routes — no change needed

## Platform Admin Sync Issues (Apr 7 2026)
- [x] Fix Thinkific premium user sync — enrolled users not getting premium_user role in app database
- [x] Fix DIY user count in platform admin — exclude seeded/test members from count

## Platform Admin Fixes (Apr 7 2026)
- [x] Remove 500 user fetch limit in platform admin — always fetch all users
- [x] Fix DIY user count to exclude seeded/demo members
- [x] Fix Thinkific premium user sync — enrolled users not getting premium_user role in userRoles table

## Auto Premium Welcome Email (Apr 7 2026)
- [ ] Auto-send premium welcome email when platform admin manually assigns premium_user role
- [ ] Send welcome emails to existing 10 new premium subscribers via backfill
- [ ] Platform admin: show user list only on search, not load all users by default

## Platform Admin UX (Apr 7 2026)
- [x] Platform admin: show user list only on search (no default load)
- [x] Platform admin: add role filter chips — Free, Premium, DIY, Admin

## Upgrade Trigger System (Apr 8 2026)
- [x] Annual pricing: drop to $99.70/yr (exact 2-months-free), add savings callout badge ($19.94 saved)
- [x] ScanCoach Fetal tab: remove top-level premium gate, open to free users with PremiumPearlGate on pitfalls/redFlags
- [x] ScanCoach PedCHD tab: remove top-level BlurredOverlay, add PremiumPearlGate on Red Flags and Clinical Tips
- [x] ScanCoach Strain tab: remove top-level BlurredOverlay, add PremiumPearlGate on Tips & Tricks tab
- [x] EchoAssist narrative gate: EchoAssistPanel Note and Tip sections gated with PremiumPearlGate via context
- [x] CaseDetail post-case modal: UpgradeTriggerModal("post_case") fires 1.5s after free user submits answers
- [x] CaseLab streak trigger: UpgradeTriggerModal("streak") fires 2s after page load when streak >= 3 and not premium

## Premium Gate Unification (Apr 8 2026)
- [x] Update BlurredOverlay, PremiumGate, and PremiumOverlay components to use soft PremiumPearlGate-style teaser lock across all 30+ usages

## Daily Challenge Email Auto-Enrollment (Apr 8 2026)
- [x] Filter challengeCron to only email users with isPending=false (signed in at least once)
- [x] Ensure notificationPrefs.dailyChallenge defaults to true for all new sign-ins
- [x] Add vitest for the eligibility filter logic (10/10 passing)

## TS Error Fixes + Welcome Email (Apr 8 2026)
- [ ] Fix adminRouter.ts null DB guard (TS18047)
- [ ] Fix caseLibraryRouter.ts missing categorySortOrder field (TS2741)
- [ ] Implement welcome email on first sign-in (OAuth callback isPending flip)
- [ ] Write vitest for welcome email trigger logic

## TS Fixes + Welcome Email (Apr 8 2026)
- [x] Fix adminRouter.ts null DB guard TS error (findDuplicatesByEmail procedure)
- [x] Fix caseLibraryRouter.ts missing categorySortOrder in extraCases select
- [x] Move findDuplicatesByEmail and mergeUsers from labSeatsRouter into platformAdminRouter
- [x] Fix CaseEditorDialog missing isSaving prop and ChallengeCardGenerator missing dayOffset prop
- [x] Add buildFirstSignInWelcomeEmail email template (introduces daily challenge, links to profile)
- [x] Wire welcome email in OAuth callback on first sign-in (fires alongside Thinkific enrollment)
- [x] Add vitest for welcome email trigger and template (32 tests passing)

## Premium Gate Bug Fix (Apr 8 2026)
- [x] Fix: premium_user role holders incorrectly seeing upgrade/auth gates — usePremium now uses premium.getStatus as authoritative source

## URGENT: Premium Gate Still Broken (Apr 11 2026)
- [ ] Full trace of premium detection chain and definitive fix

## Welcome Email & Admin Improvements (2026-04-11)
- [x] Welcome email CTA changed from "Sign In to iHeartEcho™" to "Set Up Your Account"
- [x] Welcome email CTA now links to /register instead of /login for pre-registered users
- [x] buildWelcomeEmail accepts optional ctaLabel override parameter
- [x] Admin: resendWelcomeEmail procedure added to platformAdminRouter (accessible to owner and platform_admin)
- [x] Admin: "Resend Email" button shown in user list for pending users (orange, with mail icon)
- [x] Admin: Premium badge (amber Crown) shown in user list for active premium users
- [x] welcome-email.test.ts updated to match new default CTA label
