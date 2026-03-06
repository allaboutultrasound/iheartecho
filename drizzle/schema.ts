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
  isPremium: boolean("isPremium").default(false).notNull(),
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

// ─── Lab Subscriptions ────────────────────────────────────────────────────────

export const labSubscriptions = mysqlTable("labSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),         // owner / billing admin
  labName: varchar("labName", { length: 200 }).notNull(),
  labAddress: text("labAddress"),
  labPhone: varchar("labPhone", { length: 30 }),
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "paused"]).default("trialing").notNull(),
  seats: int("seats").default(5).notNull(),          // max staff members
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  billingCycleStart: timestamp("billingCycleStart"),
  billingCycleEnd: timestamp("billingCycleEnd"),
  trialEndsAt: timestamp("trialEndsAt"),
  canceledAt: timestamp("canceledAt"),
  notes: text("notes"),
  // IAC accreditation types the lab is seeking or currently holds (JSON array)
  // Values: "adult_echo" | "pediatric_fetal_echo"
  accreditationTypes: text("accreditationTypes"),
  accreditationOnboardingComplete: boolean("accreditationOnboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabSubscription = typeof labSubscriptions.$inferSelect;
export type InsertLabSubscription = typeof labSubscriptions.$inferInsert;

// ─── Lab Members ─────────────────────────────────────────────────────────────

export const labMembers = mysqlTable("labMembers", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  userId: int("userId"),                             // null until invite accepted
  inviteEmail: varchar("inviteEmail", { length: 320 }).notNull(),
  displayName: varchar("displayName", { length: 100 }),
  credentials: varchar("credentials", { length: 200 }),
  role: mysqlEnum("role", ["medical_director", "technical_director", "medical_staff", "technical_staff", "admin"]).default("technical_staff").notNull(),
  specialty: varchar("specialty", { length: 100 }),
  department: varchar("department", { length: 100 }),
  inviteStatus: mysqlEnum("inviteStatus", ["pending", "accepted", "declined"]).default("pending").notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }),
  joinedAt: timestamp("joinedAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabMember = typeof labMembers.$inferSelect;
export type InsertLabMember = typeof labMembers.$inferInsert;

// ─── CME Entries ──────────────────────────────────────────────────────────────
// Continuing Medical/Technical Education entries per lab member

export const cmeEntries = mysqlTable("cmeEntries", {
  id: int("id").autoincrement().primaryKey(),
  labMemberId: int("labMemberId").notNull(),          // FK → labMembers.id
  labId: int("labId").notNull(),                      // FK → labSubscriptions.id (for scoping)
  title: varchar("title", { length: 200 }).notNull(),
  provider: varchar("provider", { length: 200 }),
  category: mysqlEnum("category", [
    "echo_specific",
    "cardiovascular",
    "general_medical",
    "technical",
    "safety",
    "leadership",
    "other"
  ]).default("echo_specific").notNull(),
  activityDate: varchar("activityDate", { length: 20 }).notNull(), // YYYY-MM-DD
  creditHours: int("creditHours").notNull().default(0),
  certificationNumber: varchar("certificationNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CmeEntry = typeof cmeEntries.$inferSelect;
export type InsertCmeEntry = typeof cmeEntries.$inferInsert;

// ─── Lab Peer Reviews (extends peerReviews with lab context) ─────────────────
// We add labId + revieweeId + qualityScore to peerReviews via a separate
// labPeerReviews table that references peerReviews.id for clean separation.

export const labPeerReviews = mysqlTable("labPeerReviews", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  peerReviewId: int("peerReviewId").notNull(),       // FK → peerReviews.id
  reviewerId: int("reviewerId").notNull(),            // labMembers.id (reviewer)
  revieweeId: int("revieweeId").notNull(),            // labMembers.id (sonographer being reviewed)
  qualityScore: int("qualityScore"),                  // 0–100 computed composite
  qualityTier: mysqlEnum("qualityTier", ["Excellent", "Good", "Adequate", "Needs Improvement"]),
  iqScore: int("iqScore"),                           // image quality component 0–100
  raScore: int("raScore"),                           // report accuracy component 0–100
  taScore: int("taScore"),                           // technical adherence component 0–100
  reviewMonth: varchar("reviewMonth", { length: 7 }), // "YYYY-MM" for easy grouping
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LabPeerReview = typeof labPeerReviews.$inferSelect;
export type InsertLabPeerReview = typeof labPeerReviews.$inferInsert;

// ─── Echo Cases (user-created case library) ───────────────────────────────────
export const echoCases = mysqlTable("echoCases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  patientAge: int("patientAge"),
  patientSex: mysqlEnum("patientSex", ["M", "F", "Other"]),
  clinicalHistory: text("clinicalHistory"),
  indication: varchar("indication", { length: 200 }),
  diagnosis: varchar("diagnosis", { length: 200 }),
  notes: text("notes"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EchoCase = typeof echoCases.$inferSelect;
export type InsertEchoCase = typeof echoCases.$inferInsert;

// ─── Strain Snapshots (attached to echo cases) ────────────────────────────────
export const strainSnapshots = mysqlTable("strainSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),                              // nullable — can save without a case
  caseTitle: varchar("caseTitle", { length: 200 }),   // denormalized for display
  // Segment values: JSON array of {id, value, wallMotionScore}
  segmentValues: text("segmentValues").notNull(),      // JSON string
  wallMotionScores: text("wallMotionScores"),          // JSON string {segId: score}
  // Summary metrics
  lvGls: text("lvGls"),                               // stored as string to preserve null
  rvStrain: text("rvStrain"),
  laStrain: text("laStrain"),
  wmsi: text("wmsi"),                                 // wall motion score index
  // Acquisition context
  vendor: varchar("vendor", { length: 100 }),
  frameRate: int("frameRate"),
  // Clinical notes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StrainSnapshot = typeof strainSnapshots.$inferSelect;
export type InsertStrainSnapshot = typeof strainSnapshots.$inferInsert;

// ─── Image Quality Reviews ────────────────────────────────────────────────────
export const imageQualityReviews = mysqlTable("imageQualityReviews", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  // Lab integration — nullable so standalone reviews still work
  labId: int("labId"),                                          // FK → labSubscriptions.id
  revieweeLabMemberId: int("revieweeLabMemberId"),               // FK → labMembers.id
  revieweeUserId: int("revieweeUserId"),                         // denormalized userId for fast queries
  revieweeName: varchar("revieweeName", { length: 200 }),        // denormalized name for display
  reviewType: varchar("reviewType", { length: 50 }).notNull(),
  organization: varchar("organization", { length: 200 }),
  dateReviewCompleted: varchar("dateReviewCompleted", { length: 20 }),
  examDos: varchar("examDos", { length: 20 }),
  examIdentifier: varchar("examIdentifier", { length: 100 }),
  facilityLocation: varchar("facilityLocation", { length: 200 }),
  performingSonographer: varchar("performingSonographer", { length: 200 }),
  interpretingPhysician: varchar("interpretingPhysician", { length: 200 }),
  referringPhysician: varchar("referringPhysician", { length: 200 }),
  examType: varchar("examType", { length: 50 }),
  examScope: varchar("examScope", { length: 50 }),
  stressType: varchar("stressType", { length: 100 }),
  examIndication: text("examIndication"),
  indicationAppropriateness: varchar("indicationAppropriateness", { length: 20 }),
  demographicsAccurate: varchar("demographicsAccurate", { length: 5 }),
  protocolViews: text("protocolViews"),
  protocolViewsOther: varchar("protocolViewsOther", { length: 300 }),
  gainSettings: varchar("gainSettings", { length: 50 }),
  gainSettingsOther: varchar("gainSettingsOther", { length: 200 }),
  depthSettings: varchar("depthSettings", { length: 50 }),
  depthSettingsOther: varchar("depthSettingsOther", { length: 200 }),
  focalZoneSettings: varchar("focalZoneSettings", { length: 50 }),
  focalZoneDeficiencies: varchar("focalZoneDeficiencies", { length: 200 }),
  colorizeSettings: varchar("colorizeSettings", { length: 50 }),
  colorizeSettingsOther: varchar("colorizeSettingsOther", { length: 200 }),
  zoomSettings: varchar("zoomSettings", { length: 50 }),
  zoomSettingsOther: varchar("zoomSettingsOther", { length: 200 }),
  ecgDisplay: varchar("ecgDisplay", { length: 50 }),
  ecgDisplayDeficiencies: varchar("ecgDisplayDeficiencies", { length: 200 }),
  contrastUseAppropriate: varchar("contrastUseAppropriate", { length: 200 }),
  contrastSettingsAppropriate: varchar("contrastSettingsAppropriate", { length: 10 }),
  onAxisImaging: varchar("onAxisImaging", { length: 100 }),
  effortSuboptimalViews: varchar("effortSuboptimalViews", { length: 20 }),
  measurements2dComplete: varchar("measurements2dComplete", { length: 100 }),
  measurements2dAccurate: varchar("measurements2dAccurate", { length: 20 }),
  psaxLvComplete: varchar("psaxLvComplete", { length: 100 }),
  ventricularFunctionAccurate: varchar("ventricularFunctionAccurate", { length: 20 }),
  efMeasurementsAccurate: varchar("efMeasurementsAccurate", { length: 20 }),
  simpsonsEfAccurate: varchar("simpsonsEfAccurate", { length: 20 }),
  laVolumeAccurate: varchar("laVolumeAccurate", { length: 20 }),
  dopplerMeasurementsComplete: varchar("dopplerMeasurementsComplete", { length: 100 }),
  dopplerMeasurementsAccurate: varchar("dopplerMeasurementsAccurate", { length: 50 }),
  dopplerVentricularFunction: varchar("dopplerVentricularFunction", { length: 50 }),
  dopplerWaveformSettings: varchar("dopplerWaveformSettings", { length: 50 }),
  dopplerMeasurementAccuracy: varchar("dopplerMeasurementAccuracy", { length: 50 }),
  forwardFlowSpectrum: varchar("forwardFlowSpectrum", { length: 20 }),
  pwDopplerPlacement: varchar("pwDopplerPlacement", { length: 20 }),
  cwDopplerPlacement: varchar("cwDopplerPlacement", { length: 20 }),
  spectralEnvelopePeaks: varchar("spectralEnvelopePeaks", { length: 20 }),
  colorFlowInterrogation: varchar("colorFlowInterrogation", { length: 20 }),
  colorDopplerIasIvs: varchar("colorDopplerIasIvs", { length: 20 }),
  diastolicFunctionEval: text("diastolicFunctionEval"),
  pulmonaryVeinInflow: varchar("pulmonaryVeinInflow", { length: 20 }),
  rightHeartFunctionEval: text("rightHeartFunctionEval"),
  tapseAccurate: varchar("tapseAccurate", { length: 20 }),
  tissueDopplerAdequate: varchar("tissueDopplerAdequate", { length: 20 }),
  dopplerWaveformSettingsPeer: varchar("dopplerWaveformSettingsPeer", { length: 50 }),
  dopplerSampleVolumesPeer: varchar("dopplerSampleVolumesPeer", { length: 50 }),
  aorticValveDoppler: varchar("aorticValveDoppler", { length: 20 }),
  lvotDopplerPlacement: varchar("lvotDopplerPlacement", { length: 20 }),
  pedoffCwUtilized: varchar("pedoffCwUtilized", { length: 50 }),
  pedoffCwEnvelope: varchar("pedoffCwEnvelope", { length: 50 }),
  pedoffCwLabelled: varchar("pedoffCwLabelled", { length: 50 }),
  mitralValveDoppler: varchar("mitralValveDoppler", { length: 20 }),
  mrEvaluationMethods: varchar("mrEvaluationMethods", { length: 100 }),
  pisaEroMeasurements: varchar("pisaEroMeasurements", { length: 50 }),
  tricuspidValveDoppler: varchar("tricuspidValveDoppler", { length: 20 }),
  pulmonicValveDoppler: varchar("pulmonicValveDoppler", { length: 20 }),
  aorticValvePeer: varchar("aorticValvePeer", { length: 50 }),
  mitralValvePeer: varchar("mitralValvePeer", { length: 50 }),
  tricuspidValvePeer: varchar("tricuspidValvePeer", { length: 50 }),
  pulmonicValvePeer: varchar("pulmonicValvePeer", { length: 50 }),
  diastologyPeer: varchar("diastologyPeer", { length: 50 }),
  rightHeartPeer: varchar("rightHeartPeer", { length: 50 }),
  additionalImagingMethods: text("additionalImagingMethods"),
  strainPerformed: varchar("strainPerformed", { length: 5 }),
  strainCorrect: varchar("strainCorrect", { length: 50 }),
  threeDPerformed: varchar("threeDPerformed", { length: 5 }),
  imageOptimizationSummary: varchar("imageOptimizationSummary", { length: 50 }),
  measurementAccuracySummary: varchar("measurementAccuracySummary", { length: 50 }),
  dopplerSettingsSummary: varchar("dopplerSettingsSummary", { length: 50 }),
  protocolSequenceFollowed: varchar("protocolSequenceFollowed", { length: 200 }),
  pathologyDocumented: varchar("pathologyDocumented", { length: 20 }),
  clinicalQuestionAnswered: varchar("clinicalQuestionAnswered", { length: 20 }),
  reportConcordant: varchar("reportConcordant", { length: 50 }),
  comparableToPreview: varchar("comparableToPreview", { length: 10 }),
  iacAcceptable: varchar("iacAcceptable", { length: 200 }),
  scanStartTime: varchar("scanStartTime", { length: 10 }),
  scanEndTime: varchar("scanEndTime", { length: 10 }),
  imagingTimeMinutes: int("imagingTimeMinutes"),
  scanningTimeType: varchar("scanningTimeType", { length: 20 }),
  qualityScore: int("qualityScore"),
  reviewComments: text("reviewComments"),
  reviewer: varchar("reviewer", { length: 200 }),
  reviewerEmail: varchar("reviewerEmail", { length: 200 }),
  notifyAdmin: varchar("notifyAdmin", { length: 5 }),
  notifySonographer: varchar("notifySonographer", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImageQualityReview = typeof imageQualityReviews.$inferSelect;
export type InsertImageQualityReview = typeof imageQualityReviews.$inferInsert;

// ─── Echo Correlation (QI Study Correlations) ───────────────────────────────
export const echoCorrelations = mysqlTable("echoCorrelations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  // Header
  organization: varchar("organization", { length: 255 }),
  dateReviewCompleted: varchar("dateReviewCompleted", { length: 20 }),
  examIdentifier: varchar("examIdentifier", { length: 50 }),
  // Exam Info
  examType: varchar("examType", { length: 100 }),
  correlation1Type: varchar("correlation1Type", { length: 100 }),
  correlation1TypeOther: varchar("correlation1TypeOther", { length: 100 }),
  correlation2Type: varchar("correlation2Type", { length: 100 }),
  correlation2TypeOther: varchar("correlation2TypeOther", { length: 100 }),
  // Dates of Service
  originalExamDos: varchar("originalExamDos", { length: 20 }),
  correlation1Dos: varchar("correlation1Dos", { length: 20 }),
  correlation2Dos: varchar("correlation2Dos", { length: 20 }),
  // Findings stored as JSON strings
  originalFindings: text("originalFindings"),
  corr1Findings: text("corr1Findings"),
  corr2Findings: text("corr2Findings"),
  // Concordance results as JSON
  concordance1: text("concordance1"),
  concordance2: text("concordance2"),
  // Overall
  overallConcordanceRate: int("overallConcordanceRate"),
  varianceNotes: text("varianceNotes"),
  reviewerName: varchar("reviewerName", { length: 200 }),
  reviewerEmail: varchar("reviewerEmail", { length: 200 }),
  // Lab integration
  labId: int("labId"),
  revieweeId: varchar("revieweeId", { length: 255 }),
  revieweeName: varchar("revieweeName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EchoCorrelation = typeof echoCorrelations.$inferSelect;
export type InsertEchoCorrelation = typeof echoCorrelations.$inferInsert;

// ─── Physician Peer Reviews ─────────────────────────────────────────────────
// Mirrors the Formsite PhysVariabilityECHO form with Lab Admin staff linkage.
// revieweeLabMemberId → the Original Interpreting Physician (labMembers.id)
// reviewerLabMemberId → the Over-Reading Physician Reviewer (labMembers.id)
export const physicianPeerReviews = mysqlTable("physicianPeerReviews", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  labId: int("labId"),

  // ── Header ──────────────────────────────────────────────────────────────────
  facilityAccountNumber: varchar("facilityAccountNumber", { length: 50 }),
  organization: varchar("organization", { length: 255 }),
  dateReviewCompleted: varchar("dateReviewCompleted", { length: 20 }),
  examIdentifier: varchar("examIdentifier", { length: 100 }),
  dob: varchar("dob", { length: 20 }),
  examDos: varchar("examDos", { length: 20 }),
  examType: varchar("examType", { length: 50 }),

  // ── Staff linkage ────────────────────────────────────────────────────────────
  revieweeLabMemberId: int("revieweeLabMemberId"),
  revieweeName: varchar("revieweeName", { length: 255 }),
  reviewerLabMemberId: int("reviewerLabMemberId"),
  reviewerName: varchar("reviewerName", { length: 255 }),
  qualityReviewAssignedBy: varchar("qualityReviewAssignedBy", { length: 255 }),
  reviewerEmail: varchar("reviewerEmail", { length: 255 }),

  // ── Stress-specific header ───────────────────────────────────────────────────
  postStressDopplerPerformed: varchar("postStressDopplerPerformed", { length: 10 }),

  // ── Adult TTE / Pediatric / Fetal shared findings ───────────────────────────
  situs: varchar("situs", { length: 100 }),
  cardiacPosition: varchar("cardiacPosition", { length: 100 }),
  leftHeart: varchar("leftHeart", { length: 100 }),
  rightHeart: varchar("rightHeart", { length: 100 }),
  efPercent: varchar("efPercent", { length: 50 }),
  lvWallThickness: varchar("lvWallThickness", { length: 100 }),
  ventricularSeptalDefect: varchar("ventricularSeptalDefect", { length: 100 }),
  atrialSeptalDefect: varchar("atrialSeptalDefect", { length: 100 }),
  patentForamenOvale: varchar("patentForamenOvale", { length: 100 }),
  lvChamberSize: varchar("lvChamberSize", { length: 100 }),
  laChamberSize: varchar("laChamberSize", { length: 100 }),
  rvChamberSize: varchar("rvChamberSize", { length: 100 }),
  raChamberSize: varchar("raChamberSize", { length: 100 }),
  regionalWallMotionAbnormalities: varchar("regionalWallMotionAbnormalities", { length: 200 }),
  aorticValve: varchar("aorticValve", { length: 100 }),
  mitralValve: varchar("mitralValve", { length: 100 }),
  tricuspidValve: varchar("tricuspidValve", { length: 100 }),
  pulmonicValve: varchar("pulmonicValve", { length: 100 }),
  aorticStenosis: varchar("aorticStenosis", { length: 100 }),
  aorticInsufficiency: varchar("aorticInsufficiency", { length: 100 }),
  mitralStenosis: varchar("mitralStenosis", { length: 100 }),
  mitralRegurgitation: varchar("mitralRegurgitation", { length: 100 }),
  tricuspidStenosis: varchar("tricuspidStenosis", { length: 100 }),
  tricuspidRegurgitation: varchar("tricuspidRegurgitation", { length: 100 }),
  pulmonicStenosis: varchar("pulmonicStenosis", { length: 100 }),
  pulmonicInsufficiency: varchar("pulmonicInsufficiency", { length: 100 }),
  rvspmm: varchar("rvspmm", { length: 50 }),
  pericardialEffusion: varchar("pericardialEffusion", { length: 100 }),

  // ── Pediatric/Congenital extra fields ────────────────────────────────────────
  peripheralPulmonaryStenosis: varchar("peripheralPulmonaryStenosis", { length: 100 }),
  pulmonaryVeins: varchar("pulmonaryVeins", { length: 100 }),
  coronaryAnatomy: varchar("coronaryAnatomy", { length: 100 }),
  aorticArch: varchar("aorticArch", { length: 100 }),
  greatVessels: varchar("greatVessels", { length: 100 }),
  pdaDuctalArch: varchar("pdaDuctalArch", { length: 100 }),
  conotruncalAnatomy: varchar("conotruncalAnatomy", { length: 100 }),

  // ── Stress Echo fields ───────────────────────────────────────────────────────
  restingEfPercent: varchar("restingEfPercent", { length: 50 }),
  postStressEfPercent: varchar("postStressEfPercent", { length: 50 }),
  restingRwma: varchar("restingRwma", { length: 200 }),
  postStressRwma: varchar("postStressRwma", { length: 200 }),
  responseToStress: varchar("responseToStress", { length: 100 }),
  stressAorticStenosis: varchar("stressAorticStenosis", { length: 100 }),
  stressAorticInsufficiency: varchar("stressAorticInsufficiency", { length: 100 }),
  stressMitralStenosis: varchar("stressMitralStenosis", { length: 100 }),
  stressMitralRegurgitation: varchar("stressMitralRegurgitation", { length: 100 }),
  stressTricuspidStenosis: varchar("stressTricuspidStenosis", { length: 100 }),
  stressTricuspidRegurgitation: varchar("stressTricuspidRegurgitation", { length: 100 }),
  stressPulmonicStenosis: varchar("stressPulmonicStenosis", { length: 100 }),
  stressPulmonicInsufficiency: varchar("stressPulmonicInsufficiency", { length: 100 }),
  stressRvspmm: varchar("stressRvspmm", { length: 50 }),

  // ── Fetal Echo fields ────────────────────────────────────────────────────────
  fetalBiometry: varchar("fetalBiometry", { length: 100 }),
  fetalPosition: varchar("fetalPosition", { length: 100 }),
  fetalHeartRateRhythm: varchar("fetalHeartRateRhythm", { length: 100 }),

  // ── Other findings (3 free-text) ─────────────────────────────────────────────
  otherFindings1: text("otherFindings1"),
  otherFindings2: text("otherFindings2"),
  otherFindings3: text("otherFindings3"),

  // ── Review comments ──────────────────────────────────────────────────────────
  reviewComments: text("reviewComments"),

  // ── Concordance / variability result ────────────────────────────────────────
  concordanceScore: int("concordanceScore"),
  discordanceFields: text("discordanceFields"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PhysicianPeerReview = typeof physicianPeerReviews.$inferSelect;
export type InsertPhysicianPeerReview = typeof physicianPeerReviews.$inferInsert;

// ─── Physician Notifications ──────────────────────────────────────────────────
// In-app notifications sent to physicians when a Physician Peer Review is submitted
export const physicianNotifications = mysqlTable("physicianNotifications", {
  id: int("id").primaryKey().autoincrement(),
  // The physician who receives the notification (FK → users.id)
  recipientUserId: int("recipientUserId").notNull(),
  // The lab member record for the physician (FK → labMembers.id), if linked
  recipientLabMemberId: int("recipientLabMemberId"),
  // The review that triggered this notification (FK → physicianPeerReviews.id)
  reviewId: int("reviewId").notNull(),
  // Notification type
  type: varchar("type", { length: 50 }).notNull().default("peer_review_result"),
  // Short title shown in the bell dropdown
  title: varchar("title", { length: 255 }).notNull(),
  // Full message body (includes concordance score, discordant fields, comments)
  message: text("message").notNull(),
  // Structured payload (JSON): { concordanceScore, discordantFields, reviewerName, examType, examDate }
  payload: text("payload"),
  // Whether the physician has read this notification
  isRead: boolean("isRead").notNull().default(false),
  // Whether the notification has been dismissed
  isDismissed: boolean("isDismissed").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});
export type PhysicianNotification = typeof physicianNotifications.$inferSelect;
export type InsertPhysicianNotification = typeof physicianNotifications.$inferInsert;

// ─── Accreditation Readiness ──────────────────────────────────────────────────
// Stores per-lab IAC checklist progress (JSON blob of checked item IDs)
export const accreditationReadiness = mysqlTable("accreditationReadiness", {
  id: int("id").primaryKey().autoincrement(),
  labId: int("labId").notNull(),
  userId: int("userId").notNull(),
  // JSON: { [itemId: string]: boolean } — maps checklist item IDs to checked state
  checklistProgress: text("checklistProgress").notNull(),
  // JSON: { [itemId: string]: string } — optional notes per item
  itemNotes: text("itemNotes").notNull(),
  // Cached overall completion percentage (0-100)
  completionPct: int("completionPct").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AccreditationReadiness = typeof accreditationReadiness.$inferSelect;
export type InsertAccreditationReadiness = typeof accreditationReadiness.$inferInsert;

// ─── Case Mix Submissions ─────────────────────────────────────────────────────
// IAC-compliant case study submissions tracked per lab
export const caseMixSubmissions = mysqlTable("caseMixSubmissions", {
  id: int("id").primaryKey().autoincrement(),
  labId: int("labId").notNull(),
  submittedByUserId: int("submittedByUserId").notNull(),
  // Modality: ATTE | ATEE | STRESS | ACTE | PTTE | PTEE | FETAL
  modality: varchar("modality", { length: 20 }).notNull(),
  // IAC case type category
  caseType: varchar("caseType", { length: 80 }).notNull(),
  // De-identified study identifier (no PHI)
  studyIdentifier: varchar("studyIdentifier", { length: 100 }).notNull(),
  // Date of study
  studyDate: varchar("studyDate", { length: 20 }),
  // Sonographer lab member ID (FK → labMembers.id)
  sonographerLabMemberId: int("sonographerLabMemberId"),
  sonographerName: varchar("sonographerName", { length: 100 }),
  // Physician lab member ID (FK → labMembers.id)
  physicianLabMemberId: int("physicianLabMemberId"),
  physicianName: varchar("physicianName", { length: 100 }),
  // Whether this case is from the Technical Director (required by IAC)
  isTechDirectorCase: boolean("isTechDirectorCase").notNull().default(false),
  // Whether the Medical Director is represented in this case
  isMedDirectorCase: boolean("isMedDirectorCase").notNull().default(false),
  // Free-text notes
  notes: text("notes"),
  // Submission status: draft | submitted | accepted | rejected
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CaseMixSubmission = typeof caseMixSubmissions.$inferSelect;
export type InsertCaseMixSubmission = typeof caseMixSubmissions.$inferInsert;

// ─── Accreditation Readiness (Navigator / Free-Tier) ─────────────────────────
// Separate from the DIY Tool readiness — stored independently so paid features
// can be added to the DIY version without affecting the free Navigator version.
export const accreditationReadinessNavigator = mysqlTable("accreditationReadinessNavigator", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  // JSON: { [itemId: string]: boolean }
  checklistProgress: text("checklistProgress").notNull(),
  // JSON: { [itemId: string]: string }
  itemNotes: text("itemNotes").notNull(),
  // Cached overall completion percentage (0-100)
  completionPct: int("completionPct").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AccreditationReadinessNavigator = typeof accreditationReadinessNavigator.$inferSelect;
export type InsertAccreditationReadinessNavigator = typeof accreditationReadinessNavigator.$inferInsert;
