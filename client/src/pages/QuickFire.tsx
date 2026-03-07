/**
 * QuickFire.tsx — Daily QuickFire Engine
 *
 * Shows today's 5-question set (mix of scenario, image, and quick-review).
 * Each question is submitted individually via trpc.quickfire.submitAnswer.
 * Correct answers and explanations are revealed after each submission.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
  Flame,
  ImageIcon,
  FileText,
  Stethoscope,
  Lock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  scenario: { label: "Scenario", icon: Stethoscope, color: "bg-blue-100 text-blue-700" },
  image: { label: "Image Question", icon: ImageIcon, color: "bg-purple-100 text-purple-700" },
  quickReview: { label: "Quick Review", icon: FileText, color: "bg-teal-100 text-teal-700" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

type AnswerResult = {
  isCorrect: boolean | null;
  correctAnswer: number | null;
  explanation: string | null;
  reviewAnswer: string | null;
};

const CATEGORY_TAGS = ["ACS", "Adult Echo", "Pediatric Echo", "Fetal Echo"] as const;

export default function QuickFire() {
  const { isAuthenticated } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const { data, isLoading, error, refetch } = trpc.quickfire.getTodaySet.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitMutation = trpc.quickfire.submitAnswer.useMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ correct: boolean | null }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [flipped, setFlipped] = useState(false); // for quickReview flashcard
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const allQuestions = data?.questions ?? [];
  const userAttempts = data?.userAttempts ?? {};

  // Derive which category tags are present in today's set
  const presentTags = CATEGORY_TAGS.filter((cat) =>
    allQuestions.some((q) => Array.isArray(q.tags) && q.tags.includes(cat))
  );

  // Apply tag filter
  const questions = activeTagFilter
    ? allQuestions.filter((q) => Array.isArray(q.tags) && q.tags.includes(activeTagFilter))
    : allQuestions;

  const currentQ = questions[currentIndex];

  // Detect if already completed today (all questions have attempts)
  const alreadyCompleted =
    questions.length > 0 && questions.every((q) => userAttempts[q.id] !== undefined);

  // Pre-populate session results from existing attempts on page load
  const completedCount = questions.filter((q) => userAttempts[q.id] !== undefined).length;

  const handleSelectAnswer = async (idx: number) => {
    if (answered || !currentQ) return;
    setSelectedAnswer(idx);
    setAnswered(true);

    try {
      const result = await submitMutation.mutateAsync({
        questionId: currentQ.id,
        selectedAnswer: idx,
      });
      setAnswerResult(result);
      setSessionResults((prev) => [...prev, { correct: result.isCorrect }]);
    } catch (err: any) {
      // If already answered (e.g. page refresh mid-session), show existing attempt
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
      const result = await submitMutation.mutateAsync({
        questionId: currentQ.id,
        selfMarkedCorrect: correct,
      });
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
            Daily QuickFire challenges are available to registered users. Sign in to test your echo knowledge.
          </p>
          <a href={getLoginUrl()}>
            <Button style={{ background: "#189aa1" }}>Sign In / Register</Button>
          </a>
        </div>
      </Layout>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#189aa1] border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading today's QuickFire set…</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center gap-4 text-center">
          <XCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600">Failed to load today's QuickFire set. Please try again.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </Layout>
    );
  }

  // ── No questions yet ───────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center gap-6 text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-[#189aa1]/10 flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#189aa1]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            No Questions Yet
          </h1>
          <p className="text-gray-500 text-sm">
            Today's QuickFire set is being prepared. Check back soon, or explore the Case Library.
          </p>
          <Link href="/cases">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" /> Browse Case Library
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Already completed today (and not in a practice session) ───────────────
  if (alreadyCompleted && !showResults && sessionResults.length === 0) {
    const totalCorrect = questions.filter((q) => userAttempts[q.id]?.isCorrect === true).length;
    const pct = Math.round((totalCorrect / questions.length) * 100);

    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
            <Trophy className="w-14 h-14 text-[#4ad9e0] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Merriweather, serif" }}>
              You've Completed Today's QuickFire!
            </h2>
            <p className="text-white/60 text-sm mb-1">Today's score</p>
            <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {totalCorrect}/{questions.length}
            </div>
            <p className="text-[#4ad9e0] font-semibold mb-6">{pct}% correct</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleRestart} className="text-white" style={{ background: "#189aa1" }}>
                <RefreshCw className="w-4 h-4 mr-2" /> Practice Again
              </Button>
              <Link href="/cases">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" /> Case Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (showResults) {
    const correctCount = sessionResults.filter((r) => r.correct === true).length;
    const pct = Math.round((correctCount / questions.length) * 100);
    const grade =
      pct >= 80 ? { label: "Echo Ninja 🥷", color: "text-[#4ad9e0]" } :
      pct >= 60 ? { label: "Good Work! 👍", color: "text-blue-300" } :
      { label: "Keep Practicing 📚", color: "text-orange-400" };

    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
            <Trophy className="w-14 h-14 text-[#4ad9e0] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              QuickFire Complete!
            </h2>
            <p className={`text-lg font-bold mb-2 ${grade.color}`}>{grade.label}</p>
            <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {correctCount}/{questions.length}
            </div>
            <p className="text-white/50 text-sm mb-6">{pct}% correct</p>

            <div className="grid grid-cols-5 gap-2 mb-8">
              {sessionResults.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 flex flex-col items-center gap-1 ${r.correct === true ? "bg-green-500/20" : r.correct === false ? "bg-red-500/20" : "bg-white/10"}`}
                >
                  <span className="text-xs text-white/60">Q{i + 1}</span>
                  {r.correct === true ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : r.correct === false ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/20" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleRestart} className="text-white" style={{ background: "#189aa1" }}>
                <RefreshCw className="w-4 h-4 mr-2" /> Practice Again
              </Button>
              <Link href="/cases">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" /> Case Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Question card ──────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const typeInfo = TYPE_LABELS[currentQ.type] ?? TYPE_LABELS.scenario;
  const TypeIcon = typeInfo.icon;
  const options: string[] = Array.isArray(currentQ.options) ? currentQ.options : [];
  const progress = (currentIndex / questions.length) * 100;
  const isQuickReview = currentQ.type === "quickReview";

  // Determine correct answer to show (from submitAnswer response or existing attempt)
  const revealedCorrect = answerResult?.correctAnswer ?? (userAttempts[currentQ.id]?.selectedAnswer ?? null);
  const revealedExplanation = answerResult?.explanation ?? currentQ.explanation;
  const revealedReviewAnswer = answerResult?.reviewAnswer ?? currentQ.reviewAnswer;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#189aa1" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-base leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                Daily QuickFire
              </h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-600">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        {/* Category tag filters — only shown when today's set has tagged questions */}
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
              const count = allQuestions.filter(
                (q) => Array.isArray(q.tags) && q.tags.includes(tag)
              ).length;
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
            {/* Image */}
            {currentQ.imageUrl && (
              <div className="rounded-lg overflow-hidden mb-4 bg-gray-100">
                <img
                  src={currentQ.imageUrl}
                  alt="Echo image"
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}

            {/* QuickReview flashcard */}
            {isQuickReview ? (
              <div>
                {!flipped ? (
                  <div className="rounded-lg border-2 border-dashed border-[#189aa1]/30 p-6 text-center bg-[#189aa1]/5">
                    <p className="text-sm text-gray-500 mb-4">Think of your answer, then reveal.</p>
                    <Button
                      variant="outline"
                      onClick={() => setFlipped(true)}
                      className="border-[#189aa1] text-[#189aa1]"
                    >
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
                          <Button
                            onClick={() => handleSelfMark(true)}
                            className="bg-green-500 hover:bg-green-600 text-white gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" /> Got it
                          </Button>
                          <Button
                            onClick={() => handleSelfMark(false)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" /> Missed it
                          </Button>
                        </div>
                      </div>
                    )}
                    {answered && answerResult && (
                      <div className={`rounded-lg p-3 flex items-center gap-2 ${answerResult.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        {answerResult.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${answerResult.isCorrect ? "text-green-700" : "text-red-600"}`}>
                          {answerResult.isCorrect ? "Marked as correct" : "Marked as missed"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* MCQ options */
              options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === revealedCorrect;
                let btnClass =
                  "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all font-medium ";

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
                  <button
                    key={idx}
                    className={btnClass}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={answered || submitMutation.isPending}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={
                          answered && isCorrect
                            ? { borderColor: "#16a34a", background: "#16a34a", color: "white" }
                            : answered && isSelected && !isCorrect
                            ? { borderColor: "#ef4444", background: "#ef4444", color: "white" }
                            : { borderColor: "#d1d5db" }
                        }
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                      {answered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                      )}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                      )}
                    </span>
                  </button>
                );
              })
            )}

            {/* Explanation */}
            {answered && revealedExplanation && (
              <div className="mt-2 p-4 rounded-lg bg-[#189aa1]/8 border border-[#189aa1]/20">
                <p className="text-xs font-semibold text-[#189aa1] mb-1">Explanation</p>
                <p className="text-sm text-gray-700 leading-relaxed">{revealedExplanation}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            {(answered || (isQuickReview && flipped && answered)) && (
              <Button
                className="w-full text-white"
                style={{ background: "#189aa1" }}
                onClick={handleNext}
              >
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
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < currentIndex
                  ? "bg-[#189aa1] w-2"
                  : i === currentIndex
                  ? "bg-[#189aa1] w-4"
                  : "bg-gray-200 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
