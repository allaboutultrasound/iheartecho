import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  boosts,
  comments,
  communities,
  communityMembers,
  conversations,
  messages,
  moderationLogs,
  postReactions,
  posts,
  users,
  peerReviews,
  policies,
  qaLogs,
  appropriateUseCases,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getUsersByIds(ids: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (ids.length === 0) return [];
  return db.select().from(users).where(or(...ids.map(id => eq(users.id, id))));
}

export async function acceptHubTerms(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ hubAccepted: true }).where(eq(users.id, userId));
}

export async function updateHubProfile(userId: number, data: { displayName?: string; bio?: string; credentials?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllCommunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communities).orderBy(communities.id);
}

export async function ensureDefaultCommunities() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(communities).limit(1);
  if (existing.length > 0) return;
  const defaults = [
    { slug: "general", name: "iHeartEcho Hub\u2122", description: "General echo community \u2014 news, tips, and discussions for all echo professionals.", icon: "Heart", color: "#189aa1", isDefault: true },
    { slug: "acs", name: "ACS Hub", description: "Advanced Cardiac Sonographers — advanced techniques, complex cases, hemodynamics, and peer discussion for experienced sonographers.", icon: "Zap", color: "#dc2626", isDefault: false },
    { slug: "congenital", name: "Congenital Heart Hub", description: "Fetal, Pediatric and Adult congenital heart disease — CHD imaging, cases and more.", icon: "Baby", color: "#189aa1", isDefault: false },
    { slug: "students", name: "Echo Student Hub", description: "Learning resources, study tips, board prep, and mentorship for echo students.", icon: "BookOpen", color: "#189aa1", isDefault: false },
    { slug: "travelers", name: "Travelers Hub", description: "Travel sonography \u2014 contracts, agencies, housing, and life on the road.", icon: "Plane", color: "#189aa1", isDefault: false },
  ];
  for (const c of defaults) {
    await db.insert(communities).values(c).onDuplicateKeyUpdate({ set: { name: c.name } });
  }
}

export async function getPostsByCommunity(communityId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts)
    .where(and(eq(posts.communityId, communityId), eq(posts.isHidden, false), eq(posts.moderationStatus, "approved")))
    .orderBy(desc(posts.isBoosted), desc(posts.createdAt))
    .limit(limit).offset(offset);
}

export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  return result[0];
}

export async function createPost(data: { authorId: number; communityId: number; content: string; mediaUrls?: string[]; mediaTypes?: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(posts).values({
    authorId: data.authorId,
    communityId: data.communityId,
    content: data.content,
    mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
    mediaTypes: data.mediaTypes ? JSON.stringify(data.mediaTypes) : null,
  });
}

export async function deletePost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ isHidden: true }).where(and(eq(posts.id, postId), eq(posts.authorId, userId)));
}

export async function toggleReaction(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    const p = await getPostById(postId);
    if (p) await db.update(posts).set({ likeCount: Math.max(0, p.likeCount - 1) }).where(eq(posts.id, postId));
    return false;
  } else {
    await db.insert(postReactions).values({ postId, userId, reaction: "like" });
    const p = await getPostById(postId);
    if (p) await db.update(posts).set({ likeCount: (p.likeCount ?? 0) + 1 }).where(eq(posts.id, postId));
    return true;
  }
}

export async function getUserReactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postReactions).where(eq(postReactions.userId, userId));
}

export async function getCommentsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.isHidden, false), eq(comments.moderationStatus, "approved")))
    .orderBy(comments.createdAt);
}

export async function createComment(data: { postId: number; authorId: number; content: string; parentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(comments).values({ postId: data.postId, authorId: data.authorId, content: data.content, parentId: data.parentId ?? null });
  const p = await getPostById(data.postId);
  if (p) await db.update(posts).set({ commentCount: (p.commentCount ?? 0) + 1 }).where(eq(posts.id, data.postId));
}

export async function getOrCreateConversation(userA: number, userB: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(conversations)
    .where(or(and(eq(conversations.participantA, userA), eq(conversations.participantB, userB)), and(eq(conversations.participantA, userB), eq(conversations.participantB, userA)))).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(conversations).values({ participantA: userA, participantB: userB });
  const created = await db.select().from(conversations)
    .where(or(and(eq(conversations.participantA, userA), eq(conversations.participantB, userB)), and(eq(conversations.participantA, userB), eq(conversations.participantB, userA)))).limit(1);
  return created[0];
}

export async function getConversationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(or(eq(conversations.participantA, userId), eq(conversations.participantB, userId)))
    .orderBy(desc(conversations.lastMessageAt));
}

export async function getMessages(conversationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.isHidden, false)))
    .orderBy(messages.createdAt).limit(limit);
}

export async function sendMessage(data: { conversationId: number; senderId: number; content: string; mediaUrl?: string; mediaType?: "image" | "video" | "file" }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(messages).values({ conversationId: data.conversationId, senderId: data.senderId, content: data.content, mediaUrl: data.mediaUrl, mediaType: data.mediaType });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, data.conversationId));
}

