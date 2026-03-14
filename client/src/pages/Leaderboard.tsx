/**
 * Leaderboard.tsx
 *
 * Standalone leaderboard page showing top iHeartEcho users ranked by
 * engagement points earned across Daily Challenge, Case submissions,
 * and Flashcard usage.
 *
 * Features:
 * - Category tabs: Overall / Daily Challenge / Cases / Flashcards
 * - Period filter: All Time / This Month / This Week
 * - Current user rank highlight (if logged in)
 * - Point breakdown legend
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Trophy,
  Medal,
  Zap,
  BookOpen,
  Layers,
  Star,
  Calendar,
  Clock,
  TrendingUp,
  User,
} from "lucide-react";

type Category = "total" | "challenge" | "case" | "flashcard";
type Period = "all_time" | "this_month" | "this_week";

const BRAND = "#189aa1";
const AQUA = "#4ad9e0";

const categoryTabs: { id: Category; label: string; icon: typeof Zap; color: string }[] = [
  { id: "total", label: "Overall", icon: Trophy, color: BRAND },
  { id: "challenge", label: "Daily Challenge", icon: Zap, color: "#f59e0b" },
  { id: "case", label: "Cases", icon: BookOpen, color: "#8b5cf6" },
  { id: "flashcard", label: "Flashcards", icon: Layers, color: "#10b981" },
];

const periodOptions: { id: Period; label: string; icon: typeof Calendar }[] = [
  { id: "all_time", label: "All Time", icon: Star },
  { id: "this_month", label: "This Month", icon: Calendar },
  { id: "this_week", label: "This Week", icon: Clock },
];

const pointBreakdown = [
  { icon: Zap, label: "Daily Challenge correct answer", points: 10, color: "#f59e0b" },
  { icon: BookOpen, label: "Case submission", points: 25, color: "#8b5cf6" },
  { icon: Trophy, label: "Case approved/published", points: 50, color: "#ef4444" },
  { icon: Layers, label: "Flashcard session completed", points: 5, color: "#10b981" },
  { icon: Layers, label: "Per flashcard viewed", points: 1, color: "#10b981" },
];

function RankBadge({ rank, isCurrentUser }: { rank: number; isCurrentUser?: boolean }) {
  if (rank === 1)
    return (
      <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-sm font-bold text-gray-700">2</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-sm font-bold text-white">3</span>
      </div>
    );
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
      style={
        isCurrentUser
          ? { background: BRAND, color: "#fff" }
          : { background: "#f3f4f6", color: "#6b7280" }
      }
    >
      {rank}
    </div>
  );
}

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [category, setCategory] = useState<Category>("total");
  const [period, setPeriod] = useState<Period>("all_time");

  const leaderboardQuery = trpc.leaderboard.getLeaderboard.useQuery(
    { limit: 50, category, period },
    { staleTime: 30_000 }
  );

  const myPointsQuery = trpc.leaderboard.getMyPoints.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const entries = leaderboardQuery.data ?? [];
  const myUserId = user?.id;
  const myRank = myPointsQuery.data?.rank;
  const myTotals = myPointsQuery.data?.totals;

  const activeCategoryTab = categoryTabs.find((t) => t.id === category)!;

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)",
        }}
      >
        <div className="container py-8 md:py-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(74,217,224,0.2)" }}
            >
              <Trophy className="w-5 h-5 text-[#4ad9e0]" />
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-black text-white"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                Leaderboard
              </h1>
              <p className="text-white/60 text-sm">Top echo professionals ranked by engagement points</p>
            </div>
          </div>

          {/* My stats card (if logged in) */}
          {isAuthenticated && myTotals && (
            <div
              className="mt-5 rounded-xl p-4 flex items-center gap-4"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(74,217,224,0.2)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: BRAND }}
              >
                {myRank ?? "—"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {user?.displayName || user?.name || "You"}
                </p>
                <p className="text-white/50 text-xs">Your current rank</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div>
                  <div
                    className="text-lg font-bold text-[#4ad9e0]"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {myTotals.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs">total pts</div>
                </div>
                <div>
                  <div
                    className="text-lg font-bold text-amber-400"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {myTotals.challengePoints.toLocaleString()}
                  </div>
                  <div className="text-white/40 text-xs">challenge</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container">
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                  style={
                    active
                      ? { background: tab.color + "18", color: tab.color, border: `1px solid ${tab.color}40` }
                      : { color: "#6b7280", border: "1px solid transparent" }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Period pills */}
          <div className="flex gap-2 pb-3">
            {periodOptions.map((opt) => {
              const Icon = opt.icon;
              const active = period === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={
                    active
                      ? { background: BRAND, color: "#fff" }
                      : { background: "#f3f4f6", color: "#6b7280" }
                  }
                >
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard list */}
          <div className="lg:col-span-2">
            {leaderboardQuery.isLoading && (
              <div className="flex justify-center py-16">
                <div
                  className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: `${BRAND} transparent ${BRAND} ${BRAND}` }}
                />
              </div>
            )}

            {!leaderboardQuery.isLoading && entries.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Trophy className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-gray-500">No entries yet</p>
                <p className="text-sm mt-1">
                  Complete daily challenges, submit cases, or use flashcards to earn points!
                </p>
              </div>
            )}

            {entries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* List header */}
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}
                >
                  {(() => {
                    const Icon = activeCategoryTab.icon;
                    return <Icon className="w-4 h-4 text-white" />;
                  })()}
                  <h2 className="font-bold text-white text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                    {activeCategoryTab.label} —{" "}
                    {period === "all_time" ? "All Time" : period === "this_month" ? "This Month" : "This Week"}
                  </h2>
                  <span className="ml-auto text-white/60 text-xs">{entries.length} ranked</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {entries.map((entry) => {
                    const isMe = entry.userId === myUserId;
                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                          isMe ? "bg-[#f0fbfc]" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <RankBadge rank={entry.rank} isCurrentUser={isMe} />

                        {/* Avatar */}
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                            style={{ background: isMe ? BRAND : "#e5e7eb", color: isMe ? "#fff" : "#9ca3af" }}
                          >
                            {entry.displayName?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800 truncate">
                              {entry.displayName}
                            </span>
                            {isMe && (
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                style={{ background: BRAND }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          {entry.credentials && (
                            <p className="text-xs text-gray-400 truncate">{entry.credentials}</p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className="font-bold text-base"
                            style={{ color: activeCategoryTab.color, fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {entry.points.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">pts</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: How points work */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: BRAND }} />
                <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                  How Points Work
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {pointBreakdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: item.color + "18" }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 leading-snug">{item.label}</p>
                      </div>
                      <div
                        className="text-sm font-bold flex-shrink-0"
                        style={{ color: item.color, fontFamily: "JetBrains Mono, monospace" }}
                      >
                        +{item.points}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My point breakdown (if logged in) */}
            {isAuthenticated && myTotals && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: BRAND }} />
                  <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                    My Points
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: "Total Points", value: myTotals.totalPoints, color: BRAND },
                    { label: "Daily Challenge", value: myTotals.challengePoints, color: "#f59e0b" },
                    { label: "Case Submissions", value: myTotals.casePoints, color: "#8b5cf6" },
                    { label: "Flashcards", value: myTotals.flashcardPoints, color: "#10b981" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: row.color, fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {row.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div
                    className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-500">Your Rank</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: BRAND, fontFamily: "JetBrains Mono, monospace" }}
                    >
                      #{myRank ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
