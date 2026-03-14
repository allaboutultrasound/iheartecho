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
- [x] Admin queue: show all currently live challenges (not just scheduled), with a distinct "Live" badge
- [x] Admin queue: Unpublish button on live challenges to move them back to scheduled status
- [x] Fix: question explanation showing raw HTML tags — render as HTML not plain text (dangerouslySetInnerHTML in both main and archive players)
- [x] Fix: Edit Challenge button visible to all users in archive — now only shows for platform_admin appRole
- [x] Fix: archive drill-down now works — getArchivedChallenge fetches questions regardless of isActive status
- [ ] Unpublish: keep challenge at top of queue (priority 0) and show "Unpublished" badge
- [ ] Fix ensureTodaySet queue ordering: priority ASC then queuePosition ASC (nulls last) so unpublished challenges sort first
- [ ] Full editing of live published questions from admin queue (text, images, videos, options, answer key, explanation) — no unpublish required
- [x] Fix: Edit Question button on live challenge rows opens full question editor (not challenge picker)
- [x] Remove multi-select question picker from challenge form (challenges are 1 question, auto-assigned)
- [x] Fix: Edit Question button missing for queued (non-live) challenges — pass openEditQuestion prop
- [x] Fix: Edit Question for live challenges — ensure openEditQuestionById works reliably
- [x] Add: Category filter dropdown to the challenge queue tab
