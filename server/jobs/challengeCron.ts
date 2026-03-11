/**
 * challengeCron.ts
 *
 * Runs every 5 minutes to:
 *  1. Archive any "live" challenge whose 24-hour window has expired.
 *  2. Auto-publish the next "scheduled" or highest-priority "draft" challenge
 *     if no challenge is currently live.
 *  3. Send a SendGrid notification email to all users who have opted in
 *     when a new challenge goes live.
 */

import { getDb } from "../db";
import { quickfireChallenges, quickfireDailySets, quickfireQuestions, users } from "../../drizzle/schema";
import { eq, and, asc, lte } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? "";
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "noreply@iheartecho.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME ?? "iHeartEcho™";
const APP_URL = process.env.VITE_APP_URL ?? "https://app.iheartecho.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

let cronRunning = false;
let lastAutoGenDate = ""; // tracks the last date we auto-generated a daily set

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Ensures a daily question set exists for the given date.
 * Mirrors the logic in quickfireRouter.ts ensureTodaySet.
 */
async function ensureDailySet(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, date: string) {
  const existing = await db
    .select()
    .from(quickfireDailySets)
    .where(eq(quickfireDailySets.setDate, date))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const allQuestions = await db
    .select({ id: quickfireQuestions.id, type: quickfireQuestions.type })
    .from(quickfireQuestions)
    .where(eq(quickfireQuestions.isActive, true));

  if (allQuestions.length === 0) {
    const [inserted] = await db.insert(quickfireDailySets).values({ setDate: date, questionIds: "[]" });
    return { setDate: date, questionIds: "[]", id: (inserted as any).insertId };
  }

  const scenarios = allQuestions.filter((q) => q.type === "scenario");
  const images = allQuestions.filter((q) => q.type === "image");
  const reviews = allQuestions.filter((q) => q.type === "quickReview");

  const picked = [
    ...sampleN(scenarios, Math.min(2, scenarios.length)),
    ...sampleN(images, Math.min(2, images.length)),
    ...sampleN(reviews, Math.min(1, reviews.length)),
  ];

  if (picked.length < 5) {
    const remaining = allQuestions.filter((q) => !picked.find((p) => p.id === q.id));
    picked.push(...sampleN(remaining, 5 - picked.length));
  }

  const finalIds = sampleN(picked, picked.length).map((q) => q.id);

  await db.insert(quickfireDailySets).values({
    setDate: date,
    questionIds: JSON.stringify(finalIds),
  });

  console.log(`[ChallengeCron] Auto-generated daily set for ${date} with ${finalIds.length} questions.`);
  return { setDate: date, questionIds: JSON.stringify(finalIds) };
}

/**
 * Auto-generates the daily question set for today if not already done.
 * Runs once per UTC day.
 */
async function runDailyAutoGenerate() {
  const today = todayUTC();
  if (lastAutoGenDate === today) return; // already done today
  try {
    const db = await getDb();
    if (!db) return;
    await ensureDailySet(db, today);
    lastAutoGenDate = today;
  } catch (err) {
    console.error("[ChallengeCron] Auto-generate error:", err);
  }
}

