/**
 * quickfireRouter.ts
 * tRPC procedures for the Daily QuickFire engine.
 *
 * Procedures:
 *   getTodaySet       — returns today's question set (auto-generates if missing)
 *   getQuestion       — returns a single question by ID
 *   submitAnswer      — records a user's answer and returns correctness + explanation
 *   getUserStats      — streak, accuracy, total answered for the current user
 *   getLeaderboard    — top users by total correct answers (last 30 days)
 *
 * Admin-only:
 *   createQuestion    — add a new question
 *   updateQuestion    — edit an existing question
 *   deleteQuestion    — soft-delete (isActive = false)
 *   listAllQuestions  — paginated list for admin management
 *   generateDailySet  — manually regenerate today's set
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  quickfireQuestions,
  quickfireDailySets,
  quickfireAttempts,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

/** Pick N random items from an array */
function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Auto-generate a daily set of 5 questions (mix of types) if one doesn't exist */
async function ensureTodaySet(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, date: string) {
  const existing = await db
    .select()
    .from(quickfireDailySets)
    .where(eq(quickfireDailySets.setDate, date))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Fetch active questions, try to balance types
  const allQuestions = await db
    .select({ id: quickfireQuestions.id, type: quickfireQuestions.type })
    .from(quickfireQuestions)
    .where(eq(quickfireQuestions.isActive, true));

  if (allQuestions.length === 0) {
    // Return an empty set if no questions exist yet
    const [inserted] = await db.insert(quickfireDailySets).values({
      setDate: date,
      questionIds: "[]",
    });
    return { setDate: date, questionIds: "[]", id: (inserted as any).insertId };
  }

  const scenarios = allQuestions.filter((q) => q.type === "scenario");
  const images = allQuestions.filter((q) => q.type === "image");
  const reviews = allQuestions.filter((q) => q.type === "quickReview");

  // Target: 2 scenario, 2 image, 1 quickReview (adjust if not enough)
  const picked = [
    ...sampleN(scenarios, Math.min(2, scenarios.length)),
    ...sampleN(images, Math.min(2, images.length)),
    ...sampleN(reviews, Math.min(1, reviews.length)),
  ];

  // Fill to 5 if we didn't get enough
  if (picked.length < 5) {
    const remaining = allQuestions.filter(
      (q) => !picked.find((p) => p.id === q.id)
    );
    picked.push(...sampleN(remaining, 5 - picked.length));
  }

  // Shuffle final set
  const finalIds = sampleN(picked, picked.length).map((q) => q.id);

  await db.insert(quickfireDailySets).values({
    setDate: date,
    questionIds: JSON.stringify(finalIds),
  });

  return { setDate: date, questionIds: JSON.stringify(finalIds) };
}

