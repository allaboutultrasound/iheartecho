import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Core Auth ────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Hub profile fields
  displayName: varchar("displayName", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  bio: text("bio"),
  credentials: varchar("credentials", { length: 200 }),
  specialty: varchar("specialty", { length: 100 }),
  yearsExperience: int("yearsExperience"),
  location: varchar("location", { length: 150 }),
  website: varchar("website", { length: 255 }),
  isPublicProfile: boolean("isPublicProfile").default(true).notNull(),
  hubAccepted: boolean("hubAccepted").default(false).notNull(),
  followersCount: int("followersCount").default(0).notNull(),
  followingCount: int("followingCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Hub Communities ──────────────────────────────────────────────────────────

export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  memberCount: int("memberCount").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Community = typeof communities.$inferSelect;

// ─── Hub Posts ────────────────────────────────────────────────────────────────

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  communityId: int("communityId").notNull(),
  content: text("content").notNull(),
  mediaUrls: text("mediaUrls"), // JSON array of S3 URLs
  mediaTypes: text("mediaTypes"), // JSON array of "image"|"video"
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  isBoosted: boolean("isBoosted").default(false).notNull(),
  boostExpiresAt: timestamp("boostExpiresAt"),
  isPinned: boolean("isPinned").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  moderationStatus: mysqlEnum("moderationStatus", ["approved", "pending", "rejected"])
    .default("approved")
    .notNull(),
  moderationReason: text("moderationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Post Reactions ───────────────────────────────────────────────────────────

export const postReactions = mysqlTable("postReactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  reaction: mysqlEnum("reaction", ["like", "heart", "insightful", "clap"]).default("like").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Comments / Threads ───────────────────────────────────────────────────────

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  parentId: int("parentId"), // null = top-level, set = reply in thread
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  moderationStatus: mysqlEnum("moderationStatus", ["approved", "pending", "rejected"])
    .default("approved")
    .notNull(),
  moderationReason: text("moderationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ─── Direct Messages ──────────────────────────────────────────────────────────

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  participantA: int("participantA").notNull(),
  participantB: int("participantB").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: mysqlEnum("mediaType", ["image", "video", "file"]),
  isRead: boolean("isRead").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  moderationStatus: mysqlEnum("moderationStatus", ["approved", "pending", "rejected"])
    .default("approved")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Boosted Posts ────────────────────────────────────────────────────────────

export const boosts = mysqlTable("boosts", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  durationDays: int("durationDays").default(7).notNull(),
  amountCents: int("amountCents").default(0).notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Moderation Log ───────────────────────────────────────────────────────────

export const moderationLogs = mysqlTable("moderationLogs", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["post", "comment", "message"]).notNull(),
  targetId: int("targetId").notNull(),
  action: mysqlEnum("action", ["auto_reject", "manual_reject", "approve", "hide", "warn"]).notNull(),
  reason: text("reason"),
  triggeredBy: mysqlEnum("triggeredBy", ["auto", "admin", "report"]).default("auto").notNull(),
  moderatorId: int("moderatorId"), // null if auto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Accreditation: Peer Reviews ────────────────────────────────────────────

export const peerReviews = mysqlTable("peerReviews", {
  id: int("id").autoincrement().primaryKey(),
  reviewerId: int("reviewerId").notNull(),
  patientId: varchar("patientId", { length: 64 }), // de-identified
  studyDate: varchar("studyDate", { length: 20 }),
  modality: mysqlEnum("modality", ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS"]).notNull(),
  sonographerInitials: varchar("sonographerInitials", { length: 20 }),
  imageQuality: mysqlEnum("imageQuality", ["excellent", "good", "adequate", "poor"]),
  imageQualityNotes: text("imageQualityNotes"),
  reportAccuracy: mysqlEnum("reportAccuracy", ["accurate", "minor_discrepancy", "major_discrepancy"]),
  reportNotes: text("reportNotes"),
  technicalAdherence: mysqlEnum("technicalAdherence", ["full", "partial", "non_adherent"]),
  technicalNotes: text("technicalNotes"),
  overallScore: int("overallScore"), // 1-5
  feedback: text("feedback"),
  status: mysqlEnum("status", ["draft", "submitted", "complete"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PeerReview = typeof peerReviews.$inferSelect;
export type InsertPeerReview = typeof peerReviews.$inferInsert;

// ─── Accreditation: QA Logs ───────────────────────────────────────────────────

export const qaLogs = mysqlTable("qaLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", [
    "equipment", "protocol", "image_quality", "report_turnaround",
    "staff_competency", "infection_control", "patient_safety", "other"
  ]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  finding: mysqlEnum("finding", ["pass", "fail", "needs_improvement", "na"]).default("pass").notNull(),
  actionRequired: text("actionRequired"),
  actionTaken: text("actionTaken"),
  dueDate: varchar("dueDate", { length: 20 }),
  resolvedAt: timestamp("resolvedAt"),
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QaLog = typeof qaLogs.$inferSelect;
export type InsertQaLog = typeof qaLogs.$inferInsert;

// ─── Accreditation: Policies ──────────────────────────────────────────────────

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  category: mysqlEnum("category", [
    "infection_control", "equipment", "patient_safety", "protocol",
    "staff_competency", "quality_assurance", "appropriate_use",
    "report_turnaround", "emergency", "other"
  ]).notNull(),
  modality: mysqlEnum("modality", ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "All"]).default("All").notNull(),
  content: text("content").notNull(),
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  effectiveDate: varchar("effectiveDate", { length: 20 }),
  reviewDate: varchar("reviewDate", { length: 20 }),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

// ─── Accreditation: Appropriate Use Cases ────────────────────────────────────

export const appropriateUseCases = mysqlTable("appropriateUseCases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  studyDate: varchar("studyDate", { length: 20 }),
  modality: mysqlEnum("modality", ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS"]).notNull(),
  indication: text("indication").notNull(),
  appropriatenessRating: mysqlEnum("appropriatenessRating", ["appropriate", "may_be_appropriate", "rarely_appropriate", "unknown"]).default("unknown").notNull(),
  clinicalScenario: text("clinicalScenario"),
  outcome: text("outcome"),
  notes: text("notes"),
  flagged: boolean("flagged").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppropriateUseCase = typeof appropriateUseCases.$inferSelect;
export type InsertAppropriateUseCase = typeof appropriateUseCases.$inferInsert;

// ─── Community Members ────────────────────────────────────────────────────────

export const communityMembers = mysqlTable("communityMembers", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "moderator"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
