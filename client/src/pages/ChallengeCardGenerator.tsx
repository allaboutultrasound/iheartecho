/*
 * ChallengeCardGenerator -- Admin Only
 * Generates branded 1080x1080 social media image cards for daily challenges.
 */
import { useRef, useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  ArrowLeft, Download, Loader2, AlertCircle, ImageIcon,
  CheckCircle2, Zap, Package, Share2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Brand palette
const BRAND = "#189aa1";
const BRAND_DARK = "#0d3d44";
const BRAND_AQUA = "#4ad9e0";
const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/icon-192_df958e9b.png";
// Daily challenge card background (trophy + ECG)
const HERO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/daily-challenge-card-generator_c0aea189.webp";

// Required hashtags for all posts
const REQUIRED_HASHTAGS = [
  "#iHeartEcho",
  "#AllAboutUltrasound",
  "#LoveEcho",
  "#Echocardiography",
  "#DailyChallange",
  "#EchoChallenge",
  "#CardiacUltrasound",
  "#CardiacSonographer",
  "#Cardiology",
];

// Category-specific hashtag map
const CATEGORY_HASHTAGS: Record<string, string[]> = {
  "Valvular Disease": ["#ValvularDisease", "#HeartValve", "#EchoValve"],
  "Aortic Stenosis": ["#AorticStenosis", "#AS", "#ValvularDisease"],
  "Mitral Regurgitation": ["#MitralRegurgitation", "#MR", "#ValvularDisease"],
  "Tricuspid Regurgitation": ["#TricuspidRegurgitation", "#TR", "#PulmonaryHypertension"],
  "Diastolic Function": ["#DiastolicFunction", "#Diastology", "#HeartFailure"],
  "Systolic Function": ["#SystolicFunction", "#EjectionFraction", "#LVFunction"],
  "Pericardial Disease": ["#PericardialDisease", "#Pericarditis", "#Tamponade"],
  "Congenital Heart": ["#CongenitalHeart", "#CHD", "#PediatricEcho"],
  "Hemodynamics": ["#Hemodynamics", "#CardiacOutput", "#EchoDoppler"],
  "Doppler": ["#DopplerEcho", "#EchoDoppler", "#CardiacDoppler"],
  "Cardiomyopathy": ["#Cardiomyopathy", "#HCM", "#DCM"],
  "Structural Heart": ["#StructuralHeart", "#TAVR", "#MitraClip"],
  "Fetal Echo": ["#FetalEcho", "#FetalCardiology", "#CongenitalHeart"],
  "Stress Echo": ["#StressEcho", "#ExerciseEcho", "#DSE"],
  "TEE": ["#TEE", "#TransesophagealEcho", "#IntraoperativeEcho"],
  "Aorta": ["#AorticDisease", "#AorticDissection", "#ThoracicAorta"],
  "Right Heart": ["#RightHeart", "#RVFunction", "#PulmonaryHypertension"],
  "LV Function": ["#LVFunction", "#EjectionFraction", "#SystolicFunction"],
  "Pulmonary Hypertension": ["#PulmonaryHypertension", "#PAH", "#RightHeart"],
};

function getCategoryHashtags(category: string): string[] {
  // Direct match
  if (CATEGORY_HASHTAGS[category]) return CATEGORY_HASHTAGS[category];
  // Partial match
  for (const [key, tags] of Object.entries(CATEGORY_HASHTAGS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return tags;
    }
  }
  // Default
  return ["#EchoEducation", "#EchoTraining", "#CardiacImaging"];
}

function buildSocialPost(
  type: "question" | "answer",
  category: string,
  challengeTitle: string,
  questionText: string,
  answerText: string | null,
  explanationText: string | null,
): string {
  const cleanQ = stripHtml(questionText);
  const cleanA = answerText ? stripHtml(answerText) : null;
  const cleanE = explanationText ? stripHtml(explanationText) : null;
  const categoryTags = getCategoryHashtags(category);
  const allHashtags = [...REQUIRED_HASHTAGS, ...categoryTags].join(" ");

  if (type === "question") {
    const questionPreview = cleanQ.length > 160 ? cleanQ.slice(0, 157) + "..." : cleanQ;
    return `🫀 Daily Echo Challenge — ${category}

Can you answer today's question?

❓ ${questionPreview}

Drop your answer in the comments! Answer revealed tomorrow. 👇

${allHashtags}`;
  } else {
    const answerLine = cleanA ? `✅ Answer: ${cleanA}` : "";
    const explanationLine = cleanE
      ? `\n💡 ${cleanE.length > 200 ? cleanE.slice(0, 197) + "..." : cleanE}`
      : "";
    return `🫀 Daily Echo Challenge — ${category} | ANSWER

${answerLine}${explanationLine}

How did you do? Follow for a new echo challenge every day! 📲

${allHashtags}`;
  }
}

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

async function renderCardToPng(el: HTMLElement): Promise<string> {
  return toPng(el, {
    cacheBust: true,
    pixelRatio: 1,
    width: 1080,
    height: 1080,
  });
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
        background: "#071318",
      }}
    >
      {/* Full-bleed background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${HERO_URL}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
        }}
      />
      {/* Dark overlay to ensure text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, rgba(5,14,22,0.88) 0%, rgba(7,25,35,0.82) 50%, rgba(5,14,22,0.90) 100%)",
        }}
      />

      {/* Subtle left-side darkening gradient for text area */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(5,14,22,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 7,
          background: `linear-gradient(90deg, ${BRAND_DARK}, ${BRAND}, ${BRAND_AQUA}, ${BRAND})`,
        }}
      />

      {/* Left accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 7,
          left: 0,
          bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${BRAND_AQUA}bb 0%, ${BRAND}44 60%, transparent 100%)`,
        }}
      />

      {/* Top-right geometric accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 260,
          height: 260,
          background: `linear-gradient(225deg, ${BRAND}1a 0%, transparent 60%)`,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
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
          padding: "52px 64px 44px 68px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- card header ------------------------------------------------------------

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
        marginBottom: 28,
      }}
    >
      {/* Logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            overflow: "hidden",
            border: `2.5px solid ${BRAND}88`,
            boxShadow: `0 0 24px ${BRAND}55`,
            flexShrink: 0,
          }}
        >
          <img src={LOGO_URL} alt="iHeartEcho" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              iHeartEcho™
            </span>
            <span
              style={{
                color: BRAND_AQUA,
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              EchoAssist™
            </span>
          </div>
          {/* "Daily Challenge" subtext in teal */}
          <div
            style={{
              color: BRAND,
              fontSize: 13,
              fontWeight: 600,
              marginTop: 4,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
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
          padding: "9px 22px",
          color: pillColor,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "2px",
          boxShadow: `0 0 18px ${pillBorder}44`,
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
      <div style={{ height: 3, width: 44, borderRadius: 2, background: `linear-gradient(90deg, ${BRAND_AQUA}, ${BRAND})` }} />
      <div style={{ height: 3, width: 10, borderRadius: 2, background: `${BRAND}55` }} />
      <div style={{ height: 3, width: 5, borderRadius: 2, background: `${BRAND}33` }} />
    </div>
  );
}

