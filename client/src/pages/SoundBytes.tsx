/**
 * SoundBytes™ — Premium micro-lesson video library
 * Filterable by clinical category. Premium gate for all content.
 */

import { useState } from "react";
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
} from "lucide-react";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "acs", label: "ACS", icon: Stethoscope },
  { id: "adult_echo", label: "Adult Echo", icon: Activity },
  { id: "pediatric_echo", label: "Pediatric Echo", icon: Stethoscope },
  { id: "fetal_echo", label: "Fetal Echo", icon: Baby },
  { id: "pocus", label: "POCUS", icon: Zap },
  { id: "physics", label: "Physics", icon: Microscope },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  acs: "ACS",
  adult_echo: "Adult Echo",
  pediatric_echo: "Pediatric Echo",
  fetal_echo: "Fetal Echo",
  pocus: "POCUS",
  physics: "Physics",
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

  // Fetch selected item detail
  const { data: selected } = trpc.soundBytes.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null && isPremium }
  );

  // Record view mutation
  const recordView = trpc.soundBytes.recordView.useMutation();

  function handleSelect(id: number) {
    setSelectedId(id);
    if (isPremium) {
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

        {/* Gate: logged in but not premium */}
        {isAuthenticated && !isPremium && (
          <BlurredOverlay type="premium" featureName="SoundBytes™">
            <SoundBytesPreviewGrid items={PREVIEW_ITEMS} />
          </BlurredOverlay>
        )}

        {/* Premium: show content */}
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
                        {(selected.displayViews ?? 0).toLocaleString()} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rich text body */}
                {selected.body && (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selected.body }}
                  />
                )}
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
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left group hover:shadow-md hover:border-[#189aa1]/20 transition-all"
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
                              {(item.displayViews ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
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
