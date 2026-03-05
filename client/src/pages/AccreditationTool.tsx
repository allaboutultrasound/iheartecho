/*
  DIY Accreditation Tool™ — iHeartEcho
  Tabs: Quality Review | Peer Review | Policy Builder | Appropriate Use Monitor
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Star, FileText, BarChart2, Plus, CheckCircle, AlertTriangle,
  XCircle, Clock, ChevronDown, ChevronUp, Shield, Award, BookOpen, Loader2, Download,
  TrendingUp, TrendingDown, Minus, Info, ImageIcon
} from "lucide-react";
import ImageQualityReviewTab from "./ImageQualityReview";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import jsPDF from "jspdf";

const BRAND = "#189aa1";
const MODALITIES = ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS"] as const;

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        active ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-800 hover:bg-white/60"
      }`}
      style={active ? { background: BRAND } : {}}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score?: number | null }) {
  if (!score) return <span className="text-gray-400 text-xs">—</span>;
  const color = score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + "18", color }}>
      <Star className="w-3 h-3" />
      {score}/5
    </span>
  );
}

// ─── Finding Badge ────────────────────────────────────────────────────────────
function FindingBadge({ finding }: { finding?: string | null }) {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pass: { label: "Pass", color: "#16a34a", icon: CheckCircle },
    fail: { label: "Fail", color: "#dc2626", icon: XCircle },
    needs_improvement: { label: "Needs Improvement", color: "#d97706", icon: AlertTriangle },
    na: { label: "N/A", color: "#6b7280", icon: Clock },
  };
  const m = map[finding ?? "na"] ?? map.na;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: m.color + "18", color: m.color }}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

// ─── AUC Badge ────────────────────────────────────────────────────────────────
function AucBadge({ rating }: { rating?: string | null }) {
  const map: Record<string, { label: string; color: string }> = {
    appropriate: { label: "Appropriate", color: "#16a34a" },
    may_be_appropriate: { label: "May Be Appropriate", color: "#d97706" },
    rarely_appropriate: { label: "Rarely Appropriate", color: "#dc2626" },
    unknown: { label: "Unknown", color: "#6b7280" },
  };
  const m = map[rating ?? "unknown"] ?? map.unknown;
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: m.color + "18", color: m.color }}>
      {m.label}
    </span>
  );
}

// ─── Quality Review Tab ───────────────────────────────────────────────────────
function QualityReviewTab() {
  
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    category: "" as string,
    title: "",
    description: "",
    finding: "" as string,
    actionRequired: "",
    actionTaken: "",
    dueDate: "",
  });

  const utils = trpc.useUtils();
  const { data: logs, isLoading } = trpc.accreditation.getQaLogs.useQuery({ limit: 30, offset: 0 });
  const createLog = trpc.accreditation.createQaLog.useMutation({
    onSuccess: () => {
      toast.success("QA log entry saved.");
      utils.accreditation.getQaLogs.invalidate();
      setForm({ category: "", title: "", description: "", finding: "", actionRequired: "", actionTaken: "", dueDate: "" });
      setExpanded(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const QA_CATEGORIES = [
    { value: "equipment", label: "Equipment" },
    { value: "protocol", label: "Protocol Adherence" },
    { value: "image_quality", label: "Image Quality" },
    { value: "report_turnaround", label: "Report Turnaround" },
    { value: "staff_competency", label: "Staff Competency" },
    { value: "infection_control", label: "Infection Control" },
    { value: "patient_safety", label: "Patient Safety" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = () => {
    if (!form.category || !form.title) {
      toast.error("Please fill in category and title.");
      return;
    }
    createLog.mutate({
      category: form.category as "equipment" | "protocol" | "image_quality" | "report_turnaround" | "staff_competency" | "infection_control" | "patient_safety" | "other",
      title: form.title,
      description: form.description || undefined,
      finding: (form.finding as "pass" | "fail" | "needs_improvement" | "na") || undefined,
      actionRequired: form.actionRequired || undefined,
      actionTaken: form.actionTaken || undefined,
      dueDate: form.dueDate || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Entry */}
      <Card className="border border-[#189aa1]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: BRAND }} />
              New Quality Review Entry
            </CardTitle>
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category *</label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Finding</label>
                <Select value={form.finding} onValueChange={(v) => setForm(f => ({ ...f, finding: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select finding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                    <SelectItem value="na">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
              <Input className="h-8 text-xs" placeholder="e.g. Annual equipment calibration check" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <Textarea className="text-xs min-h-[60px]" placeholder="Describe the finding or observation..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Action Required</label>
                <Input className="h-8 text-xs" placeholder="Corrective action needed" value={form.actionRequired} onChange={e => setForm(f => ({ ...f, actionRequired: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Due Date</label>
                <Input type="date" className="h-8 text-xs" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Action Taken</label>
              <Input className="h-8 text-xs" placeholder="Steps already taken" value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))} />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={createLog.isPending} className="text-white" style={{ background: BRAND }}>
              {createLog.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Save Entry
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Log List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : (logs && logs.length > 0) ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-800">{log.title}</span>
                      <FindingBadge finding={log.finding} />
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{log.category?.replace(/_/g, " ")}</span>
                    </div>
                    {log.description && <p className="text-xs text-gray-500 mb-1">{log.description}</p>}
                    {log.actionRequired && <p className="text-xs text-amber-700"><span className="font-semibold">Action required:</span> {log.actionRequired}</p>}
                    {log.actionTaken && <p className="text-xs text-green-700"><span className="font-semibold">Action taken:</span> {log.actionTaken}</p>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No QA log entries yet. Add your first entry above.</div>
      )}
    </div>
  );
}

// ─── Quality Score Engine ───────────────────────────────────────────────────

// Rubric weights
const QS_WEIGHTS = { imageQuality: 0.40, reportAccuracy: 0.35, technicalAdherence: 0.25 } as const;

// Component raw scores (0–100)
const IQ_SCORES: Record<string, number> = {
  excellent: 100, good: 80, adequate: 60, poor: 30,
};
const RA_SCORES: Record<string, number> = {
  accurate: 100, minor_discrepancy: 55, major_discrepancy: 15,
};
const TA_SCORES: Record<string, number> = {
  full: 100, partial: 55, non_adherent: 15,
};

type QualityScoreResult = {
  score: number;           // 0–100 composite
  tier: "Excellent" | "Good" | "Adequate" | "Needs Improvement" | null;
  color: string;
  bgColor: string;
  components: { label: string; raw: number; weight: number; weighted: number }[];
  complete: boolean;       // all 3 fields filled
};

function calcQualityScore(
  imageQuality?: string,
  reportAccuracy?: string,
  technicalAdherence?: string,
): QualityScoreResult {
  const iqRaw = imageQuality ? (IQ_SCORES[imageQuality] ?? null) : null;
  const raRaw = reportAccuracy ? (RA_SCORES[reportAccuracy] ?? null) : null;
  const taRaw = technicalAdherence ? (TA_SCORES[technicalAdherence] ?? null) : null;
  const complete = iqRaw !== null && raRaw !== null && taRaw !== null;

  const components = [
    { label: "Image Quality", raw: iqRaw ?? 0, weight: QS_WEIGHTS.imageQuality, weighted: (iqRaw ?? 0) * QS_WEIGHTS.imageQuality },
    { label: "Report Accuracy", raw: raRaw ?? 0, weight: QS_WEIGHTS.reportAccuracy, weighted: (raRaw ?? 0) * QS_WEIGHTS.reportAccuracy },
    { label: "Technical Adherence", raw: taRaw ?? 0, weight: QS_WEIGHTS.technicalAdherence, weighted: (taRaw ?? 0) * QS_WEIGHTS.technicalAdherence },
  ];

  const score = complete
    ? Math.round(components.reduce((s, c) => s + c.weighted, 0))
    : 0;

  let tier: QualityScoreResult["tier"] = null;
  let color = "#6b7280";
  let bgColor = "#f3f4f6";
  if (complete) {
    if (score >= 85) { tier = "Excellent"; color = "#16a34a"; bgColor = "#dcfce7"; }
    else if (score >= 70) { tier = "Good"; color = "#2563eb"; bgColor = "#dbeafe"; }
    else if (score >= 50) { tier = "Adequate"; color = "#d97706"; bgColor = "#fef3c7"; }
    else { tier = "Needs Improvement"; color = "#dc2626"; bgColor = "#fee2e2"; }
  }

  return { score, tier, color, bgColor, components, complete };
}

// Quality Score Badge component
function QualityScoreBadge({ qs, size = "sm" }: { qs: QualityScoreResult; size?: "sm" | "md" }) {
  if (!qs.complete) return null;
  const TierIcon = qs.score >= 85 ? TrendingUp : qs.score >= 50 ? Minus : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${
        size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5"
      }`}
      style={{ background: qs.bgColor, color: qs.color }}
    >
      <TierIcon className={size === "md" ? "w-4 h-4" : "w-3 h-3"} />
      QS {qs.score}
      {size === "md" && <span className="font-normal">/ 100 — {qs.tier}</span>}
    </span>
  );
}

// Inline Quality Score preview (shown inside the form while editing)
function QualityScorePreview({ imageQuality, reportAccuracy, technicalAdherence }: {
  imageQuality: string; reportAccuracy: string; technicalAdherence: string;
}) {
  const qs = calcQualityScore(imageQuality || undefined, reportAccuracy || undefined, technicalAdherence || undefined);
  if (!qs.complete) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 italic">
        <Info className="w-3.5 h-3.5" />
        Fill in Image Quality, Report Accuracy, and Technical Adherence to see the Quality Score.
      </div>
    );
  }
  return (
    <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: qs.color + "40", background: qs.bgColor + "60" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Quality Score Preview</span>
        <QualityScoreBadge qs={qs} size="md" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {qs.components.map(c => (
          <div key={c.label} className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">{c.label}</div>
            <div className="text-xs font-bold" style={{ color: qs.color }}>{c.raw}</div>
            <div className="text-[10px] text-gray-400">×{(c.weight * 100).toFixed(0)}%</div>
            <div className="h-1 rounded-full mt-1" style={{ background: qs.color + "30" }}>
              <div className="h-full rounded-full" style={{ width: `${c.raw}%`, background: qs.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-500 text-center">
        Weighted composite: {qs.components.map(c => `${c.raw}×${(c.weight * 100).toFixed(0)}%`).join(" + ")} = {qs.score}/100
      </div>
    </div>
  );
}

// ─── PDF Export Utility ─────────────────────────────────────────────────────
type PeerReviewRow = {
  id: number;
  modality: string;
  sonographerInitials?: string | null;
  patientId?: string | null;
  studyDate?: string | null;
  imageQuality?: string | null;
  imageQualityNotes?: string | null;
  reportAccuracy?: string | null;
  reportNotes?: string | null;
  technicalAdherence?: string | null;
  technicalNotes?: string | null;
  overallScore?: number | null;
  feedback?: string | null;
  status: string;
  createdAt: Date;
};

function exportPeerReviewPDF(reviews: PeerReviewRow[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageW = 215.9;
  const pageH = 279.4;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHRule = (thickness = 0.3, color: [number, number, number] = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);
    doc.line(margin, y, pageW - margin, y);
    y += 3;
  };

  // ── Header ──
  doc.setFillColor(14, 74, 80); // #0e4a50
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("iHeartEcho™ — Peer Review Report", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("DIY Accreditation Tool™  |  For IAC Accreditation Preparation", margin, 19);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 24);
  y = 36;

  // ── Summary box ──
  const submitted = reviews.filter(r => r.status === "submitted" || r.status === "complete").length;
  const avgScore = reviews.filter(r => r.overallScore).reduce((s, r) => s + (r.overallScore ?? 0), 0) /
    (reviews.filter(r => r.overallScore).length || 1);
  doc.setFillColor(240, 251, 252); // light teal bg
  doc.setDrawColor(24, 154, 161);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, 20, 2, 2, "FD");
  doc.setTextColor(14, 74, 80);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Reviews: ${reviews.length}`, margin + 6, y + 7);
  doc.text(`Submitted / Complete: ${submitted}`, margin + 50, y + 7);
  doc.text(`Avg. Overall Score: ${reviews.filter(r => r.overallScore).length ? avgScore.toFixed(1) + " / 5" : "N/A"}`, margin + 110, y + 7);
  const modalityCounts = reviews.reduce<Record<string, number>>((acc, r) => { acc[r.modality] = (acc[r.modality] ?? 0) + 1; return acc; }, {});
  const modalitySummary = Object.entries(modalityCounts).map(([k, v]) => `${k}: ${v}`).join("  |  ");
  doc.setFont("helvetica", "normal");
  doc.text(`Modalities: ${modalitySummary}`, margin + 6, y + 14);
  y += 26;

  // ── HIPAA notice ──
  doc.setFontSize(7.5);
  doc.setTextColor(120, 80, 0);
  doc.setFont("helvetica", "italic");
  doc.text(
    "HIPAA Notice: This report contains de-identified study data only. Do not add or distribute patient PHI.",
    margin, y
  );
  y += 7;
  drawHRule(0.5, [24, 154, 161]);

  // ── Individual reviews ──
  const scoreLabel = (n?: number | null) =>
    !n ? "—" : ["Poor", "Below Average", "Average", "Good", "Excellent"][n - 1] + ` (${n}/5)`;
  const fmt = (s?: string | null) => !s ? "—" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  reviews.forEach((r, idx) => {
    checkPage(52);

    // Review header bar
    doc.setFillColor(24, 154, 161);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Review #${idx + 1}  —  ${r.modality}`, margin + 3, y + 5);
    const dateStr = r.studyDate ?? new Date(r.createdAt).toLocaleDateString();
    doc.text(dateStr, pageW - margin - doc.getTextWidth(dateStr) - 3, y + 5);
    y += 10;

    // Two-column grid
    const col1 = margin;
    const col2 = margin + contentW / 2 + 2;
    const colW = contentW / 2 - 2;

    const field = (label: string, value: string, x: number, colWidth: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(label, x, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(value, colWidth - doc.getTextWidth(label) - 2);
      doc.text(lines, x + doc.getTextWidth(label) + 1, y);
    };

    field("Sonographer: ", r.sonographerInitials ?? "—", col1, colW);
    field("Patient ID: ", r.patientId ?? "—", col2, colW);
    y += 5;

    field("Image Quality: ", fmt(r.imageQuality), col1, colW);
    field("Report Accuracy: ", fmt(r.reportAccuracy), col2, colW);
    y += 5;

    field("Technical Adherence: ", fmt(r.technicalAdherence), col1, colW);
    field("Overall Score: ", scoreLabel(r.overallScore), col2, colW);
    y += 5;

    field("Status: ", fmt(r.status), col1, colW);
    y += 5;

    // Notes fields (full width)
    const noteField = (label: string, value: string | null | undefined) => {
      if (!value) return;
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(value, contentW - doc.getTextWidth(label) - 2);
      doc.text(lines, margin + doc.getTextWidth(label) + 1, y);
      y += lines.length * 4.5;
    };

    noteField("Image Notes: ", r.imageQualityNotes);
    noteField("Report Notes: ", r.reportNotes);
    noteField("Technical Notes: ", r.technicalNotes);

    // Feedback box
    if (r.feedback) {
      checkPage(16);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      const feedbackLines = doc.splitTextToSize(r.feedback, contentW - 8);
      const boxH = feedbackLines.length * 4.5 + 8;
      doc.roundedRect(margin, y, contentW, boxH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text("Feedback / Recommendations:", margin + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(feedbackLines, margin + 3, y + 10);
      y += boxH + 3;
    }

    y += 2;
    drawHRule();
  });

  // ── Footer on each page ──
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
      "iHeartEcho™ DIY Accreditation Tool™  |  For accreditation preparation use only  |  Not a substitute for official IAC review",
      margin, pageH - 8
    );
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 20, pageH - 8);
  }

  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`iHeartEcho_PeerReview_Report_${dateTag}.pdf`);
  return true;
}

// ─── Peer Review Tab ──────────────────────────────────────────────────────────
function PeerReviewTab() {
  
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    studyDate: "",
    modality: "" as string,
    sonographerInitials: "",
    imageQuality: "" as string,
    imageQualityNotes: "",
    reportAccuracy: "" as string,
    reportNotes: "",
    technicalAdherence: "" as string,
    technicalNotes: "",
    overallScore: "" as string,
    feedback: "",
    status: "draft" as string,
  });

  const utils = trpc.useUtils();
  const { data: reviews, isLoading } = trpc.accreditation.getPeerReviews.useQuery({ limit: 20, offset: 0 });
  const createReview = trpc.accreditation.createPeerReview.useMutation({
    onSuccess: () => {
      toast.success("Peer review saved.");
      utils.accreditation.getPeerReviews.invalidate();
      setForm({ patientId: "", studyDate: "", modality: "", sonographerInitials: "", imageQuality: "", imageQualityNotes: "", reportAccuracy: "", reportNotes: "", technicalAdherence: "", technicalNotes: "", overallScore: "", feedback: "", status: "draft" });
      setExpanded(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.modality) {
      toast.error("Please select a modality.");
      return;
    }
    createReview.mutate({
      patientId: form.patientId || undefined,
      studyDate: form.studyDate || undefined,
      modality: form.modality as typeof MODALITIES[number],
      sonographerInitials: form.sonographerInitials || undefined,
      imageQuality: (form.imageQuality as "excellent" | "good" | "adequate" | "poor") || undefined,
      imageQualityNotes: form.imageQualityNotes || undefined,
      reportAccuracy: (form.reportAccuracy as "accurate" | "minor_discrepancy" | "major_discrepancy") || undefined,
      reportNotes: form.reportNotes || undefined,
      technicalAdherence: (form.technicalAdherence as "full" | "partial" | "non_adherent") || undefined,
      technicalNotes: form.technicalNotes || undefined,
      overallScore: form.overallScore ? parseInt(form.overallScore) : undefined,
      feedback: form.feedback || undefined,
      status: (form.status as "draft" | "submitted" | "complete") || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border border-[#189aa1]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: BRAND }} />
              New Peer Review
            </CardTitle>
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modality *</label>
                <Select value={form.modality} onValueChange={(v) => setForm(f => ({ ...f, modality: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Study Date</label>
                <Input type="date" className="h-8 text-xs" value={form.studyDate} onChange={e => setForm(f => ({ ...f, studyDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Sonographer Initials</label>
                <Input className="h-8 text-xs" placeholder="e.g. J.S." value={form.sonographerInitials} onChange={e => setForm(f => ({ ...f, sonographerInitials: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">De-identified Patient ID</label>
              <Input className="h-8 text-xs" placeholder="e.g. PT-2024-001 (no PHI)" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Quality</label>
                <Select value={form.imageQuality} onValueChange={(v) => setForm(f => ({ ...f, imageQuality: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="adequate">Adequate</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Report Accuracy</label>
                <Select value={form.reportAccuracy} onValueChange={(v) => setForm(f => ({ ...f, reportAccuracy: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accurate">Accurate</SelectItem>
                    <SelectItem value="minor_discrepancy">Minor Discrepancy</SelectItem>
                    <SelectItem value="major_discrepancy">Major Discrepancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Technical Adherence</label>
                <Select value={form.technicalAdherence} onValueChange={(v) => setForm(f => ({ ...f, technicalAdherence: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="non_adherent">Non-Adherent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Quality Notes</label>
                <Input className="h-8 text-xs" placeholder="Notes..." value={form.imageQualityNotes} onChange={e => setForm(f => ({ ...f, imageQualityNotes: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Report Notes</label>
                <Input className="h-8 text-xs" placeholder="Notes..." value={form.reportNotes} onChange={e => setForm(f => ({ ...f, reportNotes: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Technical Notes</label>
                <Input className="h-8 text-xs" placeholder="Notes..." value={form.technicalNotes} onChange={e => setForm(f => ({ ...f, technicalNotes: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Overall Score (1–5)</label>
                <Select value={form.overallScore} onValueChange={(v) => setForm(f => ({ ...f, overallScore: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Poor", "Below Average", "Average", "Good", "Excellent"][n - 1]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Feedback / Recommendations</label>
              <Textarea className="text-xs min-h-[60px]" placeholder="Constructive feedback for the sonographer..." value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={createReview.isPending} className="text-white" style={{ background: BRAND }}>
              {createReview.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Save Review
            </Button>
          </CardContent>
        )}
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : (reviews && reviews.length > 0) ? (
        <div className="space-y-2">
          {/* Bulk export toolbar */}
          <div className="flex items-center justify-between px-1 py-1.5">
            <span className="text-xs text-gray-500 font-medium">{reviews.length} review{reviews.length !== 1 ? "s" : ""} on file</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-[#189aa1] text-[#189aa1] hover:bg-[#f0fbfc]"
              onClick={() => {
                exportPeerReviewPDF(reviews);
                toast.success("PDF report downloaded.");
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Export All as PDF
            </Button>
          </div>

          {reviews.map((r) => (
            <Card key={r.id} className="border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{r.modality}</span>
                      {r.sonographerInitials && <span className="text-xs text-gray-500">Sonographer: {r.sonographerInitials}</span>}
                      <ScoreBadge score={r.overallScore} />
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{r.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {r.imageQuality && <span>Image: <span className="font-medium capitalize">{r.imageQuality}</span></span>}
                      {r.reportAccuracy && <span>Report: <span className="font-medium">{r.reportAccuracy.replace(/_/g, " ")}</span></span>}
                      {r.technicalAdherence && <span>Technical: <span className="font-medium capitalize">{r.technicalAdherence.replace(/_/g, " ")}</span></span>}
                    </div>
                    {r.feedback && <p className="text-xs text-gray-600 mt-1 italic">"{r.feedback}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-xs text-gray-400 whitespace-nowrap">{r.studyDate ?? new Date(r.createdAt).toLocaleDateString()}</div>
                    <button
                      title="Export this review as PDF"
                      className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-[#189aa1]/40 text-[#189aa1] hover:bg-[#f0fbfc] transition-colors"
                      onClick={() => {
                        exportPeerReviewPDF([r]);
                        toast.success("Single review PDF downloaded.");
                      }}
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No peer reviews yet. Add your first review above.</div>
      )}
    </div>
  );
}

// ─── Policy Builder Tab ───────────────────────────────────────────────────────
function PolicyBuilderTab() {
  
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "" as string,
    modality: "All" as string,
    content: "",
    version: "1.0",
    effectiveDate: "",
    reviewDate: "",
    status: "draft" as string,
  });

  const utils = trpc.useUtils();
  const { data: policies, isLoading } = trpc.accreditation.getPolicies.useQuery();
  const createPolicy = trpc.accreditation.createPolicy.useMutation({
    onSuccess: () => {
      toast.success("Policy saved.");
      utils.accreditation.getPolicies.invalidate();
      setForm({ title: "", category: "", modality: "All", content: "", version: "1.0", effectiveDate: "", reviewDate: "", status: "draft" });
      setExpanded(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const POLICY_CATEGORIES = [
    { value: "infection_control", label: "Infection Control" },
    { value: "equipment", label: "Equipment" },
    { value: "patient_safety", label: "Patient Safety" },
    { value: "protocol", label: "Protocol" },
    { value: "staff_competency", label: "Staff Competency" },
    { value: "quality_assurance", label: "Quality Assurance" },
    { value: "appropriate_use", label: "Appropriate Use" },
    { value: "report_turnaround", label: "Report Turnaround" },
    { value: "emergency", label: "Emergency" },
    { value: "other", label: "Other" },
  ];

  const POLICY_TEMPLATES: Record<string, string> = {
    infection_control: `INFECTION CONTROL POLICY\n\nPurpose:\nTo prevent the transmission of infectious agents during echocardiographic procedures.\n\nScope:\nAll echocardiography laboratory personnel.\n\nPolicy:\n1. Transducer cleaning and disinfection must follow manufacturer guidelines and facility infection control standards.\n2. High-level disinfection (HLD) is required for all TEE probes after each use.\n3. Standard precautions (gloves, hand hygiene) must be observed for all patient contact.\n4. Probe covers must be used for all TEE and intracavitary procedures.\n\nReferences:\n- ASE Guidelines for Infection Control in the Echo Lab\n- CDC Standard Precautions`,
    protocol: `ECHOCARDIOGRAPHY PROTOCOL POLICY\n\nPurpose:\nTo ensure standardized, complete, and high-quality echocardiographic examinations.\n\nScope:\nAll sonographers performing echocardiographic studies.\n\nPolicy:\n1. All TTE studies must include the minimum views required by ASE/IAC standards.\n2. Doppler measurements must be obtained per ASE guidelines.\n3. Incomplete studies must be documented with clinical justification.\n4. Protocol deviations must be reported to the supervising physician.\n\nReferences:\n- ASE Guidelines for Cardiac Sonographers\n- IAC Standards for Echo Accreditation`,
    staff_competency: `STAFF COMPETENCY POLICY\n\nPurpose:\nTo ensure all echocardiography personnel maintain competency in their assigned roles.\n\nScope:\nAll sonographers and interpreting physicians in the echocardiography laboratory.\n\nPolicy:\n1. Annual competency assessments are required for all sonographers.\n2. New staff must complete a structured orientation and competency validation before independent practice.\n3. CME requirements per ARDMS/CCI/ICAEL standards must be maintained.\n4. Competency records must be maintained in personnel files.\n\nReferences:\n- ARDMS CME Requirements\n- IAC Staff Qualification Standards`,
  };

  const handleSubmit = () => {
    if (!form.title || !form.category || !form.content) {
      toast.error("Please fill in title, category, and content.");
      return;
    }
    createPolicy.mutate({
      title: form.title,
      category: form.category as "infection_control" | "equipment" | "patient_safety" | "protocol" | "staff_competency" | "quality_assurance" | "appropriate_use" | "report_turnaround" | "emergency" | "other",
      modality: (form.modality as "TTE" | "TEE" | "Stress" | "Pediatric" | "Fetal" | "HOCM" | "POCUS" | "All") || undefined,
      content: form.content,
      version: form.version || undefined,
      effectiveDate: form.effectiveDate || undefined,
      reviewDate: form.reviewDate || undefined,
      status: (form.status as "draft" | "active" | "archived") || undefined,
    });
  };

  const statusColor: Record<string, string> = { draft: "#6b7280", active: "#16a34a", archived: "#d97706" };

  return (
    <div className="space-y-4">
      <Card className="border border-[#189aa1]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: BRAND }} />
              New Policy
            </CardTitle>
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category *</label>
                <Select value={form.category} onValueChange={(v) => {
                  setForm(f => ({ ...f, category: v, content: POLICY_TEMPLATES[v] ?? f.content }));
                }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{POLICY_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modality</label>
                <Select value={form.modality} onValueChange={(v) => setForm(f => ({ ...f, modality: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Modalities</SelectItem>
                    {MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Policy Title *</label>
              <Input className="h-8 text-xs" placeholder="e.g. TEE Probe Disinfection Policy" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Policy Content *</label>
              <Textarea className="text-xs min-h-[140px] font-mono" placeholder="Enter policy text or use template above..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Version</label>
                <Input className="h-8 text-xs" placeholder="1.0" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Effective Date</label>
                <Input type="date" className="h-8 text-xs" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Review Date</label>
                <Input type="date" className="h-8 text-xs" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={createPolicy.isPending} className="text-white" style={{ background: BRAND }}>
              {createPolicy.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Save Policy
            </Button>
          </CardContent>
        )}
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : (policies && policies.length > 0) ? (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card key={p.id} className="border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-800">{p.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (statusColor[p.status] ?? "#6b7280") + "18", color: statusColor[p.status] ?? "#6b7280" }}>{p.status}</span>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{p.category?.replace(/_/g, " ")}</span>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{p.modality}</span>
                      <span className="text-xs text-gray-400">v{p.version}</span>
                    </div>
                    {p.reviewDate && <p className="text-xs text-gray-400">Review by: {p.reviewDate}</p>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No policies yet. Create your first policy above.</div>
      )}
    </div>
  );
}

// ─── Appropriate Use Monitor Tab ──────────────────────────────────────────────
function AppropriateUseTab() {
  
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    studyDate: "",
    modality: "" as string,
    indication: "",
    appropriatenessRating: "" as string,
    clinicalScenario: "",
    outcome: "",
    notes: "",
    flagged: false,
  });

  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.accreditation.getAucEntries.useQuery({ limit: 30, offset: 0 });
  const createEntry = trpc.accreditation.createAucEntry.useMutation({
    onSuccess: () => {
      toast.success("AUC entry saved.");
      utils.accreditation.getAucEntries.invalidate();
      setForm({ studyDate: "", modality: "", indication: "", appropriatenessRating: "", clinicalScenario: "", outcome: "", notes: "", flagged: false });
      setExpanded(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.modality || !form.indication) {
      toast.error("Please fill in modality and indication.");
      return;
    }
    createEntry.mutate({
      studyDate: form.studyDate || undefined,
      modality: form.modality as typeof MODALITIES[number],
      indication: form.indication,
      appropriatenessRating: (form.appropriatenessRating as "appropriate" | "may_be_appropriate" | "rarely_appropriate" | "unknown") || undefined,
      clinicalScenario: form.clinicalScenario || undefined,
      outcome: form.outcome || undefined,
      notes: form.notes || undefined,
      flagged: form.flagged,
    });
  };

  // Stats
  const total = entries?.length ?? 0;
  const appropriate = entries?.filter(e => e.appropriatenessRating === "appropriate").length ?? 0;
  const mayBe = entries?.filter(e => e.appropriatenessRating === "may_be_appropriate").length ?? 0;
  const rarely = entries?.filter(e => e.appropriatenessRating === "rarely_appropriate").length ?? 0;
  const flagged = entries?.filter(e => e.flagged).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Appropriate", value: appropriate, color: "#16a34a" },
            { label: "May Be Appropriate", value: mayBe, color: "#d97706" },
            { label: "Rarely Appropriate", value: rarely, color: "#dc2626" },
            { label: "Flagged", value: flagged, color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
              {total > 0 && <div className="text-xs font-semibold" style={{ color: s.color }}>{Math.round(s.value / total * 100)}%</div>}
            </div>
          ))}
        </div>
      )}

      <Card className="border border-[#189aa1]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" style={{ color: BRAND }} />
              New AUC Entry
            </CardTitle>
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modality *</label>
                <Select value={form.modality} onValueChange={(v) => setForm(f => ({ ...f, modality: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Study Date</label>
                <Input type="date" className="h-8 text-xs" value={form.studyDate} onChange={e => setForm(f => ({ ...f, studyDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Clinical Indication *</label>
              <Input className="h-8 text-xs" placeholder="e.g. Evaluation of new murmur" value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Appropriateness Rating</label>
              <Select value={form.appropriatenessRating} onValueChange={(v) => setForm(f => ({ ...f, appropriatenessRating: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="appropriate">Appropriate</SelectItem>
                  <SelectItem value="may_be_appropriate">May Be Appropriate</SelectItem>
                  <SelectItem value="rarely_appropriate">Rarely Appropriate</SelectItem>
                  <SelectItem value="unknown">Unknown / Not Assessed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Clinical Scenario</label>
              <Textarea className="text-xs min-h-[60px]" placeholder="Describe the clinical context..." value={form.clinicalScenario} onChange={e => setForm(f => ({ ...f, clinicalScenario: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Outcome</label>
                <Input className="h-8 text-xs" placeholder="e.g. Findings changed management" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
                <Input className="h-8 text-xs" placeholder="Additional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="flagged" checked={form.flagged} onChange={e => setForm(f => ({ ...f, flagged: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="flagged" className="text-xs text-gray-600">Flag for review (rarely appropriate or questionable indication)</label>
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={createEntry.isPending} className="text-white" style={{ background: BRAND }}>
              {createEntry.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Save Entry
            </Button>
          </CardContent>
        )}
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : (entries && entries.length > 0) ? (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id} className={`border ${e.flagged ? "border-red-200" : "border-gray-100"}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#189aa1" + "15", color: "#189aa1" }}>{e.modality}</span>
                      <AucBadge rating={e.appropriatenessRating} />
                      {e.flagged && <span className="text-xs font-semibold text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Flagged</span>}
                    </div>
                    <p className="text-xs font-medium text-gray-800 mb-0.5">{e.indication}</p>
                    {e.clinicalScenario && <p className="text-xs text-gray-500">{e.clinicalScenario}</p>}
                    {e.outcome && <p className="text-xs text-green-700 mt-0.5"><span className="font-semibold">Outcome:</span> {e.outcome}</p>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{e.studyDate ?? new Date(e.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No AUC entries yet. Add your first entry above.</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccreditationTool() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"qa" | "iqr" | "peer" | "policy" | "auc">("qa");

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: BRAND }} />
          <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-4">Please sign in to access the DIY Accreditation Tool™.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white" style={{ background: BRAND }}>
            Sign In
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}>
        <div className="container py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Award className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Accreditation Tools</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                DIY Accreditation Tool™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Quality reviews, peer review tracking, policy creation, and appropriate use monitoring — everything you need to prepare for IAC accreditation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-[#f0fbfc]">
        <div className="container py-2">
          <div className="flex flex-wrap gap-1">
            <TabBtn active={activeTab === "qa"} onClick={() => setActiveTab("qa")} icon={ClipboardList} label="Quality Review" />
            <TabBtn active={activeTab === "iqr"} onClick={() => setActiveTab("iqr")} icon={ImageIcon} label="Image Quality Review" />
            <TabBtn active={activeTab === "peer"} onClick={() => setActiveTab("peer")} icon={Star} label="Peer Review" />
            <TabBtn active={activeTab === "policy"} onClick={() => setActiveTab("policy")} icon={FileText} label="Policy Builder" />
            <TabBtn active={activeTab === "auc"} onClick={() => setActiveTab("auc")} icon={BarChart2} label="Appropriate Use" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        <div className={activeTab === "iqr" ? "" : "max-w-3xl"}>
          {/* Disclaimer */}
          <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Important:</span> This tool is designed to assist with accreditation preparation. All entries are for internal quality improvement purposes only. Do not enter any patient PHI — use de-identified study identifiers only. For official IAC accreditation requirements, always refer to the current IAC Standards documents.
            </p>
          </div>

          {activeTab === "qa" && <QualityReviewTab />}
          {activeTab === "iqr" && <ImageQualityReviewTab />}
          {activeTab === "peer" && <PeerReviewTab />}
          {activeTab === "policy" && <PolicyBuilderTab />}
          {activeTab === "auc" && <AppropriateUseTab />}
        </div>
      </div>

      {/* Footer reference */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container py-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>References: IAC Standards for Echo Accreditation · ASE Guidelines · ARDMS/CCI Competency Standards</span>
            </div>
            <a href="https://intersocietal.org/programs/echocardiography/standards/" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">IAC Standards →</a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