// ---- card footer ------------------------------------------------------------

function CardFooter({ right }: { right?: string }) {
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: `1px solid ${BRAND}44`,
      }}
    >
      <div style={{ color: BRAND_AQUA, fontSize: 13, fontWeight: 700, opacity: 0.7, letterSpacing: "0.3px" }}>
        iheartecho.com
      </div>
      {right && (
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>{right}</div>
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
        pillColor={BRAND_AQUA}
        pillBg={`linear-gradient(135deg, ${BRAND}33, ${BRAND_AQUA}18)`}
        pillBorder={BRAND_AQUA}
      />

      <div
        style={{
          color: "rgba(255,255,255,0.32)",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 18,
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
          fontSize: options.length > 0 ? 36 : 48,
          fontWeight: 700,
          lineHeight: 1.45,
          marginBottom: options.length > 0 ? 28 : 0,
          flex: options.length > 0 ? "0 0 auto" : "1 1 auto",
          fontFamily: "'Georgia', 'Merriweather', serif",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}
      >
        {cleanQ}
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: "1 1 auto" }}>
          {options.map((opt, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : `${BRAND}0a`,
                border: `1px solid ${i % 2 === 0 ? "rgba(255,255,255,0.07)" : BRAND + "33"}`,
                borderRadius: 12,
                padding: "13px 20px",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  flexShrink: 0,
                  background: i % 2 === 0 ? "rgba(255,255,255,0.07)" : `${BRAND}33`,
                  border: `1.5px solid ${i % 2 === 0 ? "rgba(255,255,255,0.12)" : BRAND_AQUA + "55"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: i % 2 === 0 ? "rgba(255,255,255,0.65)" : BRAND_AQUA,
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: i % 2 !== 0 ? `0 0 10px ${BRAND}44` : "none",
                }}
              >
                {letters[i]}
              </div>
              <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 30, fontWeight: 500, lineHeight: 1.35 }}>
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
        pill="ANSWER"
        pillColor="#4ade80"
        pillBg="linear-gradient(135deg, #22c55e22, #4ade8012)"
        pillBorder="#22c55e"
      />

      <div
        style={{
          color: "rgba(255,255,255,0.32)",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 18,
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
          color: "rgba(255,255,255,0.50)",
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1.45,
          marginBottom: 24,
          fontFamily: "'Georgia', 'Merriweather', serif",
          borderLeft: `4px solid ${BRAND}66`,
          paddingLeft: 18,
        }}
      >
        {cleanQ.length > 120 ? cleanQ.slice(0, 120) + "..." : cleanQ}
      </div>

      {/* Answer box */}
      {answerText && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(74,222,128,0.05))",
            border: "2px solid rgba(34,197,94,0.4)",
            borderRadius: 16,
            padding: "20px 26px",
            marginBottom: 18,
            position: "relative",
            boxShadow: "0 0 36px rgba(34,197,94,0.1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              left: 26,
              width: 52,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${BRAND_AQUA}, #4ade80)`,
            }}
          />
          <div style={{ color: "#4ade80", fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: "2px" }}>
            CORRECT ANSWER
          </div>
          <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, lineHeight: 1.35, textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
            {answerText}
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanationText && (
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND}12, rgba(255,255,255,0.02))`,
            border: `1px solid ${BRAND}44`,
            borderRadius: 16,
            padding: "18px 24px",
            flex: "1 1 auto",
            overflow: "hidden",
            boxShadow: `0 0 28px ${BRAND}16`,
          }}
        >
          <div style={{ color: BRAND_AQUA, fontSize: 10, fontWeight: 800, marginBottom: 10, letterSpacing: "2px" }}>
            EXPLANATION
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: 22,
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

interface DownloadableCardHandle {
  exportPng: () => Promise<string>;
}

// PREVIEW_SIZE: the card is 1080px, we scale it to PREVIEW_SIZE for display
const PREVIEW_SIZE = 700; // px — 1080 * ~0.648
const SCALE = PREVIEW_SIZE / 1080;

function DownloadableCard({
  filename,
  children,
  onRef,
}: {
  filename: string;
  children: React.ReactNode;
  onRef?: (handle: DownloadableCardHandle) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const exportPng = useCallback(async (): Promise<string> => {
    if (!ref.current) throw new Error("Card not mounted");
    return renderCardToPng(ref.current);
  }, []);

  // expose handle to parent for batch download
  const refCallback = useCallback((el: HTMLDivElement | null) => {
    (ref as any).current = el;
    if (el && onRef) {
      onRef({ exportPng });
    }
  }, [exportPng, onRef]);

  const handleDownload = useCallback(async () => {
    try {
      const dataUrl = await exportPng();
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Card export failed:", err);
      alert("Export failed. Please try again.");
    }
  }, [exportPng, filename]);

  return (
    <div className="flex flex-col">
      {/* Preview: fixed PREVIEW_SIZE square, no extra space */}
      <div
        style={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          position: "relative",
          overflow: "hidden",
          borderRadius: "10px 10px 0 0",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          background: "#071318",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1080,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={refCallback}>{children}</div>
        </div>
      </div>
      <Button
        onClick={handleDownload}
        size="sm"
        className="w-full gap-2 text-white font-semibold text-xs rounded-t-none"
        style={{
          background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})`,
          borderRadius: "0 0 10px 10px",
        }}
      >
        <Download className="w-3 h-3" />
        Download PNG
      </Button>
    </div>
  );
}

