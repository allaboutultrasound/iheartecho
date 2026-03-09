/**
 * Thinkific Webhook Handler
 *
 * Handles three categories of Thinkific webhook events:
 *
 * 1. product.* (created, updated, deleted)
 *    → Triggers a background CME catalog re-sync.
 *
 * 2. order.created
 *    → Grants iHeartEcho™ Premium Access when a user purchases the
 *      "iHeartEcho™ App - Premium Access" membership.
 *    → If the user has no iHeartEcho™ account yet, creates a pending account
 *      with isPremium=true so premium is granted immediately on first login.
 *
 * 3. subscription.cancelled
 *    → Revokes iHeartEcho™ Premium Access when the user's subscription
 *      is cancelled.
 *
 * Every event (including ignored ones) is logged to the webhookEvents table
 * for visibility in the admin dashboard.
 *
 * Setup in Thinkific:
 *   Admin → Settings → Webhooks → Add Webhook
 *   URL: https://your-domain.com/api/webhooks/thinkific
 *   Events: product.created, product.updated, product.deleted,
 *           order.created, subscription.cancelled
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { webhookEvents } from "../../drizzle/schema";
import { syncCatalogToDb } from "../routers/cmeRouter";
import { getUserByEmail, setPremiumStatus, createPendingUser } from "../db";

/**
 * Returns true if the Thinkific product name matches the iHeartEcho™ Premium Access membership.
 * The actual product name in Thinkific is: "iHeartEcho™ App - Premium Access"
 * We match broadly on any variant to be resilient to minor name changes.
 */
function isPremiumProduct(productName: string | null | undefined): boolean {
  if (!productName) return false;
  const lower = productName.toLowerCase();
  return (
    lower.includes("iheartecho app - premium access") ||
    lower.includes("iheartecho app premium access") ||
    lower.includes("iheartecho-app-premium-access") ||
    lower.includes("iheartecho premium access") ||
    (lower.includes("iheartecho") && lower.includes("premium"))
  );
}

/** Log a webhook event to the DB (fire-and-forget, never throws) */
async function logWebhookEvent(params: {
  resource: string;
  action: string;
  email?: string;
  productName?: string;
  httpStatus: number;
  outcome: "granted" | "revoked" | "pending_created" | "ignored" | "error";
  message: string;
  rawPayload?: unknown;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(webhookEvents).values({
      source: "thinkific",
      resource: params.resource,
      action: params.action,
      email: params.email ?? null,
      productName: params.productName ?? null,
      httpStatus: params.httpStatus,
      outcome: params.outcome,
      message: params.message,
      rawPayload: params.rawPayload ? JSON.stringify(params.rawPayload) : null,
    });
  } catch (logErr) {
    console.error("[Thinkific Webhook] Failed to log event:", logErr);
  }
}

export function registerThinkificWebhook(app: Router) {
  app.post("/api/webhooks/thinkific", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        resource?: string;
        action?: string;
        tenant_id?: string;
        payload?: Record<string, unknown>;
      };

      const { resource = "unknown", action = "unknown", payload } = body;

      // ── 1. Product events → CME catalog re-sync ──────────────────────────
      if (resource === "product") {
        if (!["created", "updated", "deleted"].includes(action)) {
          const msg = `ignored: action=${action}`;
          await logWebhookEvent({ resource, action, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }
        const p = payload as { id?: number; name?: string; status?: string } | undefined;
        console.log(`[Thinkific Webhook] product.${action} — id=${p?.id} name="${p?.name}"`);
        syncCatalogToDb()
          .then((count) => console.log(`[Thinkific Webhook] Re-sync complete — ${count} products`))
          .catch((err) => console.error("[Thinkific Webhook] Re-sync failed:", err));
        const msg = `product.${action} received — background sync triggered`;
        await logWebhookEvent({ resource, action, productName: p?.name, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg, productId: p?.id });
      }

      // ── 2. Order created → grant premium if it's the iHeartEcho™ membership ─
      if (resource === "order" && action === "created") {
        const p = payload as {
          product_name?: string;
          status?: string;
          user_id?: number;
          user_email?: string;
          user_name?: string;
          user?: { email?: string };
        } | undefined;

        const productName = p?.product_name ?? "";
        const userEmail = ((p?.user_email ?? p?.user?.email) ?? "").toLowerCase().trim();
        const orderStatus = (p?.status ?? "").toLowerCase();

        if (!isPremiumProduct(productName)) {
          const msg = `ignored: order for "${productName}" is not the premium membership`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (orderStatus !== "complete") {
          const msg = `ignored: order status is "${orderStatus}", not "complete"`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (!userEmail) {
          const msg = "ignored: no user email in payload";
          console.warn("[Thinkific Webhook] order.created: no user email in payload");
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        console.log(`[Thinkific Webhook] order.created — granting premium to ${userEmail} for "${productName}"`);

        const user = await getUserByEmail(userEmail);
        if (!user) {
          console.log(`[Thinkific Webhook] user ${userEmail} not found — creating pending premium account`);
          try {
            const pendingUserId = await createPendingUser(userEmail);
            await setPremiumStatus(pendingUserId, true, "thinkific");
            const msg = `pending premium account created for ${userEmail}`;
            console.log(`[Thinkific Webhook] ${msg} (userId=${pendingUserId})`);
            await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "pending_created", message: msg, rawPayload: payload });
            return res.status(200).json({ ok: true, message: msg, userId: pendingUserId });
          } catch (createErr) {
            const msg = `user ${userEmail} not found — could not create pending account`;
            console.error(`[Thinkific Webhook] Failed to create pending account for ${userEmail}:`, createErr);
            await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "error", message: msg, rawPayload: payload });
            return res.status(200).json({ ok: true, message: msg });
          }
        }

        await setPremiumStatus(user.id, true, "thinkific");
        const msg = `premium granted to ${userEmail} (userId=${user.id})`;
        console.log(`[Thinkific Webhook] ${msg}`);
        await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "granted", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg, userId: user.id });
      }

      // ── 3. Subscription cancelled → revoke premium ────────────────────────
      if (resource === "subscription" && action === "cancelled") {
        const p = payload as {
          product_name?: string;
          user_email?: string;
          user?: { email?: string };
        } | undefined;

        const productName = p?.product_name ?? "";
        const userEmail = ((p?.user_email ?? p?.user?.email) ?? "").toLowerCase().trim();

        if (!isPremiumProduct(productName)) {
          const msg = `ignored: subscription for "${productName}" is not the premium membership`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (!userEmail) {
          const msg = "ignored: no user email in payload";
          console.warn("[Thinkific Webhook] subscription.cancelled: no user email in payload");
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        console.log(`[Thinkific Webhook] subscription.cancelled — revoking premium from ${userEmail}`);

        const user = await getUserByEmail(userEmail);
        if (!user) {
          const msg = `user ${userEmail} not found — cannot revoke`;
          console.warn(`[Thinkific Webhook] ${msg}`);
          await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        await setPremiumStatus(user.id, false, "thinkific");
        const msg = `premium revoked from ${userEmail} (userId=${user.id})`;
        console.log(`[Thinkific Webhook] ${msg}`);
        await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "revoked", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg, userId: user.id });
      }

      // ── 4. All other events → ignore ──────────────────────────────────────
      const msg = `ignored: resource=${resource} action=${action}`;
      await logWebhookEvent({ resource, action, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
      return res.status(200).json({ ok: true, message: msg });

    } catch (err) {
      console.error("[Thinkific Webhook] Error processing webhook:", err);
      return res.status(500).json({ ok: false, message: "internal error" });
    }
  });
}
