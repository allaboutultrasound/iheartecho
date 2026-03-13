/**
 * emailCampaignRouter — Platform email campaigns and user interest preferences
 *
 * Procedures:
 *   user.getInterestPrefs       — get current user's interest preferences
 *   user.updateInterestPrefs    — update current user's interest preferences
 *   admin.listTemplates         — list all saved email templates
 *   admin.saveTemplate          — create or update an email template
 *   admin.deleteTemplate        — delete an email template
 *   admin.previewAudience       — count recipients matching a filter (dry-run)
 *   admin.sendCampaign          — send a campaign to filtered recipients
 *   admin.listCampaigns         — list sent/draft campaigns
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, like, or } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  emailTemplates,
  emailCampaigns,
  userRoles,
} from "../../drizzle/schema";
import { sendEmail } from "../_core/email";

// ─── Shared Zod schemas ───────────────────────────────────────────────────────

const InterestPrefsSchema = z.object({
  acs: z.boolean().default(false),
  adultEcho: z.boolean().default(false),
  pediatricEcho: z.boolean().default(false),
  fetalEcho: z.boolean().default(false),
});

const AudienceFilterSchema = z.object({
  /** Interest categories — only users who have at least one of these selected */
  interests: z.array(z.enum(["acs", "adultEcho", "pediatricEcho", "fetalEcho"])).default([]),
  /** App roles to filter by — empty means all roles */
  roles: z.array(z.string()).default([]),
  /** Subscription type: "all" | "premium" | "free" */
  subscriptionType: z.enum(["all", "premium", "free"]).default("all"),
  /** Specific email addresses — overrides all other filters when non-empty */
  specificEmails: z.array(z.string().email()).default([]),
});

// ─── Admin guard helper ───────────────────────────────────────────────────────

async function assertAdmin(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const adminRole = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.role, "platform_admin" as any),
      ),
    )
    .limit(1);
  // Also allow the DB role=admin users
  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const isAdmin = adminRole.length > 0 || user[0]?.role === "admin";
  if (!isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required." });
  }
}

// ─── Audience resolver ────────────────────────────────────────────────────────

