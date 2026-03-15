/**
 * SoundBytes™ — Premium micro-lesson video library
 * Filterable by clinical category. Premium gate for all content.
 */

import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { BlurredOverlay } from "@/components/BlurredOverlay";
import {
  Crown,
  Play,
  Eye,
  ChevronLeft,
  Stethoscope,
  Baby,
  Zap,
  Microscope,
  Activity,
  BookOpen,
  MessageCircle,
  Send,
  Clock,
  User,
  CheckCircle,
  Reply,
  ChevronDown,
  ChevronUp,
  Lock,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "acs", label: "ACS", icon: Stethoscope },
  { id: "adult_echo", label: "Adult Echo", icon: Activity },
  { id: "pediatric_echo", label: "Pediatric Echo", icon: Stethoscope },
  { id: "fetal_echo", label: "Fetal Echo", icon: Baby },
  { id: "pocus", label: "POCUS", icon: Zap },
  { id: "physics", label: "Physics", icon: Microscope },
  { id: "ecg", label: "ECG", icon: HeartPulse },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  acs: "ACS",
  adult_echo: "Adult Echo",
  pediatric_echo: "Pediatric Echo",
  fetal_echo: "Fetal Echo",
  pocus: "POCUS",
  physics: "Physics",
  ecg: "ECG",
};

const PREMIUM_ROLES_SET = new Set(["premium_user", "diy_user", "diy_admin", "platform_admin"]);

// ── Video embed helper ─────────────────────────────────────────────────────────

