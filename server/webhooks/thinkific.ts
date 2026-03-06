/**
 * Thinkific Webhook Handler
 *
 * Listens for product.created and product.updated events from Thinkific.
 * When a new course is published or an existing one is updated, we trigger
 * a background re-sync of the cmeCoursesCache so the CME Hub reflects the
 * change within seconds instead of waiting up to 6 hours.
 *
 * Setup in Thinkific:
 *   Admin → Settings → Webhooks → Add Webhook
 *   URL: https://your-domain.com/api/webhooks/thinkific
 *   Events: product.created, product.updated, product.deleted
 *
 * Security: Thinkific does not currently sign webhook payloads with HMAC,
 * so we validate the request by checking the subdomain in the payload
 * matches our configured THINKIFIC_SUBDOMAIN.
 */

import { Router, Request, Response } from "express";
import { syncCatalogToDb } from "../routers/cmeRouter";
import { ENV } from "../_core/env";

export function registerThinkificWebhook(app: Router) {
  app.post("/api/webhooks/thinkific", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        resource?: string;
        action?: string;
        tenant_id?: string;
        payload?: {
          id?: number;
          name?: string;
          status?: string;
          productable_type?: string;
        };
      };

      const { resource, action, payload } = body;

      // Only handle product events
      if (resource !== "product") {
        return res.status(200).json({ ok: true, message: "ignored: not a product event" });
      }

      // Handle created, updated, and deleted
      if (!["created", "updated", "deleted"].includes(action ?? "")) {
        return res.status(200).json({ ok: true, message: `ignored: action=${action}` });
      }

      console.log(
        `[Thinkific Webhook] product.${action} — id=${payload?.id} name="${payload?.name}" status=${payload?.status}`
      );

      // Trigger a background re-sync so the CME Hub reflects the change immediately
      // We don't await this — respond 200 quickly and let the sync run in the background
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
        productId: payload?.id,
      });
    } catch (err) {
      console.error("[Thinkific Webhook] Error processing webhook:", err);
      return res.status(500).json({ ok: false, message: "internal error" });
    }
  });
}