// ─── Admin guard ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const quickfireRouter = router({
  /** Returns today's question set with full question data */
  getTodaySet: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const date = todayDateStr();
    const set = await ensureTodaySet(db, date);
    const ids: number[] = JSON.parse(set.questionIds || "[]");

    if (ids.length === 0) {
      return { setDate: date, questions: [], userAttempts: {} };
    }

    const questions = await db
      .select()
      .from(quickfireQuestions)
      .where(eq(quickfireQuestions.isActive, true));

    const orderedQuestions = ids
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions;

    // If user is authenticated, fetch their attempts for today
    let userAttempts: Record<number, { selectedAnswer: number | null; selfMarkedCorrect: boolean | null; isCorrect: boolean | null }> = {};
    if (ctx.user) {
      const attempts = await db
        .select()
        .from(quickfireAttempts)
        .where(
          and(
            eq(quickfireAttempts.userId, ctx.user.id),
            eq(quickfireAttempts.setDate, date)
          )
        );
      for (const a of attempts) {
        userAttempts[a.questionId] = {
          selectedAnswer: a.selectedAnswer,
          selfMarkedCorrect: a.selfMarkedCorrect,
          isCorrect: a.isCorrect,
        };
      }
    }

    // Strip correct answers from response (don't reveal until answered)
    const sanitized = orderedQuestions.map((q) => {
      const attempted = userAttempts[q.id];
      return {
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
        tags: q.tags ? JSON.parse(q.tags) : [],
        // Only reveal correct answer if user has already attempted
        correctAnswer: attempted ? q.correctAnswer : null,
        explanation: attempted ? q.explanation : null,
        reviewAnswer: attempted ? q.reviewAnswer : null,
      };
    });

    return { setDate: date, questions: sanitized, userAttempts };
  }),

  /** Submit an answer for a question in today's set */
  submitAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.number().int().positive(),
        selectedAnswer: z.number().int().min(0).optional(), // MCQ index
        selfMarkedCorrect: z.boolean().optional(), // quickReview self-assessment
        timeMs: z.number().int().min(0).max(300000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const date = todayDateStr();

      // Verify question exists
      const [question] = await db
        .select()
        .from(quickfireQuestions)
        .where(eq(quickfireQuestions.id, input.questionId))
        .limit(1);

      if (!question) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
      }

      // Prevent double-submission
      const [existing] = await db
        .select()
        .from(quickfireAttempts)
        .where(
          and(
            eq(quickfireAttempts.userId, ctx.user.id),
            eq(quickfireAttempts.questionId, input.questionId),
            eq(quickfireAttempts.setDate, date)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already answered this question today",
        });
      }

      // Determine correctness
      let isCorrect: boolean | null = null;
      if (question.type === "quickReview") {
        isCorrect = input.selfMarkedCorrect ?? null;
      } else if (input.selectedAnswer !== undefined && question.correctAnswer !== null) {
        isCorrect = input.selectedAnswer === question.correctAnswer;
      }

      await db.insert(quickfireAttempts).values({
        userId: ctx.user.id,
        questionId: input.questionId,
        setDate: date,
        selectedAnswer: input.selectedAnswer ?? null,
        selfMarkedCorrect: input.selfMarkedCorrect ?? null,
        isCorrect,
        timeMs: input.timeMs ?? null,
      });

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        reviewAnswer: question.reviewAnswer,
      };
    }),

  /** Get the current user's QuickFire stats */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const userId = ctx.user.id;

    const allAttempts = await db
      .select()
      .from(quickfireAttempts)
      .where(eq(quickfireAttempts.userId, userId))
      .orderBy(desc(quickfireAttempts.setDate));

    const total = allAttempts.length;
    const correct = allAttempts.filter((a) => a.isCorrect === true).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Calculate current streak (consecutive days with at least one attempt)
    const dates = Array.from(new Set(allAttempts.map((a) => a.setDate))).sort().reverse();
    let streak = 0;
    const today = todayDateStr();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (dates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return { total, correct, accuracy, streak };
  }),

  /** Top 10 users by correct answers in the last 30 days */
  getLeaderboard: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

    const results = await db
      .select({
        userId: quickfireAttempts.userId,
        correct: sql<number>`SUM(CASE WHEN ${quickfireAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        total: count(quickfireAttempts.id),
      })
      .from(quickfireAttempts)
      .where(gte(quickfireAttempts.setDate, cutoff))
      .groupBy(quickfireAttempts.userId)
      .orderBy(desc(sql`SUM(CASE WHEN ${quickfireAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`))
      .limit(10);

    // Fetch display names
    const userIds = results.map((r) => r.userId);
    if (userIds.length === 0) return [];

    const userList = await db
      .select({ id: users.id, displayName: users.displayName, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(sql`${users.id} IN (${userIds.join(",")})`);

    return results.map((r, i) => {
      const u = userList.find((u) => u.id === r.userId);
      return {
        rank: i + 1,
        userId: r.userId,
        displayName: u?.displayName || u?.name || "Anonymous",
        avatarUrl: u?.avatarUrl ?? null,
        correct: Number(r.correct),
        total: Number(r.total),
        accuracy: r.total > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
      };
    });
  }),

  // ─── Admin procedures ───────────────────────────────────────────────────────

  createQuestion: adminProcedure
    .input(
      z.object({
        type: z.enum(["scenario", "image", "quickReview"]),
        question: z.string().min(5).max(2000),
        options: z.array(z.string().min(1)).min(2).max(6).optional(),
        correctAnswer: z.number().int().min(0).optional(),
        explanation: z.string().max(2000).optional(),
        reviewAnswer: z.string().max(2000).optional(),
        imageUrl: z.string().url().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(quickfireQuestions).values({
        type: input.type,
        question: input.question,
        options: input.options ? JSON.stringify(input.options) : null,
        correctAnswer: input.correctAnswer ?? null,
        explanation: input.explanation ?? null,
        reviewAnswer: input.reviewAnswer ?? null,
        imageUrl: input.imageUrl ?? null,
        difficulty: input.difficulty,
        tags: JSON.stringify(input.tags),
        isActive: true,
        createdByUserId: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  updateQuestion: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        type: z.enum(["scenario", "image", "quickReview"]).optional(),
        question: z.string().min(5).max(2000).optional(),
        options: z.array(z.string().min(1)).min(2).max(6).optional(),
        correctAnswer: z.number().int().min(0).optional(),
        explanation: z.string().max(2000).optional(),
        reviewAnswer: z.string().max(2000).optional(),
        imageUrl: z.string().url().optional().nullable(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, options, tags, ...rest } = input;
      await db
        .update(quickfireQuestions)
        .set({
          ...rest,
          ...(options !== undefined ? { options: JSON.stringify(options) } : {}),
          ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
        })
        .where(eq(quickfireQuestions.id, id));
      return { success: true };
    }),

  deleteQuestion: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(quickfireQuestions)
        .set({ isActive: false })
        .where(eq(quickfireQuestions.id, input.id));
      return { success: true };
    }),

  listAllQuestions: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        type: z.enum(["scenario", "image", "quickReview"]).optional(),
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (!input.includeInactive) {
        conditions.push(eq(quickfireQuestions.isActive, true));
      }
      if (input.type) {
        conditions.push(eq(quickfireQuestions.type, input.type));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [questions, totalResult] = await Promise.all([
        db
          .select()
          .from(quickfireQuestions)
          .where(whereClause)
          .orderBy(desc(quickfireQuestions.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: count(quickfireQuestions.id) })
          .from(quickfireQuestions)
          .where(whereClause),
      ]);

      return {
        questions: questions.map((q) => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : null,
          tags: q.tags ? JSON.parse(q.tags) : [],
        })),
        total: totalResult[0]?.count ?? 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  generateDailySet: adminProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const date = input.date ?? todayDateStr();

      // Delete existing set for this date if any
      await db
        .delete(quickfireDailySets)
        .where(eq(quickfireDailySets.setDate, date));

      const set = await ensureTodaySet(db, date);
      const ids: number[] = JSON.parse(set.questionIds || "[]");
      return { date, questionCount: ids.length };
    }),
});
