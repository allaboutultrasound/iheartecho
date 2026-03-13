/**
 * Accreditation Manager Router
 *
 * Accessible by: platform_admin | accreditation_manager roles
 *
 * Capabilities:
 *  - List and drill into every DIY organization (seats, facility info, readiness, form submissions, analytics)
 *  - Manage full-service (non-DIY) managed accounts
 *  - Create user accounts without SuperAdmin (admin or accreditation_manager only)
 *  - Assign tasks (quality reviews or general) with email notification to assignee
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  managedAccounts,
  accreditationTasks,
  diyOrganizations,
  diySubscriptions,
  diyOrgMembers,
  users,
  userRoles,
  imageQualityReviews,
  physicianPeerReviews,
  echoCorrelations,
  caseMixSubmissions,
  accreditationReadiness,
  accreditationFormSubmissions,
} from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { getUserById, createPendingUser } from "../db";

// ─── Guard: platform_admin or accreditation_manager ──────────────────────────
async function assertAccreditationManager(ctx: { user: { id: number; role: string } }) {
  if (ctx.user.role === "admin") return; // owner always allowed
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const roles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, ctx.user.id));
  const roleList = roles.map((r) => r.role);
  if (!roleList.includes("platform_admin") && !roleList.includes("accreditation_manager")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accreditation Manager or Platform Admin access required" });
  }
}

// ─── Email helper: task assignment notification ───────────────────────────────
async function sendTaskAssignmentEmail(opts: {
  toName: string;
  toEmail: string;
  taskTitle: string;
  taskDescription: string | null;
  taskType: string;
  priority: string;
  dueDate: Date | null;
  assignedByName: string;
  facilityName: string;
}) {
  const dueDateStr = opts.dueDate
    ? new Date(opts.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "No due date set";

  const priorityColor: Record<string, string> = {
    urgent: "#dc2626",
    high: "#d97706",
    normal: "#2563eb",
    low: "#6b7280",
  };
  const pColor = priorityColor[opts.priority] ?? "#2563eb";

  const taskTypeLabels: Record<string, string> = {
    image_quality_review: "Image Quality Review",
    peer_review: "Physician Peer Review",
    echo_correlation: "Echo Correlation",
    case_mix_submission: "Case Mix Submission",
    readiness_checklist: "Readiness Checklist",
    document_upload: "Document Upload",
    facility_information: "Facility Information",
    general: "General Task",
  };
  const typeLabel = taskTypeLabels[opts.taskType] ?? opts.taskType;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0fbfc;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbfc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0e1e2e,#0e4a50);padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;font-family:Merriweather,Georgia,serif;">iHeartEcho™</p>
                <p style="margin:4px 0 0;font-size:13px;color:#4ad9e0;">Accreditation Task Assignment</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#1f2937;">Hi ${opts.toName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;">
            A new accreditation task has been assigned to you by <strong>${opts.assignedByName}</strong> for <strong>${opts.facilityName}</strong>.
          </p>
          <!-- Task card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${typeLabel}</p>
              <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;">${opts.taskTitle}</p>
              ${opts.taskDescription ? `<p style="margin:0 0 16px;font-size:13px;color:#4b5563;line-height:1.6;">${opts.taskDescription}</p>` : ""}
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:16px;">
                    <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;color:${pColor};background:${pColor}18;text-transform:capitalize;">${opts.priority} priority</span>
                  </td>
                  <td>
                    <span style="font-size:12px;color:#6b7280;">Due: <strong style="color:#111827;">${dueDateStr}</strong></span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.6;">
            Please log in to the iHeartEcho Accreditation Manager to view the full task details and mark it as complete when done.
          </p>
          <a href="https://app.iheartecho.com/accreditation-manager" style="display:inline-block;padding:12px 24px;background:#189aa1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">View Task</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© All About Ultrasound · iHeartEcho™ Accreditation Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: { name: opts.toName, email: opts.toEmail },
    subject: `[iHeartEcho] New Task Assigned: ${opts.taskTitle}`,
    htmlBody: html,
    previewText: `${opts.assignedByName} assigned you a ${typeLabel} task for ${opts.facilityName}`,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const accreditationManagerRouter = router({
  // ── DIY Org Drill-Down ──────────────────────────────────────────────────────

  /** List all DIY orgs with subscription and member count — for the org list view */
  listDiyOrgs: protectedProcedure.query(async ({ ctx }) => {
    await assertAccreditationManager(ctx);
    const db = await getDb();
    if (!db) return [];
    const orgs = await db
      .select({
        id: diyOrganizations.id,
        name: diyOrganizations.name,
        accreditationTypes: diyOrganizations.accreditationTypes,
      })
      .from(diyOrganizations)
      .orderBy(diyOrganizations.name);

    const results = await Promise.all(
      orgs.map(async (org) => {
        const [sub] = await db
          .select()
          .from(diySubscriptions)
          .where(eq(diySubscriptions.orgId, org.id))
          .limit(1);
        const [{ cnt }] = await db
          .select({ cnt: sql<number>`count(*)` })
          .from(diyOrgMembers)
          .where(eq(diyOrgMembers.orgId, org.id));
        return { org, subscription: sub ?? null, memberCount: Number(cnt) };
      })
    );
    return results;
  }),

  /** Get full detail for a single DIY org including members */
  getDiyOrgDetail: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [org] = await db.select().from(diyOrganizations).where(eq(diyOrganizations.id, input.orgId)).limit(1);
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      const [sub] = await db.select().from(diySubscriptions).where(eq(diySubscriptions.orgId, input.orgId)).limit(1);
      const members = await db
        .select({
          member: diyOrgMembers,
          user: {
            id: users.id,
            displayName: users.displayName,
            name: users.name,
            email: users.email,
            credentials: users.credentials,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(diyOrgMembers)
        .leftJoin(users, eq(diyOrgMembers.userId, users.id))
        .where(eq(diyOrgMembers.orgId, input.orgId))
        .orderBy(diyOrgMembers.diyRole);
      return { org, subscription: sub ?? null, members };
    }),

  /** Get analytics summary for a DIY org */
  getDiyOrgAnalytics: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) return null;
      // Get member user IDs for this org
      const memberRows = await db
        .select({ userId: diyOrgMembers.userId })
        .from(diyOrgMembers)
        .where(eq(diyOrgMembers.orgId, input.orgId));
      const userIds = memberRows.map((m) => m.userId).filter((id): id is number => id !== null && id !== undefined);
      if (userIds.length === 0) return { iqrCount: 0, peerReviewCount: 0, echoCorrelationCount: 0, caseMixCount: 0 };

      const [{ iqrCount }] = await db
        .select({ iqrCount: sql<number>`count(*)` })
        .from(imageQualityReviews)
        .where(inArray(imageQualityReviews.userId, userIds));
      const [{ peerReviewCount }] = await db
        .select({ peerReviewCount: sql<number>`count(*)` })
        .from(physicianPeerReviews)
        .where(inArray(physicianPeerReviews.userId, userIds));
      const [{ echoCorrelationCount }] = await db
        .select({ echoCorrelationCount: sql<number>`count(*)` })
        .from(echoCorrelations)
        .where(inArray(echoCorrelations.userId, userIds));
      const [{ caseMixCount }] = await db
        .select({ caseMixCount: sql<number>`count(*)` })
        .from(caseMixSubmissions)
        .where(inArray(caseMixSubmissions.submittedByUserId, userIds));
      // Readiness
      const readinessRows = await db
        .select()
        .from(accreditationReadiness)
        .where(inArray(accreditationReadiness.userId, userIds));
      // Form submissions
      const [{ formSubCount }] = await db
        .select({ formSubCount: sql<number>`count(*)` })
        .from(accreditationFormSubmissions)
        .where(eq(accreditationFormSubmissions.orgId, input.orgId));

      return {
        iqrCount: Number(iqrCount),
        peerReviewCount: Number(peerReviewCount),
        echoCorrelationCount: Number(echoCorrelationCount),
        caseMixCount: Number(caseMixCount),
        readinessRows,
        formSubCount: Number(formSubCount),
      };
    }),

  /** Update DIY org facility information */
  updateDiyOrgFacility: protectedProcedure
    .input(z.object({
      orgId: z.number(),
      name: z.string().min(1).optional(),
      accreditationTypes: z.string().optional(), // JSON array string
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { orgId, ...updates } = input;
      await db.update(diyOrganizations).set(updates).where(eq(diyOrganizations.id, orgId));
      return { success: true };
    }),

  /** Update DIY org subscription (seats, plan, status) */
  updateDiyOrgSubscription: protectedProcedure
    .input(z.object({
      orgId: z.number(),
      plan: z.enum(["starter", "professional", "advanced", "partner"]).optional(),
      status: z.enum(["active", "trialing", "past_due", "canceled", "paused"]).optional(),
      hasConcierge: z.boolean().optional(),
      totalSeats: z.number().min(1).optional(),
      labAdminSeats: z.number().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { orgId, ...updates } = input;
      const [existing] = await db.select().from(diySubscriptions).where(eq(diySubscriptions.orgId, orgId)).limit(1);
      if (existing) {
        await db.update(diySubscriptions).set({ ...updates, updatedAt: new Date() }).where(eq(diySubscriptions.orgId, orgId));
      } else {
        await db.insert(diySubscriptions).values({ orgId, plan: updates.plan ?? "starter", status: updates.status ?? "active", hasConcierge: updates.hasConcierge ?? false, totalSeats: updates.totalSeats ?? 5, labAdminSeats: updates.labAdminSeats ?? 1, memberSeats: (updates.totalSeats ?? 5) - (updates.labAdminSeats ?? 1) });
      }
      return { success: true };
    }),

  // ── Managed Accounts (Full-Service) ────────────────────────────────────────

  /** List all managed (full-service) accounts */
  listManagedAccounts: protectedProcedure.query(async ({ ctx }) => {
    await assertAccreditationManager(ctx);
    const db = await getDb();
    if (!db) return [];
    const accounts = await db
      .select({
        account: managedAccounts,
        manager: {
          id: users.id,
          displayName: users.displayName,
          name: users.name,
          email: users.email,
        },
      })
      .from(managedAccounts)
      .leftJoin(users, eq(managedAccounts.assignedManagerId, users.id))
      .orderBy(managedAccounts.facilityName);
    return accounts;
  }),

  /** Get a single managed account with tasks */
  getManagedAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [account] = await db
        .select()
        .from(managedAccounts)
        .where(eq(managedAccounts.id, input.accountId))
        .limit(1);
      if (!account) throw new TRPCError({ code: "NOT_FOUND" });
      const tasks = await db
        .select()
        .from(accreditationTasks)
        .where(eq(accreditationTasks.managedAccountId, input.accountId))
        .orderBy(desc(accreditationTasks.createdAt));
      return { account, tasks };
    }),

  /** Create a new managed account */
  createManagedAccount: protectedProcedure
    .input(z.object({
      facilityName: z.string().min(1),
      facilityType: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactTitle: z.string().optional(),
      accreditationTypes: z.string().optional(),
      accreditationBody: z.string().optional(),
      currentAccreditationStatus: z.enum(["not_started", "in_progress", "submitted", "accredited", "expired", "suspended"]).optional(),
      notes: z.string().optional(),
      assignedManagerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(managedAccounts).values({
        ...input,
        createdByUserId: ctx.user.id,
      });
      return { id: (result as any).insertId as number };
    }),

  /** Update a managed account */
  updateManagedAccount: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      facilityName: z.string().min(1).optional(),
      facilityType: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactTitle: z.string().optional(),
      accreditationTypes: z.string().optional(),
      accreditationBody: z.string().optional(),
      currentAccreditationStatus: z.enum(["not_started", "in_progress", "submitted", "accredited", "expired", "suspended"]).optional(),
      accreditationExpiry: z.date().optional(),
      notes: z.string().optional(),
      assignedManagerId: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { accountId, ...updates } = input;
      await db.update(managedAccounts).set(updates).where(eq(managedAccounts.id, accountId));
      return { success: true };
    }),

  // ── Account Creation (no SuperAdmin required) ───────────────────────────────

  /** Create a user account (pending) without requiring SuperAdmin — for managed account contacts */
  createManagedUser: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      displayName: z.string().min(1),
      credentials: z.string().optional(),
      role: z.enum(["diy_admin", "diy_user", "accreditation_manager"]).default("diy_user"),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check if user already exists
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      // Create pending user
      // Create pending user (basic stub — display name and credentials updated after)
      const userId = await createPendingUser(input.email);
      // Update display name and credentials
      await db.update(users).set({
        displayName: input.displayName,
        credentials: input.credentials,
      }).where(eq(users.id, userId));
      // Assign role
      await db.insert(userRoles).values({
        userId,
        role: input.role,
        assignedByUserId: ctx.user.id,
      });
      return { userId, success: true };
    }),

  // ── Task Assignment ─────────────────────────────────────────────────────────

  /** List tasks for a managed account or DIY org */
  listTasks: protectedProcedure
    .input(z.object({
      managedAccountId: z.number().optional(),
      diyOrgId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.managedAccountId) conditions.push(eq(accreditationTasks.managedAccountId, input.managedAccountId));
      if (input.diyOrgId) conditions.push(eq(accreditationTasks.diyOrgId, input.diyOrgId));
      if (conditions.length === 0) return [];
      const tasks = await db
        .select()
        .from(accreditationTasks)
        .where(and(...conditions))
        .orderBy(desc(accreditationTasks.createdAt));
      return tasks;
    }),

  /** Assign a new task with email notification */
  assignTask: protectedProcedure
    .input(z.object({
      managedAccountId: z.number().optional(),
      diyOrgId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      taskType: z.enum([
        "image_quality_review", "peer_review", "echo_correlation",
        "case_mix_submission", "readiness_checklist", "document_upload",
        "facility_information", "general",
      ]).default("general"),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      dueDate: z.date().optional(),
      assignedToUserId: z.number().optional(),
      assignedToEmail: z.string().email().optional(),
      assignedToName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      if (!input.managedAccountId && !input.diyOrgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must specify managedAccountId or diyOrgId" });
      }
      if (!input.assignedToUserId && !input.assignedToEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must specify assignedToUserId or assignedToEmail" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Resolve assignee details
      let assigneeName = input.assignedToName ?? "Team Member";
      let assigneeEmail = input.assignedToEmail ?? "";
      if (input.assignedToUserId && !assigneeEmail) {
        const assignee = await getUserById(input.assignedToUserId);
        if (!assignee) throw new TRPCError({ code: "NOT_FOUND", message: "Assignee user not found" });
        assigneeName = assignee.displayName ?? assignee.name ?? "Team Member";
        assigneeEmail = assignee.email ?? "";
      }

      // Resolve facility name for email
      let facilityName = "your facility";
      if (input.managedAccountId) {
        const [acct] = await db.select({ facilityName: managedAccounts.facilityName }).from(managedAccounts).where(eq(managedAccounts.id, input.managedAccountId)).limit(1);
        if (acct) facilityName = acct.facilityName;
      } else if (input.diyOrgId) {
        const [org] = await db.select({ name: diyOrganizations.name }).from(diyOrganizations).where(eq(diyOrganizations.id, input.diyOrgId)).limit(1);
        if (org) facilityName = org.name;
      }

      // Resolve assigner name
      const assigner = await getUserById(ctx.user.id);
      const assignerName = assigner?.displayName ?? assigner?.name ?? "Accreditation Manager";

      // Insert task
      const [result] = await db.insert(accreditationTasks).values({
        managedAccountId: input.managedAccountId,
        diyOrgId: input.diyOrgId,
        title: input.title,
        description: input.description,
        taskType: input.taskType,
        priority: input.priority,
        dueDate: input.dueDate,
        assignedToUserId: input.assignedToUserId,
        assignedToEmail: assigneeEmail || null,
        assignedToName: assigneeName,
        assignedByUserId: ctx.user.id,
        status: "pending",
        emailStatus: "not_sent",
      });
      const taskId = (result as any).insertId as number;

      // Send email notification
      let emailSent = false;
      if (assigneeEmail) {
        emailSent = await sendTaskAssignmentEmail({
          toName: assigneeName,
          toEmail: assigneeEmail,
          taskTitle: input.title,
          taskDescription: input.description ?? null,
          taskType: input.taskType,
          priority: input.priority,
          dueDate: input.dueDate ?? null,
          assignedByName: assignerName,
          facilityName,
        });
        await db.update(accreditationTasks).set({
          emailStatus: emailSent ? "sent" : "failed",
          emailSentAt: emailSent ? new Date() : undefined,
        }).where(eq(accreditationTasks.id, taskId));
      }

      return { taskId, emailSent, success: true };
    }),

  /** Update task status */
  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "overdue", "cancelled"]),
      completionNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(accreditationTasks).set({
        status: input.status,
        completionNotes: input.completionNotes,
        completedAt: input.status === "completed" ? new Date() : undefined,
      }).where(eq(accreditationTasks.id, input.taskId));
      return { success: true };
    }),

  /** Delete a task */
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccreditationManager(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(accreditationTasks).where(eq(accreditationTasks.id, input.taskId));
      return { success: true };
    }),

  /** List all accreditation managers (for assignment dropdowns) */
  listManagers: protectedProcedure.query(async ({ ctx }) => {
    await assertAccreditationManager(ctx);
    const db = await getDb();
    if (!db) return [];
    const managers = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        name: users.name,
        email: users.email,
        credentials: users.credentials,
        role: userRoles.role,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(
        sql`${userRoles.role} IN ('platform_admin', 'accreditation_manager')`
      )
      .orderBy(users.displayName);
    return managers;
  }),
});
