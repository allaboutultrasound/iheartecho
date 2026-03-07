import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserRoles,
  assignRole,
  removeRole,
  listUsersWithRoles,
  countUsers,
  getDiyUsersForLab,
  getLabByAdmin,
  findUserByEmailWithRoles,
  createPendingUser,
  countPendingUsers,
  type AppRole,
} from "../db";
import { syncCatalogToDb } from "./cmeRouter";
/** Send a welcome email to a pre-registered user via TinyEmail */
async function sendPreRegistrationWelcome(email: string, roles: string[]): Promise<void> {
  const apiKey = process.env.TINYEMAIL_API_KEY;
  const senderEmail = process.env.TINYEMAIL_SENDER_EMAIL || "noreply@iheartecho.com";
  const senderName = process.env.TINYEMAIL_SENDER_NAME || "iHeartEcho";
  const appUrl = process.env.VITE_APP_URL ?? "https://app.iheartecho.com";

  const roleLabels: Record<string, string> = {
    premium_user: "Premium Access",
    diy_user: "DIY Accreditation",
    diy_admin: "Lab Admin",
    platform_admin: "Platform Admin",
  };
  const roleList = roles
    .filter(r => roleLabels[r])
    .map(r => `<li style="margin:4px 0;color:#475569;">${roleLabels[r]}</li>`)
    .join("");

  const brandColor = "#189aa1";
  const brandDark = "#0e1e2e";
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0fbfc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbfc;padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,${brandDark} 0%,#0e4a50 60%,${brandColor} 100%);padding:28px 32px;text-align:center;">
<div style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">iHeartEcho™</div>
<div style="font-size:12px;color:#4ad9e0;margin-top:4px;">Echocardiography Clinical Companion</div>
</td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">Your iHeartEcho account is ready</h2>
<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">An administrator has set up an iHeartEcho account for you. You now have access to the clinical platform.</p>
${roleList ? `<div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${brandColor};">Your assigned access:</p><ul style="margin:0;padding-left:20px;font-size:14px;">${roleList}</ul></div>` : ""}
<div style="text-align:center;margin:28px 0;"><a href="${appUrl}/login" style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Sign In to iHeartEcho</a></div>
<p style="margin:0;font-size:13px;color:#94a3b8;">If you have questions, contact us at <a href="mailto:support@iheartecho.com" style="color:${brandColor};">support@iheartecho.com</a>.</p>
</td></tr>
<tr><td style="background:#f8fffe;border-top:1px solid #e5f7f8;padding:20px 32px;text-align:center;">
<p style="margin:0;font-size:12px;color:#94a3b8;">© All About Ultrasound · <a href="https://www.iheartecho.com" style="color:${brandColor};text-decoration:none;">www.iheartecho.com</a></p>
</td></tr></table></td></tr></table></body></html>`;

  if (!apiKey) {
    console.log(`[AdminEmail] Welcome email to ${email} (no TINYEMAIL_API_KEY set)`);
    return;
  }

  const res = await fetch("https://api.tinyemail.com/relay/v1/email/campaign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-RELAY-ACCESS-TOKEN": apiKey,
    },
    body: JSON.stringify({
      subject: "Your iHeartEcho account is ready",
      body: html,
      preview: "Your account has been set up — sign in to get started",
      sender: { from: { name: senderName, email: senderEmail }, replyTo: { name: senderName, email: senderEmail } },
      recipients: { to: [{ name: email, email }] },
      disableTrackingLinks: true,
    }),
  }).catch(err => { console.error("[AdminEmail] TinyEmail error:", err); return null; });

  if (res && !res.ok) {
    const text = await res.text();
    console.error(`[AdminEmail] TinyEmail error ${res.status}: ${text}`);
  }
}

// ─── Platform Admin Router ────────────────────────────────────────────────────
// Manages user roles and seat assignments for the iHeartEcho platform.
// Access: platform_admin role or owner (role === "admin")

export const platformAdminRouter = router({
   /** Check if current user is a platform admin */
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    return ctx.user.role === "admin" || roles.includes("platform_admin");
  }),

  /** Count pre-registered users who have not yet signed in */
  countPending: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    const isOwner = ctx.user.role === "admin";
    const isPlatformAdmin = roles.includes("platform_admin");
    if (!isOwner && !isPlatformAdmin) return 0;
    return countPendingUsers();
  }),

  /** List all users with their roles (paginated) */
  listUsers: protectedProcedure
    .input(z.object({
      limit: z.number().max(200).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const roles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
      }
      return listUsersWithRoles(input.limit, input.offset);
    }),

  /** Get total user count */
  userCount: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return countUsers();
  }),

  /** Get roles for a specific user */
  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !myRoles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getUserRoles(input.userId);
    }),

  /** Assign a role to a user */
  assignRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
      grantedByLabId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      const isOwner = ctx.user.role === "admin";
      const isPlatformAdmin = myRoles.includes("platform_admin");
      // Only owner can assign platform_admin role
      if (input.role === "platform_admin" && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can assign platform_admin" });
      }
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await assignRole(input.userId, input.role as AppRole, ctx.user.id, input.grantedByLabId);
      return { success: true };
    }),

  /** Remove a role from a user */
  removeRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      const isOwner = ctx.user.role === "admin";
      const isPlatformAdmin = myRoles.includes("platform_admin");
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Cannot remove the base "user" role
      if (input.role === "user") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove the base user role" });
      }
      await removeRole(input.userId, input.role as AppRole);
      return { success: true };
    }),

  /** Get my own roles */
  myRoles: protectedProcedure.query(async ({ ctx }) => {
    return getUserRoles(ctx.user.id);
  }),

  /**
   * Look up a user by email address.
   * Returns the user + their current roles, or null if not found.
   * Used by the "Add user by email" flow in Platform Admin.
   */
  findUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email("Please enter a valid email address") }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !myRoles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
      }
      const found = await findUserByEmailWithRoles(input.email);
      if (!found) return null;
      return {
        id: found.id,
        name: found.name,
        email: found.email,
        displayName: found.displayName,
        role: found.role,
        roles: found.roles,
        createdAt: found.createdAt,
        lastSignedIn: found.lastSignedIn,
        isPending: found.isPending,
      };
    }),

  /**
   * Bulk assign a role to multiple users by email.
   * Returns per-row results: success | already_assigned | not_found | error
   * Processes up to 500 emails per call.
   */
  bulkAssignRole: protectedProcedure
    .input(z.object({
      emails: z.array(z.string().email()).min(1).max(500),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      const isOwner = ctx.user.role === "admin";
      const isPlatformAdmin = myRoles.includes("platform_admin");
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
      }
      if (input.role === "platform_admin" && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can assign platform_admin" });
      }

      const results: Array<{
        email: string;
        status: "success" | "already_assigned" | "pre_registered" | "error";
        displayName?: string;
        message?: string;
      }> = [];

      for (const email of input.emails) {
        try {
          const found = await findUserByEmailWithRoles(email);
          if (!found) {
            // Pre-register: create stub account and assign role immediately
            const newId = await createPendingUser(email);
            await assignRole(newId, input.role as AppRole, ctx.user.id);
            results.push({ email, status: "pre_registered" as const, displayName: email });
            // Send welcome email asynchronously (don't block the response)
            sendPreRegistrationWelcome(email, [input.role]).catch(err =>
              console.error("[AdminEmail] Failed to send welcome email:", err)
            );
            continue;
          }
          if (found.roles.includes(input.role)) {
            results.push({ email, status: "already_assigned", displayName: found.displayName ?? found.name ?? undefined });
            continue;
          }
          await assignRole(found.id, input.role as AppRole, ctx.user.id);
          results.push({ email, status: "success", displayName: found.displayName ?? found.name ?? undefined });
        } catch (err) {
          results.push({ email, status: "error", message: err instanceof Error ? err.message : "Unknown error" });
        }
      }

      return {
        total: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        alreadyAssigned: results.filter(r => r.status === "already_assigned").length,
        preRegistered: results.filter(r => r.status === "pre_registered").length,
        errors: results.filter(r => r.status === "error").length,
        rows: results,
      };
    }),

  /**
   * Assign a role to a user looked up by email.
   * Convenience wrapper so the UI can do email → role in one step.
   */
  assignRoleByEmail: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      const isOwner = ctx.user.role === "admin";
      const isPlatformAdmin = myRoles.includes("platform_admin");
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.role === "platform_admin" && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can assign platform_admin" });
      }
      let found = await findUserByEmailWithRoles(input.email);
      let wasPreRegistered = false;
      if (!found) {
        // Pre-register: create a stub account and assign the role immediately
        const newId = await createPendingUser(input.email);
        await assignRole(newId, input.role as AppRole, ctx.user.id);
        wasPreRegistered = true;
        // Send welcome email asynchronously (don't block the response)
        sendPreRegistrationWelcome(input.email, [input.role]).catch(err =>
          console.error("[AdminEmail] Failed to send welcome email:", err)
        );
        return { success: true, userId: newId, displayName: input.email, wasPreRegistered };
      }
      await assignRole(found.id, input.role as AppRole, ctx.user.id);
      return { success: true, userId: found.id, displayName: found.displayName ?? found.name, wasPreRegistered: false };
    }),

  /**
   * Manually trigger a Thinkific course catalog re-sync.
   * Fetches all products from Thinkific, filters to the E-Learning & CME collection,
   * and upserts into the cmeCoursesCache table.
   * Returns the number of courses synced and the timestamp.
   */
  syncThinkificCourses: protectedProcedure.mutation(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    const isOwner = ctx.user.role === "admin";
    const isPlatformAdmin = myRoles.includes("platform_admin");
    if (!isOwner && !isPlatformAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
    }
    const count = await syncCatalogToDb();
    return { count, syncedAt: new Date() };
  }),

  /**
   * Manually trigger a Thinkific catalog re-sync for the Registry Review collection.
   * Same underlying sync as syncThinkificCourses — both collections share the same cache table.
   */
  syncRegistryCourses: protectedProcedure.mutation(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    const isOwner = ctx.user.role === "admin";
    const isPlatformAdmin = myRoles.includes("platform_admin");
    if (!isOwner && !isPlatformAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
    }
    const count = await syncCatalogToDb();
    return { count, syncedAt: new Date() };
  }),
});

// ─── Lab Seat Management Router ───────────────────────────────────────────────
// DIY Accreditation Tool seat management — controlled by diy_admin role

export const labSeatsRouter = router({
  /** List DIY users for the current admin's lab */
  listDiyUsers: protectedProcedure.query(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    if (!myRoles.includes("diy_admin") && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "DIY Admin access required" });
    }
    const lab = await getLabByAdmin(ctx.user.id);
    if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });
    return getDiyUsersForLab(lab.id);
  }),

  /** Assign a DIY user seat */
  assignSeat: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (!myRoles.includes("diy_admin") && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) throw new TRPCError({ code: "NOT_FOUND" });
      // Check seat limit from subscription
      const seatLimit = (lab as any).seatCount ?? 1;
      const currentSeats = await getDiyUsersForLab(lab.id);
      if (currentSeats.length >= seatLimit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Seat limit reached (${seatLimit} seats). Upgrade your subscription to add more users.`,
        });
      }
      await assignRole(input.userId, "diy_user", ctx.user.id, lab.id);
      return { success: true };
    }),

  /** Revoke a DIY user seat */
  revokeSeat: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (!myRoles.includes("diy_admin") && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await removeRole(input.userId, "diy_user");
      return { success: true };
    }),

  /**
   * Bulk assign DIY seats to multiple users by email.
   * Respects the lab's seat limit — stops and reports when limit is reached.
   * Returns per-row results: success | already_assigned | not_found | seat_limit_reached | error
   */
  bulkAssignSeat: protectedProcedure
    .input(z.object({
      emails: z.array(z.string().email()).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (!myRoles.includes("diy_admin") && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "DIY Admin access required" });
      }
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });

      const seatLimit = (lab as any).seatCount ?? 1;
      let currentSeats = await getDiyUsersForLab(lab.id);

      const results: Array<{
        email: string;
        status: "success" | "already_assigned" | "pre_registered" | "seat_limit_reached" | "error";
        displayName?: string;
        message?: string;
      }> = [];

      for (const email of input.emails) {
        // Re-check seat count each iteration
        if (currentSeats.length >= seatLimit) {
          results.push({ email, status: "seat_limit_reached", message: `Seat limit of ${seatLimit} reached` });
          continue;
        }
        try {
          const found = await findUserByEmailWithRoles(email);
          if (!found) {
            // Pre-register: create stub account and assign diy_user seat immediately
            const newId = await createPendingUser(email);
            await assignRole(newId, "diy_user", ctx.user.id, lab.id);
            currentSeats = [...currentSeats, { id: newId, email } as any];
            results.push({ email, status: "pre_registered" as const, displayName: email });
            continue;
          }
          if (found.roles.includes("diy_user")) {
            results.push({ email, status: "already_assigned", displayName: found.displayName ?? found.name ?? undefined });
            continue;
          }
          await assignRole(found.id, "diy_user", ctx.user.id, lab.id);
          // Increment local count to avoid extra DB round-trip
          currentSeats = [...currentSeats, found as any];
          results.push({ email, status: "success", displayName: found.displayName ?? found.name ?? undefined });
        } catch (err) {
          results.push({ email, status: "error", message: err instanceof Error ? err.message : "Unknown error" });
        }
      }

      return {
        total: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        alreadyAssigned: results.filter(r => r.status === "already_assigned").length,
        preRegistered: results.filter(r => r.status === "pre_registered").length,
        seatLimitReached: results.filter(r => r.status === "seat_limit_reached").length,
        errors: results.filter(r => r.status === "error").length,
        rows: results,
        seatUsage: { used: currentSeats.length, total: seatLimit },
      };
    }),

  /** Get seat usage for current lab */
  seatUsage: protectedProcedure.query(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    if (!myRoles.includes("diy_admin") && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const lab = await getLabByAdmin(ctx.user.id);
    if (!lab) return { used: 0, total: 0 };
    const seats = await getDiyUsersForLab(lab.id);
    return { used: seats.length, total: (lab as any).seatCount ?? 1 };
  }),
});
