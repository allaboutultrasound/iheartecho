/**
 * Thinkific Webhook Handler
 *
 * FILTER POLICY — only the following event + product combinations are processed:
 *
 * Allowed event types (all others are rejected at the door with a 200 + "filtered" outcome):
 *   • order.created
 *   • subscription.cancelled
 *   • subscription.activated     (re-activation after pause/lapse)
 *   • enrollment.created         (direct enrollment, e.g. gifted access)
 *   • enrollment.updated         (status change on an existing enrollment)
 *
 * Allowed products (matched by name substring — case-insensitive):
 *   • iHeartEcho™ App — Premium Access  → grants/revokes "premium_user" role
 *   • DIY Accreditation memberships      → grants/revokes "diy_user" or "diy_admin" role
 *
 * product.* events (created/updated/deleted) are intentionally NOT subscribed to
 * in Thinkific — catalog re-syncs are triggered manually or on a schedule instead.
 *
 * Every event (including filtered ones) is logged to the webhookEvents table.
 *
 * Setup in Thinkific:
 *   Admin → Settings → Webhooks → Add Webhook
 *   URL: https://your-domain.com/api/webhooks/thinkific
 *   Events (subscribe ONLY to these):
 *     order.created
 *     subscription.cancelled
 *     subscription.activated
 *     enrollment.created
 *     enrollment.updated
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { webhookEvents } from "../../drizzle/schema";
import { getUserByEmail, setPremiumStatus, createPendingUser, assignRole, removeRole, ensureUserRole, markThinkificEnrolled } from "../db";
import { syncCatalogToDb } from "../routers/cmeRouter";

// ── Allowed event allowlist ──────────────────────────────────────────────────
/** Only these resource+action pairs will be processed. Everything else is filtered. */
const ALLOWED_EVENTS: Array<{ resource: string; action: string }> = [
  { resource: "order",        action: "created"   },
  { resource: "subscription", action: "cancelled" },
  { resource: "subscription", action: "activated" },
  { resource: "enrollment",   action: "created"   },
  { resource: "enrollment",   action: "updated"   },
  // product.* events trigger a background catalog re-sync
  { resource: "product",      action: "created"   },
  { resource: "product",      action: "updated"   },
  { resource: "product",      action: "deleted"   },
];

function isAllowedEvent(resource: string, action: string): boolean {
  return ALLOWED_EVENTS.some(e => e.resource === resource && e.action === action);
}

// ── Product matchers ─────────────────────────────────────────────────────────

/**
 * Returns true if the product name matches the iHeartEcho™ Premium App Access membership.
 * Canonical name: "iHeartEcho™ App - Premium Access"
 */
function isPremiumProduct(name: string | null | undefined): boolean {
  if (!name) return false;
  const l = name.toLowerCase();
  return (
    l.includes("iheartecho app - premium access") ||
    l.includes("iheartecho app premium access") ||
    l.includes("iheartecho-app-premium-access") ||
    l.includes("iheartecho premium access") ||
    (l.includes("iheartecho") && l.includes("premium"))
  );
}

/**
 * Returns true if the product name matches any iHeartEcho™ DIY Accreditation membership.
 * Covers both the admin (lab director) tier and the user (sonographer) seat tier.
 */
function isDIYProduct(name: string | null | undefined): boolean {
  if (!name) return false;
  const l = name.toLowerCase();
  return (
    l.includes("diy accreditation") ||
    l.includes("diy-accreditation") ||
    l.includes("accreditation membership") ||
    l.includes("lab director") ||
    l.includes("lab admin") ||
    (l.includes("diy") && l.includes("accreditation"))
  );
}

/**
 * Returns the role to grant for a DIY product.
 * Lab Director / Admin tier → "diy_admin"; sonographer seat → "diy_user".
 */
function diyRoleForProduct(name: string): "diy_admin" | "diy_user" {
  const l = name.toLowerCase();
  if (l.includes("lab director") || l.includes("lab admin") || l.includes("admin")) {
    return "diy_admin";
  }
  return "diy_user";
}

/**
 * Returns true if the product name matches the iHeartEcho™ Free Membership.
 * This is the default membership granted to all new users who register via Thinkific.
 * Thinkific bundle: https://member.allaboutultrasound.com/bundles/free-membership
 */
function isFreeProduct(name: string | null | undefined): boolean {
  if (!name) return false;
  const l = name.toLowerCase();
  return (
    l.includes("free membership") ||
    l.includes("free-membership") ||
    (l.includes("iheartecho") && l.includes("free")) ||
    (l.includes("allaboutultrasound") && l.includes("free")) ||
    l === "free"
  );
}

