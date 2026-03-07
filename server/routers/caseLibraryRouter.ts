/**
 * caseLibraryRouter.ts
 * tRPC procedures for the Echo Case Library engine.
 *
 * Public:
 *   listCases        — paginated list of approved cases (with filters)
 *   getCase          — full case detail with media and questions
 *
 * Protected (any logged-in user):
 *   submitCase       — submit a new case (pending approval)
 *   submitAttempt    — record answers for a case's questions
 *   getUserSubmissions — list own submitted cases
 *   uploadMedia      — get a presigned S3 upload URL for a media file
 *
 * Admin-only:
 *   listPendingCases  — review queue of pending cases
 *   approveCase       — approve a pending case
 *   rejectCase        — reject with reason
 *   adminCreateCase   — create a case directly (auto-approved)
 *   adminUpdateCase   — edit any case
 *   adminDeleteCase   — hard delete a case and its media
 *   listAllCases      — paginated list of all cases for admin management
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  echoLibraryCases,
  echoLibraryCaseMedia,
  echoLibraryCaseQuestions,
  echoLibraryCaseAttempts,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, sql, count, like, or } from "drizzle-orm";
import { storagePut } from "../storage";

// ─── Admin guard ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Input schemas ────────────────────────────────────────────────────────────
const caseInputSchema = z.object({
  title: z.string().min(5).max(300),
  summary: z.string().min(10).max(5000),
  clinicalHistory: z.string().max(5000).optional(),
  diagnosis: z.string().max(300).optional(),
  teachingPoints: z.array(z.string().max(500)).max(10).optional(),
  modality: z.enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  hipaaAcknowledged: z.boolean(),
  // Embedded media (already uploaded to S3)
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: z.string().url(),
        fileKey: z.string().max(500),
        caption: z.string().max(300).optional(),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .max(20)
    .default([]),
  // Embedded MCQ questions
  questions: z
    .array(
      z.object({
        question: z.string().min(5).max(2000),
        options: z.array(z.string().min(1)).min(2).max(6),
        correctAnswer: z.number().int().min(0),
        explanation: z.string().max(2000).optional(),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .max(10)
    .default([]),
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const caseLibraryRouter = router({
  /** Paginated list of approved cases */
  listCases: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(12),
        modality: z
          .enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"])
          .optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        search: z.string().max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [eq(echoLibraryCases.status, "approved")];

      if (input.modality) conditions.push(eq(echoLibraryCases.modality, input.modality));
      if (input.difficulty) conditions.push(eq(echoLibraryCases.difficulty, input.difficulty));
      if (input.search) {
        conditions.push(
          or(
            like(echoLibraryCases.title, `%${input.search}%`),
            like(echoLibraryCases.summary, `%${input.search}%`),
            like(echoLibraryCases.diagnosis, `%${input.search}%`)
          )
        );
      }

      const where = and(...conditions);

      const [cases, totalResult] = await Promise.all([
        db
          .select({
            id: echoLibraryCases.id,
            title: echoLibraryCases.title,
            summary: echoLibraryCases.summary,
            diagnosis: echoLibraryCases.diagnosis,
            modality: echoLibraryCases.modality,
            difficulty: echoLibraryCases.difficulty,
            tags: echoLibraryCases.tags,
            viewCount: echoLibraryCases.viewCount,
            submittedAt: echoLibraryCases.submittedAt,
            isAdminSubmission: echoLibraryCases.isAdminSubmission,
          })
          .from(echoLibraryCases)
          .where(where)
          .orderBy(desc(echoLibraryCases.submittedAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: count(echoLibraryCases.id) })
          .from(echoLibraryCases)
          .where(where),
      ]);

      // Attach thumbnail (first image media per case)
      const caseIds = cases.map((c) => c.id);
      let thumbnails: Record<number, string> = {};
      if (caseIds.length > 0) {
        const media = await db
          .select({ caseId: echoLibraryCaseMedia.caseId, url: echoLibraryCaseMedia.url })
          .from(echoLibraryCaseMedia)
          .where(
            and(
              sql`${echoLibraryCaseMedia.caseId} IN (${caseIds.join(",")})`,
              eq(echoLibraryCaseMedia.type, "image")
            )
          )
          .orderBy(echoLibraryCaseMedia.sortOrder);
        for (const m of media) {
          if (!thumbnails[m.caseId]) thumbnails[m.caseId] = m.url;
        }
      }

      return {
        cases: cases.map((c) => ({
          ...c,
          tags: c.tags ? JSON.parse(c.tags) : [],
          thumbnail: thumbnails[c.id] ?? null,
        })),
        total: totalResult[0]?.count ?? 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  /** Full case detail with media and questions (increments view count) */
  getCase: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [caseRow] = await db
        .select()
        .from(echoLibraryCases)
        .where(eq(echoLibraryCases.id, input.id))
        .limit(1);

      if (!caseRow) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      if (caseRow.status !== "approved" && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      }

      // Increment view count (fire-and-forget)
      db.update(echoLibraryCases)
        .set({ viewCount: sql`${echoLibraryCases.viewCount} + 1` })
        .where(eq(echoLibraryCases.id, input.id))
        .catch(() => {});

      const [media, questions] = await Promise.all([
        db
          .select()
          .from(echoLibraryCaseMedia)
          .where(eq(echoLibraryCaseMedia.caseId, input.id))
          .orderBy(echoLibraryCaseMedia.sortOrder),
        db
          .select()
          .from(echoLibraryCaseQuestions)
          .where(eq(echoLibraryCaseQuestions.caseId, input.id))
          .orderBy(echoLibraryCaseQuestions.sortOrder),
      ]);

      // Fetch submitter display name
      const [submitter] = await db
        .select({ displayName: users.displayName, name: users.name })
        .from(users)
        .where(eq(users.id, caseRow.submittedByUserId))
        .limit(1);

      // If authenticated, check if user has attempted this case
      let userAttempt = null;
      if (ctx.user) {
        const [attempt] = await db
          .select()
          .from(echoLibraryCaseAttempts)
          .where(
            and(
              eq(echoLibraryCaseAttempts.userId, ctx.user.id),
              eq(echoLibraryCaseAttempts.caseId, input.id)
            )
          )
          .limit(1);
        userAttempt = attempt ?? null;
      }

      return {
        ...caseRow,
        tags: caseRow.tags ? JSON.parse(caseRow.tags) : [],
        teachingPoints: caseRow.teachingPoints ? JSON.parse(caseRow.teachingPoints) : [],
        media,
        questions: questions.map((q) => ({
          ...q,
          options: JSON.parse(q.options),
        })),
        submitterName: submitter?.displayName || submitter?.name || "Anonymous",
        userAttempt: userAttempt
          ? {
              answers: userAttempt.answers ? JSON.parse(userAttempt.answers) : {},
              score: userAttempt.score,
              totalQuestions: userAttempt.totalQuestions,
            }
          : null,
      };
    }),

  /** Submit a new case (requires HIPAA acknowledgement) */
  submitCase: protectedProcedure
    .input(caseInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      if (!input.hipaaAcknowledged) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must acknowledge the HIPAA/PHI policy before submitting",
        });
      }

      const isAdmin = ctx.user.role === "admin";

      const [result] = await db.insert(echoLibraryCases).values({
        title: input.title,
        summary: input.summary,
        clinicalHistory: input.clinicalHistory ?? null,
        diagnosis: input.diagnosis ?? null,
        teachingPoints: input.teachingPoints ? JSON.stringify(input.teachingPoints) : null,
        modality: input.modality,
        difficulty: input.difficulty,
        tags: JSON.stringify(input.tags),
        status: isAdmin ? "approved" : "pending",
        isAdminSubmission: isAdmin,
        submittedByUserId: ctx.user.id,
        hipaaAcknowledged: input.hipaaAcknowledged,
      });

      const caseId = (result as any).insertId as number;

      // Insert media
      if (input.media.length > 0) {
        await db.insert(echoLibraryCaseMedia).values(
          input.media.map((m) => ({
            caseId,
            type: m.type,
            url: m.url,
            fileKey: m.fileKey,
            caption: m.caption ?? null,
            sortOrder: m.sortOrder,
          }))
        );
      }

      // Insert questions
      if (input.questions.length > 0) {
        await db.insert(echoLibraryCaseQuestions).values(
          input.questions.map((q) => ({
            caseId,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            sortOrder: q.sortOrder,
          }))
        );
      }

      return {
        caseId,
        status: isAdmin ? "approved" : "pending",
        message: isAdmin
          ? "Case published successfully"
          : "Case submitted for review. It will appear in the library once approved.",
      };
    }),

  /** Get a presigned S3 upload URL for case media */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().max(255),
        contentType: z.string().max(100),
        mediaType: z.enum(["image", "video"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ext = input.filename.split(".").pop() ?? "bin";
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const fileKey = `case-media/${ctx.user.id}/${Date.now()}-${randomSuffix}.${ext}`;

      // Upload a placeholder to get the URL (actual upload happens from client via presigned URL)
      // For now return the key so client can POST to /api/upload-media
      return { fileKey, uploadEndpoint: "/api/upload-media" };
    }),

  /** Record a user's answers for a case */
  submitAttempt: protectedProcedure
    .input(
      z.object({
        caseId: z.number().int().positive(),
        answers: z.record(z.string(), z.number().int().min(0)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Verify case exists and is approved
      const [caseRow] = await db
        .select({ id: echoLibraryCases.id, status: echoLibraryCases.status })
        .from(echoLibraryCases)
        .where(eq(echoLibraryCases.id, input.caseId))
        .limit(1);

      if (!caseRow || caseRow.status !== "approved") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      }

      const questions = await db
        .select({ id: echoLibraryCaseQuestions.id, correctAnswer: echoLibraryCaseQuestions.correctAnswer })
        .from(echoLibraryCaseQuestions)
        .where(eq(echoLibraryCaseQuestions.caseId, input.caseId));

      let score = 0;
      for (const q of questions) {
        const selected = input.answers[String(q.id)];
        if (selected !== undefined && selected === q.correctAnswer) score++;
      }

      // Upsert attempt
      const existing = await db
        .select({ id: echoLibraryCaseAttempts.id })
        .from(echoLibraryCaseAttempts)
        .where(
          and(
            eq(echoLibraryCaseAttempts.userId, ctx.user.id),
            eq(echoLibraryCaseAttempts.caseId, input.caseId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(echoLibraryCaseAttempts)
          .set({
            answers: JSON.stringify(input.answers),
            score,
            totalQuestions: questions.length,
          })
          .where(eq(echoLibraryCaseAttempts.id, existing[0].id));
      } else {
        await db.insert(echoLibraryCaseAttempts).values({
          userId: ctx.user.id,
          caseId: input.caseId,
          answers: JSON.stringify(input.answers),
          score,
          totalQuestions: questions.length,
        });
      }

      return { score, totalQuestions: questions.length };
    }),

  /** List the current user's own submissions */
  getUserSubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const cases = await db
      .select()
      .from(echoLibraryCases)
      .where(eq(echoLibraryCases.submittedByUserId, ctx.user.id))
      .orderBy(desc(echoLibraryCases.submittedAt));

    return cases.map((c) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
      teachingPoints: c.teachingPoints ? JSON.parse(c.teachingPoints) : [],
    }));
  }),

  // ─── Admin procedures ─────────────────────────────────────────────────────

  listPendingCases: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const cases = await db
      .select()
      .from(echoLibraryCases)
      .where(eq(echoLibraryCases.status, "pending"))
      .orderBy(echoLibraryCases.submittedAt);

    // Fetch submitter names
    const userIds = Array.from(new Set(cases.map((c) => c.submittedByUserId)));
    let submitterMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const userList = await db
        .select({ id: users.id, displayName: users.displayName, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${userIds.join(",")})`);
      for (const u of userList) {
        submitterMap[u.id] = u.displayName || u.name || "Unknown";
      }
    }

    return cases.map((c) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
      submitterName: submitterMap[c.submittedByUserId] ?? "Unknown",
    }));
  }),

  approveCase: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .update(echoLibraryCases)
        .set({
          status: "approved",
          reviewedByUserId: ctx.user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        })
        .where(eq(echoLibraryCases.id, input.id));

      return { success: true };
    }),

  rejectCase: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        reason: z.string().min(5).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .update(echoLibraryCases)
        .set({
          status: "rejected",
          reviewedByUserId: ctx.user.id,
          reviewedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(echoLibraryCases.id, input.id));

      return { success: true };
    }),

  adminCreateCase: adminProcedure
    .input(caseInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [result] = await db.insert(echoLibraryCases).values({
        title: input.title,
        summary: input.summary,
        clinicalHistory: input.clinicalHistory ?? null,
        diagnosis: input.diagnosis ?? null,
        teachingPoints: input.teachingPoints ? JSON.stringify(input.teachingPoints) : null,
        modality: input.modality,
        difficulty: input.difficulty,
        tags: JSON.stringify(input.tags),
        status: "approved",
        isAdminSubmission: true,
        submittedByUserId: ctx.user.id,
        hipaaAcknowledged: true,
      });

      const caseId = (result as any).insertId as number;

      if (input.media.length > 0) {
        await db.insert(echoLibraryCaseMedia).values(
          input.media.map((m) => ({
            caseId,
            type: m.type,
            url: m.url,
            fileKey: m.fileKey,
            caption: m.caption ?? null,
            sortOrder: m.sortOrder,
          }))
        );
      }

      if (input.questions.length > 0) {
        await db.insert(echoLibraryCaseQuestions).values(
          input.questions.map((q) => ({
            caseId,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            sortOrder: q.sortOrder,
          }))
        );
      }

      return { caseId };
    }),

  adminUpdateCase: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(5).max(300).optional(),
        summary: z.string().min(10).max(5000).optional(),
        clinicalHistory: z.string().max(5000).optional().nullable(),
        diagnosis: z.string().max(300).optional().nullable(),
        teachingPoints: z.array(z.string().max(500)).max(10).optional(),
        modality: z.enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"]).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        tags: z.array(z.string().max(50)).max(10).optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { id, teachingPoints, tags, ...rest } = input;
      await db
        .update(echoLibraryCases)
        .set({
          ...rest,
          ...(teachingPoints !== undefined ? { teachingPoints: JSON.stringify(teachingPoints) } : {}),
          ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
        })
        .where(eq(echoLibraryCases.id, id));

      return { success: true };
    }),

  adminDeleteCase: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Delete related records first
      await db.delete(echoLibraryCaseMedia).where(eq(echoLibraryCaseMedia.caseId, input.id));
      await db.delete(echoLibraryCaseQuestions).where(eq(echoLibraryCaseQuestions.caseId, input.id));
      await db.delete(echoLibraryCaseAttempts).where(eq(echoLibraryCaseAttempts.caseId, input.id));
      await db.delete(echoLibraryCases).where(eq(echoLibraryCases.id, input.id));

      return { success: true };
    }),

  listAllCases: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        search: z.string().max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];

      if (input.status) conditions.push(eq(echoLibraryCases.status, input.status));
      if (input.search) {
        conditions.push(
          or(
            like(echoLibraryCases.title, `%${input.search}%`),
            like(echoLibraryCases.diagnosis, `%${input.search}%`)
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [cases, totalResult] = await Promise.all([
        db
          .select()
          .from(echoLibraryCases)
          .where(where)
          .orderBy(desc(echoLibraryCases.submittedAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: count(echoLibraryCases.id) })
          .from(echoLibraryCases)
          .where(where),
      ]);

      // Fetch submitter names
      const userIds = Array.from(new Set(cases.map((c) => c.submittedByUserId)));
      let submitterMap: Record<number, string> = {};
      if (userIds.length > 0) {
        const userList = await db
          .select({ id: users.id, displayName: users.displayName, name: users.name })
          .from(users)
          .where(sql`${users.id} IN (${userIds.join(",")})`);
        for (const u of userList) {
          submitterMap[u.id] = u.displayName || u.name || "Unknown";
        }
      }

      return {
        cases: cases.map((c) => ({
          ...c,
          tags: c.tags ? JSON.parse(c.tags) : [],
          submitterName: submitterMap[c.submittedByUserId] ?? "Unknown",
        })),
        total: totalResult[0]?.count ?? 0,
        page: input.page,
        limit: input.limit,
      };
    }),
});
