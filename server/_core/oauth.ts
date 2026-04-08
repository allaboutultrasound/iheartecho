import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { activatePendingUser } from "../db";
import { enrollInFreeMembership } from "../thinkific";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { sendEmail, buildFirstSignInWelcomeEmail } from "./email";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // ── Pre-registration activation (MUST happen before upsertUser) ──────────
      // If an admin pre-registered this email before the user first signed in,
      // we update the pending stub in-place (preserving its id and roles) rather
      // than creating a second row.  We do this FIRST so that the subsequent
      // upsertUser call hits the now-updated openId and simply refreshes the row.
      if (userInfo.email) {
        try {
          const activated = await activatePendingUser(userInfo.email, userInfo.openId);
          if (activated) {
            console.log(`[OAuth] Activated pending account for ${userInfo.email}`);
          }
        } catch (err) {
          // If activation fails (e.g. unique constraint because the user somehow
          // already has a real account), log and continue — upsertUser below will
          // handle the normal sign-in path.
          console.warn("[OAuth] Failed to activate pending user:", err);
        }
      }

      // ── Upsert the real user row ──────────────────────────────────────────────
      // For a first-time sign-in with no pending account this creates a new row.
      // For a returning user it updates lastSignedIn etc.
      // For a just-activated pending user it updates the row we already fixed above.
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Auto-assign the base "user" role on every login (idempotent)
      const createdUser = await db.getUserByOpenId(userInfo.openId);
      if (createdUser) {
        await db.ensureUserRole(createdUser.id);

          // Auto-enroll new users into the Thinkific Free Membership (first sign-in only)
        if (!createdUser.thinkificEnrolledAt && createdUser.email) {
          const nameParts = (createdUser.name ?? "").split(" ");
          const firstName = nameParts[0] ?? "Member";
          const lastName = nameParts.slice(1).join(" ") ?? "";
          // Fire-and-forget: don't block the OAuth redirect on Thinkific latency
          enrollInFreeMembership(createdUser.email, firstName, lastName)
            .then(async ({ thinkificUserId, coursesEnrolled }) => {
              await db.markThinkificEnrolled(createdUser.id);
              console.log(
                `[Thinkific] Auto-enrolled user ${createdUser.email} (Thinkific ID: ${thinkificUserId}) into ${coursesEnrolled} free membership courses.`
              );
            })
            .catch((err) => {
              console.error(`[Thinkific] Auto-enrollment failed for ${createdUser.email}:`, err);
            });

          // Send one-time welcome email on first sign-in (fire-and-forget)
          const appUrl = process.env.VITE_APP_URL ?? "https://app.iheartecho.com";
          const welcomeOpts = buildFirstSignInWelcomeEmail({
            firstName,
            appUrl,
            notifSettingsUrl: `${appUrl}/profile`,
          });
          sendEmail({
            to: { name: createdUser.name ?? firstName, email: createdUser.email },
            subject: welcomeOpts.subject,
            htmlBody: welcomeOpts.htmlBody,
            previewText: welcomeOpts.previewText,
          })
            .then((ok) => {
              if (ok) console.log(`[OAuth] Welcome email sent to ${createdUser.email}`);
            })
            .catch((err) => {
              console.error(`[OAuth] Welcome email failed for ${createdUser.email}:`, err);
            });
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
