/*
 * QuickFire.tsx — Daily Challenge
 *
 * Four tabs:
 *   1. Daily Challenge  — today's question set (scenario / image / quick-review)
 *   2. Challenge Archive — past daily challenges (premium only; free members see today's challenge only)
 *   3. My Performance   — personal stats, per-category breakdown, 14-day activity chart
 *   4. Leaderboard      — ranked leaderboard with period filter and current user rank
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Zap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RefreshCw,
  Archive,
  Flame,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Star,
  Medal,
  Calendar,
  Tag,
  Clock,
  Crown,
  BarChart3,
  Target,
  TrendingUp,
  Filter,
  ChevronDown,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerResult = {
  isCorrect: boolean | null;
  correctAnswer: number | null;
  explanation: string | null;
  reviewAnswer: string | null;
};

type LeaderboardPeriod = "7d" | "30d" | "allTime";

const CATEGORY_TAGS = ["ACS", "Adult Echo", "Pediatric Echo", "Fetal Echo"] as const;
const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"] as const;

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  scenario: { label: "Scenario", color: "bg-blue-100 text-blue-700", icon: ({ className }) => <span className={className}>📋</span> },
  image: { label: "Image", color: "bg-purple-100 text-purple-700", icon: ({ className }) => <span className={className}>🖼️</span> },
  quickReview: { label: "Quick Review", color: "bg-amber-100 text-amber-700", icon: ({ className }) => <span className={className}>⚡</span> },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-red-100 text-red-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACS: "bg-red-100 text-red-700",
  "Adult Echo": "bg-[#189aa1]/10 text-[#189aa1]",
  "Pediatric Echo": "bg-purple-100 text-purple-700",
  "Fetal Echo": "bg-pink-100 text-pink-700",
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function ActivityBar({ date, correct, total }: { date: string; correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const height = Math.max(4, Math.round((pct / 100) * 48));
  const label = new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="flex flex-col items-center gap-1 group relative">
      <div className="w-6 bg-gray-100 rounded-sm flex items-end" style={{ height: 48 }}>
        <div
          className="w-full rounded-sm transition-all"
          style={{ height, background: pct >= 80 ? "#189aa1" : pct >= 60 ? "#4ad9e0" : "#f59e0b" }}
        />
      </div>
      <span className="text-[9px] text-gray-400 rotate-45 origin-left translate-x-1">{label}</span>
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
        {correct}/{total} correct ({pct}%)
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuickFire() {
  const { isAuthenticated, user } = useAuth();
  const isPremium = (user as any)?.role === "admin" || (user as any)?.isPremium === true;

  // Top-level tab
  const [activeTab, setActiveTab] = useState<"challenge" | "archive" | "performance" | "leaderboard">("challenge");

  // ── Daily Challenge state ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = trpc.quickfire.getTodaySet.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const statsQuery = trpc.quickfire.getUserStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const submitMutation = trpc.quickfire.submitAnswer.useMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ correct: boolean | null }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const allQuestions = data?.questions ?? [];
  const userAttempts = data?.userAttempts ?? {};

  const presentTags = CATEGORY_TAGS.filter((cat) =>
    allQuestions.some((q) => Array.isArray(q.tags) && q.tags.includes(cat))
  );

  const questions = activeTagFilter
    ? allQuestions.filter((q) => Array.isArray(q.tags) && q.tags.includes(activeTagFilter))
    : allQuestions;

  const currentQ = questions[currentIndex];

  const alreadyCompleted =
    questions.length > 0 && questions.every((q) => userAttempts[q.id] !== undefined);

  // ── Archive state ──────────────────────────────────────────────────────────
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(null);
  const [archiveQIndex, setArchiveQIndex] = useState(0);
  const [archiveSelected, setArchiveSelected] = useState<number | null>(null);
  const [archiveAnswered, setArchiveAnswered] = useState(false);
  const [archiveFlipped, setArchiveFlipped] = useState(false);
  const [archiveSessionResults, setArchiveSessionResults] = useState<Array<{ correct: boolean | null }>>([]);
  const [archiveShowResults, setArchiveShowResults] = useState(false);

  // Archive filters
  const [archiveCategoryFilter, setArchiveCategoryFilter] = useState<string | undefined>(undefined);
  const [archiveDifficultyFilter, setArchiveDifficultyFilter] = useState<"beginner" | "intermediate" | "advanced" | undefined>(undefined);
  const [archiveDateFrom, setArchiveDateFrom] = useState<string | undefined>(undefined);
  const [archiveDateTo, setArchiveDateTo] = useState<string | undefined>(undefined);
  const [showArchiveFilters, setShowArchiveFilters] = useState(false);

  const archiveListQuery = trpc.quickfire.getChallengeArchive.useQuery(
    {
      page: 1,
      limit: 20,
      category: archiveCategoryFilter,
      difficulty: archiveDifficultyFilter,
      dateFrom: archiveDateFrom,
      dateTo: archiveDateTo,
    },
    { enabled: activeTab === "archive" && isAuthenticated }
  );

  const archiveDetailQuery = trpc.quickfire.getArchivedChallenge.useQuery(
    { id: selectedArchiveId! },
    { enabled: selectedArchiveId !== null && isAuthenticated }
  );

  const archiveQuestions = archiveDetailQuery.data?.questions ?? [];
  const archiveCurrentQ = archiveQuestions[archiveQIndex];

  // ── Performance state ──────────────────────────────────────────────────────
  const perfQuery = trpc.quickfire.getUserStats.useQuery(undefined, {
    enabled: activeTab === "performance" && isAuthenticated,
  });

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>("30d");
  const leaderboardQuery = trpc.quickfire.getLeaderboard.useQuery(
    { period: lbPeriod },
    { enabled: activeTab === "leaderboard" }
  );

  // ── Handlers: Daily Challenge ──────────────────────────────────────────────
  const handleSelectAnswer = async (idx: number) => {
    if (answered || !currentQ) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    try {
      const result = await submitMutation.mutateAsync({ questionId: currentQ.id, selectedAnswer: idx });
      setAnswerResult(result);
      setSessionResults((prev) => [...prev, { correct: result.isCorrect }]);
    } catch {
      const existing = userAttempts[currentQ.id];
      if (existing) {
        setAnswerResult({
          isCorrect: existing.isCorrect,
          correctAnswer: currentQ.correctAnswer,
          explanation: currentQ.explanation,
          reviewAnswer: currentQ.reviewAnswer,
        });
      } else {
        toast.error("Failed to submit answer. Please try again.");
        setAnswered(false);
        setSelectedAnswer(null);
      }
    }
  };

  const handleSelfMark = async (correct: boolean) => {
    if (answered || !currentQ) return;
    setFlipped(true);
    setAnswered(true);
    try {
      const result = await submitMutation.mutateAsync({ questionId: currentQ.id, selfMarkedCorrect: correct });
      setAnswerResult(result);
      setSessionResults((prev) => [...prev, { correct: result.isCorrect }]);
    } catch {
      toast.error("Failed to record answer.");
      setAnswered(false);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setAnswerResult(null);
      setFlipped(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswerResult(null);
    setSessionResults([]);
    setShowResults(false);
    setFlipped(false);
    setActiveTagFilter(null);
    refetch();
  };

  const handleTagFilter = (tag: string | null) => {
    setActiveTagFilter(tag);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswerResult(null);
    setSessionResults([]);
    setShowResults(false);
    setFlipped(false);
  };

  // ── Handlers: Archive ──────────────────────────────────────────────────────
  const openArchiveChallenge = (id: number) => {
    setSelectedArchiveId(id);
    setArchiveQIndex(0);
    setArchiveSelected(null);
    setArchiveAnswered(false);
    setArchiveFlipped(false);
    setArchiveSessionResults([]);
    setArchiveShowResults(false);
  };

  const handleArchiveAnswer = async (idx: number) => {
    if (archiveAnswered || !archiveCurrentQ) return;
    setArchiveSelected(idx);
    setArchiveAnswered(true);
    const isCorrect = idx === archiveCurrentQ.correctAnswer;
    setArchiveSessionResults((prev) => [...prev, { correct: isCorrect }]);
  };

  const handleArchiveSelfMark = (correct: boolean) => {
    if (archiveAnswered || !archiveCurrentQ) return;
    setArchiveFlipped(true);
    setArchiveAnswered(true);
    setArchiveSessionResults((prev) => [...prev, { correct }]);
  };

  const handleArchiveNext = () => {
    if (archiveQIndex < archiveQuestions.length - 1) {
      setArchiveQIndex((i) => i + 1);
      setArchiveSelected(null);
      setArchiveAnswered(false);
      setArchiveFlipped(false);
    } else {
      setArchiveShowResults(true);
    }
  };

  const clearArchiveFilters = () => {
    setArchiveCategoryFilter(undefined);
    setArchiveDifficultyFilter(undefined);
    setArchiveDateFrom(undefined);
    setArchiveDateTo(undefined);
  };

  const hasArchiveFilters = !!(archiveCategoryFilter || archiveDifficultyFilter || archiveDateFrom || archiveDateTo);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center text-center gap-6 max-w-lg">
          <div className="w-16 h-16 rounded-full bg-[#189aa1]/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#189aa1]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            Sign In to Play Daily Challenge
          </h1>
          <p className="text-gray-500 text-sm">
            Daily challenges and the challenge archive are available to registered members. Sign in to test your knowledge.
          </p>
          <a href={getLoginUrl()}>
            <Button style={{ background: "#189aa1" }} className="text-white">Sign In / Register</Button>
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        {/* Page header */}
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#189aa1" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                Daily Challenge
              </h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-sm leading-relaxed">
                One question. One case. One chance today. Answer the challenge, see the explanation. Maintain your streak, earn points and compare with other echo professionals.
              </p>
            </div>
          </div>
          {/* Streak + Stats Panel */}
          {statsQuery.data && (
            <div className="flex flex-col items-end gap-2">
              {/* Streak Counter */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                statsQuery.data.streak >= 7
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
                  : statsQuery.data.streak >= 3
                  ? "bg-amber-50 border-amber-200"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black leading-none" style={{ fontFamily: "JetBrains Mono, monospace", color: statsQuery.data.streak >= 3 ? "#f59e0b" : "#9ca3af" }}>
                    {statsQuery.data.streak}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: statsQuery.data.streak >= 3 ? "#92400e" : "#6b7280" }}>day streak</span>
                </div>
                <Flame className={`w-6 h-6 ${statsQuery.data.streak >= 3 ? "text-amber-500" : "text-gray-300"}`} />
              </div>
              {/* Milestone message */}
              {statsQuery.data.streak > 0 && (
                <span className="text-xs font-medium" style={{ color: statsQuery.data.streak >= 30 ? "#dc2626" : statsQuery.data.streak >= 14 ? "#d97706" : statsQuery.data.streak >= 7 ? "#f59e0b" : "#9ca3af" }}>
                  {statsQuery.data.streak >= 30 ? "🔥 30-day legend!" :
                   statsQuery.data.streak >= 14 ? "🔥 2-week warrior!" :
                   statsQuery.data.streak >= 7 ? "🔥 7-day streak! Keep it up!" :
                   statsQuery.data.streak >= 3 ? `${statsQuery.data.streak} days in a row!` :
                   "Start your streak today!"}
                </span>
              )}
              {/* Correct answers pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fbfc] border border-[#189aa1]/20">
                <Star className="w-3 h-3 text-[#189aa1]" />
                <span className="text-xs font-bold text-[#189aa1]">{statsQuery.data.correct} correct</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { id: "challenge" as const, label: "Daily Challenge", icon: Zap },
            { id: "archive" as const, label: "Archive", icon: Archive },
            { id: "performance" as const, label: "My Performance", icon: BarChart3 },
            { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={activeTab === id ? { background: "#189aa1" } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Daily Challenge ─────────────────────────────────────────── */}
        {activeTab === "challenge" && (
          <>
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-12 h-12 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
                <p className="text-gray-500 text-sm">Loading today's challenge…</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-gray-600">Failed to load today's challenge. Please try again.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div>
            )}

            {!isLoading && !error && questions.length === 0 && (
              <div className="flex flex-col items-center gap-6 py-16 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#189aa1]/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#189aa1]" />
                </div>
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                  No Challenge Today Yet
                </h2>
                <p className="text-gray-500 text-sm">
                  Today's challenge is being prepared. Check back soon.
                  {isPremium && " In the meantime, browse past challenges in the archive."}
                </p>
                {isPremium && (
                  <Button variant="outline" onClick={() => setActiveTab("archive")}>
                    <Archive className="w-4 h-4 mr-2" /> Browse Archive
                  </Button>
                )}
              </div>
            )}

            {/* Already completed */}
            {!isLoading && !error && alreadyCompleted && !showResults && sessionResults.length === 0 && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
                <Trophy className="w-14 h-14 text-[#4ad9e0] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                  Today's Challenge Complete!
                </h2>
                <p className="text-white/60 text-sm mb-1">Today's score</p>
                <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {questions.filter((q) => userAttempts[q.id]?.isCorrect === true).length}/{questions.length}
                </div>
                <p className="text-[#4ad9e0] font-semibold mb-6">
                  {Math.round((questions.filter((q) => userAttempts[q.id]?.isCorrect === true).length / questions.length) * 100)}% correct
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    className="text-white"
                    style={{ background: "#189aa1" }}
                    onClick={() => setActiveTab("performance")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" /> View My Stats
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => setActiveTab("leaderboard")}
                  >
                    <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={handleRestart}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Review
                  </Button>
                </div>
              </div>
            )}

            {/* Session results */}
            {showResults && (() => {
              const correctCount = sessionResults.filter((r) => r.correct === true).length;
              const pct = Math.round((correctCount / questions.length) * 100);
              const grade =
                pct >= 80 ? { label: "Echo Ninja 🥷", color: "text-[#4ad9e0]" } :
                pct >= 60 ? { label: "Good Work! 👍", color: "text-blue-300" } :
                { label: "Keep Practicing 📚", color: "text-orange-400" };
              return (
                <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
                  <Trophy className="w-14 h-14 text-[#4ad9e0] mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                    Challenge Complete!
                  </h2>
                  <p className={`text-lg font-bold mb-2 ${grade.color}`}>{grade.label}</p>
                  <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {correctCount}/{questions.length}
                  </div>
                  <p className="text-white/50 text-sm mb-6">{pct}% correct</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button className="text-white" style={{ background: "#189aa1" }} onClick={() => setActiveTab("performance")}>
                      <BarChart3 className="w-4 h-4 mr-2" /> My Stats
                    </Button>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setActiveTab("leaderboard")}>
                      <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                    </Button>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={handleRestart}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Question card */}
            {!isLoading && !error && currentQ && !showResults && (() => {
              const typeInfo = TYPE_LABELS[currentQ.type] ?? TYPE_LABELS.scenario;
              const TypeIcon = typeInfo.icon;
              const options: string[] = Array.isArray(currentQ.options) ? currentQ.options : [];
              const progress = ((currentIndex) / questions.length) * 100;
              const isQuickReview = currentQ.type === "quickReview";

              return (
                <>
                  {/* Category filter chips */}
                  {presentTags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      <button
                        onClick={() => handleTagFilter(null)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          activeTagFilter === null
                            ? "text-white border-transparent"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1]"
                        }`}
                        style={activeTagFilter === null ? { background: "#189aa1" } : {}}
                      >
                        All
                      </button>
                      {presentTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagFilter(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            activeTagFilter === tag
                              ? "text-white border-transparent"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1]"
                          }`}
                          style={activeTagFilter === tag ? { background: "#189aa1" } : {}}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Question {currentIndex + 1} of {questions.length}</span>
                      <span>{Math.round(progress)}% complete</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                        {currentQ.difficulty && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[currentQ.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                            {currentQ.difficulty}
                          </span>
                        )}
                        {Array.isArray(currentQ.tags) && currentQ.tags.map((tag: string) => (
                          <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-800 leading-snug mt-2">
                        {currentQ.question}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 pb-3">
                      {currentQ.imageUrl && (
                        <img
                          src={currentQ.imageUrl}
                          alt="Question image"
                          className="w-full rounded-lg object-cover max-h-64 mb-3"
                        />
                      )}
                      {(currentQ as any).videoUrl && (
                        <video
                          src={(currentQ as any).videoUrl}
                          controls
                          controlsList="nodownload"
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full rounded-lg max-h-64 bg-black mb-3"
                        />
                      )}

                      {isQuickReview ? (
                        <>
                          {/* 3D Flip Card for Flashcard/QuickReview questions */}
                          <div className="flashcard-scene mb-4" style={{ minHeight: 200 }}>
                            <div className={`flashcard-card ${flipped ? "is-flipped" : ""}`} style={{ minHeight: 200 }}>
                              {/* Front face — question prompt */}
                              <div className="flashcard-face flashcard-face--front">
                                <div className="mb-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#189aa1]/15 text-[#189aa1] mb-3">
                                    ⚡ Flashcard
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 mb-4">Think about your answer, then flip the card.</p>
                                <Button
                                  className="text-white shadow-md"
                                  style={{ background: "#189aa1" }}
                                  onClick={() => setFlipped(true)}
                                >
                                  Flip Card →
                                </Button>
                              </div>
                              {/* Back face — answer */}
                              <div className="flashcard-face flashcard-face--back">
                                <div className="mb-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white mb-2">
                                    ✓ Answer
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-white/95 mb-4">{currentQ.reviewAnswer}</p>
                                {!answered && (
                                  <div className="flex gap-3 mt-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-400 hover:bg-green-500 text-white border-0"
                                      onClick={() => handleSelfMark(true)}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Got it
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-400 hover:bg-red-500 text-white border-0"
                                      onClick={() => handleSelfMark(false)}
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5 mr-1.5" /> Missed it
                                    </Button>
                                  </div>
                                )}
                                {answered && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/40 text-white hover:bg-white/10 mt-2"
                                    onClick={() => setFlipped(false)}
                                  >
                                    ← Flip Back
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        options.map((opt, idx) => {
                          const isSelected = selectedAnswer === idx;
                          const isCorrect = answerResult?.correctAnswer === idx;
                          let btnClass = "w-full text-left p-3 rounded-lg border-2 text-sm transition-all ";
                          if (!answered) {
                            btnClass += "border-gray-100 bg-white hover:border-[#189aa1] hover:bg-[#189aa1]/5 cursor-pointer";
                          } else if (isCorrect) {
                            btnClass += "border-green-500 bg-green-50 text-green-800";
                          } else if (isSelected && !isCorrect) {
                            btnClass += "border-red-400 bg-red-50 text-red-700";
                          } else {
                            btnClass += "border-gray-100 bg-gray-50 text-gray-400";
                          }
                          return (
                            <button key={idx} className={btnClass} onClick={() => handleSelectAnswer(idx)} disabled={answered}>
                              <span className="flex items-center gap-3">
                                <span
                                  className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={
                                    answered && isCorrect ? { borderColor: "#16a34a", background: "#16a34a", color: "white" } :
                                    answered && isSelected && !isCorrect ? { borderColor: "#ef4444", background: "#ef4444", color: "white" } :
                                    { borderColor: "#d1d5db" }
                                  }
                                >
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />}
                                {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
                              </span>
                            </button>
                          );
                        })
                      )}

                      {answered && answerResult?.explanation && (
                        <div className="mt-2 p-4 rounded-lg bg-[#189aa1]/8 border border-[#189aa1]/20">
                          <p className="text-xs font-semibold text-[#189aa1] mb-1">Explanation</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{answerResult.explanation}</p>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-2">
                      {(answered || (isQuickReview && flipped && answered)) && (
                        <Button className="w-full text-white" style={{ background: "#189aa1" }} onClick={handleNext}>
                          {currentIndex < questions.length - 1 ? (
                            <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
                          ) : (
                            <>See Results <Trophy className="w-4 h-4 ml-1" /></>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {questions.map((_, i) => (
                      <div key={i} className={`h-2 rounded-full transition-all ${i < currentIndex ? "bg-[#189aa1] w-2" : i === currentIndex ? "bg-[#189aa1] w-4" : "bg-gray-200 w-2"}`} />
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ── TAB: Challenge Archive ───────────────────────────────────────── */}
        {activeTab === "archive" && (
          <>
            {/* Free users: show premium gate immediately — no archive access at all */}
            {!isPremium && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Challenge Archive — Premium Only</h2>
                <p className="text-sm text-gray-500 max-w-sm mb-1">
                  Free members can access <strong>today's daily challenge only</strong>. Upgrade to Premium for unlimited access to all past challenges.
                </p>
                <p className="text-xs text-gray-400 mb-6">Replay past challenges, track your improvement, and never miss a learning opportunity.</p>
                <a href="/premium">
                  <Button className="text-white px-6" style={{ background: "#189aa1" }}>
                    <Crown className="w-4 h-4 mr-2" /> Upgrade to Premium
                  </Button>
                </a>
                <p className="text-xs text-gray-400 mt-4">Already a premium member? <a href="/premium" className="text-[#189aa1] hover:underline">Sync your membership</a></p>
              </div>
            )}

            {/* Premium users: show full archive */}
            {isPremium && selectedArchiveId === null && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Challenge Archive</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Unlimited access — all past challenges</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowArchiveFilters(!showArchiveFilters)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        hasArchiveFilters
                          ? "text-white border-transparent"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1]"
                      }`}
                      style={hasArchiveFilters ? { background: "#189aa1" } : {}}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Filters {hasArchiveFilters && "(active)"}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showArchiveFilters ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Filter panel */}
                {showArchiveFilters && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 space-y-4">
                    {/* Category filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Category</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setArchiveCategoryFilter(undefined)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            !archiveCategoryFilter ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                          }`}
                          style={!archiveCategoryFilter ? { background: "#189aa1" } : {}}
                        >All</button>
                        {CATEGORY_TAGS.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setArchiveCategoryFilter(archiveCategoryFilter === cat ? undefined : cat)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              archiveCategoryFilter === cat ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                            }`}
                            style={archiveCategoryFilter === cat ? { background: "#189aa1" } : {}}
                          >{cat}</button>
                        ))}
                      </div>
                    </div>
                    {/* Difficulty filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Difficulty</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setArchiveDifficultyFilter(undefined)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            !archiveDifficultyFilter ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                          }`}
                          style={!archiveDifficultyFilter ? { background: "#189aa1" } : {}}
                        >All</button>
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <button
                            key={d}
                            onClick={() => setArchiveDifficultyFilter(archiveDifficultyFilter === d ? undefined : d)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              archiveDifficultyFilter === d ? "text-white border-transparent" : `bg-white border-gray-200 ${DIFFICULTY_COLORS[d]}`
                            }`}
                            style={archiveDifficultyFilter === d ? { background: "#189aa1", color: "white" } : {}}
                          >{d.charAt(0).toUpperCase() + d.slice(1)}</button>
                        ))}
                      </div>
                    </div>
                    {/* Date range */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Date Range</p>
                      <div className="flex gap-3 items-center flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">From</span>
                          <input
                            type="date"
                            value={archiveDateFrom ?? ""}
                            onChange={(e) => setArchiveDateFrom(e.target.value || undefined)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#189aa1]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">To</span>
                          <input
                            type="date"
                            value={archiveDateTo ?? ""}
                            onChange={(e) => setArchiveDateTo(e.target.value || undefined)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#189aa1]"
                          />
                        </div>
                        {hasArchiveFilters && (
                          <button onClick={clearArchiveFilters} className="text-xs text-red-500 hover:underline">
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {archiveListQuery.isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                )}

                {archiveListQuery.data && archiveListQuery.data.challenges.length === 0 && (
                  <div className="text-center py-16">
                    <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">
                      {hasArchiveFilters ? "No challenges match your filters" : "No archived challenges yet"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hasArchiveFilters
                        ? "Try adjusting or clearing your filters."
                        : "Completed daily challenges will appear here after their 24-hour window closes."}
                    </p>
                    {hasArchiveFilters && (
                      <button onClick={clearArchiveFilters} className="mt-3 text-sm text-[#189aa1] hover:underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {archiveListQuery.data && archiveListQuery.data.challenges.length > 0 && (
                  <div className="space-y-3">
                    {archiveListQuery.data.challenges.map((challenge: any) => {
                      const daysAgo = challenge.archivedAt
                        ? Math.floor((Date.now() - new Date(challenge.archivedAt).getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <div
                          key={challenge.id}
                          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#189aa1]/40 cursor-pointer transition-all"
                          onClick={() => openArchiveChallenge(challenge.id)}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fbfc" }}>
                            <Archive className="w-5 h-5 text-[#189aa1]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate">{challenge.title}</div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {challenge.category && (
                                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[challenge.category] ?? "bg-gray-100 text-gray-600"}`}>
                                  <Tag className="w-3 h-3" />{challenge.category}
                                </span>
                              )}
                              {challenge.difficulty && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[challenge.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                                  {challenge.difficulty}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {challenge.archivedAt
                                  ? new Date(challenge.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                  : "—"}
                              </span>
                              {daysAgo !== null && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />{daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Archive challenge player */}
            {selectedArchiveId !== null && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setSelectedArchiveId(null)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#189aa1] transition-colors"
                  >
                    ← Back to Archive
                  </button>
                  {archiveDetailQuery.data && (
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-gray-800">{archiveDetailQuery.data.title}</span>
                      {archiveDetailQuery.data.category && (
                        <span className="ml-2 text-xs text-gray-400">· {archiveDetailQuery.data.category}</span>
                      )}
                    </div>
                  )}
                </div>

                {archiveDetailQuery.isLoading && (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <div className="w-12 h-12 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
                    <p className="text-gray-500 text-sm">Loading challenge…</p>
                  </div>
                )}

                {/* Archive results */}
                {archiveShowResults && (() => {
                  const correctCount = archiveSessionResults.filter((r) => r.correct === true).length;
                  const pct = Math.round((correctCount / archiveQuestions.length) * 100);
                  const grade =
                    pct >= 80 ? { label: "Echo Ninja 🥷", color: "text-[#4ad9e0]" } :
                    pct >= 60 ? { label: "Good Work! 👍", color: "text-blue-300" } :
                    { label: "Keep Practicing 📚", color: "text-orange-400" };
                  return (
                    <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
                      <Trophy className="w-14 h-14 text-[#4ad9e0] mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                        Challenge Complete!
                      </h2>
                      <p className={`text-lg font-bold mb-2 ${grade.color}`}>{grade.label}</p>
                      <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {correctCount}/{archiveQuestions.length}
                      </div>
                      <p className="text-white/50 text-sm mb-6">{pct}% correct</p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button
                          className="text-white"
                          style={{ background: "#189aa1" }}
                          onClick={() => {
                            setArchiveQIndex(0);
                            setArchiveSelected(null);
                            setArchiveAnswered(false);
                            setArchiveFlipped(false);
                            setArchiveSessionResults([]);
                            setArchiveShowResults(false);
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                        </Button>
                        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setSelectedArchiveId(null)}>
                          <Archive className="w-4 h-4 mr-2" /> Back to Archive
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Archive question card */}
                {!archiveDetailQuery.isLoading && archiveCurrentQ && !archiveShowResults && (() => {
                  const typeInfo = TYPE_LABELS[archiveCurrentQ.type] ?? TYPE_LABELS.scenario;
                  const TypeIcon = typeInfo.icon;
                  const options: string[] = Array.isArray(archiveCurrentQ.options) ? archiveCurrentQ.options : [];
                  const progress = (archiveQIndex / archiveQuestions.length) * 100;
                  const isQuickReview = archiveCurrentQ.type === "quickReview";

                  return (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Question {archiveQIndex + 1} of {archiveQuestions.length}</span>
                          <span>{Math.round(progress)}% complete</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>

                      <Card className="shadow-sm border-gray-100">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                            {archiveCurrentQ.difficulty && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[archiveCurrentQ.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                                {archiveCurrentQ.difficulty}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-base font-semibold text-gray-800 leading-snug mt-2">
                            {archiveCurrentQ.question}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2 pb-3">
                          {archiveCurrentQ.imageUrl && (
                            <img src={archiveCurrentQ.imageUrl} alt="Question" className="w-full rounded-lg object-cover max-h-64 mb-3" />
                          )}
                          {(archiveCurrentQ as any).videoUrl && (
                            <video
                              src={(archiveCurrentQ as any).videoUrl}
                              controls
                              controlsList="nodownload"
                              onContextMenu={(e) => e.preventDefault()}
                              className="w-full rounded-lg max-h-64 bg-black mb-3"
                            />
                          )}

                          {isQuickReview ? (
                            <>
                              {/* 3D Flip Card for Flashcard/QuickReview questions — archive */}
                              <div className="flashcard-scene mb-4" style={{ minHeight: 200 }}>
                                <div className={`flashcard-card ${archiveFlipped ? "is-flipped" : ""}`} style={{ minHeight: 200 }}>
                                  {/* Front face — question prompt */}
                                  <div className="flashcard-face flashcard-face--front">
                                    <div className="mb-3">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#189aa1]/15 text-[#189aa1] mb-3">
                                        ⚡ Flashcard
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 mb-4">Think about your answer, then flip the card.</p>
                                    <Button
                                      className="text-white shadow-md"
                                      style={{ background: "#189aa1" }}
                                      onClick={() => setArchiveFlipped(true)}
                                    >
                                      Flip Card →
                                    </Button>
                                  </div>
                                  {/* Back face — answer */}
                                  <div className="flashcard-face flashcard-face--back">
                                    <div className="mb-3">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white mb-2">
                                        ✓ Answer
                                      </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-white/95 mb-4">{archiveCurrentQ.reviewAnswer}</p>
                                    {!archiveAnswered && (
                                      <div className="flex gap-3 mt-2">
                                        <Button
                                          size="sm"
                                          className="bg-green-400 hover:bg-green-500 text-white border-0"
                                          onClick={() => handleArchiveSelfMark(true)}
                                        >
                                          <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Got it
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-red-400 hover:bg-red-500 text-white border-0"
                                          onClick={() => handleArchiveSelfMark(false)}
                                        >
                                          <ThumbsDown className="w-3.5 h-3.5 mr-1.5" /> Missed it
                                        </Button>
                                      </div>
                                    )}
                                    {archiveAnswered && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-white/40 text-white hover:bg-white/10 mt-2"
                                        onClick={() => setArchiveFlipped(false)}
                                      >
                                        ← Flip Back
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            options.map((opt, idx) => {
                              const isSelected = archiveSelected === idx;
                              const isCorrect = archiveCurrentQ.correctAnswer === idx;
                              let btnClass = "w-full text-left p-3 rounded-lg border-2 text-sm transition-all ";
                              if (!archiveAnswered) {
                                btnClass += "border-gray-100 bg-white hover:border-[#189aa1] hover:bg-[#189aa1]/5 cursor-pointer";
                              } else if (isCorrect) {
                                btnClass += "border-green-500 bg-green-50 text-green-800";
                              } else if (isSelected && !isCorrect) {
                                btnClass += "border-red-400 bg-red-50 text-red-700";
                              } else {
                                btnClass += "border-gray-100 bg-gray-50 text-gray-400";
                              }
                              return (
                                <button key={idx} className={btnClass} onClick={() => handleArchiveAnswer(idx)} disabled={archiveAnswered}>
                                  <span className="flex items-center gap-3">
                                    <span
                                      className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                                      style={
                                        archiveAnswered && isCorrect ? { borderColor: "#16a34a", background: "#16a34a", color: "white" } :
                                        archiveAnswered && isSelected && !isCorrect ? { borderColor: "#ef4444", background: "#ef4444", color: "white" } :
                                        { borderColor: "#d1d5db" }
                                      }
                                    >
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    {opt}
                                    {archiveAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />}
                                    {archiveAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
                                  </span>
                                </button>
                              );
                            })
                          )}

                          {archiveAnswered && archiveCurrentQ.explanation && (
                            <div className="mt-2 p-4 rounded-lg bg-[#189aa1]/8 border border-[#189aa1]/20">
                              <p className="text-xs font-semibold text-[#189aa1] mb-1">Explanation</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{archiveCurrentQ.explanation}</p>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="pt-2">
                          {(archiveAnswered || (isQuickReview && archiveFlipped && archiveAnswered)) && (
                            <Button className="w-full text-white" style={{ background: "#189aa1" }} onClick={handleArchiveNext}>
                              {archiveQIndex < archiveQuestions.length - 1 ? (
                                <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
                              ) : (
                                <>See Results <Trophy className="w-4 h-4 ml-1" /></>
                              )}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>

                      {/* Progress dots */}
                      <div className="flex justify-center gap-2 mt-4">
                        {archiveQuestions.map((_, i) => (
                          <div key={i} className={`h-2 rounded-full transition-all ${i < archiveQIndex ? "bg-[#189aa1] w-2" : i === archiveQIndex ? "bg-[#189aa1] w-4" : "bg-gray-200 w-2"}`} />
                        ))}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* ── TAB: My Performance ──────────────────────────────────────────── */}
        {activeTab === "performance" && (
          <>
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>My Performance</h2>
              <p className="text-xs text-gray-500">Your personal Daily Challenge stats and progress</p>
            </div>

            {perfQuery.isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
              </div>
            )}

            {perfQuery.data && (() => {
              const stats = perfQuery.data;
              return (
                <div className="space-y-5">
                  {/* Stat cards row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Answered", value: stats.total, icon: Target, color: "#189aa1" },
                      { label: "Correct", value: stats.correct, icon: CheckCircle2, color: "#16a34a" },
                      { label: "Accuracy", value: `${stats.accuracy}%`, icon: TrendingUp, color: "#7c3aed" },
                      { label: "Current Streak", value: `${stats.streak}d`, icon: Flame, color: "#f59e0b" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "15" }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="text-2xl font-black" style={{ fontFamily: "JetBrains Mono, monospace", color }}>
                          {value}
                        </div>
                        <div className="text-xs text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Best streak */}
                  {stats.bestStreak > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">Best Streak</div>
                        <div className="text-xs text-gray-400">Your longest consecutive daily challenge streak</div>
                      </div>
                      <div className="ml-auto text-2xl font-black text-amber-500" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {stats.bestStreak}d
                      </div>
                    </div>
                  )}

                  {/* Per-category breakdown */}
                  {Object.keys(stats.categoryStats).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                        Performance by Category
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.categoryStats)
                          .sort(([, a], [, b]) => b.total - a.total)
                          .map(([cat, s]) => {
                            const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                            const barColor = pct >= 80 ? "#189aa1" : pct >= 60 ? "#4ad9e0" : "#f59e0b";
                            return (
                              <div key={cat}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600"}`}>
                                    {cat}
                                  </span>
                                  <span className="text-xs text-gray-500">{s.correct}/{s.total} correct · <span className="font-bold" style={{ color: barColor }}>{pct}%</span></span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: barColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* 14-day activity chart */}
                  {stats.recentHistory.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                        14-Day Activity
                      </h3>
                      <div className="flex items-end gap-1 overflow-x-auto pb-6">
                        {stats.recentHistory.map((day) => (
                          <ActivityBar key={day.date} date={day.date} correct={day.correct} total={day.total} />
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ background: "#189aa1" }} />
                          <span className="text-xs text-gray-400">≥80% accuracy</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ background: "#4ad9e0" }} />
                          <span className="text-xs text-gray-400">60–79%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ background: "#f59e0b" }} />
                          <span className="text-xs text-gray-400">&lt;60%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {stats.total === 0 && (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-gray-500 font-medium">No data yet</p>
                      <p className="text-sm text-gray-400 mt-1">Complete your first daily challenge to see your stats here.</p>
                      <Button className="mt-4 text-white" style={{ background: "#189aa1" }} onClick={() => setActiveTab("challenge")}>
                        <Zap className="w-4 h-4 mr-2" /> Start Today's Challenge
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* ── TAB: Leaderboard ─────────────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Ninja Leaderboard</h2>
                <p className="text-xs text-gray-500">Top performers by correct answers</p>
              </div>
              {/* Period filter */}
              <div className="flex gap-1.5">
                {([
                  { id: "7d" as const, label: "7 Days" },
                  { id: "30d" as const, label: "30 Days" },
                  { id: "allTime" as const, label: "All Time" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setLbPeriod(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      lbPeriod === id
                        ? "text-white border-transparent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1]"
                    }`}
                    style={lbPeriod === id ? { background: "#189aa1" } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {leaderboardQuery.isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
              </div>
            )}

            {leaderboardQuery.data && leaderboardQuery.data.entries.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No entries yet — be the first to complete a challenge!</p>
              </div>
            )}

            {leaderboardQuery.data && leaderboardQuery.data.entries.length > 0 && (
              <div className="space-y-3">
                {/* Current user rank banner (if outside top 10) */}
                {leaderboardQuery.data.currentUserRank && leaderboardQuery.data.currentUserRank > 10 && (
                  <div className="rounded-xl p-4 flex items-center gap-4 border-2" style={{ borderColor: "#189aa1", background: "#f0fbfc" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#189aa1" }}>
                      #{leaderboardQuery.data.currentUserRank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">Your Rank</div>
                      <div className="text-xs text-gray-500">
                        {leaderboardQuery.data.currentUserEntry?.correct ?? 0} correct · {leaderboardQuery.data.currentUserEntry?.accuracy ?? 0}% accuracy
                      </div>
                    </div>
                    <div className="text-xs text-[#189aa1] font-semibold">
                      {10 - (leaderboardQuery.data.currentUserRank ?? 0) < 0
                        ? `${leaderboardQuery.data.currentUserRank - 10} spots from top 10`
                        : ""}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}>
                    <Trophy className="w-4 h-4 text-white" />
                    <h3 className="font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>
                      Top 50 — {lbPeriod === "7d" ? "Last 7 Days" : lbPeriod === "30d" ? "Last 30 Days" : "All Time"}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {leaderboardQuery.data.entries.map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                          entry.isCurrentUser ? "bg-[#f0fbfc]" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          entry.rank === 1 ? "bg-amber-400 text-white" :
                          entry.rank === 2 ? "bg-gray-300 text-gray-700" :
                          entry.rank === 3 ? "bg-amber-700 text-white" :
                          entry.isCurrentUser ? "text-white" :
                          "bg-gray-100 text-gray-500"
                        }`}
                        style={entry.isCurrentUser && entry.rank > 3 ? { background: "#189aa1" } : {}}
                        >
                          {entry.rank === 1 ? <Medal className="w-4 h-4" /> : entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800 truncate">{entry.displayName}</span>
                            {entry.isCurrentUser && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0" style={{ background: "#189aa1" }}>You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {entry.accuracy}% accuracy · {entry.total} answered
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                            {entry.correct}
                          </div>
                          <div className="text-xs text-gray-400">correct</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
