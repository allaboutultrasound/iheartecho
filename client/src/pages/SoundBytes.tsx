/**
 * SoundBytes™ — Premium micro-lesson video library
 *
 * Auth gate rules:
 *   - Not logged in: blurred overlay with login prompt
 *   - Logged in, free user:
 *       • First 3 items in the "All" view (by index) are freely playable
 *       • Items 4+ show an upgrade modal when clicked
 *       • Clicking any category filter tab shows an upgrade modal
 *   - Premium user: full access to all videos, all category filters
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { trpc } from "@/lib/trpc";
import { useAbTest } from "@/hooks/useAbTest";
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
  CheckCircle,
  Reply,
  ChevronDown,
  ChevronUp,
  Lock,
  HeartPulse,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "acs", label: "ACS", icon: Stethoscope },
  { id: "adult_echo", label: "Adult Echo", icon: HeartPulse },
  { id: "pediatric_echo", label: "Pediatric Echo", icon: Stethoscope },
  { id: "fetal_echo", label: "Fetal Echo", icon: Baby },
  { id: "pocus", label: "POCUS", icon: Zap },
  { id: "physics", label: "Physics", icon: Microscope },
  { id: "ecg", label: "ECG", icon: Activity },
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

// Number of free SoundBytes available to logged-in free members (from the "All" view)
const FREE_SOUNDBYTES_LIMIT = 3;

// ── Meta Pixel helpers ────────────────────────────────────────────────────────
// Safe wrapper — no-ops if the pixel hasn't loaded yet (e.g. ad-blockers)
function fbTrack(event: string, params?: Record<string, unknown>) {
  try {
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") fbq("track", event, params ?? {});
  } catch {
    // silently ignore if fbq is unavailable
  }
}

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

// ── Upgrade Modal ──────────────────────────────────────────────────────────────
//
// A/B Test: "soundbytes_upgrade_modal"
//   Variant A (control)  — standard copy, no pricing callout
//   Variant B (pricing)  — adds "Most popular: Annual Premium" pricing card
//                          with price, savings badge, and direct checkout CTA

const CHECKOUT_URL = "https://member.allaboutultrasound.com/enroll/3703267?price_id=4651832";
const MONTHLY_PRICE = "$9.99";
// Annual plan pricing — update these when Thinkific pricing changes
const ANNUAL_PRICE_PER_MONTH = "$6.99";
const ANNUAL_TOTAL = "$83.88";
const ANNUAL_SAVINGS_PCT = "30%";

interface UpgradeModalProps {
  categoryLabel: string;
  onClose: () => void;
  /** Called when the user clicks any upgrade CTA — fires Meta Pixel Lead + Subscribe events */
  onCtaClick: () => void;
  variant: "A" | "B";
}

