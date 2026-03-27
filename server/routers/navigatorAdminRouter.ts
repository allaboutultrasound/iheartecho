/*
  navigatorAdminRouter — iHeartEcho™
  Admin procedures for editing Navigator protocol checklist sections.
  All mutations are admin-only (adminProcedure).
  Public read: getModuleSections (returns DB overrides or empty array).
*/
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { navigatorProtocolOverrides } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────
const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string().optional(),
  critical: z.boolean().optional(),
});

const SectionInputSchema = z.object({
  module: z.string(),
  sectionId: z.string(),
  sectionTitle: z.string(),
  probeNote: z.string().optional(),
  items: z.array(ChecklistItemSchema),
  sortOrder: z.number().int(),
});

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const navigatorAdminRouter = router({
  // List all sections for a module (returns DB rows, empty array if none seeded)
  // Public so navigator pages can read overrides without requiring login
  getModuleSections: publicProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(navigatorProtocolOverrides)
        .where(eq(navigatorProtocolOverrides.module, input.module))
        .orderBy(asc(navigatorProtocolOverrides.sortOrder));
      return rows.map((r: typeof navigatorProtocolOverrides.$inferSelect) => ({
        id: r.id,
        module: r.module,
        sectionId: r.sectionId,
        sectionTitle: r.sectionTitle,
        probeNote: r.probeNote ?? "",
        items: JSON.parse(r.items) as Array<{
          id: string;
          label: string;
          detail?: string;
          critical?: boolean;
        }>,
        sortOrder: r.sortOrder,
        updatedAt: r.updatedAt,
      }));
    }),

  // Upsert a single section (insert or update by module+sectionId)
  upsertSection: adminProcedure
    .input(SectionInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await db
        .select({ id: navigatorProtocolOverrides.id })
        .from(navigatorProtocolOverrides)
        .where(
          and(
            eq(navigatorProtocolOverrides.module, input.module),
            eq(navigatorProtocolOverrides.sectionId, input.sectionId)
          )
        )
        .limit(1);

      const itemsJson = JSON.stringify(input.items);

      if (existing.length > 0) {
        await db
          .update(navigatorProtocolOverrides)
          .set({
            sectionTitle: input.sectionTitle,
            probeNote: input.probeNote ?? null,
            items: itemsJson,
            sortOrder: input.sortOrder,
            updatedByUserId: ctx.user.id,
          })
          .where(eq(navigatorProtocolOverrides.id, existing[0].id));
        return { id: existing[0].id, action: "updated" as const };
      } else {
        const result = await db.insert(navigatorProtocolOverrides).values({
          module: input.module,
          sectionId: input.sectionId,
          sectionTitle: input.sectionTitle,
          probeNote: input.probeNote ?? null,
          items: itemsJson,
          sortOrder: input.sortOrder,
          updatedByUserId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { id: Number((result as any).insertId), action: "created" as const };
      }
    }),

  // Delete a section by DB id
  deleteSection: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .delete(navigatorProtocolOverrides)
        .where(eq(navigatorProtocolOverrides.id, input.id));
      return { success: true };
    }),

  // Reorder sections: accepts array of { id, sortOrder }
  reorderSections: adminProcedure
    .input(
      z.array(z.object({ id: z.number(), sortOrder: z.number().int() }))
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await Promise.all(
        input.map((item) =>
          db
            .update(navigatorProtocolOverrides)
            .set({ sortOrder: item.sortOrder })
            .where(eq(navigatorProtocolOverrides.id, item.id))
        )
      );
      return { success: true };
    }),

  // Seed a module from the static defaults (bulk insert — only if module has no rows)
  seedFromStatic: adminProcedure
    .input(
      z.object({
        module: z.string(),
        sections: z.array(SectionInputSchema),
        force: z.boolean().optional(), // if true, delete existing rows first
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      if (input.force) {
        await db
          .delete(navigatorProtocolOverrides)
          .where(eq(navigatorProtocolOverrides.module, input.module));
      } else {
        const existing = await db
          .select({ id: navigatorProtocolOverrides.id })
          .from(navigatorProtocolOverrides)
          .where(eq(navigatorProtocolOverrides.module, input.module))
          .limit(1);
        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Module already has overrides. Use force=true to overwrite.",
          });
        }
      }

      if (input.sections.length === 0) return { inserted: 0 };

      await db.insert(navigatorProtocolOverrides).values(
        input.sections.map((s) => ({
          module: s.module,
          sectionId: s.sectionId,
          sectionTitle: s.sectionTitle,
          probeNote: s.probeNote ?? null,
          items: JSON.stringify(s.items),
          sortOrder: s.sortOrder,
          updatedByUserId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );

      return { inserted: input.sections.length };
    }),
});
