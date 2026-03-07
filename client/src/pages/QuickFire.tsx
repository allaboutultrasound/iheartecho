/**
 * QuickFire.tsx — Daily QuickFire Challenge
 *
 * Three tabs:
 *   1. Daily Challenge — today's 5-question set (scenario / image / quick-review)
 *   2. Echo Cases      — curated case library with gamified MCQ (from former Case Lab)
 *   3. Leaderboard     — top 10 users by correct answers (last 30 days)
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
  BookOpen,
  Flame,
  ImageIcon,
  FileText,
  Stethoscope,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Star,
  Medal,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Static Case Lab data (merged from former CaseLab.tsx) ───────────────────

const ECHO_CASES = [
  {
    id: 1,
    title: "Case 1 — Apical 4-Chamber",
    difficulty: "Intermediate",
    findings: [
      "Severely dilated LV (LVEDD 7.2 cm)",
      "EF visually estimated 20–25%",
      "Functional MR — moderate",
      "Dilated LA",
      "RV mildly dilated",
    ],
    question: "What is the most likely diagnosis?",
    options: [
      "Hypertrophic Cardiomyopathy",
      "Dilated Cardiomyopathy",
      "Cardiac Tamponade",
      "Severe Aortic Stenosis",
    ],
    correct: 1,
    explanation:
      "The findings of severely dilated LV with markedly reduced EF, functional MR, and dilated LA are classic for Dilated Cardiomyopathy (DCM). HCM would show hypertrophy, not dilation. Tamponade would show pericardial effusion. AS would show LVH with preserved or reduced EF.",
    points: 150,
    category: "Cardiomyopathy",
  },
  {
    id: 2,
    title: "Case 2 — CW Doppler through AV",
    difficulty: "Advanced",
    findings: [
      "AV Vmax: 4.6 m/s",
      "Mean gradient: 52 mmHg",
      "AVA: 0.7 cm²",
      "Heavily calcified AV on 2D",
    ],
    question: "What severity of aortic stenosis is present?",
    options: ["Mild AS", "Moderate AS", "Severe AS", "Very Severe AS"],
    correct: 2,
    explanation:
      "Severe AS criteria (ASE): Vmax ≥ 4 m/s, mean gradient ≥ 40 mmHg, AVA ≤ 1.0 cm². This patient meets ALL three criteria. Very severe AS is defined as Vmax > 5 m/s by some guidelines, which is not met here.",
    points: 200,
    category: "Valvular Disease",
  },
  {
    id: 3,
    title: "Case 3 — Subcostal View",
    difficulty: "Beginner",
    findings: [
      "IVC diameter: 2.8 cm",
      "IVC collapsibility: < 20% with sniff",
      "RA enlarged",
      "RV enlarged with paradoxical septal motion",
    ],
    question: "What is the estimated RAP?",
    options: [
      "0–5 mmHg (normal)",
      "5–10 mmHg (mildly elevated)",
      "≥ 15 mmHg (severely elevated)",
      "Cannot be determined",
    ],
    correct: 2,
    explanation:
      "IVC > 2.1 cm with < 50% collapse with sniff indicates elevated RAP ≥ 15 mmHg (ASE 2015 guidelines). The dilated, non-collapsing IVC with enlarged RA and RV is consistent with right heart failure or severe TR.",
    points: 100,
    category: "Right Heart",
  },
  {
    id: 4,
    title: "Case 4 — Fetal Echo 3VV",
    difficulty: "Advanced",
    findings: [
      "4 vessels visible in 3-vessel view",
      "Extra vessel posterior to PA",
      "Normal cardiac situs",
      "Normal 4-chamber view",
    ],
    question: "What is the most likely cause of the extra vessel?",
    options: [
      "Double aortic arch",
      "Persistent left SVC / vertical vein (TAPVR)",
      "Pulmonary arteriovenous malformation",
      "Normal variant",
    ],
    correct: 1,
    explanation:
      "A 4th vessel in the 3-vessel view, particularly posterior to the PA, raises concern for a persistent left SVC or a vertical vein draining anomalous pulmonary veins (TAPVR). This requires full fetal echo evaluation and fetal cardiologist referral.",
    points: 250,
    category: "Fetal Echo",
  },
  {
    id: 5,
    title: "Case 5 — Parasternal Long Axis",
    difficulty: "Intermediate",
    findings: [
      "Asymmetric septal hypertrophy (IVS 1.8 cm)",
      "Systolic anterior motion of MV",
      "LVOT peak gradient 68 mmHg at rest",
      "Posterior MR jet",
    ],
    question: "What is the most likely diagnosis?",
    options: [
      "Hypertensive Heart Disease",
      "Obstructive HOCM",
      "Aortic Stenosis",
      "Restrictive Cardiomyopathy",
    ],
    correct: 1,
    explanation:
      "Asymmetric septal hypertrophy with SAM of the mitral valve and a resting LVOT gradient ≥ 30 mmHg defines obstructive HOCM. The posterior MR jet is characteristic of SAM-related MR. Hypertensive heart disease causes concentric LVH without SAM.",
    points: 200,
    category: "Cardiomyopathy",
  },
  {
    id: 6,
    title: "Case 6 — Pediatric A4C",
    difficulty: "Advanced",
    findings: [
      "Inlet VSD — large, unrestrictive",
      "Bidirectional shunting on color Doppler",
      "RV pressure estimated at systemic level",
      "Mildly reduced RV function",
    ],
    question: "What complication has most likely developed?",
    options: [
      "Pulmonary hypertension with Eisenmenger physiology",
      "Spontaneous VSD closure",
      "Infective endocarditis",
      "Aortic regurgitation",
    ],
    correct: 0,
    explanation:
      "Bidirectional or right-to-left shunting across a large VSD with RV pressure at systemic level indicates Eisenmenger syndrome — irreversible pulmonary hypertension caused by long-standing left-to-right shunt. Surgical repair is contraindicated at this stage.",
    points: 300,
    category: "Congenital Heart",
  },
];

// ─── Type definitions ─────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuickFire() {
  const { isAuthenticated } = useAuth();

  // Top-level tab
  const [activeTab, setActiveTab] = useState<"challenge" | "cases" | "leaderboard">("challenge");

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

  // ── Echo Cases state ───────────────────────────────────────────────────────
  const [caseIdx, setCaseIdx] = useState(0);
  const [caseSelected, setCaseSelected] = useState<number | null>(null);
  const [caseRevealed, setCaseRevealed] = useState(false);
  const [caseTotalPoints, setCaseTotalPoints] = useState(0);
  const [caseStreak, setCaseStreak] = useState(0);

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

  // ── Handlers: Echo Cases ───────────────────────────────────────────────────
  const currentCase = ECHO_CASES[caseIdx];

  const handleCaseAnswer = (idx: number) => {
    if (caseRevealed) return;
    setCaseSelected(idx);
    setCaseRevealed(true);
    if (idx === currentCase.correct) {
      setCaseTotalPoints((p) => p + currentCase.points);
      setCaseStreak((s) => s + 1);
    } else {
      setCaseStreak(0);
    }
  };

  const nextCase = () => {
    setCaseIdx((i) => (i + 1) % ECHO_CASES.length);
    setCaseSelected(null);
    setCaseRevealed(false);
  };

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "challenge" as const, label: "Daily Challenge", icon: Zap },
    { id: "cases" as const, label: "Echo Cases", icon: BookOpen },
    { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
  ];

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
            Daily challenges and echo cases are available to registered users. Sign in to test your knowledge.
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
          {tabs.map(({ id, label, icon: Icon }) => (
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
                  No Questions Yet
                </h2>
                <p className="text-gray-500 text-sm">
                  Today's challenge is being prepared. In the meantime, try the Echo Cases tab.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("cases")}>
                  <BookOpen className="w-4 h-4 mr-2" /> Browse Echo Cases
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
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setActiveTab("cases")}>
                    <BookOpen className="w-4 h-4 mr-2" /> Echo Cases
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

        {/* ── TAB: Echo Cases ──────────────────────────────────────────────── */}
        {activeTab === "cases" && (
          <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Cases</h2>
                <p className="text-xs text-gray-500">Curated clinical scenarios — earn points for correct answers</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{caseStreak} streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fbfc] border border-[#189aa1]/20">
                  <Star className="w-3.5 h-3.5 text-[#189aa1]" />
                  <span className="text-xs font-bold text-[#189aa1]">{caseTotalPoints.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Case list */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Cases</div>
                {ECHO_CASES.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => { setCaseIdx(i); setCaseSelected(null); setCaseRevealed(false); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${caseIdx === i ? "border-[#189aa1] bg-[#f0fbfc]" : "border-gray-100 bg-white hover:border-[#189aa1]/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#189aa1" }}>{c.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.difficulty === "Beginner" ? "bg-green-50 text-green-700" :
                        c.difficulty === "Intermediate" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>{c.difficulty}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">{c.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">+{c.points} pts</div>
                  </button>
                ))}
              </div>

              {/* Active case */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}>
                    <div>
                      <div className="text-xs text-white/70">{currentCase.category} · {currentCase.difficulty}</div>
                      <h3 className="font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>{currentCase.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                      <Star className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-bold">+{currentCase.points} pts</span>
                    </div>
                  </div>
                  <div className="p-5">
                    {/* Findings */}
                    <div className="mb-5">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Echo Findings</div>
                      <div className="p-4 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10 space-y-1.5">
                        {currentCase.findings.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-4">
                      <div className="text-sm font-bold text-gray-700 mb-3">{currentCase.question}</div>
                      <div className="space-y-2">
                        {currentCase.options.map((opt, i) => {
                          const isCorrect = i === currentCase.correct;
                          const isSelected = i === caseSelected;
                          let cls = "border-gray-100 bg-white hover:border-[#189aa1]/40";
                          if (caseRevealed) {
                            if (isCorrect) cls = "border-green-400 bg-green-50";
                            else if (isSelected && !isCorrect) cls = "border-red-300 bg-red-50";
                          }
                          return (
                            <button
                              key={i}
                              onClick={() => handleCaseAnswer(i)}
                              disabled={caseRevealed}
                              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${cls} ${caseRevealed ? "cursor-default" : "cursor-pointer"}`}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                caseRevealed && isCorrect ? "border-green-500 bg-green-500 text-white" :
                                caseRevealed && isSelected ? "border-red-400 bg-red-400 text-white" :
                                "border-gray-300 text-gray-400"
                              }`}>
                                {caseRevealed && isCorrect ? <CheckCircle2 className="w-3 h-3" /> :
                                 caseRevealed && isSelected ? <XCircle className="w-3 h-3" /> :
                                 String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm text-gray-700">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    {caseRevealed && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`p-4 rounded-lg border mb-4 ${caseSelected === currentCase.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {caseSelected === currentCase.correct
                              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                              : <XCircle className="w-4 h-4 text-red-500" />}
                            <span className={`text-sm font-bold ${caseSelected === currentCase.correct ? "text-green-700" : "text-red-700"}`}>
                              {caseSelected === currentCase.correct ? `Correct! +${currentCase.points} points` : "Incorrect"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{currentCase.explanation}</p>
                        </div>
                        <button
                          onClick={nextCase}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
                          style={{ background: "#189aa1" }}
                        >
                          Next Case <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
