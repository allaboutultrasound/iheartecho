import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import {
  acceptHubTerms,
  createComment,
  createPost,
  deletePost,
  ensureDefaultCommunities,
  getAllCommunities,
  getCommentsByPost,
  getConversationsForUser,
  getMessages,
  getOrCreateConversation,
  getPostById,
  getPostsByCommunity,
  getUserById,
  getUserReactions,
  getUsersByIds,
  logModeration,
  moderateContent,
  sendMessage,
  toggleReaction,
  updateHubProfile,
  createPeerReview,
  getPeerReviews,
  createPolicy,
  getPolicies,
  updatePolicy,
  createQaLog,
  getQaLogs,
  createAucEntry,
  getAucEntries,
  createLabSubscription,
  getLabByAdmin,
  getLabById,
  updateLabSubscription,
  addLabMember,
  getLabMembers,
  updateLabMember,
  removeLabMember,
  createLabPeerReview,
  getLabPeerReviews,
  getStaffQsTrend,
  getLabStaffSnapshot,
  getLabMonthlySummary,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Hub Communities ──────────────────────────────────────────────────────

  hub: router({
    // Seed default communities on first call
    getCommunities: publicProcedure.query(async () => {
      await ensureDefaultCommunities();
      return getAllCommunities();
    }),

    // Accept Hub terms (HIPAA disclaimer)
    acceptTerms: protectedProcedure.mutation(async ({ ctx }) => {
      await acceptHubTerms(ctx.user.id);
      return { success: true };
    }),

    // Update Hub profile (displayName, bio, credentials)
    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().max(100).optional(),
        bio: z.string().max(500).optional(),
        credentials: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateHubProfile(ctx.user.id, input);
        return { success: true };
      }),

    // Get user profile by ID
    getUserProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          id: user.id,
          displayName: user.displayName ?? user.name ?? "Echo Professional",
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          credentials: user.credentials,
        };
      }),

    // ─── Posts ──────────────────────────────────────────────────────────────

    getPosts: publicProcedure
      .input(z.object({
        communityId: z.number(),
        limit: z.number().max(50).default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        const rawPosts = await getPostsByCommunity(input.communityId, input.limit, input.offset);

        // Enrich with author info
        const authorIds = Array.from(new Set(rawPosts.map(p => p.authorId)));
        const authors = await getUsersByIds(authorIds);
        const authorMap = new Map(authors.map(a => [a.id, a]));

        // Get user reactions if logged in
        let likedPostIds = new Set<number>();
        if (ctx.user) {
          const reactions = await getUserReactions(ctx.user.id);
          likedPostIds = new Set(reactions.map(r => r.postId));
        }

        return rawPosts.map(p => ({
          ...p,
          mediaUrls: p.mediaUrls ? JSON.parse(p.mediaUrls) as string[] : [],
          mediaTypes: p.mediaTypes ? JSON.parse(p.mediaTypes) as string[] : [],
          author: {
            id: p.authorId,
            displayName: authorMap.get(p.authorId)?.displayName ?? authorMap.get(p.authorId)?.name ?? "Echo Professional",
            avatarUrl: authorMap.get(p.authorId)?.avatarUrl ?? null,
            credentials: authorMap.get(p.authorId)?.credentials ?? null,
          },
          isLiked: likedPostIds.has(p.id),
        }));
      }),

    createPost: protectedProcedure
      .input(z.object({
        communityId: z.number(),
        content: z.string().min(1).max(5000),
        mediaUrls: z.array(z.string()).optional(),
        mediaTypes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-moderation
        const mod = moderateContent(input.content);
        if (!mod.approved) {
          await logModeration({
            targetType: "post",
            targetId: 0,
            action: "auto_reject",
            reason: mod.reason,
            triggeredBy: "auto",
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: mod.reason });
        }

        await createPost({
          authorId: ctx.user.id,
          communityId: input.communityId,
          content: input.content,
          mediaUrls: input.mediaUrls,
          mediaTypes: input.mediaTypes,
        });
        return { success: true };
      }),

    deletePost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePost(input.postId, ctx.user.id);
        return { success: true };
      }),

    toggleReaction: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await toggleReaction(input.postId, ctx.user.id);
        return { liked };
      }),

    // ─── Comments ────────────────────────────────────────────────────────────

    getComments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const rawComments = await getCommentsByPost(input.postId);
        const authorIds = Array.from(new Set(rawComments.map(c => c.authorId)));
        const authors = await getUsersByIds(authorIds);
        const authorMap = new Map(authors.map(a => [a.id, a]));
        return rawComments.map(c => ({
          ...c,
          author: {
            id: c.authorId,
            displayName: authorMap.get(c.authorId)?.displayName ?? authorMap.get(c.authorId)?.name ?? "Echo Professional",
            avatarUrl: authorMap.get(c.authorId)?.avatarUrl ?? null,
            credentials: authorMap.get(c.authorId)?.credentials ?? null,
          },
        }));
      }),

    createComment: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const mod = moderateContent(input.content);
        if (!mod.approved) {
          throw new TRPCError({ code: "BAD_REQUEST", message: mod.reason });
        }
        await createComment({
          postId: input.postId,
          authorId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        });
        return { success: true };
      }),

    // ─── Media Upload ────────────────────────────────────────────────────────

    getUploadUrl: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number().max(50 * 1024 * 1024), // 50MB max
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate content type
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
        if (!allowed.includes(input.contentType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File type not allowed. Supported: JPEG, PNG, GIF, WebP, MP4, WebM, MOV." });
        }
        const ext = input.filename.split(".").pop() ?? "bin";
        const key = `hub-media/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        // Return the key for client-side upload via presigned URL
        // For simplicity, we return a direct upload endpoint
        return { key, uploadEndpoint: `/api/upload?key=${encodeURIComponent(key)}` };
      }),

    // ─── Direct Messages ─────────────────────────────────────────────────────

    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const convos = await getConversationsForUser(ctx.user.id);
      // Enrich with other participant info
      const otherIds = convos.map(c =>
        c.participantA === ctx.user.id ? c.participantB : c.participantA
      );
      const others = await getUsersByIds(otherIds);
      const otherMap = new Map(others.map(u => [u.id, u]));
      return convos.map(c => {
        const otherId = c.participantA === ctx.user.id ? c.participantB : c.participantA;
        const other = otherMap.get(otherId);
        return {
          ...c,
          otherUser: {
            id: otherId,
            displayName: other?.displayName ?? other?.name ?? "Echo Professional",
            avatarUrl: other?.avatarUrl ?? null,
          },
        };
      });
    }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user is a participant
        const convos = await getConversationsForUser(ctx.user.id);
        const isParticipant = convos.some(c => c.id === input.conversationId);
        if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });
        return getMessages(input.conversationId);
      }),

    startConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.otherUserId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself." });
        }
        const convo = await getOrCreateConversation(ctx.user.id, input.otherUserId);
        return convo;
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "video", "file"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify participant
        const convos = await getConversationsForUser(ctx.user.id);
        const isParticipant = convos.some(c => c.id === input.conversationId);
        if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

        const mod = moderateContent(input.content);
        if (!mod.approved) {
          throw new TRPCError({ code: "BAD_REQUEST", message: mod.reason });
        }

        await sendMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.content,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
        });
        return { success: true };
      }),
  }),

  // ─── Accreditation ────────────────────────────────────────────────────────────

  accreditation: router({
  // Peer Reviews
  createPeerReview: protectedProcedure
    .input(z.object({
      patientId: z.string().optional(),
      studyDate: z.string().optional(),
      modality: z.enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS"]),
      sonographerInitials: z.string().optional(),
      imageQuality: z.enum(["excellent", "good", "adequate", "poor"]).optional(),
      imageQualityNotes: z.string().optional(),
      reportAccuracy: z.enum(["accurate", "minor_discrepancy", "major_discrepancy"]).optional(),
      reportNotes: z.string().optional(),
      technicalAdherence: z.enum(["full", "partial", "non_adherent"]).optional(),
      technicalNotes: z.string().optional(),
      overallScore: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
      status: z.enum(["draft", "submitted", "complete"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createPeerReview({ ...input, reviewerId: ctx.user.id });
    }),

  getPeerReviews: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return getPeerReviews(ctx.user.id, input.limit, input.offset);
    }),

  // Policies
  createPolicy: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.enum(["infection_control", "equipment", "patient_safety", "protocol", "staff_competency", "quality_assurance", "appropriate_use", "report_turnaround", "emergency", "other"]),
      modality: z.enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "All"]).optional(),
      content: z.string().min(1),
      version: z.string().optional(),
      effectiveDate: z.string().optional(),
      reviewDate: z.string().optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createPolicy({ ...input, authorId: ctx.user.id });
    }),

  getPolicies: protectedProcedure
    .query(async ({ ctx }) => {
      return getPolicies(ctx.user.id);
    }),

  updatePolicy: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      category: z.enum(["infection_control", "equipment", "patient_safety", "protocol", "staff_competency", "quality_assurance", "appropriate_use", "report_turnaround", "emergency", "other"]).optional(),
      content: z.string().optional(),
      version: z.string().optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
      reviewDate: z.string().optional(),
      effectiveDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updatePolicy(id, data);
    }),

  // QA Logs
  createQaLog: protectedProcedure
    .input(z.object({
      category: z.enum(["equipment", "protocol", "image_quality", "report_turnaround", "staff_competency", "infection_control", "patient_safety", "other"]),
      title: z.string().min(1),
      description: z.string().optional(),
      finding: z.enum(["pass", "fail", "needs_improvement", "na"]).optional(),
      actionRequired: z.string().optional(),
      actionTaken: z.string().optional(),
      dueDate: z.string().optional(),
      attachmentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createQaLog({ ...input, userId: ctx.user.id });
    }),

  getQaLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(30), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return getQaLogs(ctx.user.id, input.limit, input.offset);
    }),

  // Appropriate Use Cases
  createAucEntry: protectedProcedure
    .input(z.object({
      studyDate: z.string().optional(),
      modality: z.enum(["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS"]),
      indication: z.string().min(1),
      appropriatenessRating: z.enum(["appropriate", "may_be_appropriate", "rarely_appropriate", "unknown"]).optional(),
      clinicalScenario: z.string().optional(),
      outcome: z.string().optional(),
      notes: z.string().optional(),
      flagged: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createAucEntry({ ...input, userId: ctx.user.id });
    }),

  getAucEntries: protectedProcedure
    .input(z.object({ limit: z.number().default(30), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return getAucEntries(ctx.user.id, input.limit, input.offset);
    }),
   }),

  // ─── Lab Subscription Router ────────────────────────────────────────────────
  lab: router({
    // Subscription management
    createLab: protectedProcedure
      .input(z.object({
        labName: z.string().min(1).max(200),
        labAddress: z.string().optional(),
        labPhone: z.string().optional(),
        plan: z.enum(["basic", "professional", "enterprise"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getLabByAdmin(ctx.user.id);
        if (existing) throw new Error("You already have a lab subscription.");
        return createLabSubscription({ ...input, adminUserId: ctx.user.id });
      }),

    getMyLab: protectedProcedure
      .query(async ({ ctx }) => {
        return getLabByAdmin(ctx.user.id);
      }),

    updateLab: protectedProcedure
      .input(z.object({
        labName: z.string().min(1).max(200).optional(),
        labAddress: z.string().optional(),
        labPhone: z.string().optional(),
        plan: z.enum(["basic", "professional", "enterprise"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        // Update seats if plan changed
        const seats = input.plan === "enterprise" ? 999 : input.plan === "professional" ? 25 : input.plan === "basic" ? 5 : undefined;
        await updateLabSubscription(lab.id, { ...input, ...(seats ? { seats } : {}) });
        return { success: true };
      }),

    upgradePlan: protectedProcedure
      .input(z.object({ plan: z.enum(["basic", "professional", "enterprise"]) }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        const seats = input.plan === "enterprise" ? 999 : input.plan === "professional" ? 25 : 5;
        await updateLabSubscription(lab.id, { plan: input.plan, seats, status: "active" });
        return { success: true };
      }),

    // Staff management
    addMember: protectedProcedure
      .input(z.object({
        inviteEmail: z.string().email(),
        displayName: z.string().optional(),
        credentials: z.string().optional(),
        role: z.enum(["admin", "reviewer", "sonographer"]).optional(),
        specialty: z.string().optional(),
        department: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab subscription found. Please create a lab first.");
        const members = await getLabMembers(lab.id);
        if (members.length >= lab.seats) throw new Error(`Seat limit reached (${lab.seats}). Upgrade your plan to add more staff.`);
        return addLabMember({ ...input, labId: lab.id });
      }),

    getMembers: protectedProcedure
      .query(async ({ ctx }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getLabMembers(lab.id);
      }),

    updateMember: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        displayName: z.string().optional(),
        credentials: z.string().optional(),
        role: z.enum(["admin", "reviewer", "sonographer"]).optional(),
        specialty: z.string().optional(),
        department: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        const { memberId, ...data } = input;
        await updateLabMember(memberId, data);
        return { success: true };
      }),

    removeMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        await removeLabMember(input.memberId);
        return { success: true };
      }),

    // Lab peer reviews
    createLabReview: protectedProcedure
      .input(z.object({
        peerReviewId: z.number(),
        revieweeId: z.number(),
        qualityScore: z.number().min(0).max(100).optional(),
        qualityTier: z.enum(["Excellent", "Good", "Adequate", "Needs Improvement"]).optional(),
        iqScore: z.number().min(0).max(100).optional(),
        raScore: z.number().min(0).max(100).optional(),
        taScore: z.number().min(0).max(100).optional(),
        reviewMonth: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        return createLabPeerReview({ ...input, labId: lab.id, reviewerId: ctx.user.id });
      }),

    getLabReviews: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getLabPeerReviews(lab.id, input.limit, input.offset);
      }),

    // Analytics
    getStaffTrend: protectedProcedure
      .input(z.object({ revieweeId: z.number(), months: z.number().default(12) }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getStaffQsTrend(lab.id, input.revieweeId, input.months);
      }),

    getStaffSnapshot: protectedProcedure
      .query(async ({ ctx }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getLabStaffSnapshot(lab.id);
      }),

    getMonthlySummary: protectedProcedure
      .input(z.object({ months: z.number().default(12) }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getLabMonthlySummary(lab.id, input.months);
      }),
  }),
});
export type AppRouter = typeof appRouter;
