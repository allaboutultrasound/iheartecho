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
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createPatchedFetch } from "../_core/patchedFetch";
import { ENV } from "../_core/env";
import {
  quickfireQuestions,
  quickfireDailySets,
  quickfireAttempts,
  quickfireChallenges,
  users,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { eq, and, desc, sql, gte, lte, count, inArray } from "drizzle-orm";
import { sendStreakReminders } from "../streakReminders";
import { generateVirtualLeaderboard } from "../leaderboardSeed";

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
    // Calculate current streak
    const dates = Array.from(new Set(allAttempts.map((a) => a.setDate))).sort().reverse();
    let streak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const today = todayDateStr();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (dates[i] === expectedStr) { streak++; } else { break; }
    }
    // Best streak
    const sortedDates = [...dates].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { tempStreak = 1; }
      else {
        const prev = new Date(sortedDates[i - 1]);
        prev.setDate(prev.getDate() + 1);
        if (prev.toISOString().slice(0, 10) === sortedDates[i]) { tempStreak++; }
        else { tempStreak = 1; }
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }
    // Per-category accuracy
    const questionIds = Array.from(new Set(allAttempts.map((a) => a.questionId)));
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    if (questionIds.length > 0) {
      const questions = await db
        .select({ id: quickfireQuestions.id, tags: quickfireQuestions.tags })
        .from(quickfireQuestions)
        .where(inArray(quickfireQuestions.id, questionIds));
      const tagMap = new Map(questions.map((q) => [q.id, q.tags ? JSON.parse(q.tags) as string[] : []]));
      for (const attempt of allAttempts) {
        const tags = tagMap.get(attempt.questionId) ?? [];
        for (const tag of tags) {
          if (!categoryStats[tag]) categoryStats[tag] = { correct: 0, total: 0 };
          categoryStats[tag].total++;
          if (attempt.isCorrect) categoryStats[tag].correct++;
        }
      }
    }
    // Recent 14-day history
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const cutoff14 = fourteenDaysAgo.toISOString().slice(0, 10);
    const recentAttempts = allAttempts.filter((a) => a.setDate >= cutoff14);
    const byDate: Record<string, { correct: number; total: number }> = {};
    for (const a of recentAttempts) {
      if (!byDate[a.setDate]) byDate[a.setDate] = { correct: 0, total: 0 };
      byDate[a.setDate].total++;
      if (a.isCorrect) byDate[a.setDate].correct++;
    }
    const recentHistory = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, s]) => ({ date, correct: s.correct, total: s.total, accuracy: Math.round((s.correct / s.total) * 100) }));
    return { total, correct, accuracy, streak, bestStreak, categoryStats, recentHistory };
  }),

  /** Leaderboard with period filter and current user rank */
  getLeaderboard: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "allTime"]).default("30d") }).optional())
    .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const period = input?.period ?? "30d";
    let cutoff: string | null = null;
    if (period === "7d") { const d = new Date(); d.setDate(d.getDate() - 7); cutoff = d.toISOString().slice(0, 10); }
    else if (period === "30d") { const d = new Date(); d.setDate(d.getDate() - 30); cutoff = d.toISOString().slice(0, 10); }
    const whereClause = cutoff ? gte(quickfireAttempts.setDate, cutoff) : undefined;
    const results = await db
      .select({
        userId: quickfireAttempts.userId,
        correct: sql<number>`SUM(CASE WHEN ${quickfireAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        total: count(quickfireAttempts.id),
      })
      .from(quickfireAttempts)
      .where(whereClause)
      .groupBy(quickfireAttempts.userId)
      .orderBy(desc(sql`SUM(CASE WHEN ${quickfireAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`))
      .limit(50);
    const userIds = results.map((r) => r.userId);
    // NOTE: Do NOT early-return when userIds is empty — virtual entries must still be shown
    const userList = userIds.length > 0 ? await db
      .select({ id: users.id, displayName: users.displayName, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(inArray(users.id, userIds)) : [];
    const currentUserId = ctx.user.id;
    const allEntries = results.map((r, i) => {
      const u = userList.find((u) => u.id === r.userId);
      return {
        rank: i + 1,
        userId: r.userId,
        displayName: u?.displayName || u?.name || "Anonymous",
        avatarUrl: u?.avatarUrl ?? null,
        correct: Number(r.correct),
        total: Number(r.total),
        accuracy: r.total > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
        isCurrentUser: r.userId === currentUserId,
      };
    });
    // Merge real users with virtual seeded entries
    const virtualEntries = generateVirtualLeaderboard(1200, period);
    // Convert real entries to same shape as virtual
    type LeaderEntry = {
      rank: number;
      userId: string | number;
      displayName: string;
      avatarUrl: string | null;
      correct: number;
      total: number;
      accuracy: number;
      isCurrentUser: boolean;
      isVirtual?: boolean;
      city?: string;
    };
    const realMapped: LeaderEntry[] = allEntries.map((e) => ({ ...e, isVirtual: false }));
    // Combine and sort by correct desc
    const combined: LeaderEntry[] = [...realMapped, ...virtualEntries]
      .sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy);
    // Assign ranks
    combined.forEach((e, i) => { e.rank = i + 1; });
    // Find current user
    const currentUserEntry = combined.find((e) => e.userId === currentUserId || String(e.userId) === String(currentUserId)) ?? null;
    const currentUserRank = currentUserEntry?.rank ?? null;
    // Return top 50 + current user if outside top 50
    const top50 = combined.slice(0, 50);
    const entries = [...top50];
    if (currentUserEntry && currentUserRank && currentUserRank > 50) entries.push(currentUserEntry);
    return { entries, currentUserRank, currentUserEntry };
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

  /**
   * AI-powered bulk question generator.
   * Generates N questions for a given topic and inserts them into the DB.
   * Returns the generated questions and their new IDs for preview.
   */
  aiGenerateQuestions: adminProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(500),
        type: z.enum(["scenario", "image", "quickReview"]).default("scenario"),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
        count: z.number().int().min(1).max(20).default(5),
        insertImmediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ENV.forgeApiKey || !ENV.forgeApiUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI service not configured. Missing Forge API credentials.",
        });
      }

      const forgeBaseUrl = (ENV.forgeApiUrl ?? "").replace(/\/+$/, "");
      const forgeApiKey = ENV.forgeApiKey ?? "";

      const typeInstructions =
        input.type === "quickReview"
          ? `Each item is a flashcard: a short clinical question or fact prompt in 'question', and the concise answer in 'reviewAnswer'. Do NOT include options or correctAnswer.`
          : `Each item is a multiple-choice question with exactly 4 options in 'options', a 0-indexed correctAnswer as a number (0, 1, 2, or 3), and a clear explanation. Do NOT include reviewAnswer.`;

      const jsonFormatInstructions =
        input.type === "quickReview"
          ? `{"questions":[{"question":"...","reviewAnswer":"...","tags":["...","..."]}]}`
          : `{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","tags":["...","..."]}]}`;

      const promptText = `You are an expert echocardiography educator creating ${input.count} ${input.difficulty} ${input.type} questions about: "${input.topic}".

${typeInstructions}

Guidelines:
- Use accurate, up-to-date ASE/AHA/ACC guidelines where applicable
- Questions should be clinically relevant and educational
- For MCQ: distractors should be plausible but clearly distinguishable from the correct answer
- Tags: 2-4 specific clinical terms (e.g. "aortic stenosis", "ASE 2021", "Doppler")
- Difficulty: ${input.difficulty} (beginner=basic concepts, intermediate=clinical application, advanced=complex interpretation)

Return exactly ${input.count} questions as a valid JSON object matching this format:
${jsonFormatInstructions}

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

      let text: string;
      try {
        // Use native fetch (not createPatchedFetch) — patchedFetch is for SSE streaming only
        const aiResp = await fetch(`${forgeBaseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${forgeApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: promptText }],
            temperature: 0.7,
          }),
        });
        if (!aiResp.ok) {
          const errBody = await aiResp.text();
          throw new Error(`Forge API returned ${aiResp.status}: ${errBody.substring(0, 200)}`);
        }
        const aiData = await aiResp.json() as {
          choices?: { message?: { content?: string } }[];
          error?: { message?: string };
        };
        if (aiData.error) {
          throw new Error(`Forge API error: ${aiData.error.message ?? JSON.stringify(aiData.error)}`);
        }
        text = aiData.choices?.[0]?.message?.content ?? "";
        if (!text) throw new Error("Forge API returned empty content");
      } catch (aiErr) {
        const errMsg = aiErr instanceof Error ? aiErr.message : String(aiErr);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI generation failed: ${errMsg.substring(0, 300)}`,
        });
      }

      // Parse the JSON response — handle multiple formats the model may return:
      // 1. {"questions":[...]}  (ideal)
      // 2. [{...},{...}]        (root array — model ignores wrapper instruction)
      // 3. ```json\n{...}\n```  (markdown fenced)
      let parsedResult: { questions: Array<{
        question: string;
        options?: string[];
        correctAnswer?: number;
        explanation?: string;
        reviewAnswer?: string;
        tags: string[];
      }> };
      try {
        // Step 1: strip markdown code fences
        let cleaned = text
          .replace(/^```(?:json)?\s*/im, "")
          .replace(/\s*```\s*$/im, "")
          .trim();

        // Step 2: extract the first JSON value (object or array) from the text
        // This handles cases where the model adds prose before/after the JSON
        const jsonMatch = cleaned.match(/([\[\{][\s\S]*[\]\}])/);
        if (jsonMatch) cleaned = jsonMatch[1].trim();

        const raw = JSON.parse(cleaned);

        // Step 3: normalise — accept both {questions:[]} and a root array
        if (Array.isArray(raw)) {
          parsedResult = { questions: raw };
        } else if (raw && Array.isArray(raw.questions)) {
          parsedResult = raw;
        } else {
          throw new Error("Response is not a questions array or {questions:[]} object");
        }

        if (parsedResult.questions.length === 0) {
          throw new Error("AI returned an empty questions array");
        }
      } catch (parseErr) {
        // Surface the raw text in the error so admins can debug
        const preview = text?.substring(0, 300) ?? "(empty)";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI returned invalid JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)} | Raw preview: ${preview}`,
        });
      }

      const object = parsedResult;

      // If insertImmediately is true, bulk-insert the generated questions
      const insertedIds: number[] = [];
      if (input.insertImmediately) {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        for (const q of object.questions) {
          const [result] = await db.insert(quickfireQuestions).values({
            type: input.type,
            question: q.question,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer ?? null,
            explanation: q.explanation ?? null,
            reviewAnswer: q.reviewAnswer ?? null,
            imageUrl: null,
            difficulty: input.difficulty,
            tags: JSON.stringify(q.tags),
            isActive: true,
            createdByUserId: ctx.user.id,
          });
          insertedIds.push((result as any).insertId);
        }
      }

      return {
        questions: object.questions,
        insertedIds,
        inserted: insertedIds.length,
      };
    }),

  bulkImportQuestions: adminProcedure
    .input(
      z.object({
        questions: z
          .array(
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
          .min(1)
          .max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = input.questions.map((q) => ({
        type: q.type,
        question: q.question,
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer ?? null,
        explanation: q.explanation ?? null,
        reviewAnswer: q.reviewAnswer ?? null,
        imageUrl: q.imageUrl ?? null,
        difficulty: q.difficulty,
        tags: JSON.stringify(q.tags),
        isActive: true,
        createdByUserId: ctx.user.id,
      }));
      // Insert in batches of 50 to avoid hitting DB limits
      const BATCH = 50;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        await db.insert(quickfireQuestions).values(rows.slice(i, i + BATCH));
        inserted += Math.min(BATCH, rows.length - i);
      }
      return { inserted };
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

  // ─── Streak Reminders ────────────────────────────────────────────────────────

  /** Admin: trigger streak reminder emails to all users who haven't completed today's set */
  triggerStreakReminders: adminProcedure
    .input(z.object({ appUrl: z.string().url().optional() }))
    .mutation(async ({ input }) => {
      const appUrl = input.appUrl ?? process.env.VITE_APP_URL ?? "https://app.iheartecho.com";
      const summary = await sendStreakReminders(appUrl);
      return summary;
    }),

  // ─── Notification Preferences ────────────────────────────────────────────────

  /** Get the current user's notification preferences */
  getNotificationPrefs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [row] = await db
      .select({ notificationPrefs: users.notificationPrefs })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    try {
      const prefs = row.notificationPrefs ? JSON.parse(row.notificationPrefs) : {};
      return {
        quickfireReminder: prefs.quickfireReminder !== false,
        reminderTime: typeof prefs.reminderTime === "string" ? prefs.reminderTime : "18:00",
      };
    } catch {
      return { quickfireReminder: true, reminderTime: "18:00" };
    }
  }),

  /** Update the current user's notification preferences */
  updateNotificationPrefs: protectedProcedure
    .input(
      z.object({
        quickfireReminder: z.boolean(),
        reminderTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "Must be HH:MM format")
          .default("18:00"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(users)
        .set({ notificationPrefs: JSON.stringify(input) })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  // ─── Challenge Queue ─────────────────────────────────────────────────────────

  /** Get the currently live challenge (status = 'live') with full question data */
  getLiveChallenge: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const [challenge] = await db
      .select()
      .from(quickfireChallenges)
      .where(eq(quickfireChallenges.status, "live"))
      .orderBy(desc(quickfireChallenges.publishedAt))
      .limit(1);

    if (!challenge) return null;

    const ids: number[] = JSON.parse(challenge.questionIds || "[]");
    if (ids.length === 0) return { ...challenge, questions: [], userAttempts: {} };

    const allQ = await db.select().from(quickfireQuestions).where(eq(quickfireQuestions.isActive, true));
    const orderedQuestions = ids.map((id) => allQ.find((q) => q.id === id)).filter(Boolean) as typeof allQ;

    let userAttempts: Record<number, { selectedAnswer: number | null; selfMarkedCorrect: boolean | null; isCorrect: boolean | null }> = {};
    const setDate = challenge.publishDate ?? challenge.publishedAt?.toISOString().slice(0, 10) ?? "";
    if (ctx.user && setDate) {
      const attempts = await db
        .select()
        .from(quickfireAttempts)
        .where(and(eq(quickfireAttempts.userId, ctx.user.id), eq(quickfireAttempts.setDate, setDate)));
      for (const a of attempts) {
        userAttempts[a.questionId] = { selectedAnswer: a.selectedAnswer, selfMarkedCorrect: a.selfMarkedCorrect, isCorrect: a.isCorrect };
      }
    }

    const sanitized = orderedQuestions.map((q) => {
      const attempted = userAttempts[q.id];
      return {
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
        tags: q.tags ? JSON.parse(q.tags) : [],
        correctAnswer: attempted ? q.correctAnswer : null,
        explanation: attempted ? q.explanation : null,
        reviewAnswer: attempted ? q.reviewAnswer : null,
      };
    });

    // Compute time remaining (24h window from publishedAt)
    const publishedAt = challenge.publishedAt ? new Date(challenge.publishedAt).getTime() : null;
    const expiresAt = publishedAt ? publishedAt + 24 * 60 * 60 * 1000 : null;
    const msRemaining = expiresAt ? Math.max(0, expiresAt - Date.now()) : null;

    return { ...challenge, questions: sanitized, userAttempts, setDate, msRemaining };
  }),

  /** Get the challenge archive — premium members only; free users get no archive access */
  getChallengeArchive: publicProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(20).default(10),
      category: z.string().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      dateFrom: z.string().optional(), // YYYY-MM-DD
      dateTo: z.string().optional(),   // YYYY-MM-DD
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const isPremium = (ctx.user as any)?.isPremium === true || (ctx.user as any)?.role === "admin";
      // Free users have no archive access — return empty with flag so UI can show upgrade prompt
      if (!isPremium) {
        return { challenges: [], total: 0, isPremium: false, page: input.page, limit: input.limit };
      }
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [eq(quickfireChallenges.status, "archived")];
      // Category filter
      if (input.category) {
        conditions.push(eq(quickfireChallenges.category, input.category));
      }
      // Difficulty filter
      if (input.difficulty) {
        conditions.push(eq(quickfireChallenges.difficulty, input.difficulty));
      }
      // Date range filters
      if (input.dateFrom) {
        conditions.push(gte(quickfireChallenges.publishDate, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(quickfireChallenges.publishDate, input.dateTo));
      }
      const [rows, totalResult] = await Promise.all([
        db.select({ id: quickfireChallenges.id, title: quickfireChallenges.title, description: quickfireChallenges.description,
          category: quickfireChallenges.category, difficulty: quickfireChallenges.difficulty,
          publishDate: quickfireChallenges.publishDate,
          publishedAt: quickfireChallenges.publishedAt, archivedAt: quickfireChallenges.archivedAt,
          questionIds: quickfireChallenges.questionIds })
          .from(quickfireChallenges).where(and(...conditions))
          .orderBy(desc(quickfireChallenges.publishedAt)).limit(input.limit).offset(offset),
        db.select({ count: count(quickfireChallenges.id) }).from(quickfireChallenges).where(and(...conditions)),
      ]);
      return { challenges: rows, total: totalResult[0]?.count ?? 0, isPremium: true, page: input.page, limit: input.limit };
    }),

  /** Get a single archived challenge with full questions (for replay) */
  getArchivedChallenge: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [challenge] = await db.select().from(quickfireChallenges)
        .where(and(eq(quickfireChallenges.id, input.id), eq(quickfireChallenges.status, "archived"))).limit(1);
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });

      // Access gate: archive is premium-only; free users cannot replay any archived challenge
      const isPremium = (ctx.user as any)?.isPremium === true || (ctx.user as any)?.role === "admin";
      if (!isPremium) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Premium access required to replay archived challenges" });
      }

      const ids: number[] = JSON.parse(challenge.questionIds || "[]");
      const allQ = await db.select().from(quickfireQuestions).where(eq(quickfireQuestions.isActive, true));
      const questions = ids.map((id) => allQ.find((q) => q.id === id)).filter(Boolean) as typeof allQ;

      // For archived challenges, always reveal answers
      const withAnswers = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
        tags: q.tags ? JSON.parse(q.tags) : [],
      }));

      return { ...challenge, questions: withAnswers };
    }),

  // ─── Admin: Challenge Queue Management ──────────────────────────────────────

  /** List all challenges in the queue (draft + scheduled + live) */
  adminListChallenges: adminProcedure
    .input(z.object({ includeArchived: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const statuses = input.includeArchived
        ? ["draft", "scheduled", "live", "archived"]
        : ["draft", "scheduled", "live"];

      const rows = await db.select().from(quickfireChallenges)
        .where(sql`${quickfireChallenges.status} IN (${statuses.map(() => "?").join(",")})` as any)
        .orderBy(quickfireChallenges.priority, desc(quickfireChallenges.createdAt));

      return rows.map((r) => ({ ...r, questionIds: JSON.parse(r.questionIds || "[]") as number[] }));
    }),

  /** Create a new challenge in the queue */
  adminCreateChallenge: adminProcedure
    .input(z.object({
      title: z.string().min(3).max(300),
      description: z.string().max(2000).optional(),
      questionIds: z.array(z.number().int().positive()).min(1),
      priority: z.number().int().min(1).default(100),
      category: z.string().max(64).optional(),
      publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(quickfireChallenges).values({
        title: input.title,
        description: input.description ?? null,
        questionIds: JSON.stringify(input.questionIds),
        priority: input.priority,
        category: input.category ?? null,
        status: input.publishDate ? "scheduled" : "draft",
        publishDate: input.publishDate ?? null,
        createdByUserId: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  /** Update a challenge (title, description, questions, priority, category, publishDate) */
  adminUpdateChallenge: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().min(3).max(300).optional(),
      description: z.string().max(2000).optional().nullable(),
      questionIds: z.array(z.number().int().positive()).min(1).optional(),
      priority: z.number().int().min(1).optional(),
      category: z.string().max(64).optional().nullable(),
      publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, questionIds, ...rest } = input;
      await db.update(quickfireChallenges).set({
        ...rest,
        ...(questionIds !== undefined ? { questionIds: JSON.stringify(questionIds) } : {}),
        ...(rest.publishDate !== undefined ? { status: rest.publishDate ? "scheduled" : "draft" } : {}),
      }).where(eq(quickfireChallenges.id, id));
      return { success: true };
    }),

  /** Delete a draft challenge */
  adminDeleteChallenge: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Only allow deleting drafts/scheduled — never live/archived
      const [ch] = await db.select({ status: quickfireChallenges.status }).from(quickfireChallenges)
        .where(eq(quickfireChallenges.id, input.id)).limit(1);
      if (!ch) throw new TRPCError({ code: "NOT_FOUND" });
      if (ch.status === "live" || ch.status === "archived") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete a live or archived challenge" });
      }
      await db.delete(quickfireChallenges).where(eq(quickfireChallenges.id, input.id));
      return { success: true };
    }),

  /** Reorder challenge priorities — accepts an ordered array of IDs */
  adminReorderChallenges: adminProcedure
    .input(z.object({ orderedIds: z.array(z.number().int().positive()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      for (let i = 0; i < input.orderedIds.length; i++) {
        await db.update(quickfireChallenges).set({ priority: i + 1 }).where(eq(quickfireChallenges.id, input.orderedIds[i]));
      }
      return { success: true };
    }),

  /**
   * Publish the next scheduled/draft challenge immediately (or auto-publish on cron).
   * Picks the highest-priority draft/scheduled challenge and makes it live.
   * Archives any currently live challenge first.
   */
  adminPublishNextChallenge: adminProcedure
    .input(z.object({ sendNotification: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // 1. Archive any currently live challenge
      const now = new Date();
      await db.update(quickfireChallenges).set({ status: "archived", archivedAt: now })
        .where(eq(quickfireChallenges.status, "live"));

      // 2. Pick next: prefer scheduled (has a publishDate), then draft, ordered by priority
      const today = now.toISOString().slice(0, 10);
      const candidates = await db.select().from(quickfireChallenges)
        .where(sql`${quickfireChallenges.status} IN ('draft', 'scheduled')` as any)
        .orderBy(quickfireChallenges.priority, quickfireChallenges.createdAt)
        .limit(10);

      // Prefer a challenge whose publishDate <= today, else take the first draft
      const next = candidates.find((c) => !c.publishDate || c.publishDate <= today) ?? candidates[0];
      if (!next) return { published: false, message: "No challenges in queue" };

      await db.update(quickfireChallenges).set({
        status: "live",
        publishDate: next.publishDate ?? today,
        publishedAt: now,
        archivedAt: null,
      }).where(eq(quickfireChallenges.id, next.id));

      // 3. Send owner notification
      if (input.sendNotification) {
        await notifyOwner({
          title: `🔥 New QuickFire Challenge Live: ${next.title}`,
          content: `Challenge "${next.title}" is now live for 24 hours. Users have been notified.`,
        }).catch(() => {});
      }

      return { published: true, challengeId: next.id, title: next.title, publishDate: next.publishDate ?? today };
    }),

  /** Manually archive the currently live challenge */
  adminArchiveChallenge: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(quickfireChallenges).set({ status: "archived", archivedAt: new Date() })
        .where(and(eq(quickfireChallenges.id, input.id), eq(quickfireChallenges.status, "live")));
      return { success: true };
    }),

  // ─── Flashcard Deck ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns all active quickReview-type flashcards, ordered by spaced-repetition priority.
   * Cards the user has missed most recently appear first.
   * Unauthenticated users get a random order.
   */
  getFlashcardDeck: publicProcedure
    .input(z.object({
      topic: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Fetch all active flashcard questions
      const allCards = await db
        .select()
        .from(quickfireQuestions)
        .where(and(
          eq(quickfireQuestions.isActive, true),
          eq(quickfireQuestions.type, "quickReview"),
        ))
        .limit(input.limit);

      if (allCards.length === 0) return { cards: [], totalCards: 0, userStats: null };

      // Filter by topic if provided
      const filtered = input.topic
        ? allCards.filter((c) => {
            const tags: string[] = c.tags ? JSON.parse(c.tags) : [];
            return tags.some((t) => t.toLowerCase().includes(input.topic!.toLowerCase()));
          })
        : allCards;

      // If user is authenticated, fetch their attempt history for spaced repetition
      if (ctx.user) {
        const cardIds = filtered.map((c) => c.id);
        const attempts = cardIds.length > 0
          ? await db
              .select({
                questionId: quickfireAttempts.questionId,
                selfMarkedCorrect: quickfireAttempts.selfMarkedCorrect,
                createdAt: quickfireAttempts.createdAt,
              })
              .from(quickfireAttempts)
              .where(and(
                eq(quickfireAttempts.userId, ctx.user.id),
                inArray(quickfireAttempts.questionId, cardIds),
              ))
          : [];

        // Build per-card stats
        const statsMap: Record<number, { gotIt: number; missed: number; lastSeen: Date | null; lastResult: boolean | null }> = {};
        for (const a of attempts) {
          if (!statsMap[a.questionId]) {
            statsMap[a.questionId] = { gotIt: 0, missed: 0, lastSeen: null, lastResult: null };
          }
          const s = statsMap[a.questionId];
          if (a.selfMarkedCorrect === true) s.gotIt++;
          else if (a.selfMarkedCorrect === false) s.missed++;
          if (!s.lastSeen || a.createdAt > s.lastSeen) {
            s.lastSeen = a.createdAt;
            s.lastResult = a.selfMarkedCorrect;
          }
        }

        // Spaced repetition sort:
        // 1. Never seen (no attempts) — highest priority
        // 2. Last result was missed — second priority, sorted by most recently missed first
        // 3. Last result was correct — lowest priority, sorted by least recently seen first
        const scored = filtered.map((card) => {
          const s = statsMap[card.id];
          let score = 0;
          if (!s || s.gotIt + s.missed === 0) {
            score = 0; // never seen — show first
          } else if (s.lastResult === false) {
            score = 1; // last missed — show second
          } else {
            score = 2; // last correct — show last
          }
          return { card, score, lastSeen: s?.lastSeen ?? null, stats: s ?? { gotIt: 0, missed: 0, lastSeen: null, lastResult: null } };
        });

        scored.sort((a, b) => {
          if (a.score !== b.score) return a.score - b.score;
          // Within same score group, sort by lastSeen ascending (least recently seen first)
          if (!a.lastSeen && !b.lastSeen) return 0;
          if (!a.lastSeen) return -1;
          if (!b.lastSeen) return 1;
          return a.lastSeen.getTime() - b.lastSeen.getTime();
        });

        const cards = scored.map(({ card, stats }) => ({
          ...card,
          tags: card.tags ? JSON.parse(card.tags) : [],
          gotIt: stats.gotIt,
          missed: stats.missed,
          lastSeen: stats.lastSeen,
          lastResult: stats.lastResult,
        }));

        // Aggregate user stats
        const totalAttempts = attempts.length;
        const totalGotIt = attempts.filter((a) => a.selfMarkedCorrect === true).length;
        const totalMissed = attempts.filter((a) => a.selfMarkedCorrect === false).length;

        return {
          cards,
          totalCards: filtered.length,
          userStats: { totalAttempts, totalGotIt, totalMissed, accuracy: totalAttempts > 0 ? Math.round((totalGotIt / totalAttempts) * 100) : null },
        };
      }

      // Unauthenticated: return in random order
      const shuffled = sampleN(filtered, filtered.length);
      return {
        cards: shuffled.map((c) => ({ ...c, tags: c.tags ? JSON.parse(c.tags) : [], gotIt: 0, missed: 0, lastSeen: null, lastResult: null })),
        totalCards: filtered.length,
        userStats: null,
      };
    }),

  /**
   * Record a flashcard deck self-assessment (Got it / Missed it).
   * Uses a special setDate of 'deck-YYYY-MM-DD' to distinguish from daily challenge attempts.
   */
  submitFlashcardReview: protectedProcedure
    .input(z.object({
      questionId: z.number().int().positive(),
      gotIt: z.boolean(),
      timeMs: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Verify the question exists and is a quickReview type
      const [q] = await db
        .select({ id: quickfireQuestions.id, type: quickfireQuestions.type })
        .from(quickfireQuestions)
        .where(and(eq(quickfireQuestions.id, input.questionId), eq(quickfireQuestions.isActive, true)))
        .limit(1);
      if (!q) throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });

      const setDate = `deck-${todayDateStr()}`;
      await db.insert(quickfireAttempts).values({
        userId: ctx.user.id,
        questionId: input.questionId,
        setDate,
        selectedAnswer: null,
        selfMarkedCorrect: input.gotIt,
        isCorrect: input.gotIt,
        timeMs: input.timeMs ?? null,
      });

      return { success: true };
    }),
});