export async function runChallengeCron() {
  if (cronRunning) return; // prevent overlapping runs
  cronRunning = true;
  try {
    const db = await getDb();
    if (!db) return;

    const now = new Date();

    // ── Step 1: Archive expired live challenges ──────────────────────────────
    const [liveChallenge] = await db
      .select()
      .from(quickfireChallenges)
      .where(eq(quickfireChallenges.status, "live"))
      .limit(1);

    if (liveChallenge?.publishedAt) {
      const publishedAt = new Date(liveChallenge.publishedAt);
      const expiresAt = new Date(publishedAt.getTime() + 24 * 60 * 60 * 1000);
      if (now >= expiresAt) {
        await db
          .update(quickfireChallenges)
          .set({ status: "archived", archivedAt: now })
          .where(eq(quickfireChallenges.id, liveChallenge.id));
        console.log(`[ChallengeCron] Archived challenge #${liveChallenge.id}: "${liveChallenge.title}"`);
      }
    }

    // ── Step 2: Check if a challenge is still live after archiving ───────────
    const [stillLive] = await db
      .select({ id: quickfireChallenges.id })
      .from(quickfireChallenges)
      .where(eq(quickfireChallenges.status, "live"))
      .limit(1);

    if (stillLive) return; // already have a live challenge, nothing to do

    // ── Step 3: Find next challenge to publish ───────────────────────────────
    // Priority: scheduled challenges with publishDate <= today first,
    // then draft challenges ordered by priority ASC, createdAt ASC.
    const todayStr = now.toISOString().slice(0, 10);

    const [nextScheduled] = await db
      .select()
      .from(quickfireChallenges)
      .where(
        and(
          eq(quickfireChallenges.status, "scheduled"),
          lte(quickfireChallenges.publishDate, todayStr)
        )
      )
      .orderBy(asc(quickfireChallenges.priority), asc(quickfireChallenges.createdAt))
      .limit(1);

    // Only auto-publish drafts that have a publishDate <= today.
    // Pure drafts (no publishDate) must be manually published by admin.
    const toPublish = nextScheduled;
    if (!toPublish) {
      console.log("[ChallengeCron] No challenges queued for publishing.");
      return;
    }

    // ── Step 4: Publish the challenge ────────────────────────────────────────
    await db
      .update(quickfireChallenges)
      .set({ status: "live", publishedAt: now, publishDate: todayStr })
      .where(eq(quickfireChallenges.id, toPublish.id));

    console.log(`[ChallengeCron] Published challenge #${toPublish.id}: "${toPublish.title}"`);

    // ── Step 5: Send email notifications to opted-in users ───────────────────
    if (!SENDGRID_API_KEY) {
      console.log("[ChallengeCron] SendGrid not configured — skipping user emails.");
      return;
    }

    try {
      // Fetch all users with emails who have opted in to quickfireReminder
      const usersWithEmail = await db
        .select({ email: users.email, name: users.name, displayName: users.displayName, notificationPrefs: users.notificationPrefs })
        .from(users);

      const recipients = usersWithEmail.filter((u) => {
        if (!u.email) return false;
        try {
          const prefs = u.notificationPrefs ? JSON.parse(u.notificationPrefs) : {};
          // Default: opted in unless explicitly set to false
          return prefs.quickfireReminder !== false;
        } catch {
          return true;
        }
      });

      if (recipients.length === 0) {
        console.log("[ChallengeCron] No opted-in users to notify.");
        return;
      }

      const challengeUrl = `${APP_URL}/quickfire`;
      const categoryTag = toPublish.category ? ` — ${toPublish.category}` : "";

      // Send in batches of 100 to stay within SendGrid rate limits
      const BATCH = 100;
      for (let i = 0; i < recipients.length; i += BATCH) {
        const batch = recipients.slice(i, i + BATCH);
        const messages = batch.map((u) => ({
          to: u.email!,
          from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
          subject: `🔥 New Daily Challenge: ${toPublish.title}${categoryTag}`,
          html: buildEmailHtml({
            userName: u.displayName ?? u.name ?? "Echo Learner",
            challengeTitle: toPublish.title,
            challengeDescription: toPublish.description ?? "",
            challengeUrl,
            category: toPublish.category ?? "General",
          }),
          text: `New Daily Challenge: ${toPublish.title}\n\n${toPublish.description ?? ""}\n\nYou have 24 hours to complete it!\n\n${challengeUrl}`,
        }));
        await sgMail.send(messages as any);
        console.log(`[ChallengeCron] Sent challenge notification to ${batch.length} users (batch ${Math.floor(i / BATCH) + 1}).`);
      }
    } catch (emailErr) {
      console.error("[ChallengeCron] Email send error:", emailErr);
    }
  } catch (err) {
    console.error("[ChallengeCron] Error:", err);
  } finally {
    cronRunning = false;
  }
}

function buildEmailHtml({
  userName,
  challengeTitle,
  challengeDescription,
  challengeUrl,
  category,
}: {
  userName: string;
  challengeTitle: string;
  challengeDescription: string;
  challengeUrl: string;
  category: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Daily Challenge</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e1e2e 0%,#0e4a50 60%,#189aa1 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">iHeartEcho™</h1>
              <p style="margin:4px 0 0;color:#4ad9e0;font-size:14px;font-weight:600;">Daily Challenge</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hi ${userName},</p>
              <h2 style="margin:0 0 16px;color:#0e1e2e;font-size:22px;font-weight:800;">🔥 A new challenge is live!</h2>
              <!-- Challenge card -->
              <div style="background:#f0fbfc;border:1px solid #4ad9e0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <div style="display:inline-block;background:#189aa1;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:10px;letter-spacing:0.5px;">${category.toUpperCase()}</div>
                <h3 style="margin:0 0 8px;color:#0e1e2e;font-size:18px;font-weight:800;">${challengeTitle}</h3>
                ${challengeDescription ? `<p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">${challengeDescription}</p>` : ""}
              </div>
              <p style="margin:0 0 8px;color:#4b5563;font-size:14px;">You have <strong>24 hours</strong> to complete this challenge and make the leaderboard.</p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;">After 24 hours, the challenge is archived. <strong>Premium members</strong> can replay all past challenges in the archive — free members access today's challenge only.</p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#189aa1;">
                    <a href="${challengeUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Take the Challenge →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you're subscribed to Daily Challenge notifications.<br/>
                <a href="${challengeUrl}" style="color:#189aa1;text-decoration:none;">Manage preferences</a> · 
                <a href="${challengeUrl}" style="color:#189aa1;text-decoration:none;">iHeartEcho™</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Start the cron job — runs every 5 minutes.
 * Also runs daily auto-generation at midnight UTC.
 */
export function startChallengeCron() {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  console.log("[ChallengeCron] Started — checking every 5 minutes.");
  // Run immediately on startup to catch any missed publishes and generate today's set
  runChallengeCron().catch(console.error);
  runDailyAutoGenerate().catch(console.error);
  setInterval(() => {
    runChallengeCron().catch(console.error);
    runDailyAutoGenerate().catch(console.error);
  }, INTERVAL_MS);
}