async function resolveRecipients(
  filter: z.infer<typeof AudienceFilterSchema>,
): Promise<{ id: number; email: string; displayName: string | null; name: string | null }[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  // If specific emails are provided, use those directly
  if (filter.specificEmails.length > 0) {
    const results: { id: number; email: string; displayName: string | null; name: string | null }[] = [];
    for (const email of filter.specificEmails) {
      const found = await db
        .select({ id: users.id, email: users.email, displayName: users.displayName, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (found[0]?.email) {
        results.push(found[0] as any);
      }
    }
    return results;
  }

  // Fetch all users with emails
  let allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      name: users.name,
      isPremium: users.isPremium,
      interestPrefs: users.interestPrefs,
      isPending: users.isPending,
    })
    .from(users)
    .where(
      and(
        // Must have an email
        // Using a workaround since drizzle doesn't have isNotNull in this version
        eq(users.isPending, false),
      ),
    );

  // Filter out users without emails
  allUsers = allUsers.filter((u) => u.email && u.email.trim() !== "");

  // Apply subscription filter
  if (filter.subscriptionType === "premium") {
    allUsers = allUsers.filter((u) => u.isPremium);
  } else if (filter.subscriptionType === "free") {
    allUsers = allUsers.filter((u) => !u.isPremium);
  }

  // Apply role filter
  if (filter.roles.length > 0) {
    const roleUserIds = new Set<number>();
    for (const role of filter.roles) {
      const roleRows = await db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(eq(userRoles.role, role as any));
      roleRows.forEach((r) => roleUserIds.add(r.userId));
    }
    allUsers = allUsers.filter((u) => roleUserIds.has(u.id));
  }

  // Apply interest filter
  if (filter.interests.length > 0) {
    allUsers = allUsers.filter((u) => {
      if (!u.interestPrefs) return false; // no prefs set — exclude when filtering by interest
      try {
        const prefs = JSON.parse(u.interestPrefs) as Record<string, boolean>;
        return filter.interests.some((interest) => prefs[interest] === true);
      } catch {
        return false;
      }
    });
  }

  return allUsers.map((u) => ({
    id: u.id,
    email: u.email!,
    displayName: u.displayName,
    name: u.name,
  }));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const emailCampaignRouter = router({
  // ── User: interest preferences ────────────────────────────────────────────

  getInterestPrefs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [u] = await db
      .select({ interestPrefs: users.interestPrefs })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    if (!u?.interestPrefs) {
      return { acs: false, adultEcho: false, pediatricEcho: false, fetalEcho: false };
    }
    try {
      return InterestPrefsSchema.parse(JSON.parse(u.interestPrefs));
    } catch {
      return { acs: false, adultEcho: false, pediatricEcho: false, fetalEcho: false };
    }
  }),

  updateInterestPrefs: protectedProcedure
    .input(InterestPrefsSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(users)
        .set({ interestPrefs: JSON.stringify(input) })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  // ── Admin: email templates ────────────────────────────────────────────────

  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    await assertAdmin(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.updatedAt));
  }),

  saveTemplate: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(), // if provided, update; otherwise create
        name: z.string().min(1).max(200),
        subject: z.string().min(1).max(500),
        htmlBody: z.string().min(1),
        previewText: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      if (input.id) {
        await db
          .update(emailTemplates)
          .set({
            name: input.name,
            subject: input.subject,
            htmlBody: input.htmlBody,
            previewText: input.previewText ?? null,
          })
          .where(eq(emailTemplates.id, input.id));
        return { id: input.id };
      } else {
        const [result] = await db.insert(emailTemplates).values({
          createdByUserId: ctx.user.id,
          name: input.name,
          subject: input.subject,
          htmlBody: input.htmlBody,
          previewText: input.previewText ?? null,
        });
        return { id: (result as any).insertId as number };
      }
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id));
      return { success: true };
    }),

  // ── Admin: audience preview ───────────────────────────────────────────────

  previewAudience: protectedProcedure
    .input(AudienceFilterSchema)
    .query(async ({ ctx, input }) => {
      await assertAdmin(ctx.user.id);
      const recipients = await resolveRecipients(input);
      return {
        count: recipients.length,
        sampleEmails: recipients.slice(0, 5).map((r) => r.email),
      };
    }),

  // ── Admin: send campaign ──────────────────────────────────────────────────

  sendCampaign: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(500),
        htmlBody: z.string().min(1),
        previewText: z.string().max(300).optional(),
        audienceFilter: AudienceFilterSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAdmin(ctx.user.id);
      const db = await getDb();

      // Resolve recipients
      const recipients = await resolveRecipients(input.audienceFilter);
      if (recipients.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No recipients match the selected audience filters.",
        });
      }

      // Create campaign record
      const db2 = await getDb();
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db2.insert(emailCampaigns).values({
        sentByUserId: ctx.user.id,
        subject: input.subject,
        htmlBody: input.htmlBody,
        previewText: input.previewText ?? null,
        audienceFilter: JSON.stringify(input.audienceFilter),
        recipientCount: recipients.length,
        status: "sending",
      });
      const campaignId = (result as any).insertId as number;

      // Send emails (fire and forget — update status after)
      let sent = 0;
      let failed = 0;
      for (const recipient of recipients) {
        const displayName = recipient.displayName || recipient.name || recipient.email;
        const ok = await sendEmail({
          to: { name: displayName, email: recipient.email },
          subject: input.subject,
          htmlBody: input.htmlBody,
          previewText: input.previewText,
        });
        if (ok) sent++;
        else failed++;
      }

      // Update campaign status
      await db2
        .update(emailCampaigns)
        .set({
          status: failed === recipients.length ? "failed" : "sent",
          sentAt: new Date(),
          errorMessage:
            failed > 0
              ? `${failed} of ${recipients.length} emails failed to send.`
              : null,
        })
        .where(eq(emailCampaigns.id, campaignId));

      return {
        campaignId,
        sent,
        failed,
        total: recipients.length,
      };
    }),

  // ── Admin: list campaigns ─────────────────────────────────────────────────

  listCampaigns: protectedProcedure.query(async ({ ctx }) => {
    await assertAdmin(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(100);
  }),
});
