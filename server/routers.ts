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
  createEchoCase,
  getEchoCasesByUser,
  getEchoCaseById,
  createStrainSnapshot,
  getStrainSnapshotsByCase,
  getStrainSnapshotsByUser,
  createImageQualityReview,
  getImageQualityReviewsByUser,
  getImageQualityReviewById,
  updateImageQualityReview,
  deleteImageQualityReview,
  getIqrStats,
  // Lab IQR analytics
  getIQRReviewsByLab,
  getLabStaffIQRStats,
  getStaffIQRTrend,
  getStaffIQRDomainBreakdown,
  getLabIQRMonthlySummary,
  getLabMembersWithIQRStats,
  createEchoCorrelation,
  getEchoCorrelationsByUser,
  getEchoCorrelationById,
  updateEchoCorrelation,
  deleteEchoCorrelation,
  getEchoCorrelationsByLab,
  getCaseMix,
  getLabByMemberUserId,
  createPhysicianPeerReview,
  getPhysicianPeerReviewsByUser,
  getPhysicianPeerReviewsByLab,
  getPhysicianPeerReviewById,
  updatePhysicianPeerReview,
  deletePhysicianPeerReview,
  getPhysicianPeerReviewStaffSnapshot,
  getPhysicianPeerReviewMonthlySummary,
  getPhysicianPeerReviewTrend,
  createPhysicianNotification,
  getPhysicianNotifications,
  countUnreadPhysicianNotifications,
  markPhysicianNotificationRead,
  markAllPhysicianNotificationsRead,
  dismissPhysicianNotification,
  getAccreditationReadiness,
  saveAccreditationReadiness,
  getAccreditationReadinessNavigator,
  saveAccreditationReadinessNavigator,
  getReadinessAutoChecks,
  createCaseMixSubmission,
  getCaseMixSubmissions,
  getCaseMixSummary,
  deleteCaseMixSubmission,
  updateCaseMixSubmissionStatus,
  getCmeStaffSummary,
  getCmeEntriesForMember,
  addCmeEntry,
  deleteCmeEntry,
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
        accreditationTypes: z.array(z.enum(["adult_echo", "pediatric_fetal_echo"])).optional(),
        accreditationOnboardingComplete: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) throw new Error("No lab found.");
        // Update seats if plan changed
        const seats = input.plan === "enterprise" ? 999 : input.plan === "professional" ? 25 : input.plan === "basic" ? 5 : undefined;
        const { accreditationTypes, ...rest } = input;
        await updateLabSubscription(lab.id, {
          ...rest,
          ...(seats ? { seats } : {}),
          ...(accreditationTypes !== undefined ? { accreditationTypes: JSON.stringify(accreditationTypes) } : {}),
        });
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
        role: z.enum(["admin", "medical_director", "technical_director", "medical_staff", "technical_staff"]).optional(),
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
        role: z.enum(["admin", "medical_director", "technical_director", "medical_staff", "technical_staff"]).optional(),
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

    // ─── IQR Analytics (real data from imageQualityReviews) ──────────────────

    /** Lab-wide IQR snapshot: avg score + review count per staff member */
    getIqrStaffSnapshot: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) return [];
      return getLabStaffIQRStats(lab.id);
    }),

    /** Monthly IQR quality score trend for a specific staff member */
    getIqrStaffTrend: protectedProcedure
      .input(z.object({ revieweeLabMemberId: z.number(), months: z.number().default(12) }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getStaffIQRTrend(lab.id, input.revieweeLabMemberId);
      }),

    /** Domain-level breakdown for a specific staff member */
    getIqrDomainBreakdown: protectedProcedure
      .input(z.object({ revieweeLabMemberId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getStaffIQRDomainBreakdown(lab.id, input.revieweeLabMemberId);
      }),

    /** Monthly lab-wide IQR summary for the Reports tab */
    getIqrMonthlySummary: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) return [];
      return getLabIQRMonthlySummary(lab.id);
    }),

    /** Lab members enriched with IQR stats (for Staff tab) */
    getMembersWithIqrStats: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) return [];
      return getLabMembersWithIQRStats(lab.id);
    }),
  }),
  // ─── Strain Navigator ────────────────────────────────────────────────────────

  strain: router({
    // List current user's echo cases for the case picker
    listMyCases: protectedProcedure.query(async ({ ctx }) => {
      return getEchoCasesByUser(ctx.user.id, 50, 0);
    }),

    // Save a strain snapshot to an existing case (or without a case)
    saveSnapshot: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        segmentValues: z.string(),
        wallMotionScores: z.string().optional(),
        lvGls: z.string().nullable().optional(),
        rvStrain: z.string().nullable().optional(),
        laStrain: z.string().nullable().optional(),
        wmsi: z.string().nullable().optional(),
        vendor: z.string().nullable().optional(),
        frameRate: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let caseTitle: string | null = null;
        if (input.caseId) {
          const echoCase = await getEchoCaseById(input.caseId);
          if (!echoCase || echoCase.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
          }
          caseTitle = echoCase.title;
        }
        await createStrainSnapshot({
          userId: ctx.user.id,
          caseId: input.caseId ?? null,
          caseTitle,
          segmentValues: input.segmentValues,
          wallMotionScores: input.wallMotionScores ?? null,
          lvGls: input.lvGls ?? null,
          rvStrain: input.rvStrain ?? null,
          laStrain: input.laStrain ?? null,
          wmsi: input.wmsi ?? null,
          vendor: input.vendor ?? null,
          frameRate: input.frameRate ?? null,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),

    // Create a new echo case AND save the snapshot in one step
    createCaseAndSaveSnapshot: protectedProcedure
      .input(z.object({
        caseTitle: z.string().min(1).max(200),
        segmentValues: z.string(),
        wallMotionScores: z.string().optional(),
        lvGls: z.string().nullable().optional(),
        rvStrain: z.string().nullable().optional(),
        laStrain: z.string().nullable().optional(),
        wmsi: z.string().nullable().optional(),
        vendor: z.string().nullable().optional(),
        frameRate: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create the case first
        await createEchoCase({
          userId: ctx.user.id,
          title: input.caseTitle,
        });
        // Get the newly created case
        const cases = await getEchoCasesByUser(ctx.user.id, 1, 0);
        const newCase = cases[0];
        // Save the snapshot attached to the new case
        await createStrainSnapshot({
          userId: ctx.user.id,
          caseId: newCase?.id ?? null,
          caseTitle: input.caseTitle,
          segmentValues: input.segmentValues,
          wallMotionScores: input.wallMotionScores ?? null,
          lvGls: input.lvGls ?? null,
          rvStrain: input.rvStrain ?? null,
          laStrain: input.laStrain ?? null,
          wmsi: input.wmsi ?? null,
          vendor: input.vendor ?? null,
          frameRate: input.frameRate ?? null,
          notes: input.notes ?? null,
        });
        return { success: true, caseId: newCase?.id };
      }),

    // Get all snapshots for a specific case
    getSnapshotsByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const echoCase = await getEchoCaseById(input.caseId);
        if (!echoCase || echoCase.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
        }
        return getStrainSnapshotsByCase(input.caseId);
      }),

    // Get recent snapshots for the current user
    getMySnapshots: protectedProcedure.query(async ({ ctx }) => {
      return getStrainSnapshotsByUser(ctx.user.id, 20);
    }),
  }),
  // ─── Image Quality Reviews ──────────────────────────────────────────────────

  iqr: router({
    create: protectedProcedure
      .input(z.object({
        reviewType: z.string(),
        organization: z.string().optional(),
        dateReviewCompleted: z.string().optional(),
        examDos: z.string().optional(),
        examIdentifier: z.string().optional(),
        facilityLocation: z.string().optional(),
        performingSonographer: z.string().optional(),
        interpretingPhysician: z.string().optional(),
        referringPhysician: z.string().optional(),
        examType: z.string().optional(),
        examScope: z.string().optional(),
        stressType: z.string().optional(),
        examIndication: z.string().optional(),
        indicationAppropriateness: z.string().optional(),
        demographicsAccurate: z.string().optional(),
        protocolViews: z.string().optional(),
        protocolViewsOther: z.string().optional(),
        gainSettings: z.string().optional(),
        gainSettingsOther: z.string().optional(),
        depthSettings: z.string().optional(),
        depthSettingsOther: z.string().optional(),
        focalZoneSettings: z.string().optional(),
        focalZoneDeficiencies: z.string().optional(),
        colorizeSettings: z.string().optional(),
        colorizeSettingsOther: z.string().optional(),
        zoomSettings: z.string().optional(),
        zoomSettingsOther: z.string().optional(),
        ecgDisplay: z.string().optional(),
        ecgDisplayDeficiencies: z.string().optional(),
        contrastUseAppropriate: z.string().optional(),
        contrastSettingsAppropriate: z.string().optional(),
        onAxisImaging: z.string().optional(),
        effortSuboptimalViews: z.string().optional(),
        measurements2dComplete: z.string().optional(),
        measurements2dAccurate: z.string().optional(),
        psaxLvComplete: z.string().optional(),
        ventricularFunctionAccurate: z.string().optional(),
        efMeasurementsAccurate: z.string().optional(),
        simpsonsEfAccurate: z.string().optional(),
        laVolumeAccurate: z.string().optional(),
        dopplerMeasurementsComplete: z.string().optional(),
        dopplerMeasurementsAccurate: z.string().optional(),
        dopplerVentricularFunction: z.string().optional(),
        dopplerWaveformSettings: z.string().optional(),
        dopplerMeasurementAccuracy: z.string().optional(),
        forwardFlowSpectrum: z.string().optional(),
        pwDopplerPlacement: z.string().optional(),
        cwDopplerPlacement: z.string().optional(),
        spectralEnvelopePeaks: z.string().optional(),
        colorFlowInterrogation: z.string().optional(),
        colorDopplerIasIvs: z.string().optional(),
        diastolicFunctionEval: z.string().optional(),
        pulmonaryVeinInflow: z.string().optional(),
        rightHeartFunctionEval: z.string().optional(),
        tapseAccurate: z.string().optional(),
        tissueDopplerAdequate: z.string().optional(),
        dopplerWaveformSettingsPeer: z.string().optional(),
        dopplerSampleVolumesPeer: z.string().optional(),
        aorticValveDoppler: z.string().optional(),
        lvotDopplerPlacement: z.string().optional(),
        pedoffCwUtilized: z.string().optional(),
        pedoffCwEnvelope: z.string().optional(),
        pedoffCwLabelled: z.string().optional(),
        mitralValveDoppler: z.string().optional(),
        mrEvaluationMethods: z.string().optional(),
        pisaEroMeasurements: z.string().optional(),
        tricuspidValveDoppler: z.string().optional(),
        pulmonicValveDoppler: z.string().optional(),
        aorticValvePeer: z.string().optional(),
        mitralValvePeer: z.string().optional(),
        tricuspidValvePeer: z.string().optional(),
        pulmonicValvePeer: z.string().optional(),
        diastologyPeer: z.string().optional(),
        rightHeartPeer: z.string().optional(),
        additionalImagingMethods: z.string().optional(),
        strainPerformed: z.string().optional(),
        strainCorrect: z.string().optional(),
        threeDPerformed: z.string().optional(),
        imageOptimizationSummary: z.string().optional(),
        measurementAccuracySummary: z.string().optional(),
        dopplerSettingsSummary: z.string().optional(),
        protocolSequenceFollowed: z.string().optional(),
        pathologyDocumented: z.string().optional(),
        clinicalQuestionAnswered: z.string().optional(),
        reportConcordant: z.string().optional(),
        comparableToPreview: z.string().optional(),
        iacAcceptable: z.string().optional(),
        scanStartTime: z.string().optional(),
        scanEndTime: z.string().optional(),
        imagingTimeMinutes: z.number().optional(),
        scanningTimeType: z.string().optional(),
        qualityScore: z.number().optional(),
        reviewComments: z.string().optional(),
        reviewer: z.string().optional(),
        reviewerEmail: z.string().optional(),
        notifyAdmin: z.string().optional(),
        notifySonographer: z.string().optional(),
        revieweeLabMemberId: z.number().optional(),
        comparableToPrevious: z.string().optional(),
        dob: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Map comparableToPrevious → comparableToPreview for DB compatibility
        const { comparableToPrevious, dob: _dob, ...rest } = input;
        const review = await createImageQualityReview({ ...rest, comparableToPreview: comparableToPrevious, userId: ctx.user.id });
        return review;
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return getImageQualityReviewsByUser(ctx.user.id, input.limit, input.offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const review = await getImageQualityReviewById(input.id);
        if (!review || review.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return review;
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ ctx, input }) => {
        const { id, comparableToPrevious, dob: _dob, ...data } = input as Record<string, unknown> & { id: number; comparableToPrevious?: string; dob?: string };
        const mapped = { ...data, ...(comparableToPrevious !== undefined ? { comparableToPreview: comparableToPrevious } : {}) };
        await updateImageQualityReview(id, ctx.user.id, mapped as Parameters<typeof updateImageQualityReview>[2]);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteImageQualityReview(input.id, ctx.user.id);
        return { success: true };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getIqrStats(ctx.user.id);
    }),
    getLabStaffForReview: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return { sonographers: [], physicians: [], labName: null };
      const members = await getLabMembers(lab.id);
      const sonographers = members.filter(m => m.role === 'technical_director' || m.role === 'technical_staff' || m.role === 'admin');
      const physicians = members.filter(m => m.role === 'medical_director' || m.role === 'medical_staff' || m.role === 'admin');
      return {
        labName: lab.labName,
        sonographers: sonographers.map(m => ({ id: m.id, name: m.displayName ?? m.inviteEmail, role: m.role })),
        physicians: physicians.map(m => ({ id: m.id, name: m.displayName ?? m.inviteEmail, role: m.role })),
      };
    }),
  }),

  // ─── Echo Correlation ─────────────────────────────────────────────────────
  echoCorrelation: router({
    create: protectedProcedure
      .input(z.object({
        organization: z.string().optional(),
        dateReviewCompleted: z.string().optional(),
        examIdentifier: z.string().optional(),
        examType: z.string().optional(),
        correlation1Type: z.string().optional(),
        correlation1TypeOther: z.string().optional(),
        correlation2Type: z.string().optional(),
        correlation2TypeOther: z.string().optional(),
        originalExamDos: z.string().optional(),
        correlation1Dos: z.string().optional(),
        correlation2Dos: z.string().optional(),
        originalFindings: z.string().optional(),
        corr1Findings: z.string().optional(),
        corr2Findings: z.string().optional(),
        concordance1: z.string().optional(),
        concordance2: z.string().optional(),
        overallConcordanceRate: z.number().optional(),
        varianceNotes: z.string().optional(),
        reviewerName: z.string().optional(),
        reviewerEmail: z.string().optional(),
        labId: z.number().optional(),
        revieweeId: z.string().optional(),
        revieweeName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createEchoCorrelation({ ...input, userId: ctx.user.id });
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx }) => {
        return getEchoCorrelationsByUser(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const record = await getEchoCorrelationById(input.id);
        if (!record || record.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return record;
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const existing = await getEchoCorrelationById(id);
        if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await updateEchoCorrelation(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getEchoCorrelationById(input.id);
        if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteEchoCorrelation(input.id);
        return { success: true };
      }),

    getByLab: protectedProcedure
      .input(z.object({ labId: z.number() }))
      .query(async ({ input }) => {
        return getEchoCorrelationsByLab(input.labId);
      }),
  }),

    // ─── Case Mix Tracker (legacy get, merged into new caseMix router below) ───

  // ─── Physician Peer Review ───────────────────────────────────────────────
  physicianPeerReview: router({
    /** Create a new Physician Peer Review */
    create: protectedProcedure
      .input(z.object({
        labId: z.number().optional(),
        facilityAccountNumber: z.string().optional(),
        organization: z.string().optional(),
        dateReviewCompleted: z.string().optional(),
        examIdentifier: z.string().optional(),
        dob: z.string().optional(),
        examDos: z.string().optional(),
        examType: z.string().optional(),
        // Staff linkage
        revieweeLabMemberId: z.number().optional(),
        revieweeName: z.string().optional(),
        reviewerLabMemberId: z.number().optional(),
        reviewerName: z.string().optional(),
        qualityReviewAssignedBy: z.string().optional(),
        reviewerEmail: z.string().optional(),
        // Stress
        postStressDopplerPerformed: z.string().optional(),
        // Shared findings
        situs: z.string().optional(),
        cardiacPosition: z.string().optional(),
        leftHeart: z.string().optional(),
        rightHeart: z.string().optional(),
        efPercent: z.string().optional(),
        lvWallThickness: z.string().optional(),
        ventricularSeptalDefect: z.string().optional(),
        atrialSeptalDefect: z.string().optional(),
        patentForamenOvale: z.string().optional(),
        lvChamberSize: z.string().optional(),
        laChamberSize: z.string().optional(),
        rvChamberSize: z.string().optional(),
        raChamberSize: z.string().optional(),
        regionalWallMotionAbnormalities: z.string().optional(),
        aorticValve: z.string().optional(),
        mitralValve: z.string().optional(),
        tricuspidValve: z.string().optional(),
        pulmonicValve: z.string().optional(),
        aorticStenosis: z.string().optional(),
        aorticInsufficiency: z.string().optional(),
        mitralStenosis: z.string().optional(),
        mitralRegurgitation: z.string().optional(),
        tricuspidStenosis: z.string().optional(),
        tricuspidRegurgitation: z.string().optional(),
        pulmonicStenosis: z.string().optional(),
        pulmonicInsufficiency: z.string().optional(),
        rvspmm: z.string().optional(),
        pericardialEffusion: z.string().optional(),
        // Pediatric extra
        peripheralPulmonaryStenosis: z.string().optional(),
        pulmonaryVeins: z.string().optional(),
        coronaryAnatomy: z.string().optional(),
        aorticArch: z.string().optional(),
        greatVessels: z.string().optional(),
        pdaDuctalArch: z.string().optional(),
        conotruncalAnatomy: z.string().optional(),
        // Stress
        restingEfPercent: z.string().optional(),
        postStressEfPercent: z.string().optional(),
        restingRwma: z.string().optional(),
        postStressRwma: z.string().optional(),
        responseToStress: z.string().optional(),
        stressAorticStenosis: z.string().optional(),
        stressAorticInsufficiency: z.string().optional(),
        stressMitralStenosis: z.string().optional(),
        stressMitralRegurgitation: z.string().optional(),
        stressTricuspidStenosis: z.string().optional(),
        stressTricuspidRegurgitation: z.string().optional(),
        stressPulmonicStenosis: z.string().optional(),
        stressPulmonicInsufficiency: z.string().optional(),
        stressRvspmm: z.string().optional(),
        // Fetal
        fetalBiometry: z.string().optional(),
        fetalPosition: z.string().optional(),
        fetalHeartRateRhythm: z.string().optional(),
        // Other
        otherFindings1: z.string().optional(),
        otherFindings2: z.string().optional(),
        otherFindings3: z.string().optional(),
        reviewComments: z.string().optional(),
        concordanceScore: z.number().optional(),
        discordanceFields: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const labId = input.labId ?? (await getLabByMemberUserId(ctx.user.id))?.id;
        const review = await createPhysicianPeerReview({ ...input, userId: ctx.user.id, labId });

        // ── Trigger notification to the reviewed physician ──────────────────────
        // Only send if the reviewee is a linked lab member with a userId
        if (input.revieweeLabMemberId && review) {
          try {
            // Look up the lab member to get their userId
            const labMembers = labId ? await getLabMembers(labId) : [];
            const revieweeMember = labMembers.find(m => m.id === input.revieweeLabMemberId);
            if (revieweeMember?.userId) {
              const examType = input.examType ?? "Echo";
              const examDate = input.examDos ?? input.dateReviewCompleted ?? new Date().toLocaleDateString();
              const reviewerName = input.reviewerName ?? ctx.user.name ?? "A reviewer";
              const concordance = input.concordanceScore != null ? `${input.concordanceScore}%` : "N/A";
              const discordant = input.discordanceFields
                ? JSON.parse(input.discordanceFields).slice(0, 5).join(", ")
                : "None";

              const title = `Physician Peer Review Result — ${examType} (${examDate})`;
              const message = [
                `A Physician Peer Review has been completed for your ${examType} study dated ${examDate}.`,
                ``,
                `**Concordance Score:** ${concordance}`,
                `**Discordant Fields:** ${discordant}`,
                input.reviewComments ? `**Reviewer Comments:** ${input.reviewComments}` : null,
                ``,
                `Reviewed by: ${reviewerName}`,
              ].filter(Boolean).join("\n");

              await createPhysicianNotification({
                recipientUserId: revieweeMember.userId,
                recipientLabMemberId: input.revieweeLabMemberId,
                reviewId: (review as unknown as { insertId: number }).insertId ?? 0,
                title,
                message,
                payload: {
                  concordanceScore: input.concordanceScore,
                  discordantFields: input.discordanceFields ? JSON.parse(input.discordanceFields) : [],
                  reviewerName,
                  examType,
                  examDate,
                },
              });
            }
          } catch (notifErr) {
            // Notification failure should not block review creation
            console.warn("[PhysicianPeerReview] Notification failed:", notifErr);
          }
        }

        return review;
      }),

    /** List Physician Peer Reviews for the current user */
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return getPhysicianPeerReviewsByUser(ctx.user.id, input.limit, input.offset);
      }),

    /** Get a single Physician Peer Review by ID */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const review = await getPhysicianPeerReviewById(input.id);
        if (!review || review.userId !== ctx.user.id) return null;
        return review;
      }),

    /** Delete a Physician Peer Review */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePhysicianPeerReview(input.id, ctx.user.id);
        return { success: true };
      }),

    /** Get lab staff (physician role) for the dropdowns */
    getLabStaffForReview: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return { physicians: [] };
      const members = await getLabMembers(lab.id);
      const physicians = members.filter(m => m.role === "medical_director" || m.role === "medical_staff" || m.role === "admin");
      return { physicians };
    }),

    /** Lab-wide staff snapshot for Analytics tab */
    getStaffSnapshot: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) return [];
      return getPhysicianPeerReviewStaffSnapshot(lab.id);
    }),

    /** Monthly summary for Reports tab */
    getMonthlySummary: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByAdmin(ctx.user.id);
      if (!lab) return [];
      return getPhysicianPeerReviewMonthlySummary(lab.id);
    }),

    /** Trend for a specific physician */
    getPhysicianTrend: protectedProcedure
      .input(z.object({ revieweeLabMemberId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByAdmin(ctx.user.id);
        if (!lab) return [];
        return getPhysicianPeerReviewTrend(lab.id, input.revieweeLabMemberId);
      }),
  }),

  // ─── Physician Notifications ─────────────────────────────────────────────
  notification: router({
    /** Get all notifications for the current user */
    getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await getPhysicianNotifications(ctx.user.id);
      return notifications.map(n => ({
        ...n,
        payload: n.payload ? JSON.parse(n.payload) : null,
      }));
    }),
    /** Count unread notifications */
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return countUnreadPhysicianNotifications(ctx.user.id);
    }),
    /** Mark a single notification as read */
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markPhysicianNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    /** Mark all notifications as read */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllPhysicianNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    /** Dismiss (soft-delete) a notification */
    dismiss: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await dismissPhysicianNotification(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Accreditation Readiness ──────────────────────────────────────────────────
  accreditationReadiness: router({
    /** Get or initialize readiness checklist for the current user's lab */
    get: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return null;
      return getAccreditationReadiness(lab.id, ctx.user.id);
    }),
    /** Save checklist progress */
    save: protectedProcedure
      .input(z.object({
        checklistProgress: z.record(z.string(), z.boolean()),
        itemNotes: z.record(z.string(), z.string()),
        completionPct: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found for this user" });
        await saveAccreditationReadiness(lab.id, ctx.user.id, input.checklistProgress, input.itemNotes, input.completionPct);
        return { success: true };
      }),
    /** Get auto-check signals derived from real DB records for the current lab */
    autoChecks: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return {} as Record<string, boolean>;
      return getReadinessAutoChecks(lab.id);
    }),
  }),

  // ─── Accreditation Readiness Navigator (Free-Tier) ───────────────────────────
  // Independent backend — keyed by userId only, no lab membership required.
  // Visible only to users without an active paid DIY Tool subscription.
  accreditationReadinessNavigator: router({
    /** Get or initialize readiness checklist for the current user (Navigator free-tier) */
    get: protectedProcedure.query(async ({ ctx }) => {
      return getAccreditationReadinessNavigator(ctx.user.id);
    }),
    /** Save checklist progress (Navigator free-tier) */
    save: protectedProcedure
      .input(z.object({
        checklistProgress: z.record(z.string(), z.boolean()),
        itemNotes: z.record(z.string(), z.string()),
        completionPct: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveAccreditationReadinessNavigator(
          ctx.user.id,
          input.checklistProgress,
          input.itemNotes,
          input.completionPct,
        );
        return { success: true };
      }),
  }),

  // ─── Case Mix Submissions ─────────────────────────────────────────────────────
  caseMix: router({
    /** Get all case submissions for the current user's lab */
    list: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return [];
      return getCaseMixSubmissions(lab.id);
    }),
    /** Get case mix summary (counts by modality/caseType) */
    summary: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return [];
      return getCaseMixSummary(lab.id);
    }),
    /** Submit a new case */
    create: protectedProcedure
      .input(z.object({
        modality: z.enum(["ATTE", "ATEE", "STRESS", "ACTE", "PTTE", "PTEE", "FETAL"]),
        caseType: z.string().min(1).max(80),
        studyIdentifier: z.string().min(1).max(100),
        studyDate: z.string().optional(),
        sonographerLabMemberId: z.number().optional(),
        sonographerName: z.string().max(100).optional(),
        physicianLabMemberId: z.number().optional(),
        physicianName: z.string().max(100).optional(),
        isTechDirectorCase: z.boolean().default(false),
        isMedDirectorCase: z.boolean().default(false),
        notes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found for this user" });
        await createCaseMixSubmission({
          ...input,
          labId: lab.id,
          submittedByUserId: ctx.user.id,
          status: "draft",
        });
        return { success: true };
      }),
    /** Delete a case submission */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });
        await deleteCaseMixSubmission(input.id, lab.id);
        return { success: true };
      }),
    /** Update case status */
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["draft", "submitted", "accepted", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });
        await updateCaseMixSubmissionStatus(input.id, lab.id, input.status);
        return { success: true };
      }),
    /** Get lab staff for case mix dropdowns */
    getLabStaff: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return { sonographers: [], physicians: [] };
      const members = await getLabMembers(lab.id);
      return {
        sonographers: members.filter(m => m.role === "technical_director" || m.role === "technical_staff" || m.role === "admin"),
        physicians: members.filter(m => m.role === "medical_director" || m.role === "medical_staff" || m.role === "admin"),
      };
    }),
  }),

  // ─── CME Router ───────────────────────────────────────────────────────────
  cme: router({
    /** Get CME credit summary for all staff in the lab */
    getStaffSummary: protectedProcedure.query(async ({ ctx }) => {
      const lab = await getLabByMemberUserId(ctx.user.id);
      if (!lab) return [];
      return getCmeStaffSummary(lab.id);
    }),
    /** Get all CME entries for a specific lab member */
    getEntriesForMember: protectedProcedure
      .input(z.object({ labMemberId: z.number() }))
      .query(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) return [];
        return getCmeEntriesForMember(lab.id, input.labMemberId);
      }),
    /** Add a CME entry */
    addEntry: protectedProcedure
      .input(z.object({
        labMemberId: z.number(),
        title: z.string().min(1),
        provider: z.string().optional(),
        category: z.enum(["echo_specific", "cardiovascular", "general_medical", "technical", "safety", "leadership", "other"]),
        activityDate: z.string(),
        creditHours: z.number().min(0).max(100),
        certificationNumber: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });
        await addCmeEntry({ ...input, labId: lab.id });
        return { success: true };
      }),
    /** Delete a CME entry */
    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lab = await getLabByMemberUserId(ctx.user.id);
        if (!lab) throw new TRPCError({ code: "NOT_FOUND", message: "No lab found" });
        await deleteCmeEntry(input.id, lab.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
