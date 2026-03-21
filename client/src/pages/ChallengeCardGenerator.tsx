/**
 * ChallengeCardGenerator -- Admin Only
 * Generates branded 1080x1080 social media image cards for daily challenges.
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

// Brand palette
const BRAND = "#189aa1";
const BRAND_DARK = "#0d3d44";
const BRAND_LIGHT = "#4ad9e0";
const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/icon-192_df958e9b.png";
const HERO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/ihe-hero-MNscA4NaWNyxrdkewtLGLG.webp";

// ---- helpers ----------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (typeof parsed[0] === "object" && parsed[0] !== null)
      return parsed.map((o: any) =>
        typeof o.text === "string" ? o.text : String(o)
      );
    return parsed as string[];
  } catch {
    return [];
  }
}

// ---- shared card shell ------------------------------------------------------

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Open Sans', sans-serif",
        boxSizing: "border-box",
        // Deep navy-teal gradient base
        background:
          "linear-gradient(160deg, #071318 0%, #0b2a32 45%, #071318 100%)",
      }}
    >
      {/* ---- decorative layers ---- */}

      {/* Hero image — soft trophy silhouette bottom-right */}
      <div
        style={{
          position: "absolute",
          right: -80,
          bottom: -80,
          width: 640,
          height: 640,
          backgroundImage: `url("${HERO_URL}")`,
          backgroundSize: "cover",
          backgroundPosition: "65% 55%",
          opacity: 0.13,
          borderRadius: "50%",
          filter: "blur(3px) saturate(0.6)",
        }}
      />

      {/* Large radial teal glow — top-left */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND}50 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Smaller aqua glow — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND_LIGHT}18 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Subtle dot-grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage:
            "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Top accent bar — thick gradient stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${BRAND_DARK}, ${BRAND}, ${BRAND_LIGHT}, ${BRAND})`,
        }}
      />

      {/* Left accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(180deg, ${BRAND_LIGHT}cc 0%, ${BRAND}44 60%, transparent 100%)`,
        }}
      />

      {/* Diagonal geometric accent — top-right corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 280,
          height: 280,
          background: `linear-gradient(225deg, ${BRAND}22 0%, transparent 60%)`,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />

      {/* Bottom-left corner accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 200,
          height: 200,
          background: `linear-gradient(45deg, ${BRAND_LIGHT}14 0%, transparent 60%)`,
          clipPath: "polygon(0 100%, 0 0, 100% 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px 68px 52px 72px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- card header (shared) ---------------------------------------------------

function CardHeader({ pill, pillColor, pillBg, pillBorder }: {
  pill: string;
  pillColor: string;
  pillBg: string;
  pillBorder: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 48,
      }}
    >
      {/* Logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 16,
            overflow: "hidden",
            border: `2px solid ${BRAND_LIGHT}44`,
            boxShadow: `0 0 24px ${BRAND}55`,
            flexShrink: 0,
          }}
        >
          <img
            src={LOGO_URL}
            alt="iHeartEcho"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div>
          <div
            style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            iHeartEcho&#x2122;
          </div>
          <div
            style={{
              color: BRAND_LIGHT,
              fontSize: 14,
              fontWeight: 600,
              marginTop: 3,
              letterSpacing: "0.5px",
            }}
          >
            Daily Challenge
          </div>
        </div>
      </div>

      {/* Type pill */}
      <div
        style={{
          background: pillBg,
          border: `1.5px solid ${pillBorder}`,
          borderRadius: 28,
          padding: "10px 26px",
          color: pillColor,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "2px",
          boxShadow: `0 0 20px ${pillBorder}55`,
        }}
      >
        {pill}
      </div>
    </div>
  );
}

// ---- teal divider -----------------------------------------------------------

function TealDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
      <div
        style={{
          height: 3,
          width: 48,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND})`,
        }}
      />
      <div
        style={{
          height: 3,
          width: 12,
          borderRadius: 2,
          background: `${BRAND}55`,
        }}
      />
      <div
        style={{
          height: 3,
          width: 6,
          borderRadius: 2,
          background: `${BRAND}33`,
        }}
      />
    </div>
  );
}

// ---- card footer (shared) ---------------------------------------------------

function CardFooter({ right }: { right?: string }) {
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: `1px solid ${BRAND}44`,
      }}
    >
      <div
        style={{
          color: BRAND_LIGHT,
          fontSize: 14,
          fontWeight: 700,
          opacity: 0.75,
          letterSpacing: "0.3px",
        }}
      >
        iheartecho.com
      </div>
      {right && (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          {right}
        </div>
      )}
    </div>
  );
}

// ---- Question Card ----------------------------------------------------------

function QuestionCard({
  challengeTitle,
  questionText,
  options,
  qid,
}: {
  challengeTitle: string;
  questionText: string;
  options: string[];
  qid: string | null;
}) {
  const letters = ["A", "B", "C", "D", "E"];
  const cleanQ = stripHtml(questionText);

  return (
    <CardShell>
      <CardHeader
        pill="QUESTION"
        pillColor={BRAND_LIGHT}
        pillBg={`linear-gradient(135deg, ${BRAND}33, ${BRAND_LIGHT}18)`}
        pillBorder={BRAND_LIGHT}
      />

      {/* Challenge title */}
      <div
        style={{
          color: "rgba(255,255,255,0.38)",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 22,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {challengeTitle}
      </div>

      <TealDivider />

      {/* Question text */}
      <div
        style={{
          color: "#fff",
          fontSize: options.length > 0 ? 30 : 40,
          fontWeight: 700,
          lineHeight: 1.5,
          marginBottom: options.length > 0 ? 32 : 0,
          flex: options.length > 0 ? "0 0 auto" : "1 1 auto",
          fontFamily: "'Georgia', 'Merriweather', serif",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}
      >
        {cleanQ}
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 13,
            flex: "1 1 auto",
          }}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background:
                  i % 2 === 0
                    ? "rgba(255,255,255,0.04)"
                    : `${BRAND}0a`,
                border: `1px solid ${i % 2 === 0 ? "rgba(255,255,255,0.08)" : BRAND + "33"}`,
                borderRadius: 14,
                padding: "15px 22px",
                transition: "all 0.2s",
              }}
            >
              {/* Letter bubble */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background:
                    i % 2 === 0
                      ? "rgba(255,255,255,0.08)"
                      : `${BRAND}33`,
                  border: `1.5px solid ${i % 2 === 0 ? "rgba(255,255,255,0.15)" : BRAND_LIGHT + "55"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: i % 2 === 0 ? "rgba(255,255,255,0.7)" : BRAND_LIGHT,
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow:
                    i % 2 !== 0 ? `0 0 12px ${BRAND}44` : "none",
                }}
              >
                {letters[i]}
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 18,
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                {stripHtml(opt)}
              </span>
            </div>
          ))}
        </div>
      )}

      <CardFooter right={qid ?? undefined} />
    </CardShell>
  );
}

// ---- Answer Card ------------------------------------------------------------

function AnswerCard({
  challengeTitle,
  questionText,
  options,
  correctAnswer,
  explanation,
  reviewAnswer,
  qid,
}: {
  challengeTitle: string;
  questionText: string;
  options: string[];
  correctAnswer: number | null;
  explanation: string | null;
  reviewAnswer: string | null;
  qid: string | null;
}) {
  const letters = ["A", "B", "C", "D", "E"];
  const answerText =
    options.length > 0 && correctAnswer != null
      ? `${letters[correctAnswer]}. ${stripHtml(options[correctAnswer] ?? "")}`
      : reviewAnswer
      ? stripHtml(reviewAnswer)
      : null;
  const explanationText = explanation ? stripHtml(explanation) : null;
  const cleanQ = stripHtml(questionText);

  return (
    <CardShell>
      <CardHeader
        pill="&#x2713; ANSWER"
        pillColor="#4ade80"
        pillBg="linear-gradient(135deg, #22c55e22, #4ade8012)"
        pillBorder="#22c55e"
      />

      {/* Challenge title */}
      <div
        style={{
          color: "rgba(255,255,255,0.38)",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 22,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {challengeTitle}
      </div>

      <TealDivider />

      {/* Question recap */}
      <div
        style={{
          color: "rgba(255,255,255,0.48)",
          fontSize: 19,
          fontWeight: 500,
          lineHeight: 1.5,
          marginBottom: 28,
          fontFamily: "'Georgia', 'Merriweather', serif",
          borderLeft: `4px solid ${BRAND}66`,
          paddingLeft: 20,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {cleanQ.length > 130 ? cleanQ.slice(0, 130) + "..." : cleanQ}
      </div>

      {/* Answer box */}
      {answerText && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(74,222,128,0.05))",
            border: "2px solid rgba(34,197,94,0.4)",
            borderRadius: 18,
            padding: "22px 28px",
            marginBottom: 22,
            position: "relative",
            boxShadow: "0 0 40px rgba(34,197,94,0.12)",
          }}
        >
          {/* Teal-green top accent */}
          <div
            style={{
              position: "absolute",
              top: -2,
              left: 28,
              width: 56,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${BRAND_LIGHT}, #4ade80)`,
            }}
          />
          <div
            style={{
              color: "#4ade80",
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: "2px",
            }}
          >
            CORRECT ANSWER
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 27,
              fontWeight: 700,
              lineHeight: 1.35,
              textShadow: "0 2px 16px rgba(0,0,0,0.4)",
            }}
          >
            {answerText}
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanationText && (
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND}12, rgba(255,255,255,0.03))`,
            border: `1px solid ${BRAND}44`,
            borderRadius: 18,
            padding: "20px 26px",
            flex: "1 1 auto",
            overflow: "hidden",
            boxShadow: `0 0 30px ${BRAND}18`,
          }}
        >
          <div
            style={{
              color: BRAND_LIGHT,
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 12,
              letterSpacing: "2px",
            }}
          >
            EXPLANATION
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 19,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 6,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {explanationText}
          </div>
        </div>
      )}

      <CardFooter right="Follow for daily echo challenges" />
    </CardShell>
  );
}

// ---- DownloadableCard wrapper -----------------------------------------------

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
      {/* Scaled preview — 1080 rendered at 25% = 270px */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "#071318",
        }}
      >
        <div
          style={{
            transform: "scale(0.25)",
            transformOrigin: "top left",
            width: 1080,
            height: 1080,
          }}
        >
          <div ref={ref}>{children}</div>
        </div>
      </div>
      <Button
        onClick={handleDownload}
        size="sm"
        className="w-full gap-2 text-white font-semibold"
        style={{ background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})` }}
      >
        <Download className="w-3.5 h-3.5" />
        Download PNG
      </Button>
    </div>
  );
}

