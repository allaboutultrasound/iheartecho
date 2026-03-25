/**
 * One-click unsubscribe endpoint.
 * GET /api/unsubscribe?token=<hmac-signed-token>
 *
 * Token format (base64url): userId:timestamp:hmac
 * HMAC uses JWT_SECRET so tokens cannot be forged.
 * Tokens expire after 30 days.
 *
 * On unsubscribe, the user's email is added to SendGrid's Global Unsubscribe
 * suppression list. This blocks delivery from ALL senders on the same SendGrid
 * account — including the All About Ultrasound app — preventing cross-app emails.
 */
import type { Express } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(userId: number, timestamp: number): string {
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

function verify(token: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userIdStr, timestampStr, hmac] = parts;
    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(userId) || isNaN(timestamp)) return null;
    // Check expiry
    if (Date.now() - timestamp > TOKEN_TTL_MS) return null;
    // Verify HMAC
    const expected = crypto
      .createHmac("sha256", ENV.cookieSecret)
      .update(`${userId}:${timestamp}`)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"))) return null;
    return { userId };
  } catch {
    return null;
  }
}

/**
 * Add an email address to SendGrid's Global Unsubscribe suppression list.
 * This prevents ALL sends from this SendGrid account to that address,
 * including from the All About Ultrasound app if it shares the same account.
 */
async function addToSendGridGlobalUnsubscribe(email: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[Unsubscribe] SENDGRID_API_KEY not set — skipping global suppression");
    return;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/asm/suppressions/global", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_emails: [email],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Unsubscribe] SendGrid global suppression failed (${response.status}): ${body}`);
    } else {
      console.log(`[Unsubscribe] Added ${email} to SendGrid global suppression list`);
    }
  } catch (err) {
    // Non-fatal — local DB unsubscribe still succeeded
    console.error("[Unsubscribe] SendGrid global suppression request failed:", err);
  }
}

export function generateUnsubscribeToken(userId: number): string {
  return sign(userId, Date.now());
}

export function registerUnsubscribeRoute(app: Express) {
  app.get("/api/unsubscribe", async (req, res) => {
    const token = req.query.token as string | undefined;

    if (!token) {
      return res.redirect(302, "/profile#notifications?unsubscribe=invalid");
    }

    const parsed = verify(token);
    if (!parsed) {
      return res.redirect(302, "/profile#notifications?unsubscribe=invalid");
    }

    try {
      const db = await getDb();
      if (!db) return res.redirect(302, "/profile#notifications?unsubscribe=error");

      const [userRow] = await db
        .select({ email: users.email, notificationPrefs: users.notificationPrefs })
        .from(users)
        .where(eq(users.id, parsed.userId))
        .limit(1);

      if (!userRow) {
        return res.redirect(302, "/profile#notifications?unsubscribe=notfound");
      }

      let prefs: Record<string, unknown> = {};
      try {
        prefs = JSON.parse(userRow.notificationPrefs ?? "{}");
      } catch {
        prefs = {};
      }
      prefs.quickfireReminder = false;
      prefs.dailyChallenge = false;
      prefs.emailCampaigns = false;

      // Update local DB — sets the global suppression flag used by all iHeartEcho email paths
      await db
        .update(users)
        .set({
          notificationPrefs: JSON.stringify(prefs),
          unsubscribedAt: new Date(),
        })
        .where(eq(users.id, parsed.userId));

      // Add to SendGrid global suppression — blocks delivery from ALL senders on this
      // SendGrid account, including the All About Ultrasound app (cross-app suppression)
      if (userRow.email) {
        await addToSendGridGlobalUnsubscribe(userRow.email);
      }

      return res.redirect(302, "/profile#notifications?unsubscribe=success");
    } catch (err) {
      console.error("[Unsubscribe] Error:", err);
      return res.redirect(302, "/profile#notifications?unsubscribe=error");
    }
  });
}