// ---- Social Post Panel ------------------------------------------------------

function SocialPostPanel({
  type,
  category,
  challengeTitle,
  questionText,
  answerText,
  explanationText,
}: {
  type: "question" | "answer";
  category: string;
  challengeTitle: string;
  questionText: string;
  answerText: string | null;
  explanationText: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const post = buildSocialPost(type, category, challengeTitle, questionText, answerText, explanationText);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(post);
      setCopied(true);
      toast.success("Copied!", { description: "Social post copied to clipboard." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = post;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      toast.success("Copied!", { description: "Social post copied to clipboard." });
      setTimeout(() => setCopied(false), 2500);
    }
  }, [post, toast]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${BRAND}33`, background: "#0a1620" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${BRAND}22`, background: `${BRAND}0a` }}
      >
        <div className="flex items-center gap-1.5">
          <Share2 className="w-3 h-3" style={{ color: BRAND_AQUA }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND_AQUA }}>
            Social Post — {type === "question" ? "Question" : "Answer"}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 gap-1 text-[10px] font-semibold text-white"
          style={{ background: copied ? "#166534" : `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})` }}
        >
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      {/* Post preview */}
      <div
        className="px-3 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap"
        style={{ color: "rgba(255,255,255,0.65)", maxHeight: 160, overflowY: "auto" }}
      >
        {post}
      </div>
    </div>
  );
}

