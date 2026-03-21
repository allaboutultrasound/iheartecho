/**
 * ChallengeCardGenerator — Admin Only
 * Generates branded social media image cards (question + answer) for each
 * daily challenge category. Cards can be downloaded individually as PNG files.
 */
import { useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toPng } from "html-to-image";
import {
  ArrowLeft, Download, Loader2, AlertCircle, ImageIcon,
  CheckCircle2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Brand ───────────────────────────────────────────────────────────────────
const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";
const BRAND_LIGHT = "#4ad9e0";

// Category color accents
const CAT_COLORS: Record<string, { bg: string; accent: string; label: string }> = {
  "ACS":            { bg: "#1a0a0a", accent: "#e05555", label: "ACS" },
  "Adult Echo":     { bg: "#0e1e2e", accent: "#189aa1", label: "Adult Echo" },
  "Pediatric Echo": { bg: "#0a1a0a", accent: "#22c55e", label: "Pediatric Echo" },
  "Fetal Echo":     { bg: "#1a0a1a", accent: "#a855f7", label: "Fetal Echo" },
  "POCUS":          { bg: "#0a0a1a", accent: "#3b82f6", label: "POCUS" },
  "General":        { bg: "#1a1a0a", accent: "#f59e0b", label: "General" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (typeof parsed[0] === "object" && parsed[0] !== null) {
      return parsed.map((o: any) => (typeof o.text === "string" ? o.text : String(o)));
    }
    return parsed as string[];
  } catch {
    return [];
  }
}

// ─── Question Card (1080×1080) ────────────────────────────────────────────────

function QuestionCard({
  category,
  challengeTitle,
  questionText,
  options,
  difficulty,
  qid,
}: {
  category: string;
  challengeTitle: string;
  questionText: string;
  options: string[];
  difficulty: string;
  qid: string | null;
}) {
  const colors = CAT_COLORS[category] ?? CAT_COLORS["Adult Echo"];
  const letters = ["A", "B", "C", "D", "E"];

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: `linear-gradient(145deg, ${colors.bg} 0%, #0a1520 60%, #0d2030 100%)`,
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "64px",
        boxSizing: "border-box",
      }}
    >
      {/* Background grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 6,
        background: `linear-gradient(90deg, ${colors.accent}, ${BRAND_LIGHT})`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo placeholder */}
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff",
          }}>♥</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.3px" }}>iHeartEcho™</div>
            <div style={{ color: BRAND_LIGHT, fontSize: 13, fontWeight: 600, marginTop: 1 }}>Daily Challenge</div>
          </div>
        </div>
        <div style={{
          background: colors.accent + "22", border: `1.5px solid ${colors.accent}55`,
          borderRadius: 20, padding: "6px 18px",
          color: colors.accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px",
        }}>
          {colors.label.toUpperCase()}
        </div>
      </div>

      {/* Challenge title */}
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 600, marginBottom: 20, letterSpacing: "0.3px" }}>
        {challengeTitle}
      </div>

      {/* Question label */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: BRAND + "22", border: `1px solid ${BRAND}44`,
        borderRadius: 8, padding: "5px 14px", marginBottom: 28, alignSelf: "flex-start",
      }}>
        <span style={{ color: BRAND_LIGHT, fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>QUESTION</span>
        {qid && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>· {qid}</span>}
      </div>

      {/* Question text */}
      <div style={{
        color: "#fff", fontSize: options.length > 0 ? 30 : 36,
        fontWeight: 700, lineHeight: 1.45, marginBottom: 36,
        flex: options.length > 0 ? "0 0 auto" : "1 1 auto",
        fontFamily: "'Merriweather', 'Georgia', serif",
      }}>
        {stripHtml(questionText)}
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 auto" }}>
          {options.map((opt, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "14px 20px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 14,
              }}>{letters[i]}</div>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
                {stripHtml(opt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "auto", paddingTop: 32,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>iheartecho.com</div>
        <div style={{
          background: difficulty === "beginner" ? "#22c55e22" : difficulty === "advanced" ? "#ef444422" : "#f59e0b22",
          border: `1px solid ${difficulty === "beginner" ? "#22c55e44" : difficulty === "advanced" ? "#ef444444" : "#f59e0b44"}`,
          borderRadius: 20, padding: "4px 14px",
          color: difficulty === "beginner" ? "#4ade80" : difficulty === "advanced" ? "#f87171" : "#fbbf24",
          fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const,
        }}>
          {difficulty}
        </div>
      </div>
    </div>
  );
}

// ─── Answer Card (1080×1080) ──────────────────────────────────────────────────

function AnswerCard({
  category,
  challengeTitle,
  questionText,
  options,
  correctAnswer,
  explanation,
  reviewAnswer,
  qid,
}: {
  category: string;
  challengeTitle: string;
  questionText: string;
  options: string[];
  correctAnswer: number | null;
  explanation: string | null;
  reviewAnswer: string | null;
  qid: string | null;
}) {
  const colors = CAT_COLORS[category] ?? CAT_COLORS["Adult Echo"];
  const letters = ["A", "B", "C", "D", "E"];
  const answerText = options.length > 0 && correctAnswer != null
    ? `${letters[correctAnswer]}. ${stripHtml(options[correctAnswer] ?? "")}`
    : reviewAnswer
    ? stripHtml(reviewAnswer)
    : null;
  const explanationText = explanation ? stripHtml(explanation) : null;

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: `linear-gradient(145deg, ${colors.bg} 0%, #0a1520 60%, #0d2030 100%)`,
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "64px",
        boxSizing: "border-box",
      }}
    >
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 6,
        background: `linear-gradient(90deg, ${colors.accent}, ${BRAND_LIGHT})`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_LIGHT})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff",
          }}>♥</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.3px" }}>iHeartEcho™</div>
            <div style={{ color: BRAND_LIGHT, fontSize: 13, fontWeight: 600, marginTop: 1 }}>Daily Challenge</div>
          </div>
        </div>
        <div style={{
          background: colors.accent + "22", border: `1.5px solid ${colors.accent}55`,
          borderRadius: 20, padding: "6px 18px",
          color: colors.accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px",
        }}>
          {colors.label.toUpperCase()}
        </div>
      </div>

      {/* Challenge title */}
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 600, marginBottom: 20, letterSpacing: "0.3px" }}>
        {challengeTitle}
      </div>

      {/* Answer label */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#22c55e22", border: "1px solid #22c55e44",
        borderRadius: 8, padding: "5px 14px", marginBottom: 28, alignSelf: "flex-start",
      }}>
        <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>✓ ANSWER</span>
        {qid && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>· {qid}</span>}
      </div>

      {/* Question recap (smaller) */}
      <div style={{
        color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 500,
        lineHeight: 1.4, marginBottom: 28,
        fontFamily: "'Merriweather', 'Georgia', serif",
        borderLeft: `3px solid rgba(255,255,255,0.15)`, paddingLeft: 16,
      }}>
        {stripHtml(questionText).length > 120
          ? stripHtml(questionText).slice(0, 120) + "…"
          : stripHtml(questionText)}
      </div>

      {/* Answer box */}
      {answerText && (
        <div style={{
          background: "#22c55e18", border: "2px solid #22c55e55",
          borderRadius: 16, padding: "20px 24px", marginBottom: 28,
        }}>
          <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px" }}>
            CORRECT ANSWER
          </div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>
            {answerText}
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanationText && (
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "20px 24px", flex: "1 1 auto", overflow: "hidden",
        }}>
          <div style={{ color: BRAND_LIGHT, fontSize: 13, fontWeight: 700, marginBottom: 10, letterSpacing: "0.5px" }}>
            EXPLANATION
          </div>
          <div style={{
            color: "rgba(255,255,255,0.75)", fontSize: 19, lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 7, WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {explanationText}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "auto", paddingTop: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>iheartecho.com</div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Follow for daily echo challenges</div>
      </div>
    </div>
  );
}

// ─── Card Wrapper with Download Button ────────────────────────────────────────

function DownloadableCard({
  filename,
  children,
}: {
  filename: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1080,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Card export failed:", err);
      alert("Export failed. Please try again.");
    }
  }, [filename]);

  return (
    <div className="flex flex-col gap-3">
      {/* Scaled preview */}
      <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ transform: "scale(0.25)", transformOrigin: "top left", width: 1080, height: 1080 }}>
          <div ref={ref}>
            {children}
          </div>
        </div>
      </div>
      <Button
        onClick={handleDownload}
        size="sm"
        className="w-full gap-2 text-white"
        style={{ background: BRAND }}
      >
        <Download className="w-3.5 h-3.5" />
        Download PNG
      </Button>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ item }: {
  item: {
    category: string;
    challenge: { title: string; status: string; category: string } | null;
    questions: Array<{
      id: number;
      qid: string | null;
      type: string;
      question: string;
      options: string | null;
      correctAnswer: number | null;
      explanation: string | null;
      reviewAnswer: string | null;
      imageUrl: string | null;
      difficulty: string;
      category: string | null;
    }>;
  };
}) {
  const { category, challenge, questions } = item;
  const colors = CAT_COLORS[category] ?? CAT_COLORS["Adult Echo"];
  const q = questions[0];

  if (!challenge || !q) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/40 text-sm">
        No queued challenge for <span className="font-semibold text-white/60">{category}</span>
      </div>
    );
  }

  const options = parseOptions(q.options);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0e1a24" }}>
      {/* Category header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: colors.accent }} />
          <span className="font-bold text-white text-base">{category}</span>
          <Badge className="text-[11px] px-2 py-0.5" style={{ background: colors.accent + "22", color: colors.accent, border: "none" }}>
            {challenge.status}
          </Badge>
        </div>
        <span className="text-white/40 text-xs truncate max-w-xs">{challenge.title}</span>
      </div>

      {/* Cards grid */}
      <div className="p-5 grid grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5" style={{ color: BRAND_LIGHT }} />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Question Card</span>
          </div>
          <DownloadableCard filename={`${category.replace(/\s+/g, "-")}-question.png`}>
            <QuestionCard
              category={category}
              challengeTitle={challenge.title}
              questionText={q.question}
              options={options}
              difficulty={q.difficulty}
              qid={q.qid}
            />
          </DownloadableCard>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Answer Card</span>
          </div>
          <DownloadableCard filename={`${category.replace(/\s+/g, "-")}-answer.png`}>
            <AnswerCard
              category={category}
              challengeTitle={challenge.title}
              questionText={q.question}
              options={options}
              correctAnswer={q.correctAnswer}
              explanation={q.explanation}
              reviewAnswer={q.reviewAnswer}
              qid={q.qid}
            />
          </DownloadableCard>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChallengeCardGenerator() {
  const { data, isLoading, error, refetch } = trpc.quickfire.adminGetCardGeneratorData.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="min-h-screen" style={{ background: "#0a1018" }}>
      {/* Header */}
      <div style={{ background: "#0e1a24", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/platform-admin">
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" style={{ color: BRAND_LIGHT }} />
            <h1 className="text-lg font-bold text-white">Challenge Card Generator</h1>
          </div>
          <Badge className="text-[10px] px-2 py-0.5 ml-1" style={{ background: BRAND + "22", color: BRAND_LIGHT, border: "none" }}>
            Admin
          </Badge>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 text-white/70 border-white/20 hover:bg-white/10"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Instructions */}
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: BRAND + "15", border: `1px solid ${BRAND}33` }}>
          <p className="text-white/70">
            Cards are generated from the <strong className="text-white">next queued challenge</strong> per category.
            Each card is <strong className="text-white">1080×1080 px</strong> — ideal for Instagram, Facebook, and LinkedIn.
            Download the question card first, then post the answer card 24 hours later.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND_LIGHT }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        {/* Cards */}
        {data && (
          <div className="space-y-6">
            {data.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                No queued challenges found. Add challenges to the queue first.
              </div>
            ) : (
              data.map((item) => (
                <CategorySection key={item.category} item={item as any} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