function getEmbedUrl(videoUrl: string): string | null {
  // YouTube
  const ytMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0`;

  // Direct embed URL (already an iframe src)
  if (videoUrl.startsWith("https://") && (videoUrl.includes("embed") || videoUrl.includes("player"))) {
    return videoUrl;
  }

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SoundBytesPage() {
  const { isAuthenticated, user } = useAuth();
  const appRoles: string[] = (user as any)?.appRoles ?? [];
  const isPremium =
    (user as any)?.isPremium === true ||
    appRoles.some((r) => PREMIUM_ROLES_SET.has(r)) ||
    (user as any)?.role === "admin";

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Fetch list (public procedure — returns published items)
  const { data: items = [], isLoading } = trpc.soundBytes.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  // Determine if the selected item is free-tier (based on list data)
  const selectedItem = items.find((i) => i.id === selectedId);
  const selectedIsFree = selectedItem?.isFree ?? false;
  // Can view detail if premium OR if the item is free-tier and user is logged in
  const canViewSelected = isPremium || (isAuthenticated && selectedIsFree);

  // Fetch selected item detail
  const { data: selected } = trpc.soundBytes.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null && canViewSelected }
  );

  // Record view mutation
  const recordView = trpc.soundBytes.recordView.useMutation();

  // Discussions
  const utils = trpc.useUtils();
  const { data: discussions = [] } = trpc.soundBytes.listDiscussions.useQuery(
    { soundByteId: selectedId! },
    { enabled: selectedId !== null && canViewSelected }
  );
  const submitDiscussion = trpc.soundBytes.submitDiscussion.useMutation({
    onSuccess: () => {
      utils.soundBytes.listDiscussions.invalidate({ soundByteId: selectedId! });
      setDiscussionBody("");
      toast.success("Your comment has been submitted for review. It will appear once approved.");
    },
    onError: () => toast.error("Failed to submit comment. Please try again."),
  });
  const [discussionBody, setDiscussionBody] = useState("");
  // Track which discussions have their replies expanded
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  function toggleReplies(discussionId: number) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(discussionId)) next.delete(discussionId);
      else next.add(discussionId);
      return next;
    });
  }

  function handleSelect(id: number) {
    const item = items.find((i) => i.id === id);
    const itemIsFree = item?.isFree ?? false;
    setSelectedId(id);
    if (isPremium || (isAuthenticated && itemIsFree)) {
      recordView.mutate({ soundByteId: id, watchedSeconds: 0, completed: false });
    }
  }

  // ── Blurred preview items for non-premium users ────────────────────────────

  const PREVIEW_ITEMS = [
    { title: "Aortic Stenosis: Grading Severity with Doppler", category: "adult_echo" },
    { title: "Fetal Cardiac Anatomy: 4-Chamber View", category: "fetal_echo" },
    { title: "POCUS in the ICU: Lung Sliding Sign", category: "pocus" },
    { title: "Pediatric Echo: Normal Z-Score Ranges", category: "pediatric_echo" },
    { title: "Physics: Nyquist Limit and Aliasing", category: "physics" },
    { title: "ACS: Wall Motion Abnormalities by Territory", category: "acs" },
  ];

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/soundbytes-banner-notext2_ad85c0e2.png"
          alt="SoundBytes™ banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay for text legibility */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(14,30,46,0.72) 0%, rgba(14,74,80,0.45) 60%, transparent 100%)" }} />
        <div className="relative container py-10 md:py-14">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "#189aa1" }}
            >
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl md:text-3xl font-black text-white drop-shadow"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  SoundBytes™
                </h1>
                <span
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shadow"
                  style={{ background: "#d97706", color: "#fff" }}
                >
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              </div>
              <p className="text-white/80 text-sm mt-0.5 drop-shadow">
                Quick-hit video micro-lessons — clinical pearls in minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveCategory(id);
                  setSelectedId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === id
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
                style={activeCategory === id ? { background: "#189aa1" } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-6">
        {/* Gate: not logged in */}
        {!isAuthenticated && (
          <BlurredOverlay type="login" featureName="SoundBytes™">
            <SoundBytesPreviewGrid items={PREVIEW_ITEMS} />
          </BlurredOverlay>
        )}

        {/* Free user: back button when viewing a free item detail */}
        {isAuthenticated && !isPremium && selectedId !== null && canViewSelected && selected && (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-sm text-[#189aa1] font-semibold mb-4 hover:opacity-80 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to SoundBytes
            </button>
            {/* Video player */}
            <div className="rounded-xl overflow-hidden bg-black mb-5 aspect-video">
              {(() => {
                const embedUrl = getEmbedUrl(selected.videoUrl);
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selected.title}
                    />
                  );
                }
                return (
                  <video
                    src={selected.videoUrl}
                    controls
                    className="w-full h-full"
                    onEnded={() =>
                      recordView.mutate({ soundByteId: selected.id, watchedSeconds: 999, completed: true })
                    }
                  />
                );
              })()}
            </div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 leading-snug" style={{ fontFamily: "Merriweather, serif" }}>
                  {selected.title}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa115", color: "#189aa1" }}>
                    {CATEGORY_LABELS[selected.category] ?? selected.category}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Free</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {(selected.phantomViews ?? selected.displayViews ?? 0).toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>
            {selected.body && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: selected.body }} />
            )}
            {/* Upgrade CTA */}
            <div className="mt-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider mb-1">Upgrade to Premium</p>
                <p className="text-white font-bold text-sm">Unlock all SoundBytes™ micro-lessons</p>
                <p className="text-white/60 text-xs mt-0.5">Access the full library of clinical echo micro-lessons.</p>
              </div>
              <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "#189aa1" }}>
                Upgrade Now
              </a>
            </div>
          </div>
        )}

        {/* Gate: logged in but not premium — show free items + blurred premium items */}
        {isAuthenticated && !isPremium && selectedId === null && (
          <FreeUserGrid
            items={items}
            isLoading={isLoading}
            onSelect={handleSelect}
            previewItems={PREVIEW_ITEMS}
          />
        )}

        {/* Free user viewing a free item detail */}
        {isAuthenticated && !isPremium && selectedId !== null && !canViewSelected && (
          <BlurredOverlay type="premium" featureName="SoundBytes™">
            <SoundBytesPreviewGrid items={PREVIEW_ITEMS} />
          </BlurredOverlay>
        )}

        {/* Content visible to premium OR free user on a free item */}
        {(isPremium || (isAuthenticated && canViewSelected)) && (
          <>
            {/* Detail view */}
            {selectedId !== null && selected && (
              <div className="max-w-3xl mx-auto">
                <button
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1.5 text-sm text-[#189aa1] font-semibold mb-4 hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to SoundBytes
                </button>

                {/* Video player */}
                <div className="rounded-xl overflow-hidden bg-black mb-5 aspect-video">
                  {(() => {
                    const embedUrl = getEmbedUrl(selected.videoUrl);
                    if (embedUrl) {
                      return (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={selected.title}
                        />
                      );
                    }
                    return (
                      <video
                        src={selected.videoUrl}
                        controls
                        className="w-full h-full"
                        onEnded={() =>
                          recordView.mutate({
                            soundByteId: selected.id,
                            watchedSeconds: 999,
                            completed: true,
                          })
                        }
                      />
                    );
                  })()}
                </div>

                {/* Title + category badge */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <h2
                      className="text-xl font-bold text-gray-900 leading-snug"
                      style={{ fontFamily: "Merriweather, serif" }}
                    >
                      {selected.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#189aa115", color: "#189aa1" }}
                      >
                        {CATEGORY_LABELS[selected.category] ?? selected.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {(selected.phantomViews ?? selected.displayViews ?? 0).toLocaleString()} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rich text body */}
                {selected.body && (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-8"
                    dangerouslySetInnerHTML={{ __html: selected.body }}
                  />
                )}

                {/* ── Discussions ─────────────────────────────────────────── */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3
                    className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2"
                    style={{ fontFamily: "Merriweather, serif" }}
                  >
                    <MessageCircle className="w-4 h-4" style={{ color: "#189aa1" }} />
                    Discussion
                    {discussions.length > 0 && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#189aa115", color: "#189aa1" }}
                      >
                        {discussions.length}
                      </span>
                    )}
                  </h3>

                  {/* Submit form */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Comments are reviewed before appearing publicly.
                    </p>
                    <textarea
                      value={discussionBody}
                      onChange={(e) => setDiscussionBody(e.target.value)}
                      placeholder="Share a clinical pearl, question, or insight…"
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => {
                          if (!discussionBody.trim()) return;
                          submitDiscussion.mutate({
                            soundByteId: selected.id,
                            body: discussionBody.trim(),
                          });
                        }}
                        disabled={!discussionBody.trim() || submitDiscussion.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ background: "#189aa1" }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submitDiscussion.isPending ? "Submitting…" : "Submit for Review"}
                      </button>
                    </div>
                  </div>

                  {/* Approved comments */}
                  {discussions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No approved comments yet. Be the first to share a thought!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discussions.map((d) => (
                        <DiscussionThread
                          key={d.id}
                          discussion={d as any}
                          isExpanded={expandedReplies.has(d.id)}
                          onToggleReplies={() => toggleReplies(d.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List view */}
            {selectedId === null && (
              <>
                {isLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                        <div className="aspect-video bg-gray-100" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-3/4" />
                          <div className="h-3 bg-gray-50 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && items.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No SoundBytes in this category yet.</p>
                    <p className="text-xs mt-1">Check back soon — new micro-lessons are added regularly.</p>
                  </div>
                )}

                {!isLoading && items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                      const itemIsFree = item.isFree ?? false;
                      const isLocked = !isPremium && isAuthenticated && !itemIsFree;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`bg-white rounded-xl border overflow-hidden text-left group transition-all ${
                            isLocked
                              ? "border-gray-100 opacity-70 cursor-pointer hover:opacity-90"
                              : "border-gray-100 hover:shadow-md hover:border-[#189aa1]/20"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="aspect-video bg-gradient-to-br from-[#0e1e2e] to-[#0e4a50] relative overflow-hidden">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className={`w-full h-full object-cover ${isLocked ? "brightness-50" : ""}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ background: "rgba(24,154,161,0.3)" }}
                                >
                                  <Play className="w-6 h-6 text-[#4ad9e0] fill-[#4ad9e0]" />
                                </div>
                              </div>
                            )}
                            {/* Free badge */}
                            {itemIsFree && (
                              <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                                Free
                              </span>
                            )}
                            {/* Lock overlay for premium items shown to free users */}
                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="flex flex-col items-center gap-1">
                                  <Lock className="w-7 h-7 text-white/80" />
                                  <span className="text-xs text-white/70 font-semibold">Premium</span>
                                </div>
                              </div>
                            )}
                            {/* Play overlay on hover (non-locked) */}
                            {!isLocked && (
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ background: "#189aa1" }}
                                >
                                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-4">
                            <h3
                              className="font-bold text-gray-800 text-sm leading-snug mb-2 line-clamp-2"
                              style={{ fontFamily: "Merriweather, serif" }}
                            >
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "#189aa115", color: "#189aa1" }}
                              >
                                {CATEGORY_LABELS[item.category] ?? item.category}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {(item.phantomViews ?? item.displayViews ?? 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// ── Preview grid (shown blurred to non-premium users) ─────────────────────────

function SoundBytesPreviewGrid({
  items,
}: {
  items: { title: string; category: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <div className="aspect-video bg-gradient-to-br from-[#0e1e2e] to-[#0e4a50] flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(24,154,161,0.3)" }}
            >
              <Play className="w-6 h-6 text-[#4ad9e0] fill-[#4ad9e0]" />
            </div>
          </div>
          <div className="p-4">
            <h3
              className="font-bold text-gray-800 text-sm leading-snug mb-2"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {item.title}
            </h3>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#189aa115", color: "#189aa1" }}
            >
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DiscussionThread — shows a single approved comment + admin replies ─────────

interface DiscussionThreadProps {
  discussion: {
    id: number;
    body: string;
    createdAt: number;
    userId: number;
    userName?: string | null;
    userDisplayName?: string | null;
    userCredentials?: string | null;
    userAvatarUrl?: string | null;
  };
  isExpanded: boolean;
  onToggleReplies: () => void;
}

function DiscussionThread({ discussion, isExpanded, onToggleReplies }: DiscussionThreadProps) {
  const { data: replies = [] } = trpc.soundBytes.listReplies.useQuery(
    { discussionId: discussion.id },
    { enabled: isExpanded }
  );

  const displayName = discussion.userDisplayName || discussion.userName || "Member";
  const credentials = discussion.userCredentials;
  const avatarUrl = discussion.userAvatarUrl;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "#189aa1" }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-800">
              {displayName}
              {credentials && <span className="text-gray-500 font-normal">, {credentials}</span>}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{discussion.body}</p>

          {/* Toggle replies button — only shown if there are replies or after first load */}
          <button
            onClick={onToggleReplies}
            className="mt-2 flex items-center gap-1 text-xs text-[#189aa1] font-semibold hover:opacity-80 transition-opacity"
          >
            <Reply className="w-3 h-3" />
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide replies
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                View replies
              </>
            )}
          </button>
        </div>

        {/* Threaded replies */}
        {isExpanded && (
          <div className="mt-2 ml-4 space-y-2">
            {replies.length === 0 ? (
              <p className="text-xs text-gray-400 italic pl-1">No replies yet.</p>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#0e4a50" }}
                  >
                    {(reply.userName || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-[#f0fbfc] rounded-lg border border-[#189aa1]/15 px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#189aa1]">{reply.userName}</span>
                      <span className="text-xs font-medium text-[#189aa1]/70 bg-[#189aa1]/10 px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ── FreeUserGrid — shown to logged-in free users: free items playable, rest locked ──

interface FreeUserGridProps {
  items: Array<{
    id: number;
    title: string;
    category: string;
    thumbnailUrl?: string | null;
    displayViews?: number | null;
    phantomViews?: number | null;
    isFree?: boolean;
  }>;
  isLoading: boolean;
  onSelect: (id: number) => void;
  previewItems: { title: string; category: string }[];
}

function FreeUserGrid({ items, isLoading, onSelect, previewItems }: FreeUserGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayItems = items.length > 0 ? items : previewItems.map((p, i) => ({ ...p, id: -(i + 1), isFree: false }));

  return (
    <>
      {/* Free tier banner */}
      <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(90deg, #0e1e2e, #0e4a50)" }}>
        <Crown className="w-5 h-5 text-[#4ad9e0] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Free Access: First 4 SoundBytes™</p>
          <p className="text-white/60 text-xs">Upgrade to Premium to unlock the full library of clinical echo micro-lessons.</p>
        </div>
        <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#189aa1" }}>
          Upgrade
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item) => {
          const itemIsFree = item.isFree ?? false;
          const isLocked = !itemIsFree;
          return (
            <button
              key={item.id}
              onClick={() => itemIsFree && item.id > 0 ? onSelect(item.id) : undefined}
              className={`bg-white rounded-xl border overflow-hidden text-left group transition-all ${
                isLocked ? "border-gray-100 cursor-default" : "border-gray-100 hover:shadow-md hover:border-[#189aa1]/20 cursor-pointer"
              }`}
            >
              <div className="aspect-video bg-gradient-to-br from-[#0e1e2e] to-[#0e4a50] relative overflow-hidden">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className={`w-full h-full object-cover ${isLocked ? "brightness-50" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(24,154,161,0.3)" }}>
                      <Play className="w-6 h-6 text-[#4ad9e0] fill-[#4ad9e0]" />
                    </div>
                  </div>
                )}
                {/* Free badge */}
                {itemIsFree && (
                  <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                    Free
                  </span>
                )}
                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="w-7 h-7 text-white/80" />
                      <span className="text-xs text-white/70 font-semibold">Premium</span>
                    </div>
                  </div>
                )}
                {/* Play overlay on hover (free items only) */}
                {itemIsFree && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#189aa1" }}>
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm leading-snug mb-2 line-clamp-2" style={{ fontFamily: "Merriweather, serif" }}>
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa115", color: "#189aa1" }}>
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}
                  </span>
                  {!isLocked && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(item.phantomViews ?? item.displayViews ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
