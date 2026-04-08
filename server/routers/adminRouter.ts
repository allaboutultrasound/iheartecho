import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { count } from "drizzle-orm";
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
  cleanupUserRolesDb,
  generateWelcomeMagicLink,
  getUserById,
  type AppRole,
  type UserTypeFilter,
} from "../db";
import { syncCatalogToDb } from "./cmeRouter";
import { sendEmail, buildWelcomeEmail, buildWelcomeWithMagicLinkEmail } from "../_core/email";

/** Send a branded welcome email to a pre-registered user via SendGrid */
async function sendPreRegistrationWelcome(email: string, roles: string[]): Promise<void> {
  const appUrl = process.env.VITE_APP_URL ?? "https://app.iheartecho.com";
  const payload = buildWelcomeEmail({
    firstName: email.split("@")[0], // best-effort first name from email
    loginUrl: `${appUrl}/login`,
    roles,
  });
  const sent = await sendEmail({
    to: { name: email, email },
    subject: payload.subject,
    htmlBody: payload.htmlBody,
    previewText: payload.previewText,
  });
  if (!sent) {
    console.warn(`[AdminEmail] Welcome email to ${email} could not be sent (SendGrid unavailable)`);
  }
}

// ─── Platform Admin Router ────────────────────────────────────────────────────
// Manages user roles and seat assignments for the iHeartEcho™ platform.
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

  /** List all users with their roles (paginated, with optional search and type filter) */
  listUsers: protectedProcedure
    .input(z.object({
      limit: z.number().default(0), // 0 = fetch all (no limit)
      offset: z.number().default(0),
      search: z.string().optional().default(''),
      userType: z.enum(['all','pending','active','premium','diy_admin','diy_user','platform_admin','free']).optional().default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const roles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
      }
      return listUsersWithRoles(input.limit, input.offset, input.userType as UserTypeFilter, input.search);
    }),

  /** Get total user count */
  userCount: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return countUsers();
  }),

  /**
   * Get accurate platform stats server-side.
   * DIY counts exclude demo/seeded users (isDemo=true).
   */
  getPlatformStats: protectedProcedure.query(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    if (ctx.user.role !== "admin" && !myRoles.includes("platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const { getDb } = await import("../db");
    const { users, userRoles } = await import("../../drizzle/schema");
    const { eq, and, ne } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return { totalUsers: 0, premiumUsers: 0, diyAdmins: 0, diyUsers: 0 };

    // Total users (all, including demo)
    const totalResult = await db.select({ total: count() }).from(users);
    const totalUsers = totalResult[0]?.total ?? 0;

    // Premium users — count userRoles rows with premium_user role (non-demo)
    const premiumRows = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(userRoles.role, "premium_user"), eq(users.isDemo, false)));
    const premiumUsers = premiumRows.length;

    // DIY Admins — exclude demo users
    const diyAdminRows = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(userRoles.role, "diy_admin"), eq(users.isDemo, false)));
    const diyAdmins = diyAdminRows.length;

    // DIY Users — exclude demo users
    const diyUserRows = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(userRoles.role, "diy_user"), eq(users.isDemo, false)));
    const diyUsers = diyUserRows.length;

    return { totalUsers, premiumUsers, diyAdmins, diyUsers };
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
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin", "accreditation_manager", "education_manager", "education_admin", "education_student"]),
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
      // Only platform_admin (or owner) can assign accreditation_manager role
      if (input.role === "accreditation_manager" && !isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform admin can assign the Accreditation Manager role" });
      }
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await assignRole(input.userId, input.role as AppRole, ctx.user.id, input.grantedByLabId);

      // Auto-send premium welcome email when premium_user role is manually assigned
      if (input.role === "premium_user") {
        try {
          const targetUser = await getUserById(input.userId);
          if (targetUser?.email) {
            const magicUrl = await generateWelcomeMagicLink(input.userId);
            const firstName = targetUser.name?.split(" ")[0] || targetUser.email.split("@")[0];
            const userRoles = await getUserRoles(input.userId);
            const { subject, htmlBody, previewText } = buildWelcomeWithMagicLinkEmail({
              firstName,
              magicUrl,
              membershipLabel: "Premium Access",
              roles: userRoles,
            });
            await sendEmail({
              to: { name: targetUser.name || firstName, email: targetUser.email },
              subject,
              htmlBody,
              previewText,
            });
            console.log(`[Admin] Premium welcome email sent to ${targetUser.email}`);
          }
        } catch (emailErr) {
          // Non-fatal: role was assigned successfully, email failure should not block the response
          console.error(`[Admin] Failed to send premium welcome email for userId ${input.userId}:`, emailErr);
        }
      }

      return { success: true };
    }),

  /** Remove a role from a user */
  removeRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin", "accreditation_manager", "education_manager", "education_admin", "education_student"]),
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
      // Only platform_admin (or owner) can remove accreditation_manager role
      if (input.role === "accreditation_manager" && !isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform admin can remove the Accreditation Manager role" });
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
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin", "accreditation_manager", "education_manager", "education_admin", "education_student"]),
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
      if (input.role === "accreditation_manager" && !isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform admin can assign the Accreditation Manager role" });
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
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin", "accreditation_manager", "education_manager", "education_admin", "education_student"]),
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
      if (input.role === "accreditation_manager" && !isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform admin can assign the Accreditation Manager role" });
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

  /**
   * Clean up duplicate and missing user roles.
   * - Removes duplicate 'user' role entries (keeps the lowest id)
   * - Backfills missing 'user' role for all non-pending accounts
   * Returns counts of deduped and backfilled rows.
   */
  cleanupUserRoles: protectedProcedure.mutation(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    const isOwner = ctx.user.role === "admin";
    const isPlatformAdmin = myRoles.includes("platform_admin");
    if (!isOwner && !isPlatformAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
    }
    return cleanupUserRolesDb();
  }),

  /**
   * Bulk backfill: fetch all users from Thinkific and create iHeartEcho accounts
   * for anyone not already registered. Runs silently (no emails sent).
   * Returns counts of created, skipped (already existed), and errors.
   */
  syncAllThinkificMembers: protectedProcedure.mutation(async ({ ctx }) => {
    const myRoles = await getUserRoles(ctx.user.id);
    const isOwner = ctx.user.role === "admin";
    const isPlatformAdmin = myRoles.includes("platform_admin");
    if (!isOwner && !isPlatformAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
    }

    const { getAllThinkificUsers } = await import("../thinkific");
    const { findUserByEmail, ensureUserRole } = await import("../db");

    const thinkificUsers = await getAllThinkificUsers();
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tUser of thinkificUsers) {
      if (!tUser.email) { errors++; continue; }
      try {
        const existing = await findUserByEmail(tUser.email);
        if (existing) {
          await ensureUserRole(existing.id);
          skipped++;
        } else {
          const newId = await createPendingUser(tUser.email);
          await ensureUserRole(newId);
          created++;
        }
      } catch (err) {
        console.error(`[SyncThinkific] Error processing ${tUser.email}:`, err);
        errors++;
      }
    }

    console.log(`[SyncThinkific] Bulk sync complete: ${created} created, ${skipped} skipped, ${errors} errors out of ${thinkificUsers.length} Thinkific users`);
    return { total: thinkificUsers.length, created, skipped, errors, syncedAt: new Date() };
  }),

  /**
   * Backfill: find all users with isPremium=true but no premium_user row in userRoles,
   * and insert the missing role rows. Fixes users whose premium was granted via the old
   * setPremiumStatus path (which only updated the users table, not userRoles).
   * Returns count of rows inserted.
   */
  backfillPremiumRoles: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const { getDb } = await import("../db");
    const { users, userRoles } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return { inserted: 0, emails: [] as string[] };
    // Find all users with isPremium=true
    const premiumUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.isPremium, true));
    let inserted = 0;
    const emails: string[] = [];
    for (const u of premiumUsers) {
      const existing = await db
        .select({ id: userRoles.id })
        .from(userRoles)
        .where(and(eq(userRoles.userId, u.id), eq(userRoles.role, "premium_user")))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(userRoles).values({
          userId: u.id,
          role: "premium_user",
          assignedByUserId: 0,
          grantedByLabId: null,
        });
        inserted++;
        emails.push(u.email ?? `userId:${u.id}`);
      }
    }
    console.log(`[Admin] backfillPremiumRoles: inserted ${inserted} missing premium_user role rows for: ${emails.join(", ") || "none"}`);    return { inserted, emails };
  }),

  /**
   * Find all user rows sharing the same email (case-insensitive).
   * Returns the list of matching rows with their roles, so the admin
   * can choose which row to keep as the survivor.
   */
  findDuplicatesByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !myRoles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await import("../db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { users, userRoles } = await import("../../drizzle/schema");
      const { sql, eq } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${input.email})`);
      if (rows.length === 0) return { rows: [] };
      const allRoles = await db
        .select()
        .from(userRoles)
        .where(
          rows.length === 1
            ? eq(userRoles.userId, rows[0].id)
            : sql`${userRoles.userId} IN (${sql.join(rows.map(r => sql`${r.id}`), sql`, `)})`
        );
      const rolesByUser = allRoles.reduce<Record<number, string[]>>((acc, r) => {
        if (!acc[r.userId]) acc[r.userId] = [];
        acc[r.userId].push(r.role);
        return acc;
      }, {});
      return {
        rows: rows.map(r => ({
          id: r.id,
          email: r.email,
          name: r.name,
          isPending: r.isPending,
          openId: r.openId,
          createdAt: r.createdAt,
          lastSignedIn: r.lastSignedIn,
          roles: rolesByUser[r.id] ?? [],
        })),
      };
    }),

  /**
   * Merge duplicate user accounts.
   * Keeps survivorId, reassigns all data from duplicateIds to survivorId,
   * then deletes the duplicate rows.
   */
  mergeUsers: protectedProcedure
    .input(z.object({
      survivorId: z.number().int().positive(),
      duplicateIds: z.array(z.number().int().positive()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const myRoles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !myRoles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.duplicateIds.includes(input.survivorId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "survivorId cannot be in duplicateIds" });
      }
      const db = await import("../db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const schema = await import("../../drizzle/schema");
      const { sql, eq, inArray } = await import("drizzle-orm");
      const dupIds = input.duplicateIds;
      const userIdTables = [
        schema.userRoles, schema.peerReviews, schema.qaLogs, schema.appropriateUseCases,
        schema.echoCases, schema.strainSnapshots, schema.imageQualityReviews,
        schema.echoCorrelations, schema.physicianPeerReviews, schema.accreditationReadiness,
        schema.accreditationReadinessNavigator, schema.cmeEnrollmentCache,
        schema.quickfireAttempts, schema.echoLibraryCaseAttempts, schema.educatorOrgMembers,
        schema.educatorStudentProgress, schema.educatorStudentCompetencies,
        schema.educatorQuizAttempts, schema.userPointsLog, schema.caseViewEvents,
        schema.soundByteDiscussions, schema.soundByteDiscussionReplies, schema.soundByteViews,
      ] as any[];
      const singletonTables = [schema.userPointsTotals] as any[];
      let tablesUpdated = 0;
      for (const table of userIdTables) {
        try {
          await db.update(table).set({ userId: input.survivorId }).where(inArray((table as any).userId, dupIds));
          tablesUpdated++;
        } catch (_e) { /* ignore dup key */ }
      }
      for (const table of singletonTables) {
        await db.delete(table).where(inArray((table as any).userId, dupIds));
      }
      try { await db.update(schema.labMembers).set({ userId: input.survivorId }).where(inArray(schema.labMembers.userId, dupIds)); } catch (_e) { /* ignore */ }
      try { await db.update(schema.diyOrgMembers).set({ userId: input.survivorId }).where(inArray(schema.diyOrgMembers.userId, dupIds)); } catch (_e) { /* ignore */ }
      try {
        const accreditationChecklist = (schema as any).accreditationChecklist;
        if (accreditationChecklist) {
          await db.update(accreditationChecklist).set({ userId: input.survivorId }).where(inArray(accreditationChecklist.userId, dupIds));
        }
      } catch (_e) { /* ignore */ }
      await db.delete(schema.userRoles).where(inArray(schema.userRoles.userId, dupIds));
      const deleteResult = await db.delete(schema.users).where(inArray(schema.users.id, dupIds));
      return {
        survivorId: input.survivorId,
        deletedIds: dupIds,
        tablesUpdated,
        rowsDeleted: (deleteResult as any).affectedRows ?? dupIds.length,
      };
    }),
});

// ─── Lab Seat Management Routerr ───────────────────────────────────────────────
// DIY Accreditation Tool™ seat management — controlled by diy_admin role

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

  /** One-time cleanup: deduplicate userRoles and backfill missing 'user' roles */
  cleanupUserRoles: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Owner only" });
    }
    return cleanupUserRolesDb();
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
