/**
 * FlashcardDeck.tsx
 *
 * Standalone Flashcard Deck study mode.
 * - Shows all quickReview-type questions as flip cards
 * - Spaced repetition: missed cards appear first
 * - Topic filter chips
 * - Progress bar + accuracy stats
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trophy,
  BookOpen,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const TOPICS = [
  "All Topics",
  "HOCM",
  "Strain",
  "Diastolic Function",
  "Dilated CM",
  "Restrictive CM",
  "Constrictive Pericarditis",
  "Tamponade",
  "Pulmonary HTN",
  "Pulmonary Embolism",
  "Aortic Stenosis",
  "Mitral Regurgitation",
];

export default function FlashcardDeck() {
  const { isAuthenticated } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<Record<number, boolean>>({});
  const [sessionComplete, setSessionComplete] = useState(false);

  const topicParam = selectedTopic === "All Topics" ? undefined : selectedTopic;

  const { data, isLoading, refetch } = trpc.quickfire.getFlashcardDeck.useQuery(
    { topic: topicParam, limit: 100 },
    { staleTime: 30_000 }
  );

  const submitReview = trpc.quickfire.submitFlashcardReview.useMutation({
    onSuccess: () => {
      // Refetch to update spaced repetition order after session
    },
  });

  const cards = data?.cards ?? [];
  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const answeredCount = Object.keys(sessionResults).length;
  const gotItCount = Object.values(sessionResults).filter(Boolean).length;
  const missedCount = answeredCount - gotItCount;
  const sessionAccuracy = answeredCount > 0 ? Math.round((gotItCount / answeredCount) * 100) : null;

  const progressPct = totalCards > 0 ? Math.round((answeredCount / totalCards) * 100) : 0;

  // Aggregate topic list from all cards
  const availableTopics = useMemo(() => {
    if (!data?.cards) return TOPICS;
    const tagSet = new Set<string>();
    for (const c of data.cards) {
      const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
      tags.forEach((t) => tagSet.add(t));
    }
    return ["All Topics", ...Array.from(tagSet).sort()];
  }, [data?.cards]);

  function handleTopicChange(topic: string) {
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionResults({});
    setSessionComplete(false);
  }

  function handleFlip() {
    setFlipped((f) => !f);
  }

  function handleMark(gotIt: boolean) {
    if (!currentCard) return;
    const newResults = { ...sessionResults, [currentCard.id]: gotIt };
    setSessionResults(newResults);

    if (isAuthenticated) {
      submitReview.mutate({ questionId: currentCard.id, gotIt });
    }

    setFlipped(false);

    // Advance to next unanswered card
    const nextIndex = cards.findIndex((c, i) => i > currentIndex && !newResults[c.id]);
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      // Check if all cards have been answered
      const allAnswered = cards.every((c) => newResults[c.id] !== undefined);
      if (allAnswered) {
        setSessionComplete(true);
      } else {
        // Find the first unanswered card from the beginning
        const firstUnanswered = cards.findIndex((c) => !newResults[c.id]);
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered);
        } else {
          setSessionComplete(true);
        }
      }
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }

  function handleNext() {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setFlipped(false);
    setSessionResults({});
    setSessionComplete(false);
    refetch();
  }

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#189aa1]" />
          <p className="text-gray-500">Loading flashcards…</p>
        </div>
      </Layout>
    );
  }

  // ── Render: Empty State ───────────────────────────────────────────────────
  if (totalCards === 0) {
    return (
      <Layout>
        <div className="container py-16 flex flex-col items-center gap-4 text-center">
          <Layers className="w-12 h-12 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-700">No flashcards yet</h2>
          <p className="text-gray-500 max-w-sm">
            Flashcards are added by admins via the AI Generate tool. Check back soon!
          </p>
        </div>
      </Layout>
    );
  }

  // ── Render: Session Complete ──────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <Layout>
        <div className="container py-12 max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#189aa1]/20">
            <Trophy className="w-14 h-14 text-[#189aa1] mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>
              Session Complete!
            </h2>
            <p className="text-gray-500 mb-6">You reviewed all {totalCards} flashcards.</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">{gotItCount}</div>
                <div className="text-xs text-green-700 font-medium">Got It</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-500">{missedCount}</div>
                <div className="text-xs text-red-600 font-medium">Missed</div>
              </div>
              <div className="bg-[#f0fbfc] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#189aa1]">{sessionAccuracy ?? 0}%</div>
                <div className="text-xs text-[#189aa1] font-medium">Accuracy</div>
              </div>
            </div>

            {missedCount > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Next session, the {missedCount} missed card{missedCount !== 1 ? "s" : ""} will appear first.
              </p>
            )}

            <Button
              onClick={handleRestart}
              className="w-full text-white font-bold"
              style={{ background: "#189aa1" }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Study Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render: Main Deck ─────────────────────────────────────────────────────
  const alreadyAnswered = currentCard ? sessionResults[currentCard.id] !== undefined : false;
  const thisResult = currentCard ? sessionResults[currentCard.id] : undefined;
  const tags: string[] = currentCard && Array.isArray(currentCard.tags) ? currentCard.tags : [];

  return (
    <Layout>
      <div className="container py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#189aa1]" />
            <h1 className="text-lg font-black text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              Flashcard Deck
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-[#189aa1]">{currentIndex + 1}</span>
            <span>/</span>
            <span>{totalCards}</span>
          </div>
        </div>

        {/* Topic Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {availableTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedTopic === topic
                  ? "bg-[#189aa1] text-white border-[#189aa1]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{answeredCount} of {totalCards} reviewed</span>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-semibold">✓ {gotItCount}</span>
              <span className="text-red-500 font-semibold">✗ {missedCount}</span>
              {sessionAccuracy !== null && (
                <span className="text-[#189aa1] font-semibold">{sessionAccuracy}%</span>
              )}
            </div>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Flip Card */}
        {currentCard && (
          <div className="mb-6">
            <div
              className="flashcard-container cursor-pointer"
              onClick={handleFlip}
              style={{ height: "280px" }}
            >
              <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
                {/* Front */}
                <div className="flashcard-front rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 text-center"
                  style={{ background: "linear-gradient(135deg, #0e4a50 0%, #189aa1 100%)" }}>
                  <div className="mb-3 flex flex-wrap gap-1 justify-center">
                    {tags.map((tag) => (
                      <Badge key={tag} className="text-xs bg-white/20 text-white border-0">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-white font-bold text-lg leading-snug mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                    {currentCard.question}
                  </p>
                  <div className="flex items-center gap-1.5 text-white/60 text-xs mt-auto">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap to reveal answer
                  </div>
                </div>

                {/* Back */}
                <div className="flashcard-back rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 text-center"
                  style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 100%)" }}>
                  <p className="text-[#4ad9e0] font-bold text-lg leading-snug mb-3" style={{ fontFamily: "Merriweather, serif" }}>
                    {currentCard.reviewAnswer ?? currentCard.explanation ?? "No answer provided."}
                  </p>
                  {currentCard.explanation && currentCard.reviewAnswer && (
                    <p className="text-white/60 text-sm leading-relaxed mt-2">
                      {currentCard.explanation}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-white/40 text-xs mt-auto">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap to flip back
                  </div>
                </div>
              </div>
            </div>

            {/* Mark Buttons — only shown when flipped and not yet answered */}
            {flipped && !alreadyAnswered && (
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={(e) => { e.stopPropagation(); handleMark(false); }}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-500 hover:bg-red-50 font-bold"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Missed It
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleMark(true); }}
                  className="flex-1 text-white font-bold"
                  style={{ background: "#189aa1" }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Got It!
                </Button>
              </div>
            )}

            {/* Already answered indicator */}
            {alreadyAnswered && (
              <div className={`mt-4 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-2 ${
                thisResult ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}>
                {thisResult ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {thisResult ? "Got It" : "Missed It"}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            className="gap-1 text-gray-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalCards - 1}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* User Stats (if authenticated) */}
        {data?.userStats && (
          <div className="mt-6 bg-[#f0fbfc] rounded-xl p-4 border border-[#189aa1]/20">
            <h3 className="text-xs font-bold text-[#189aa1] uppercase tracking-wider mb-2">Your All-Time Stats</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">{data.userStats.totalAttempts}</div>
                <div className="text-xs text-gray-500">Reviews</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{data.userStats.totalGotIt}</div>
                <div className="text-xs text-gray-500">Got It</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#189aa1]">
                  {data.userStats.accuracy !== null ? `${data.userStats.accuracy}%` : "—"}
                </div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
