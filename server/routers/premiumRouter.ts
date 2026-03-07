/**
 * Premium Access Router
 *
 * Handles premium membership status for the iHeartEcho App Premium Access
 * membership ($9/month) sold via Thinkific at:
 * https://member.allaboutultrasound.com/order?ct=d0290929-3906-48ab-8c3a-ff71e2748af0
 *
 * Procedures:
 *  - premium.getStatus        — returns the current user's premium status
 *  - premium.checkAndSync     — re-checks Thinkific and syncs isPremium in DB
 *  - premium.adminGrant       — admin: manually grant premium to a user by email
 *  - premium.adminRevoke      — admin: manually revoke premium from a user by email
 *  - premium.adminListPremium — admin: list all premium users
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserByEmail, getUserById, setPremiumStatus } from "../db";
import { getUserByEmail as getThinkificUserByEmail, getEnrollmentsByUserId } from "../thinkific";

/** The Thinkific membership product slug for iHeartEcho Premium Access */
export const PREMIUM_MEMBERSHIP_SLUG = "iheartecho-app-premium-access";

/**
 * Check if a Thinkific user is enrolled in the iHeartEcho Premium membership.
 * We look for a membership enrollment by checking the membership_id field.
 * Thinkific membership enrollments appear as enrollments with a membership_id set.
 */
export async function checkThinkificPremiumByEmail(email: string): Promise<boolean> {
  try {
    const thinkificUser = await getThinkificUserByEmail(email);
    if (!thinkificUser) return false;
    const enrollments = await getEnrollmentsByUserId(thinkificUser.id);
    // Check if any enrollment is for the premium membership
    // Thinkific membership enrollments have a membership_id field
    return enrollments.some((e) => {
      // Thinkific membership enrollments may carry extra fields not in the base type
      const extra = e as unknown as Record<string, unknown>;
      const slug = (extra.membership_slug as string | undefined) ?? "";
      const membershipId = extra.membership_id;
      return (
        slug === PREMIUM_MEMBERSHIP_SLUG ||
        (membershipId !== null && membershipId !== undefined)
      );
    });
  } catch (err) {
    console.error("[Premium] Error checking Thinkific premium status:", err);
    return false;
  }
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const premiumRouter = router({
  /**
   * Get the current user's premium status.
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return {
      isPremium: user.isPremium,
      premiumGrantedAt: user.premiumGrantedAt ?? null,
      premiumSource: user.premiumSource ?? null,
      checkoutUrl: "https://member.allaboutultrasound.com/order?ct=d0290929-3906-48ab-8c3a-ff71e2748af0",
      manageUrl: `https://member.allaboutultrasound.com/users/sign_in`,
    };
  }),

  /**
   * Re-check Thinkific and sync the user's isPremium flag.
   * Called when a user returns from the Thinkific checkout page.
   */
  checkAndSync: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    if (!user.email) {
      return { isPremium: false, changed: false, message: "No email on account" };
    }
    const hasPremium = await checkThinkificPremiumByEmail(user.email);
    const changed = hasPremium !== user.isPremium;
    if (changed) {
      await setPremiumStatus(user.id, hasPremium, "thinkific");
    }
    return {
      isPremium: hasPremium,
      changed,
      message: changed
        ? hasPremium
          ? "Premium access granted — welcome!"
          : "Premium access has been removed"
        : hasPremium
        ? "Premium access is active"
        : "No active premium membership found",
    };
  }),

  /**
   * Admin: manually grant premium access to a user by email.
   */
  adminGrant: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      await setPremiumStatus(user.id, true, "admin");
      return { success: true, userId: user.id, email: user.email };
    }),

  /**
   * Admin: manually revoke premium access from a user by email.
   */
  adminRevoke: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      await setPremiumStatus(user.id, false, "admin");
      return { success: true, userId: user.id, email: user.email };
    }),

  /**
   * Admin: list all users with active premium access.
   */
  adminListPremium: adminProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        displayName: users.displayName,
        isPremium: users.isPremium,
        premiumGrantedAt: users.premiumGrantedAt,
        premiumSource: users.premiumSource,
      })
      .from(users)
      .where(eq(users.isPremium, true))
      .orderBy(desc(users.premiumGrantedAt));
  }),
});
