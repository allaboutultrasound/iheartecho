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
