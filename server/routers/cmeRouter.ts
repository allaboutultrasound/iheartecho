/**
 * CME Hub Router — Thinkific-backed public course catalog.
 *
 * Scope (simplified):
 *   cmeCatalog.getCatalog — public: returns visible, published, non-archived courses
 *                           with Thinkific deep-links (email pre-fill supported client-side)
 *
 * The catalog is cached in cmeCoursesCache and refreshed every 6 hours.
 * No enrollment tracking, no transcript, no admin metadata panel.
 */

import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cmeCoursesCache } from "../../drizzle/schema";
import { getVisibleProducts, buildCourseUrl, buildEnrollUrl } from "../thinkific";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogCourse {
  thinkificProductId: number;
  thinkificCourseId: number | null;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  cardImageUrl: string | null;
  instructorNames: string | null;
  hasCertificate: boolean;
  /** Direct course URL on Thinkific */
  courseUrl: string;
  /** Checkout/enroll URL on Thinkific */
  enrollUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sync visible products from Thinkific into cmeCoursesCache */
export async function syncCatalogToDb(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const products = await getVisibleProducts();
  let synced = 0;

  for (const p of products) {
    await db
      .insert(cmeCoursesCache)
      .values({
        thinkificProductId: p.id,
        thinkificCourseId: p.productable_type === "Course" ? p.productable_id : null,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        cardImageUrl: p.card_image_url,
        instructorNames: p.instructor_names,
        hasCertificate: p.has_certificate,
        thinkificStatus: p.status,
        syncedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          cardImageUrl: p.card_image_url,
          instructorNames: p.instructor_names,
          hasCertificate: p.has_certificate,
          thinkificStatus: p.status,
          syncedAt: new Date(),
        },
      });
    synced++;
  }
  return synced;
}

/** Map cached DB rows to CatalogCourse objects */
function mapToCatalogCourse(c: typeof cmeCoursesCache.$inferSelect): CatalogCourse {
  return {
    thinkificProductId: c.thinkificProductId,
    thinkificCourseId: c.thinkificCourseId,
    name: c.name,
    slug: c.slug,
    description: c.description,
    price: c.price ?? "0.0",
    cardImageUrl: c.cardImageUrl,
    instructorNames: c.instructorNames,
    hasCertificate: c.hasCertificate,
    courseUrl: buildCourseUrl(c.slug),
    enrollUrl: buildEnrollUrl(c.slug),
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const cmeRouter = router({
  /**
   * Public: returns the visible course catalog.
   * If the cache is empty or stale (>6 hours), triggers a sync first.
   * The client appends ?email=<user_email> to the deep-links for pre-fill.
   */
  getCatalog: publicProcedure.query(async (): Promise<CatalogCourse[]> => {
    const db = await getDb();
    if (!db) return [];

    const cached = await db.select().from(cmeCoursesCache).limit(1);

    if (cached.length === 0) {
      // First load — sync from Thinkific synchronously
      await syncCatalogToDb();
    } else {
      // Stale check (6 hours) — background refresh
      const ageMs = Date.now() - cached[0].syncedAt.getTime();
      if (ageMs > 6 * 60 * 60 * 1000) {
        syncCatalogToDb().catch(console.error);
      }
    }

    const courses = await db.select().from(cmeCoursesCache);
    return courses.map(mapToCatalogCourse);
  }),
});