const BANNED_PATTERNS = [
  /\b(sex|porn|nude|naked|explicit|xxx|adult.content|onlyfans)\b/i,
  /\b(phi|patient.name|dob|date.of.birth|ssn|social.security|mrn|medical.record.number)\b/i,
  /\b(fuck|shit|cunt|nigger|faggot)\b/i,
];

export function moderateContent(text: string): { approved: boolean; reason?: string } {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      if (/sex|porn|nude|naked|explicit|xxx|adult.content|onlyfans/i.test(text))
        return { approved: false, reason: "Sexually explicit content is not permitted in iHeartEcho Hub\u2122." };
      if (/phi|patient.name|dob|date.of.birth|ssn|social.security|mrn|medical.record.number/i.test(text))
        return { approved: false, reason: "Content appears to contain Protected Health Information (PHI). HIPAA compliance requires removal of all patient identifiers." };
      return { approved: false, reason: "Content violates iHeartEcho Hub\u2122 community standards." };
    }
  }
  return { approved: true };
}

export async function logModeration(data: { targetType: "post" | "comment" | "message"; targetId: number; action: "auto_reject" | "manual_reject" | "approve" | "hide" | "warn"; reason?: string; triggeredBy?: "auto" | "admin" | "report"; moderatorId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(moderationLogs).values({ targetType: data.targetType, targetId: data.targetId, action: data.action, reason: data.reason, triggeredBy: data.triggeredBy ?? "auto", moderatorId: data.moderatorId });
}

// ─── ACCREDITATION HELPERS ────────────────────────────────────────────────────

export async function createPeerReview(data: {
  reviewerId: number;
  patientId?: string;
  studyDate?: string;
  modality: "TTE" | "TEE" | "Stress" | "Pediatric" | "Fetal" | "HOCM" | "POCUS";
  sonographerInitials?: string;
  imageQuality?: "excellent" | "good" | "adequate" | "poor";
  imageQualityNotes?: string;
  reportAccuracy?: "accurate" | "minor_discrepancy" | "major_discrepancy";
  reportNotes?: string;
  technicalAdherence?: "full" | "partial" | "non_adherent";
  technicalNotes?: string;
  overallScore?: number;
  feedback?: string;
  status?: "draft" | "submitted" | "complete";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(peerReviews).values(data).$returningId();
  return row;
}

export async function getPeerReviews(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(peerReviews)
    .where(eq(peerReviews.reviewerId, userId))
    .orderBy(desc(peerReviews.createdAt))
    .limit(limit).offset(offset);
}

export async function createPolicy(data: {
  authorId: number;
  title: string;
  category: "infection_control" | "equipment" | "patient_safety" | "protocol" | "staff_competency" | "quality_assurance" | "appropriate_use" | "report_turnaround" | "emergency" | "other";
  modality?: "TTE" | "TEE" | "Stress" | "Pediatric" | "Fetal" | "HOCM" | "POCUS" | "All";
  content: string;
  version?: string;
  effectiveDate?: string;
  reviewDate?: string;
  status?: "draft" | "active" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(policies).values(data).$returningId();
  return row;
}

export async function getPolicies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(policies)
    .where(eq(policies.authorId, userId))
    .orderBy(desc(policies.updatedAt));
}

export async function updatePolicy(id: number, data: Partial<{
  title: string;
  category: "infection_control" | "equipment" | "patient_safety" | "protocol" | "staff_competency" | "quality_assurance" | "appropriate_use" | "report_turnaround" | "emergency" | "other";
  content: string;
  version: string;
  status: "draft" | "active" | "archived";
  reviewDate: string;
  effectiveDate: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(policies).set(data).where(eq(policies.id, id));
}

export async function createQaLog(data: {
  userId: number;
  category: "equipment" | "protocol" | "image_quality" | "report_turnaround" | "staff_competency" | "infection_control" | "patient_safety" | "other";
  title: string;
  description?: string;
  finding?: "pass" | "fail" | "needs_improvement" | "na";
  actionRequired?: string;
  actionTaken?: string;
  dueDate?: string;
  attachmentUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(qaLogs).values(data).$returningId();
  return row;
}

export async function getQaLogs(userId: number, limit = 30, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(qaLogs)
    .where(eq(qaLogs.userId, userId))
    .orderBy(desc(qaLogs.createdAt))
    .limit(limit).offset(offset);
}

export async function createAucEntry(data: {
  userId: number;
  studyDate?: string;
  modality: "TTE" | "TEE" | "Stress" | "Pediatric" | "Fetal" | "HOCM" | "POCUS";
  indication: string;
  appropriatenessRating?: "appropriate" | "may_be_appropriate" | "rarely_appropriate" | "unknown";
  clinicalScenario?: string;
  outcome?: string;
  notes?: string;
  flagged?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [row] = await db.insert(appropriateUseCases).values(data).$returningId();
  return row;
}

export async function getAucEntries(userId: number, limit = 30, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appropriateUseCases)
    .where(eq(appropriateUseCases.userId, userId))
    .orderBy(desc(appropriateUseCases.createdAt))
    .limit(limit).offset(offset);
}
