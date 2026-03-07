/**
 * Thinkific Webhook Handler
 *
 * Handles three categories of Thinkific webhook events:
 *
 * 1. product.* (created, updated, deleted)
 *    → Triggers a background CME catalog re-sync.
 *
 * 2. order.created
 *    → Grants iHeartEcho Premium Access when a user purchases the
 *      "iHeartEcho App Premium Access" membership.
 *    → If the user has no iHeartEcho account yet, creates a pending account
 *      with isPremium=true so premium is granted immediately on first login.
 *
 * 3. subscription.cancelled
 *    → Revokes iHeartEcho Premium Access when the user's subscription
 *      is cancelled.
 *
 * Setup in Thinkific:
 *   Admin → Settings → Webhooks → Add Webhook
 *   URL: https://your-domain.com/api/webhooks/thinkific
 *   Events: product.created, product.updated, product.deleted,
 *           order.created, subscription.cancelled
 */
import { Router, Request, Response } from "express";
import { syncCatalogToDb } from "../routers/cmeRouter";
import { getUserByEmail, setPremiumStatus, createPendingUser } from "../db";

/** Returns true if the Thinkific product name matches the iHeartEcho Premium Access membership */
function isPremiumProduct(productName: string | null | undefined): boolean {
  if (!productName) return false;
  const lower = productName.toLowerCase();
  return (
    lower.includes("iheartecho-app-premium-access") ||
    lower.includes("iheartecho app premium access") ||
    lower.includes("iheartecho premium access")
  );
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

      const { resource, action, payload } = body;

      // ── 1. Product events → CME catalog re-sync ──────────────────────────
      if (resource === "product") {
        if (!["created", "updated", "deleted"].includes(action ?? "")) {
          return res.status(200).json({ ok: true, message: `ignored: action=${action}` });
        }
        const p = payload as { id?: number; name?: string; status?: string } | undefined;
        console.log(
          `[Thinkific Webhook] product.${action} — id=${p?.id} name="${p?.name}" status=${p?.status}`
        );
        syncCatalogToDb()
          .then((count) => {
            console.log(`[Thinkific Webhook] Re-sync complete — ${count} products synced`);
          })
          .catch((err) => {
            console.error("[Thinkific Webhook] Re-sync failed:", err);
          });
        return res.status(200).json({
          ok: true,
          message: `product.${action} received — background sync triggered`,
          productId: p?.id,
        });
      }

      // ── 2. Order created → grant premium if it's the iHeartEcho membership ─
      if (resource === "order" && action === "created") {
        const p = payload as {
          product_name?: string;
          status?: string;
          user?: { email?: string; first_name?: string; last_name?: string; id?: number };
        } | undefined;

        const productName = p?.product_name ?? "";
        const userEmail = (p?.user?.email ?? "").toLowerCase().trim();
        const orderStatus = (p?.status ?? "").toLowerCase();

        if (!isPremiumProduct(productName)) {
          return res.status(200).json({
            ok: true,
            message: `ignored: order for "${productName}" is not the premium membership`,
          });
        }

        if (orderStatus !== "complete") {
          return res.status(200).json({
            ok: true,
            message: `ignored: order status is "${orderStatus}", not "complete"`,
          });
        }

        if (!userEmail) {
          console.warn("[Thinkific Webhook] order.created: no user email in payload");
          return res.status(200).json({ ok: true, message: "ignored: no user email" });
        }

        console.log(
          `[Thinkific Webhook] order.created — granting premium to ${userEmail} for "${productName}"`
        );

        const user = await getUserByEmail(userEmail);
        if (!user) {
          // User hasn't created an iHeartEcho account yet.
          // Create a pending account with isPremium=true so that when they
          // register or sign in with this email, premium is granted immediately.
          console.log(
            `[Thinkific Webhook] order.created: user ${userEmail} not found — creating pending premium account`
          );
          try {
            const pendingUserId = await createPendingUser(userEmail);
            await setPremiumStatus(pendingUserId, true, "thinkific");
            console.log(
              `[Thinkific Webhook] Pending premium account created for ${userEmail} (userId=${pendingUserId})`
            );
            return res.status(200).json({
              ok: true,
              message: `pending premium account created for ${userEmail}`,
              userId: pendingUserId,
            });
          } catch (createErr) {
            console.error(
              `[Thinkific Webhook] Failed to create pending premium account for ${userEmail}:`,
              createErr
            );
            return res.status(200).json({
              ok: true,
              message: `user ${userEmail} not found — could not create pending account`,
            });
          }
        }

        await setPremiumStatus(user.id, true, "thinkific");
        console.log(`[Thinkific Webhook] Premium granted to userId=${user.id} (${userEmail})`);

        return res.status(200).json({
          ok: true,
          message: `premium granted to ${userEmail}`,
          userId: user.id,
        });
      }

      // ── 3. Subscription cancelled → revoke premium ────────────────────────
      if (resource === "subscription" && action === "cancelled") {
        const p = payload as {
          product_name?: string;
          user?: { email?: string };
        } | undefined;

        const productName = p?.product_name ?? "";
        const userEmail = (p?.user?.email ?? "").toLowerCase().trim();

        if (!isPremiumProduct(productName)) {
          return res.status(200).json({
            ok: true,
            message: `ignored: subscription for "${productName}" is not the premium membership`,
          });
        }

        if (!userEmail) {
          console.warn("[Thinkific Webhook] subscription.cancelled: no user email in payload");
          return res.status(200).json({ ok: true, message: "ignored: no user email" });
        }

        console.log(
          `[Thinkific Webhook] subscription.cancelled — revoking premium from ${userEmail}`
        );

        const user = await getUserByEmail(userEmail);
        if (!user) {
          console.warn(
            `[Thinkific Webhook] subscription.cancelled: user ${userEmail} not found in DB`
          );
          return res.status(200).json({ ok: true, message: `user ${userEmail} not found` });
        }

        await setPremiumStatus(user.id, false, "thinkific");
        console.log(`[Thinkific Webhook] Premium revoked from userId=${user.id} (${userEmail})`);

        return res.status(200).json({
          ok: true,
          message: `premium revoked from ${userEmail}`,
          userId: user.id,
        });
      }

      // ── 4. All other events → ignore ──────────────────────────────────────
      return res.status(200).json({
        ok: true,
        message: `ignored: resource=${resource} action=${action}`,
      });
    } catch (err) {
      console.error("[Thinkific Webhook] Error processing webhook:", err);
      return res.status(500).json({ ok: false, message: "internal error" });
    }
  });
}
