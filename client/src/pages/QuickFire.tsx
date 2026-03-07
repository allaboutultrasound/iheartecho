/*
 * QuickFire.tsx — Daily QuickFire Challenge
 *
 * Three tabs:
 *   1. Daily Challenge  — today's question set (scenario / image / quick-review)
 *   2. Challenge Archive — past daily challenges (free: 7 days, premium: unlimited)
 *   3. Leaderboard      — top 10 users by correct answers (last 30 days)
 */

import { useState } from "react";
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

const CATEGORY_TAGS = ["ACS", "Adult Echo", "Pediatric Echo", "Fetal Echo"] as const;

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuickFire() {
  const { isAuthenticated, user } = useAuth();
  const isPremium = (user as any)?.role === "admin" || (user as any)?.isPremium === true;

  // Top-level tab
  const [activeTab, setActiveTab] = useState<"challenge" | "archive" | "leaderboard">("challenge");

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

  const archiveListQuery = trpc.quickfire.getChallengeArchive.useQuery(
    { page: 1, limit: 20 },
    { enabled: activeTab === "archive" && isAuthenticated }
  );

  const archiveDetailQuery = trpc.quickfire.getArchivedChallenge.useQuery(
    { id: selectedArchiveId! },
    { enabled: selectedArchiveId !== null && isAuthenticated }
  );

  const archiveQuestions = archiveDetailQuery.data?.questions ?? [];
  const archiveCurrentQ = archiveQuestions[archiveQIndex];

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const leaderboardQuery = trpc.quickfire.getLeaderboard.useQuery(undefined, {
    enabled: activeTab === "leaderboard",
  });

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

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center text-center gap-6 max-w-lg">
          <div className="w-16 h-16 rounded-full bg-[#189aa1]/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#189aa1]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            Sign In to Play QuickFire
          </h1>
          <p className="text-gray-500 text-sm">
            Daily challenges and the challenge archive are available to registered users. Sign in to test your knowledge.
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
                QuickFire Challenge
              </h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          {/* User stats pills */}
          {statsQuery.data && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">{statsQuery.data.streak} day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fbfc] border border-[#189aa1]/20">
                <Star className="w-3.5 h-3.5 text-[#189aa1]" />
                <span className="text-xs font-bold text-[#189aa1]">{statsQuery.data.correct} correct</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "challenge" as const, label: "Daily Challenge", icon: Zap },
            { id: "archive" as const, label: "Challenge Archive", icon: Archive },
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
                  Today's challenge is being prepared. Check back soon, or browse past challenges in the archive.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("archive")}>
                  <Archive className="w-4 h-4 mr-2" /> Browse Archive
                </Button>
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
                  <Button onClick={handleRestart} className="text-white" style={{ background: "#189aa1" }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Practice Again
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setActiveTab("archive")}>
                    <Archive className="w-4 h-4 mr-2" /> Challenge Archive
                  </Button>
                </div>
              </div>
            )}

            {/* Results screen */}
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
                  <div className="grid grid-cols-5 gap-2 mb-8">
                    {sessionResults.map((r, i) => (
                      <div key={i} className={`rounded-lg p-2 flex flex-col items-center gap-1 ${r.correct === true ? "bg-green-500/20" : r.correct === false ? "bg-red-500/20" : "bg-white/10"}`}>
                        <span className="text-xs text-white/60">Q{i + 1}</span>
                        {r.correct === true ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                         r.correct === false ? <XCircle className="w-5 h-5 text-red-400" /> :
                         <div className="w-5 h-5 rounded-full bg-white/20" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={handleRestart} className="text-white" style={{ background: "#189aa1" }}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Practice Again
                    </Button>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setActiveTab("leaderboard")}>
                      <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Active question card */}
            {!isLoading && !error && currentQ && !showResults && !(alreadyCompleted && sessionResults.length === 0) && (() => {
              const typeInfo = TYPE_LABELS[currentQ.type] ?? TYPE_LABELS.scenario;
              const TypeIcon = typeInfo.icon;
              const options: string[] = Array.isArray(currentQ.options) ? currentQ.options : [];
              const progress = (currentIndex / questions.length) * 100;
              const isQuickReview = currentQ.type === "quickReview";
              const revealedCorrect = answerResult?.correctAnswer ?? (userAttempts[currentQ.id]?.selectedAnswer ?? null);
              const revealedExplanation = answerResult?.explanation ?? currentQ.explanation;
              const revealedReviewAnswer = answerResult?.reviewAnswer ?? currentQ.reviewAnswer;

              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-gray-600">{currentIndex + 1} / {questions.length}</span>
                  </div>

                  <Progress value={progress} className="mb-4 h-2" />

                  {/* Category tag filters */}
                  {presentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => handleTagFilter(null)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          activeTagFilter === null
                            ? "border-[#189aa1] bg-[#189aa1] text-white"
                            : "border-gray-200 bg-white text-gray-500 hover:border-[#189aa1] hover:text-[#189aa1]"
                        }`}
                      >
                        All ({allQuestions.length})
                      </button>
                      {presentTags.map((tag) => {
                        const count = allQuestions.filter((q) => Array.isArray(q.tags) && q.tags.includes(tag)).length;
                        return (
                          <button
                            key={tag}
                            onClick={() => handleTagFilter(tag)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                              activeTagFilter === tag
                                ? "border-[#189aa1] bg-[#189aa1] text-white"
                                : "border-gray-200 bg-white text-gray-500 hover:border-[#189aa1] hover:text-[#189aa1]"
                            }`}
                          >
                            {tag} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <Card className="shadow-lg border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[currentQ.difficulty] ?? ""}`}>
                          {currentQ.difficulty}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                        {currentQ.question}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {currentQ.imageUrl && (
                        <div className="rounded-lg overflow-hidden mb-4 bg-gray-100">
                          <img src={currentQ.imageUrl} alt="Echo image" className="w-full max-h-72 object-contain" />
                        </div>
                      )}

                      {isQuickReview ? (
                        <div>
                          {!flipped ? (
                            <div className="rounded-lg border-2 border-dashed border-[#189aa1]/30 p-6 text-center bg-[#189aa1]/5">
                              <p className="text-sm text-gray-500 mb-4">Think of your answer, then reveal.</p>
                              <Button variant="outline" onClick={() => setFlipped(true)} className="border-[#189aa1] text-[#189aa1]">
                                Reveal Answer
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="rounded-lg border border-[#189aa1]/30 p-4 bg-[#189aa1]/5">
                                <p className="text-xs font-semibold text-[#189aa1] mb-1">Answer</p>
                                <p className="text-sm text-gray-800 leading-relaxed">{revealedReviewAnswer ?? currentQ.reviewAnswer ?? "—"}</p>
                              </div>
                              {!answered && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2 text-center">Did you get it right?</p>
                                  <div className="flex gap-3 justify-center">
                                    <Button onClick={() => handleSelfMark(true)} className="bg-green-500 hover:bg-green-600 text-white gap-2">
                                      <ThumbsUp className="w-4 h-4" /> Got it
                                    </Button>
                                    <Button onClick={() => handleSelfMark(false)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
                                      <ThumbsDown className="w-4 h-4" /> Missed it
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {answered && answerResult && (
                                <div className={`rounded-lg p-3 flex items-center gap-2 ${answerResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                                  {answerResult.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                                  <span className={`text-sm font-medium ${answerResult.isCorrect ? "text-green-700" : "text-red-600"}`}>
                                    {answerResult.isCorrect ? "Marked as correct" : "Marked as missed"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        options.map((opt, idx) => {
                          const isSelected = selectedAnswer === idx;
                          const isCorrect = idx === revealedCorrect;
                          let btnClass = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all font-medium ";
                          if (!answered) {
                            btnClass += "border-gray-200 hover:border-[#189aa1] hover:bg-[#189aa1]/5 text-gray-700";
                          } else if (isCorrect) {
                            btnClass += "border-green-500 bg-green-50 text-green-800";
                          } else if (isSelected && !isCorrect) {
                            btnClass += "border-red-400 bg-red-50 text-red-700";
                          } else {
                            btnClass += "border-gray-100 bg-gray-50 text-gray-400";
                          }
                          return (
                            <button key={idx} className={btnClass} onClick={() => handleSelectAnswer(idx)} disabled={answered || submitMutation.isPending}>
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

                      {answered && revealedExplanation && (
                        <div className="mt-2 p-4 rounded-lg bg-[#189aa1]/8 border border-[#189aa1]/20">
                          <p className="text-xs font-semibold text-[#189aa1] mb-1">Explanation</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{revealedExplanation}</p>
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
            {/* Archive list view */}
            {selectedArchiveId === null && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Challenge Archive</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isPremium
                        ? "Unlimited access — all past challenges"
                        : "Free access — last 7 days. Upgrade for unlimited history."}
                    </p>
                  </div>
                  {!isPremium && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">Free: 7 days</span>
                    </div>
                  )}
                </div>

                {archiveListQuery.isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                )}

                {archiveListQuery.data && archiveListQuery.data.challenges.length === 0 && (
                  <div className="text-center py-16">
                    <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No archived challenges yet</p>
                    <p className="text-sm text-gray-400 mt-1">Completed daily challenges will appear here after their 24-hour window closes.</p>
                  </div>
                )}

                {archiveListQuery.data && archiveListQuery.data.challenges.length > 0 && (
                  <div className="space-y-3">
                    {archiveListQuery.data.challenges.map((challenge: any, idx: number) => {
                      const daysAgo = challenge.archivedAt
                        ? Math.floor((Date.now() - new Date(challenge.archivedAt).getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      const isLocked = !isPremium && daysAgo !== null && daysAgo > 7;
                      return (
                        <div
                          key={challenge.id}
                          className={`flex items-center gap-4 p-4 bg-white rounded-xl border transition-all ${
                            isLocked
                              ? "border-gray-100 opacity-60 cursor-not-allowed"
                              : "border-gray-100 hover:border-[#189aa1]/40 cursor-pointer"
                          }`}
                          onClick={() => !isLocked && openArchiveChallenge(challenge.id)}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isLocked ? "#f3f4f6" : "#f0fbfc" }}>
                            {isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : <Archive className="w-5 h-5 text-[#189aa1]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800 truncate">{challenge.title}</div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {challenge.category && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Tag className="w-3 h-3" />{challenge.category}
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
                          {isLocked ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 flex-shrink-0">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-bold text-amber-600">Premium</span>
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}

                    {/* Premium upsell */}
                    {!isPremium && (
                      <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
                        <Crown className="w-8 h-8 text-amber-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm">Unlock Unlimited Archive Access</div>
                          <div className="text-white/60 text-xs mt-0.5">Premium members can access all past challenges, no time limit.</div>
                        </div>
                        <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="text-white flex-shrink-0" style={{ background: "#189aa1" }}>
                            Upgrade
                          </Button>
                        </a>
                      </div>
                    )}
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
                      <div className="flex items-center justify-between mb-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-semibold text-gray-600">{archiveQIndex + 1} / {archiveQuestions.length}</span>
                      </div>
                      <Progress value={progress} className="mb-4 h-2" />

                      <Card className="shadow-lg border-0">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[archiveCurrentQ.difficulty] ?? ""}`}>
                              {archiveCurrentQ.difficulty}
                            </span>
                          </div>
                          <CardTitle className="text-base leading-snug text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                            {archiveCurrentQ.question}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {archiveCurrentQ.imageUrl && (
                            <div className="rounded-lg overflow-hidden mb-4 bg-gray-100">
                              <img src={archiveCurrentQ.imageUrl} alt="Echo image" className="w-full max-h-72 object-contain" />
                            </div>
                          )}

                          {isQuickReview ? (
                            <div>
                              {!archiveFlipped ? (
                                <div className="rounded-lg border-2 border-dashed border-[#189aa1]/30 p-6 text-center bg-[#189aa1]/5">
                                  <p className="text-sm text-gray-500 mb-4">Think of your answer, then reveal.</p>
                                  <Button variant="outline" onClick={() => setArchiveFlipped(true)} className="border-[#189aa1] text-[#189aa1]">
                                    Reveal Answer
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="rounded-lg border border-[#189aa1]/30 p-4 bg-[#189aa1]/5">
                                    <p className="text-xs font-semibold text-[#189aa1] mb-1">Answer</p>
                                    <p className="text-sm text-gray-800 leading-relaxed">{archiveCurrentQ.reviewAnswer ?? "—"}</p>
                                  </div>
                                  {!archiveAnswered && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-2 text-center">Did you get it right?</p>
                                      <div className="flex gap-3 justify-center">
                                        <Button onClick={() => handleArchiveSelfMark(true)} className="bg-green-500 hover:bg-green-600 text-white gap-2">
                                          <ThumbsUp className="w-4 h-4" /> Got it
                                        </Button>
                                        <Button onClick={() => handleArchiveSelfMark(false)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
                                          <ThumbsDown className="w-4 h-4" /> Missed it
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            options.map((opt, idx) => {
                              const isSelected = archiveSelected === idx;
                              const isCorrect = idx === archiveCurrentQ.correctAnswer;
                              let btnClass = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all font-medium ";
                              if (!archiveAnswered) {
                                btnClass += "border-gray-200 hover:border-[#189aa1] hover:bg-[#189aa1]/5 text-gray-700";
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

        {/* ── TAB: Leaderboard ─────────────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <>
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Ninja Leaderboard</h2>
              <p className="text-xs text-gray-500">Top performers — last 30 days</p>
            </div>

            {leaderboardQuery.isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
              </div>
            )}

            {leaderboardQuery.data && leaderboardQuery.data.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No entries yet — be the first to complete a challenge!</p>
              </div>
            )}

            {leaderboardQuery.data && leaderboardQuery.data.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}>
                  <Trophy className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>Top 10 — Last 30 Days</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {leaderboardQuery.data.map((entry) => (
                    <div key={entry.userId} className="flex items-center gap-4 px-5 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        entry.rank === 1 ? "bg-amber-400 text-white" :
                        entry.rank === 2 ? "bg-gray-300 text-gray-700" :
                        entry.rank === 3 ? "bg-amber-700 text-white" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {entry.rank === 1 ? <Medal className="w-4 h-4" /> : entry.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{entry.displayName}</div>
                        <div className="text-xs text-gray-400">{entry.accuracy}% accuracy · {entry.total} answered</div>
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
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