/** Returns true if the product is relevant to iHeartEcho (premium, DIY, or free). */
function isRelevantProduct(name: string | null | undefined): boolean {
  return isPremiumProduct(name) || isDIYProduct(name) || isFreeProduct(name);
}

// ── Logger ───────────────────────────────────────────────────────────────────

async function logWebhookEvent(params: {
  resource: string;
  action: string;
  email?: string;
  productName?: string;
  httpStatus: number;
  outcome: "granted" | "revoked" | "pending_created" | "ignored" | "filtered" | "error";
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

// ── Route ────────────────────────────────────────────────────────────────────

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

      // ── Gate 1: Event type filter ─────────────────────────────────────────
      // Reject any event type not in the allowlist immediately — no DB work done.
      if (!isAllowedEvent(resource, action)) {
        const msg = `filtered: ${resource}.${action} is not in the iHeartEcho event allowlist`;
        console.log(`[Thinkific Webhook] ${msg}`);
        await logWebhookEvent({ resource, action, httpStatus: 200, outcome: "filtered", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg });
      }

      // ── 0. product.* events → trigger background catalog re-sync ──────────
      // These are catalog management events, not membership events.
      // Respond immediately and kick off a background sync.
      if (resource === "product") {
        const productPayload = payload as { id?: number; name?: string } | undefined;
        const productId = productPayload?.id;
        const allowedProductActions = ["created", "updated", "deleted"];
        if (!allowedProductActions.includes(action)) {
          const msg = `ignored: product.${action} is not a handled product action`;
          await logWebhookEvent({ resource, action, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }
        // Respond immediately — sync runs in background
        res.status(200).json({ ok: true, message: `product.${action} received — catalog sync queued`, productId });
        // Fire-and-forget catalog sync
        syncCatalogToDb().catch(err => {
          console.error("[Thinkific Webhook] Background catalog sync failed:", err);
        });
        return res;
      }

      // ── Gate 2: Product relevance filter ─────────────────────────────────
      // For all allowed events, extract the product name and reject irrelevant products.
      const p = payload as {
        product_name?: string;
        status?: string;
        user_id?: number;
        user_email?: string;
        user_name?: string;
        user?: { email?: string };
      } | undefined;

      const productName = (p?.product_name ?? "").trim();
      const userEmail = ((p?.user_email ?? p?.user?.email) ?? "").toLowerCase().trim();

      if (productName && !isRelevantProduct(productName)) {
        const msg = `filtered: "${productName}" is not an iHeartEcho membership product`;
        console.log(`[Thinkific Webhook] ${msg}`);
        await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "filtered", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg });
      }

      // ── 1. order.created → grant access ──────────────────────────────────
      if (resource === "order" && action === "created") {
        const orderStatus = (p?.status ?? "").toLowerCase();

        if (!isRelevantProduct(productName)) {
          const msg = `ignored: order for "${productName}" is not a relevant membership`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (orderStatus !== "complete") {
          const msg = `ignored: order status is "${orderStatus}", not "complete"`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (!userEmail) {
          const msg = "ignored: no user email in order payload";
          console.warn("[Thinkific Webhook] order.created: no user email in payload");
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        return await grantAccess({ resource, action, userEmail, productName, payload, res });
      }

      // ── 2. enrollment.created / enrollment.updated → grant access ─────────
      if (resource === "enrollment" && (action === "created" || action === "updated")) {
        const enrollStatus = ((p as any)?.activated ?? (p as any)?.status ?? "").toString().toLowerCase();

        // Only process active/completed enrollments
        if (enrollStatus && !["true", "active", "completed", "1"].includes(enrollStatus)) {
          const msg = `ignored: enrollment status "${enrollStatus}" is not active`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (!userEmail) {
          const msg = "ignored: no user email in enrollment payload";
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        return await grantAccess({ resource, action, userEmail, productName, payload, res });
      }

      // ── 3. subscription.activated → re-grant access ───────────────────────
      if (resource === "subscription" && action === "activated") {
        if (!userEmail) {
          const msg = "ignored: no user email in subscription.activated payload";
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }
        return await grantAccess({ resource, action, userEmail, productName, payload, res });
      }

      // ── 4. subscription.cancelled → revoke access ─────────────────────────
      if (resource === "subscription" && action === "cancelled") {
        if (!isRelevantProduct(productName)) {
          const msg = `ignored: subscription for "${productName}" is not a relevant membership`;
          await logWebhookEvent({ resource, action, email: userEmail || undefined, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (!userEmail) {
          const msg = "ignored: no user email in subscription.cancelled payload";
          console.warn("[Thinkific Webhook] subscription.cancelled: no user email in payload");
          await logWebhookEvent({ resource, action, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        console.log(`[Thinkific Webhook] subscription.cancelled — revoking access from ${userEmail} for "${productName}"`);

        const user = await getUserByEmail(userEmail);
        if (!user) {
          const msg = `user ${userEmail} not found — cannot revoke`;
          console.warn(`[Thinkific Webhook] ${msg}`);
          await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
          return res.status(200).json({ ok: true, message: msg });
        }

        if (isPremiumProduct(productName)) {
          await setPremiumStatus(user.id, false, "thinkific");
        } else if (isDIYProduct(productName)) {
          const role = diyRoleForProduct(productName);
          await removeRole(user.id, role);
        } else if (isFreeProduct(productName)) {
          // Free membership cancelled — basic user role is retained; no action needed.
          console.log(`[Thinkific Webhook] Free membership cancelled for ${userEmail} — no role changes required.`);
        }

        const msg = `access revoked from ${userEmail} (userId=${user.id}) for "${productName}"`;
        console.log(`[Thinkific Webhook] ${msg}`);
        await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "revoked", message: msg, rawPayload: payload });
        return res.status(200).json({ ok: true, message: msg, userId: user.id });
      }

      // ── Fallback (should not reach here given Gate 1) ─────────────────────
      const msg = `ignored: resource=${resource} action=${action}`;
      await logWebhookEvent({ resource, action, httpStatus: 200, outcome: "ignored", message: msg, rawPayload: payload });
      return res.status(200).json({ ok: true, message: msg });

    } catch (err) {
      console.error("[Thinkific Webhook] Error processing webhook:", err);
      return res.status(500).json({ ok: false, message: "internal error" });
    }
  });
}

// ── Shared grant helper ───────────────────────────────────────────────────────

async function grantAccess(params: {
  resource: string;
  action: string;
  userEmail: string;
  productName: string;
  payload: unknown;
  res: Response;
}): Promise<Response> {
  const { resource, action, userEmail, productName, payload, res } = params;

  console.log(`[Thinkific Webhook] ${resource}.${action} — granting access to ${userEmail} for "${productName}"`);

  const user = await getUserByEmail(userEmail);
  if (!user) {
    console.log(`[Thinkific Webhook] user ${userEmail} not found — creating pending account`);
    try {
      const pendingUserId = await createPendingUser(userEmail);
      if (isPremiumProduct(productName)) {
        await setPremiumStatus(pendingUserId, true, "thinkific");
      } else if (isDIYProduct(productName)) {
        const role = diyRoleForProduct(productName);
        await assignRole(pendingUserId, role, 0 /* system/webhook grant */);
      } else if (isFreeProduct(productName)) {
        // Free membership — ensure base "user" role is assigned and mark enrollment timestamp.
        // No email is sent — Thinkific handles all enrollment communications.
        await ensureUserRole(pendingUserId);
        await markThinkificEnrolled(pendingUserId);
        console.log(`[Thinkific Webhook] Free membership enrolled for ${userEmail} (userId=${pendingUserId}) — user role confirmed, thinkificEnrolledAt set.`);
      }
      const msg = `pending account created and access granted for ${userEmail} ("${productName}")`;
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

  if (isPremiumProduct(productName)) {
    await setPremiumStatus(user.id, true, "thinkific");
  } else if (isDIYProduct(productName)) {
    const role = diyRoleForProduct(productName);
    await assignRole(user.id, role, 0 /* system/webhook grant */);
  } else if (isFreeProduct(productName)) {
    // Free membership — ensure base "user" role is assigned and mark enrollment timestamp.
    // No email is sent — Thinkific handles all enrollment communications.
    await ensureUserRole(user.id);
    await markThinkificEnrolled(user.id);
    console.log(`[Thinkific Webhook] Free membership enrolled for ${userEmail} (userId=${user.id}) — user role confirmed, thinkificEnrolledAt set.`);
  }

  const msg = `access granted to ${userEmail} (userId=${user.id}) for "${productName}"`;
  console.log(`[Thinkific Webhook] ${msg}`);
  await logWebhookEvent({ resource, action, email: userEmail, productName, httpStatus: 200, outcome: "granted", message: msg, rawPayload: payload });
  return res.status(200).json({ ok: true, message: msg, userId: user.id });
}