// ---- CategorySection --------------------------------------------------------

function CategorySection({
  item,
}: {
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
  const q = questions[0];

  if (!challenge || !q) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/40 text-sm">
        No queued challenge for{" "}
        <span className="font-semibold text-white/60">{category}</span>
      </div>
    );
  }

  const options = parseOptions(q.options);

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{ background: "#0e1a24" }}
    >
      {/* Category header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: BRAND_LIGHT,
              boxShadow: `0 0 8px ${BRAND_LIGHT}`,
            }}
          />
          <span className="font-bold text-white text-base">{category}</span>
          <Badge
            className="text-[11px] px-2 py-0.5"
            style={{
              background: BRAND + "22",
              color: BRAND_LIGHT,
              border: "none",
            }}
          >
            {challenge.status}
          </Badge>
        </div>
        <span className="text-white/40 text-xs truncate max-w-xs">
          {challenge.title}
        </span>
      </div>

      {/* Cards grid */}
      <div className="p-5 grid grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5" style={{ color: BRAND_LIGHT }} />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Question Card
            </span>
          </div>
          <DownloadableCard
            filename={`${category.replace(/\s+/g, "-")}-question.png`}
          >
            <QuestionCard
              challengeTitle={challenge.title}
              questionText={q.question}
              options={options}
              qid={q.qid}
            />
          </DownloadableCard>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Answer Card
            </span>
          </div>
          <DownloadableCard
            filename={`${category.replace(/\s+/g, "-")}-answer.png`}
          >
            <AnswerCard
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

// ---- Main Page --------------------------------------------------------------

export default function ChallengeCardGenerator() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.quickfire.adminGetCardGeneratorData.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="min-h-screen" style={{ background: "#0a1018" }}>
      {/* Header */}
      <div
        style={{
          background: "#0e1a24",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/platform-admin">
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" style={{ color: BRAND_LIGHT }} />
            <h1 className="text-lg font-bold text-white">
              Challenge Card Generator
            </h1>
          </div>
          <Badge
            className="text-[10px] px-2 py-0.5 ml-1"
            style={{
              background: BRAND + "22",
              color: BRAND_LIGHT,
              border: "none",
            }}
          >
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
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: BRAND + "15", border: `1px solid ${BRAND}33` }}
        >
          <p className="text-white/70">
            Cards are generated from the{" "}
            <strong className="text-white">next queued challenge</strong> per
            category. Each card is{" "}
            <strong className="text-white">1080x1080 px</strong> -- ideal for
            Instagram, Facebook, and LinkedIn. Download the question card first,
            then post the answer card 24 hours later.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: BRAND_LIGHT }}
            />
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