function UpgradeModal({ categoryLabel, onClose, onCtaClick, variant }: UpgradeModalProps) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const FEATURES = [
    "All SoundBytes™ in every category",
    "Full EchoAssist™ clinical decision support",
    "500+ echo cases with gamified learning",
    "DIY Accreditation tools & checklists",
    "Unlimited Hemodynamics Lab access",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,30,46,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Header gradient */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 100%)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: "rgba(24,154,161,0.25)", border: "2px solid #189aa1" }}
          >
            <Crown className="w-7 h-7 text-[#4ad9e0]" />
          </div>
          <h2
            className="text-xl font-black text-white mb-1"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            Unlock All SoundBytes™
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Free members get {categoryLabel === "category_filter" ? "access to the first 3 SoundBytes™ in the All view" : "3 free SoundBytes™"}. Upgrade to iHeartEcho™ Premium for unlimited access to every category and every micro-lesson.
          </p>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">

          {/* ── Variant B: Annual pricing callout ─────────────────────────── */}
          {variant === "B" && (
            <div className="mb-4 rounded-xl overflow-hidden border-2 border-[#189aa1] shadow-sm">
              {/* Most popular badge */}
              <div
                className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-white"
                style={{ background: "#189aa1" }}
              >
                <Crown className="w-3 h-3" />
                Most popular
              </div>
              <div className="px-4 py-3 bg-[#f0fbfc]">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-gray-900">{ANNUAL_PRICE_PER_MONTH}</span>
                    <span className="text-sm text-gray-500 ml-1">/mo</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ background: "#d97706" }}
                  >
                    Save {ANNUAL_SAVINGS_PCT}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Billed annually — {ANNUAL_TOTAL}/year
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  vs {MONTHLY_PRICE}/mo billed monthly
                </p>
              </div>
            </div>
          )}

          {/* Feature list */}
          <ul className="space-y-2.5 mb-5">
            {FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#189aa1" }} />
                {feat}
              </li>
            ))}
          </ul>

          {/* CTA button */}
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCtaClick}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 shadow-md"
            style={{ background: "linear-gradient(90deg, #189aa1, #0e4a50)" }}
          >
            <Crown className="w-4 h-4" />
            {variant === "B" ? "Get Annual Premium" : "Upgrade to Premium"}
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          {/* Variant B: secondary monthly option */}
          {variant === "B" && (
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}

              className="mt-2 flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-[#189aa1] hover:bg-gray-50 transition-all"
            >
              Or pay {MONTHLY_PRICE}/month
            </a>
          )}

          <button
            onClick={onClose}
            className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SoundBytesPage() {
  const { isAuthenticated, user } = useAuth();
  const { isPremium } = usePremium();

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // activeCategory is always "all" for free users — category filter triggers upgrade modal

  // A/B test for the upgrade modal
  const { variant: abVariant, trackImpression: trackAbImpression, trackClick: trackAbClick } =
    useAbTest("soundbytes_upgrade_modal");

  // Upgrade modal state: holds the category label to display in the modal
  const [upgradeModalCategory, setUpgradeModalCategory] = useState<string | null>(null);

  // Track impression when the modal opens
  useEffect(() => {
    if (upgradeModalCategory !== null) {
      trackAbImpression({ category: upgradeModalCategory });
    }
  }, [upgradeModalCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Fired when the user clicks any upgrade CTA inside the modal.
   * Tracks A/B click + fires Meta Pixel Lead and Subscribe events.
   */
  function handleUpgradeCtaClick() {
    trackAbClick({ category: upgradeModalCategory ?? "" });
    fbTrack("Lead", { content_name: "SoundBytes Upgrade", content_category: "SoundBytes" });
    fbTrack("Subscribe", { content_name: "SoundBytes Upgrade", predicted_ltv: 83.88 });
  }

  // Fetch list (public procedure — returns published items with isFree per category)
  const { data: items = [], isLoading } = trpc.soundBytes.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  // Position-based free access: first FREE_SOUNDBYTES_LIMIT items in the "All" list are playable
  const selectedItemIndex = items.findIndex((i) => i.id === selectedId);
  const selectedIsInFreeSlot = selectedItemIndex >= 0 && selectedItemIndex < FREE_SOUNDBYTES_LIMIT;
  // Can view detail if premium OR if the item is within the first 3 positions and user is logged in
  const canViewSelected = isPremium || (isAuthenticated && selectedIsInFreeSlot);

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

  /**
   * Handle a card click for a free user.
   *
   * Rules:
   *   1. If the item is within the first FREE_SOUNDBYTES_LIMIT positions → play it.
   *   2. Otherwise → show the upgrade modal.
   */
  function handleFreeUserSelect(id: number, itemIndex: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (itemIndex < FREE_SOUNDBYTES_LIMIT) {
      // Allow play — within the free slots
      setSelectedId(id);
      recordView.mutate({ soundByteId: id, watchedSeconds: 0, completed: false });
      // Meta Pixel: free user opened a SoundByte — build retargeting audience
      fbTrack("ViewContent", { content_name: "SoundBytes", content_category: item.category });
    } else {
      // Beyond the free limit — show upgrade modal
      setUpgradeModalCategory("SoundBytes™");
    }
  }

  /**
   * Handle a category filter tab click for a free user.
   * Category filtering is a premium feature — show upgrade modal.
   */
  function handleFreeCategoryClick() {
    setUpgradeModalCategory("category_filter");
  }

  function handlePremiumSelect(id: number) {
    setSelectedId(id);
    recordView.mutate({ soundByteId: id, watchedSeconds: 0, completed: false });
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
      {/* Upgrade modal — rendered at top level so it overlays everything */}
      {upgradeModalCategory && (
        <UpgradeModal
          categoryLabel={upgradeModalCategory}
          onClose={() => setUpgradeModalCategory(null)}
          onCtaClick={handleUpgradeCtaClick}
          variant={abVariant}
        />
      )}

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
                  if (!isPremium && isAuthenticated && id !== "all") {
                    // Category filtering is premium-only for free users
                    handleFreeCategoryClick();
                    return;
                  }
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
                {!isPremium && isAuthenticated && id !== "all" && (
                  <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Growing library notice */}
      <div className="container pt-3 pb-0">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4ad9e0] animate-pulse flex-shrink-0" />
          Our library is growing — check back weekly for new SoundBytes™.
        </p>
      </div>

      {/* Main content */}
      <div className="container py-6">
        {/* Gate: not logged in */}
        {!isAuthenticated && (
          <BlurredOverlay type="login" featureName="SoundBytes™">
            <SoundBytesPreviewGrid items={PREVIEW_ITEMS} />
          </BlurredOverlay>
        )}

        {/* Free user: detail view of their free video */}
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Free Preview</span>
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
            {/* Upgrade CTA — inline after watching a free video */}
            <div className="mt-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider mb-1">Enjoying SoundBytes™?</p>
                <p className="text-white font-bold text-sm">Upgrade to unlock all categories and every SoundByte™</p>
                <p className="text-white/60 text-xs mt-0.5">Free members get the first 3. Premium unlocks the full clinical micro-lesson library.</p>
              </div>
              <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "#189aa1" }}>
                Upgrade Now
              </a>
            </div>
          </div>
        )}

        {/* Gate: logged in but not premium — show grid with per-category gate */}
        {isAuthenticated && !isPremium && selectedId === null && (
          <FreeUserGrid
            items={items}
            isLoading={isLoading}
            onSelect={handleFreeUserSelect}
            previewItems={PREVIEW_ITEMS}
          />
        )}

        {/* Free user tried to view a locked item (shouldn't normally reach here — modal fires first) */}
        {isAuthenticated && !isPremium && selectedId !== null && !canViewSelected && (
          <BlurredOverlay type="premium" featureName="SoundBytes™">
            <SoundBytesPreviewGrid items={PREVIEW_ITEMS} />
          </BlurredOverlay>
        )}

        {/* Content visible to premium users */}
        {isPremium && (
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
                      const isLocked = false; // Premium users see everything unlocked
                      return (
                        <button
                          key={item.id}
                          onClick={() => handlePremiumSelect(item.id)}
                          className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left group transition-all hover:shadow-md hover:border-[#189aa1]/20"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-video bg-gradient-to-br from-[#0e1e2e] to-[#0e4a50] relative overflow-hidden">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
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
                            {/* Play overlay on hover */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "#189aa1" }}
                              >
                                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                              </div>
                            </div>
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


// ── FreeUserGrid — shown to logged-in free users ───────────────────────────────
//
// Gate logic:
//   • Index 0..FREE_SOUNDBYTES_LIMIT-1 → playable (green "Free" badge)
//   • Index FREE_SOUNDBYTES_LIMIT+ → locked (Crown overlay), clicking fires upgrade modal

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
  onSelect: (id: number, itemIndex: number) => void;
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

  type GridItem = { id: number; title: string; category: string; thumbnailUrl?: string | null; displayViews?: number | null; phantomViews?: number | null; isFree?: boolean };
  const displayItems: GridItem[] = items.length > 0 ? items : previewItems.map((p, i) => ({ ...p, id: -(i + 1), isFree: false }));

  return (
    <>
      {/* Free tier banner */}
      <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(90deg, #0e1e2e, #0e4a50)" }}>
        <Crown className="w-5 h-5 text-[#4ad9e0] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Free Access: First {FREE_SOUNDBYTES_LIMIT} SoundBytes™</p>
          <p className="text-white/60 text-xs">Upgrade to Premium to unlock all categories and the full micro-lesson library.</p>
        </div>
        <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#189aa1" }}>
          Upgrade
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item, idx) => {
          // Position-based: first FREE_SOUNDBYTES_LIMIT items are playable
          const isPlayable = idx < FREE_SOUNDBYTES_LIMIT;
          const isLocked = !isPlayable;

          return (
            <button
              key={item.id}
              onClick={() => item.id > 0 ? onSelect(item.id, idx) : undefined}
              className={`bg-white rounded-xl border overflow-hidden text-left group transition-all ${
                isPlayable
                  ? "border-gray-100 hover:shadow-md hover:border-[#189aa1]/20 cursor-pointer"
                  : "border-gray-100 cursor-pointer hover:opacity-90"
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

                {/* Playable: green Free badge */}
                {isPlayable && (
                  <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                    Free
                  </span>
                )}

                {/* Lock overlay for locked items */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-1">
                      <Crown className="w-6 h-6 text-amber-400" />
                      <span className="text-xs text-white/80 font-semibold">Premium</span>
                    </div>
                  </div>
                )}

                {/* Play overlay on hover (playable items only) */}
                {isPlayable && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#189aa1" }}>
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Upgrade prompt overlay on hover (locked items) */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-bold bg-[#189aa1] px-3 py-1.5 rounded-full shadow">
                      Upgrade to watch
                    </span>
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
                  {isPlayable && (
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
