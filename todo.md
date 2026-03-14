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