// ---- CategorySection --------------------------------------------------------

type QuestionItem = {
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
};

type CategoryItem = {
  category: string;
  challenge: { title: string; status: string; category: string } | null;
  questions: QuestionItem[];
};

function CategorySection({
  item,
  onQuestionRef,
  onAnswerRef,
}: {
  item: CategoryItem;
  onQuestionRef: (cat: string, h: DownloadableCardHandle) => void;
  onAnswerRef: (cat: string, h: DownloadableCardHandle) => void;
}) {
  const { category, challenge, questions } = item;
  const q = questions[0];

  if (!challenge || !q) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-white/40 text-xs">
        No queued challenge for <span className="font-semibold text-white/60">{category}</span>
      </div>
    );
  }

  const options = parseOptions(q.options);
  const letters = ["A", "B", "C", "D", "E"];
  const answerText =
    options.length > 0 && q.correctAnswer != null
      ? `${letters[q.correctAnswer]}. ${stripHtml(options[q.correctAnswer] ?? "")}`
      : q.reviewAnswer
      ? stripHtml(q.reviewAnswer)
      : null;
  const explanationText = q.explanation ? stripHtml(q.explanation) : null;

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" style={{ background: "#0e1a24" }}>
      {/* Category header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND_AQUA, boxShadow: `0 0 6px ${BRAND_AQUA}` }} />
          <span className="font-bold text-white text-sm">{category}</span>
          <Badge className="text-[10px] px-1.5 py-0" style={{ background: BRAND + "22", color: BRAND_AQUA, border: "none" }}>
            {challenge.status}
          </Badge>
        </div>
        <span className="text-white/35 text-xs truncate max-w-xs">{challenge.title}</span>
      </div>

      {/* Cards + social posts */}
      <div className="p-4 space-y-4">
        {/* Cards row — side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Question card */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" style={{ color: BRAND_AQUA }} />
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Question Card</span>
            </div>
            <DownloadableCard
              filename={`${category.replace(/\s+/g, "-")}-question.png`}
              onRef={(h) => onQuestionRef(category, h)}
            >
              <QuestionCard
                challengeTitle={challenge.title}
                questionText={q.question}
                options={options}
                qid={q.qid}
              />
            </DownloadableCard>
          </div>

          {/* Answer card */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Answer Card</span>
            </div>
            <DownloadableCard
              filename={`${category.replace(/\s+/g, "-")}-answer.png`}
              onRef={(h) => onAnswerRef(category, h)}
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

        {/* Social posts row — side by side below cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3" style={{ color: BRAND_AQUA }} />
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Question Post</span>
            </div>
            <SocialPostPanel
              type="question"
              category={category}
              challengeTitle={challenge.title}
              questionText={q.question}
              answerText={answerText}
              explanationText={explanationText}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3" style={{ color: BRAND_AQUA }} />
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Answer Post</span>
            </div>
            <SocialPostPanel
              type="answer"
              category={category}
              challengeTitle={challenge.title}
              questionText={q.question}
              answerText={answerText}
              explanationText={explanationText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page --------------------------------------------------------------

export default function ChallengeCardGenerator() {
  const { data, isLoading, error, refetch } = trpc.quickfire.adminGetCardGeneratorData.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  // Refs for batch export
  const questionRefs = useRef<Record<string, DownloadableCardHandle>>({});
  const answerRefs = useRef<Record<string, DownloadableCardHandle>>({});
  const [batchLoading, setBatchLoading] = useState<"questions" | "answers" | null>(null);

  const handleBatchDownload = useCallback(async (type: "questions" | "answers") => {
    setBatchLoading(type);
    const refs = type === "questions" ? questionRefs.current : answerRefs.current;
    const zip = new JSZip();
    const folder = zip.folder(type === "questions" ? "question-cards" : "answer-cards")!;
    try {
      await Promise.all(
        Object.entries(refs).map(async ([cat, handle]) => {
          const dataUrl = await handle.exportPng();
          const base64 = dataUrl.split(",")[1];
          folder.file(`${cat.replace(/\s+/g, "-")}-${type === "questions" ? "question" : "answer"}.png`, base64, { base64: true });
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `iheartecho-${type}-${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err) {
      console.error("Batch export failed:", err);
      alert("Batch export failed. Please try again.");
    } finally {
      setBatchLoading(null);
    }
  }, []);

  const hasData = data && data.some((d: any) => d.challenge && d.questions.length > 0);

  return (
    <div className="min-h-screen" style={{ background: "#0a1018" }}>
      {/* Header */}
      <div style={{ background: "#0e1a24", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-2">
          <Link href="/platform-admin">
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/50" />
            </button>
          </Link>
          <ImageIcon className="w-4 h-4" style={{ color: BRAND_AQUA }} />
          <h1 className="text-base font-bold text-white">Challenge Card Generator</h1>
          <Badge className="text-[10px] px-1.5 py-0 ml-0.5" style={{ background: BRAND + "22", color: BRAND_AQUA, border: "none" }}>
            Admin
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            {hasData && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleBatchDownload("questions")}
                  disabled={batchLoading !== null}
                  className="gap-1.5 text-white text-xs font-semibold"
                  style={{ background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})` }}
                >
                  {batchLoading === "questions" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                  All Questions
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBatchDownload("answers")}
                  disabled={batchLoading !== null}
                  className="gap-1.5 text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(90deg, #166534, #14532d)" }}
                >
                  {batchLoading === "answers" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                  All Answers
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-white/60 border-white/20 hover:bg-white/10 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        {/* Info bar */}
        <div
          className="rounded-lg p-3 mb-4 text-xs"
          style={{ background: BRAND + "14", border: `1px solid ${BRAND}2a` }}
        >
          <p className="text-white/60">
            Cards are generated from the <strong className="text-white">next queued challenge</strong> per category.
            Each card is <strong className="text-white">1080×1080 px</strong> — ideal for Instagram, Facebook, and LinkedIn.
            Post the question card first, then the answer card 24 hours later.
            Use <strong className="text-white">All Questions</strong> or <strong className="text-white">All Answers</strong> to download a ZIP of all cards at once.
            Click <strong className="text-white">Copy</strong> on any social post to get a ready-to-paste caption with hashtags.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: BRAND_AQUA }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        {/* Cards */}
        {data && (
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                No queued challenges found. Add challenges to the queue first.
              </div>
            ) : (
              data.map((item: any) => (
                <CategorySection
                  key={item.category}
                  item={item}
                  onQuestionRef={(cat, h) => { questionRefs.current[cat] = h; }}
                  onAnswerRef={(cat, h) => { answerRefs.current[cat] = h; }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
