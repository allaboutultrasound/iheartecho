/**
 * One-time script: force-refresh today's daily challenge set for all categories.
 * Run with: npx tsx scripts/refresh-all-now.mts
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, sql, inArray } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
import dotenv from "dotenv";
dotenv.config();

const { quickfireDailySets, quickfireChallenges, quickfireQuestions } = schema;

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDailySetIds(raw: string | null): Record<string, number | null> {
  const defaults: Record<string, number | null> = {
    acs: null, adultEcho: null, pediatricEcho: null, fetalEcho: null, pocus: null,
  };
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn, { schema, mode: "default" });
  const date = todayDateStr();
  console.log(`[refresh-all-now] Refreshing daily set for ${date}`);

  // 1. Read stale set and auto-activate any inactive questions
  const [staleSet] = await db
    .select({ questionIds: quickfireDailySets.questionIds })
    .from(quickfireDailySets)
    .where(eq(quickfireDailySets.setDate, date))
    .limit(1);

  if (staleSet) {
    const staleMap = parseDailySetIds(staleSet.questionIds);
    const staleIds = Object.values(staleMap).filter((id): id is number => id !== null);
    if (staleIds.length > 0) {
      await db
        .update(quickfireQuestions)
        .set({ isActive: true })
        .where(inArray(quickfireQuestions.id, staleIds));
      console.log(`[refresh-all-now] Auto-activated question IDs: [${staleIds.join(", ")}]`);
    }
    // Delete today's set
    await db.delete(quickfireDailySets).where(eq(quickfireDailySets.setDate, date));
    console.log(`[refresh-all-now] Deleted today's cached daily set.`);
  } else {
    console.log(`[refresh-all-now] No existing daily set for today — will build fresh.`);
  }

  // 2. Reset live challenges published today back to scheduled
  const resetResult = await db
    .update(quickfireChallenges)
    .set({ status: "scheduled", publishedAt: null, archivedAt: null })
    .where(
      and(
        eq(quickfireChallenges.status, "live"),
        sql`DATE(${quickfireChallenges.publishedAt}) = ${date}` as any
      )
    );
  console.log(`[refresh-all-now] Reset live challenges back to scheduled.`);

  // 3. Rebuild: pick one challenge per category
  const CHALLENGE_CATEGORIES = ["ACS", "Adult Echo", "Pediatric Echo", "Fetal Echo", "POCUS"] as const;
  const CAT_KEY: Record<string, string> = {
    "ACS": "acs",
    "Adult Echo": "adultEcho",
    "Pediatric Echo": "pediatricEcho",
    "Fetal Echo": "fetalEcho",
    "POCUS": "pocus",
  };

  const questionMap: Record<string, number | null> = {
    acs: null, adultEcho: null, pediatricEcho: null, fetalEcho: null, pocus: null,
  };
  const usedChallengeIds: number[] = [];

  for (const cat of CHALLENGE_CATEGORIES) {
    const key = CAT_KEY[cat];
    const catChallenges = await db
      .select()
      .from(quickfireChallenges)
      .where(
        and(
          inArray(quickfireChallenges.status, ["draft", "scheduled"] as any[]),
          cat === "Adult Echo"
            ? sql`(${quickfireChallenges.category} = ${cat} OR ${quickfireChallenges.category} IS NULL)` as any
            : eq(quickfireChallenges.category, cat)
        )
      )
      .orderBy(quickfireChallenges.priority, quickfireChallenges.createdAt)
      .limit(10);

    const match = catChallenges.find(
      (c) => !usedChallengeIds.includes(c.id) && (!c.publishDate || c.publishDate <= date)
    );

    if (match) {
      const ids: number[] = JSON.parse(match.questionIds || "[]");
      if (ids.length > 0) {
        let activeId: number | null = null;
        for (const qid of ids) {
          const [qrow] = await db
            .select({ id: quickfireQuestions.id })
            .from(quickfireQuestions)
            .where(and(eq(quickfireQuestions.id, qid), eq(quickfireQuestions.isActive, true)))
            .limit(1);
          if (qrow) { activeId = qrow.id; break; }
        }
        if (activeId === null && ids.length > 0) {
          // Auto-activate first question
          await db.update(quickfireQuestions).set({ isActive: true }).where(eq(quickfireQuestions.id, ids[0]));
          activeId = ids[0];
        }
        if (activeId !== null) {
          questionMap[key] = activeId;
          usedChallengeIds.push(match.id);
          await db
            .update(quickfireChallenges)
            .set({ status: "live", publishDate: match.publishDate ?? date, publishedAt: new Date(), archivedAt: null })
            .where(eq(quickfireChallenges.id, match.id));
          console.log(`[refresh-all-now] ${cat} → challenge #${match.id}, question #${activeId} → LIVE`);
        }
      }
    } else {
      // Fallback: random active question
      const pool = await db
        .select({ id: quickfireQuestions.id })
        .from(quickfireQuestions)
        .where(
          and(
            eq(quickfireQuestions.isActive, true),
            sql`${quickfireQuestions.type} != 'quickReview'` as any,
            sql`${quickfireQuestions.category} = ${cat}` as any
          )
        );
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)].id;
        questionMap[key] = picked;
        console.log(`[refresh-all-now] ${cat} → fallback question #${picked} (no queued challenge)`);
      } else {
        console.warn(`[refresh-all-now] ${cat} → NO questions available!`);
      }
    }
  }

  // Archive any remaining live challenges not in today's set
  const stillLive = await db
    .select({ id: quickfireChallenges.id })
    .from(quickfireChallenges)
    .where(eq(quickfireChallenges.status, "live"));
  for (const row of stillLive) {
    if (!usedChallengeIds.includes(row.id)) {
      await db
        .update(quickfireChallenges)
        .set({ status: "archived", archivedAt: new Date() })
        .where(eq(quickfireChallenges.id, row.id));
    }
  }

  // 4. Insert new daily set
  const questionIds = JSON.stringify(questionMap);
  await db.insert(quickfireDailySets).values({ setDate: date, questionIds });
  console.log(`[refresh-all-now] New daily set inserted: ${questionIds}`);
  console.log(`[refresh-all-now] Done!`);

  await conn.end();
}

main().catch((err) => {
  console.error("[refresh-all-now] ERROR:", err);
  process.exit(1);
});
