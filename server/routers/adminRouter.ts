import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserRoles,
  assignRole,
  removeRole,
  listUsersWithRoles,
  countUsers,
  getDiyUsersForLab,
  getLabByAdmin,
  type AppRole,
} from "../db";

// ─── Platform Admin Router ────────────────────────────────────────────────────
// Manages user roles and seat assignments for the iHeartEcho platform.
// Access: platform_admin role or owner (role === "admin")

export const platformAdminRouter = router({
  /** Check if current user is a platform admin */
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    return ctx.user.role === "admin" || roles.includes("platform_admin");
  }),

  /** List all users with their roles (paginated) */
  listUsers: protectedProcedure
    .input(z.object({
      limit: z.number().max(200).default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const roles = await getUserRoles(ctx.user.id);
      if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
      }
      return listUsersWithRoles(input.limit, input.offset);
    }),

  /** Get total user count */
  userCount: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getUserRoles(ctx.user.id);
    if (ctx.user.role !== "admin" && !roles.includes("platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return countUsers();
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
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
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
      if (!isOwner && !isPlatformAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await assignRole(input.userId, input.role as AppRole, ctx.user.id, input.grantedByLabId);
      return { success: true };
    }),

  /** Remove a role from a user */
  removeRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "premium_user", "diy_admin", "diy_user", "platform_admin"]),
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
      await removeRole(input.userId, input.role as AppRole);
      return { success: true };
    }),

  /** Get my own roles */
  myRoles: protectedProcedure.query(async ({ ctx }) => {
    return getUserRoles(ctx.user.id);
  }),
});

// ─── Lab Seat Management Router ───────────────────────────────────────────────
// DIY Accreditation Tool seat management — controlled by diy_admin role

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
