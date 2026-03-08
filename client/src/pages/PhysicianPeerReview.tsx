/**
 * Physician Peer Review
 * Rebuilt from the Formsite PhysVariabilityECHO form.
 * Staff dropdowns auto-query Lab Admin physician-role members.
 * Submissions link back to Lab Admin analytics via revieweeLabMemberId / reviewerLabMemberId.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, ChevronDown, ChevronUp, Download, Trash2,
  Stethoscope, User, FileText, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, Send
} from "lucide-react";
import jsPDF from "jspdf";

const BRAND = "#189aa1";

// ─── Exam types ──────────────────────────────────────────────────────────────
const EXAM_TYPES = [
  "Adult TTE",
  "Adult Stress Echo",
  "Pediatric/Congenital",
  "Fetal Echo",
] as const;
type ExamType = typeof EXAM_TYPES[number];

// ─── Finding options ──────────────────────────────────────────────────────────
const NORMAL_ABNORMAL = ["Normal", "Abnormal", "Not Evaluated", "Not Applicable"];
const PRESENT_ABSENT = ["Present", "Absent", "Not Evaluated", "Not Applicable"];
const CHAMBER_SIZE = ["Normal", "Mildly Enlarged", "Moderately Enlarged", "Severely Enlarged", "Mildly Reduced", "Not Evaluated", "Not Applicable"];
const EF_OPTIONS = ["Normal (≥55%)", "Mildly Reduced (45–54%)", "Moderately Reduced (30–44%)", "Severely Reduced (<30%)", "Hyperdynamic (>70%)", "Not Evaluated"];
const VALVE_STENOSIS = ["None", "Mild", "Moderate", "Severe", "Not Evaluated", "Not Applicable"];
const VALVE_REGURG = ["None/Trace", "Mild", "Moderate", "Moderate-Severe", "Severe", "Not Evaluated", "Not Applicable"];
const RWMA_OPTIONS = ["None", "Anterior", "Anterolateral", "Inferolateral", "Inferior", "Inferoseptal", "Anteroseptal", "Apical", "Multiple Territories", "Not Evaluated"];
const RVSP_OPTIONS = ["Normal (<35 mmHg)", "Mildly Elevated (35–50 mmHg)", "Moderately Elevated (50–70 mmHg)", "Severely Elevated (>70 mmHg)", "Not Evaluated", "Not Applicable"];
const PERICARDIAL_EFF = ["None", "Small", "Moderate", "Large", "Circumferential", "Loculated", "Not Evaluated"];
const RESPONSE_TO_STRESS = ["Normal", "Ischemia", "Infarction", "Non-diagnostic", "Not Evaluated"];
const SITUS_OPTIONS = ["Situs Solitus", "Situs Inversus", "Situs Ambiguus", "Not Evaluated"];
const CARDIAC_POSITION = ["Levocardia", "Dextrocardia", "Mesocardia", "Not Evaluated"];
const FETAL_BIOMETRY = ["Appropriate for Gestational Age", "Small for Gestational Age", "Large for Gestational Age", "Not Evaluated"];
const FETAL_POSITION = ["Cephalic", "Breech", "Transverse", "Not Evaluated"];
const FETAL_HR = ["Normal Sinus Rhythm", "Bradycardia", "Tachycardia", "Irregular", "Not Evaluated"];

// ─── Concordance scoring ──────────────────────────────────────────────────────
/**
 * Compute concordance score (0–100) by comparing original vs over-read findings.
 * Fields with "Not Evaluated" / "Not Applicable" are excluded from scoring.
 */
function computeConcordanceScore(
  original: Record<string, string>,
  overRead: Record<string, string>,
  fields: string[]
): { score: number; discordantFields: string[] } {
  const evaluatedFields = fields.filter(f => {
    const o = original[f] ?? "";
    const r = overRead[f] ?? "";
    return o && r && o !== "Not Evaluated" && o !== "Not Applicable" && r !== "Not Evaluated" && r !== "Not Applicable";
  });
  if (evaluatedFields.length === 0) return { score: 100, discordantFields: [] };
  const discordantFields = evaluatedFields.filter(f => original[f] !== overRead[f]);
  const score = Math.round(((evaluatedFields.length - discordantFields.length) / evaluatedFields.length) * 100);
  return { score, discordantFields };
}

// ─── Form state ───────────────────────────────────────────────────────────────
type FindingsState = {
  situs: string; cardiacPosition: string; leftHeart: string; rightHeart: string;
  efPercent: string; lvWallThickness: string; ventricularSeptalDefect: string;
  atrialSeptalDefect: string; patentForamenOvale: string;
  lvChamberSize: string; laChamberSize: string; rvChamberSize: string; raChamberSize: string;
  regionalWallMotionAbnormalities: string;
  aorticValve: string; mitralValve: string; tricuspidValve: string; pulmonicValve: string;
  aorticStenosis: string; aorticInsufficiency: string;
  mitralStenosis: string; mitralRegurgitation: string;
  tricuspidStenosis: string; tricuspidRegurgitation: string;
  pulmonicStenosis: string; pulmonicInsufficiency: string;
  rvspmm: string; pericardialEffusion: string;
  // Pediatric extra
  peripheralPulmonaryStenosis: string; pulmonaryVeins: string; coronaryAnatomy: string;
  aorticArch: string; greatVessels: string; pdaDuctalArch: string; conotruncalAnatomy: string;
  // Stress
  restingEfPercent: string; postStressEfPercent: string;
  restingRwma: string; postStressRwma: string; responseToStress: string;
  stressAorticStenosis: string; stressAorticInsufficiency: string;
  stressMitralStenosis: string; stressMitralRegurgitation: string;
  stressTricuspidStenosis: string; stressTricuspidRegurgitation: string;
  stressPulmonicStenosis: string; stressPulmonicInsufficiency: string;
  stressRvspmm: string;
  // Fetal
  fetalBiometry: string; fetalPosition: string; fetalHeartRateRhythm: string;
};

const BLANK_FINDINGS: FindingsState = {
  situs: "", cardiacPosition: "", leftHeart: "", rightHeart: "",
  efPercent: "", lvWallThickness: "", ventricularSeptalDefect: "",
  atrialSeptalDefect: "", patentForamenOvale: "",
  lvChamberSize: "", laChamberSize: "", rvChamberSize: "", raChamberSize: "",
  regionalWallMotionAbnormalities: "",
  aorticValve: "", mitralValve: "", tricuspidValve: "", pulmonicValve: "",
  aorticStenosis: "", aorticInsufficiency: "",
  mitralStenosis: "", mitralRegurgitation: "",
  tricuspidStenosis: "", tricuspidRegurgitation: "",
  pulmonicStenosis: "", pulmonicInsufficiency: "",
  rvspmm: "", pericardialEffusion: "",
  peripheralPulmonaryStenosis: "", pulmonaryVeins: "", coronaryAnatomy: "",
  aorticArch: "", greatVessels: "", pdaDuctalArch: "", conotruncalAnatomy: "",
  restingEfPercent: "", postStressEfPercent: "",
  restingRwma: "", postStressRwma: "", responseToStress: "",
  stressAorticStenosis: "", stressAorticInsufficiency: "",
  stressMitralStenosis: "", stressMitralRegurgitation: "",
  stressTricuspidStenosis: "", stressTricuspidRegurgitation: "",
  stressPulmonicStenosis: "", stressPulmonicInsufficiency: "",
  stressRvspmm: "",
  fetalBiometry: "", fetalPosition: "", fetalHeartRateRhythm: "",
};

// All scoreable finding fields per exam type
const TTE_FIELDS = [
  "situs","cardiacPosition","leftHeart","rightHeart","efPercent","lvWallThickness",
  "ventricularSeptalDefect","atrialSeptalDefect","patentForamenOvale",
  "lvChamberSize","laChamberSize","rvChamberSize","raChamberSize",
  "regionalWallMotionAbnormalities",
  "aorticValve","mitralValve","tricuspidValve","pulmonicValve",
  "aorticStenosis","aorticInsufficiency","mitralStenosis","mitralRegurgitation",
  "tricuspidStenosis","tricuspidRegurgitation","pulmonicStenosis","pulmonicInsufficiency",
  "rvspmm","pericardialEffusion",
];
const PED_EXTRA_FIELDS = [
  "peripheralPulmonaryStenosis","pulmonaryVeins","coronaryAnatomy",
  "aorticArch","greatVessels","pdaDuctalArch","conotruncalAnatomy",
];
const STRESS_FIELDS = [
  "restingEfPercent","postStressEfPercent","restingRwma","postStressRwma","responseToStress",
  "stressAorticStenosis","stressAorticInsufficiency","stressMitralStenosis","stressMitralRegurgitation",
  "stressTricuspidStenosis","stressTricuspidRegurgitation","stressPulmonicStenosis","stressPulmonicInsufficiency",
  "stressRvspmm",
];
const FETAL_FIELDS = [
  "fetalBiometry","fetalPosition","fetalHeartRateRhythm",
];

function getFieldsForExamType(examType: string): string[] {
  if (examType === "Adult TTE") return TTE_FIELDS;
  if (examType === "Adult Stress Echo") return STRESS_FIELDS;
  if (examType === "Pediatric/Congenital") return [...TTE_FIELDS, ...PED_EXTRA_FIELDS];
  if (examType === "Fetal Echo") return FETAL_FIELDS;
  return TTE_FIELDS;
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportPhysicianPeerReviewPDF(review: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageW = 215.9, margin = 18, contentW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFillColor(14, 74, 80); doc.rect(0, 0, pageW, 14, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("iHeartEcho — Physician Peer Review Report", margin, 9.5);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW - margin, 9.5, { align: "right" });
  y = 22;

  const row = (label: string, value: string | null | undefined) => {
    if (!value) return;
    doc.setTextColor(80, 80, 80); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
    doc.text(String(value), margin + 55, y);
    y += 5.5;
  };

  const section = (title: string) => {
    y += 3;
    doc.setFillColor(240, 251, 252); doc.setDrawColor(24, 154, 161);
    doc.roundedRect(margin, y, contentW, 7, 1, 1, "FD");
    doc.setTextColor(14, 74, 80); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.text(title, margin + 3, y + 4.8);
    y += 10;
  };

  section("Exam Information");
  row("Organization", review.organization);
  row("Facility Account #", review.facilityAccountNumber);
  row("Exam Identifier", review.examIdentifier);
  row("DOB", review.dob);
  row("Exam DOS", review.examDos);
  row("Date Review Completed", review.dateReviewCompleted);
  row("Exam Type", review.examType);

  section("Physicians");
  row("Original Interpreting Physician", review.revieweeName);
  row("Over-Reading Physician Reviewer", review.reviewerName);
  row("Quality Review Assigned By", review.qualityReviewAssignedBy);
  row("Reviewer Email", review.reviewerEmail);

  if (review.examType === "Adult TTE" || review.examType === "Pediatric/Congenital") {
    section("Cardiac Findings");
    row("Situs", review.situs); row("Cardiac Position", review.cardiacPosition);
    row("Left Heart", review.leftHeart); row("Right Heart", review.rightHeart);
    row("EF%", review.efPercent); row("LV Wall Thickness", review.lvWallThickness);
    row("VSD", review.ventricularSeptalDefect); row("ASD", review.atrialSeptalDefect);
    row("PFO", review.patentForamenOvale);
    row("LV Chamber Size", review.lvChamberSize); row("LA Chamber Size", review.laChamberSize);
    row("RV Chamber Size", review.rvChamberSize); row("RA Chamber Size", review.raChamberSize);
    row("RWMA", review.regionalWallMotionAbnormalities);
    row("Aortic Valve", review.aorticValve); row("Mitral Valve", review.mitralValve);
    row("Tricuspid Valve", review.tricuspidValve); row("Pulmonic Valve", review.pulmonicValve);
    row("Aortic Stenosis", review.aorticStenosis); row("Aortic Insufficiency", review.aorticInsufficiency);
    row("Mitral Stenosis", review.mitralStenosis); row("Mitral Regurgitation", review.mitralRegurgitation);
    row("Tricuspid Stenosis", review.tricuspidStenosis); row("Tricuspid Regurgitation", review.tricuspidRegurgitation);
    row("Pulmonic Stenosis", review.pulmonicStenosis); row("Pulmonic Insufficiency", review.pulmonicInsufficiency);
    row("RVSP", review.rvspmm); row("Pericardial Effusion", review.pericardialEffusion);
  }

  if (review.examType === "Pediatric/Congenital") {
    section("Congenital Findings");
    row("Peripheral Pulmonary Stenosis", review.peripheralPulmonaryStenosis);
    row("Pulmonary Veins", review.pulmonaryVeins); row("Coronary Anatomy", review.coronaryAnatomy);
    row("Aortic Arch", review.aorticArch); row("Great Vessels", review.greatVessels);
    row("PDA / Ductal Arch", review.pdaDuctalArch); row("Conotruncal Anatomy", review.conotruncalAnatomy);
  }

  if (review.examType === "Adult Stress Echo") {
    section("Stress Echo Findings");
    row("Post-Stress Doppler Performed", review.postStressDopplerPerformed);
    row("Resting EF%", review.restingEfPercent); row("Post-Stress EF%", review.postStressEfPercent);
    row("Resting RWMA", review.restingRwma); row("Post-Stress RWMA", review.postStressRwma);
    row("Response to Stress", review.responseToStress);
    row("Aortic Stenosis", review.stressAorticStenosis); row("Aortic Insufficiency", review.stressAorticInsufficiency);
    row("Mitral Stenosis", review.stressMitralStenosis); row("Mitral Regurgitation", review.stressMitralRegurgitation);
    row("Tricuspid Stenosis", review.stressTricuspidStenosis); row("Tricuspid Regurgitation", review.stressTricuspidRegurgitation);
    row("Pulmonic Stenosis", review.stressPulmonicStenosis); row("Pulmonic Insufficiency", review.stressPulmonicInsufficiency);
    row("RVSP", review.stressRvspmm);
  }

  if (review.examType === "Fetal Echo") {
    section("Fetal Echo Findings");
    row("Fetal Biometry", review.fetalBiometry);
    row("Fetal Position", review.fetalPosition);
    row("Fetal Heart Rate / Rhythm", review.fetalHeartRateRhythm);
  }

  if (review.otherFindings1 || review.otherFindings2 || review.otherFindings3) {
    section("Other Findings");
    if (review.otherFindings1) row("Finding 1", review.otherFindings1);
    if (review.otherFindings2) row("Finding 2", review.otherFindings2);
    if (review.otherFindings3) row("Finding 3", review.otherFindings3);
  }

  if (review.reviewComments) {
    section("Review Comments");
    const lines = doc.splitTextToSize(review.reviewComments, contentW - 6);
    doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(lines, margin + 3, y);
    y += lines.length * 5;
  }

  if (review.concordanceScore != null) {
    y += 4;
    const color = review.concordanceScore >= 90 ? [22, 163, 74] : review.concordanceScore >= 75 ? [37, 99, 235] : [220, 38, 38];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Concordance Score: ${review.concordanceScore}%`, pageW / 2, y + 7.5, { align: "center" });
    if (review.discordanceFields) {
      try {
        const fields = JSON.parse(review.discordanceFields) as string[];
        if (fields.length > 0) {
          y += 16;
          doc.setTextColor(80, 80, 80); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
          doc.text("Discordant Fields:", margin, y);
          doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
          doc.text(fields.join(", "), margin + 40, y);
        }
      } catch {}
    }
  }

  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`iHeartEcho_PhysicianPeerReview_${dateTag}.pdf`);
}

// ─── StaffComboField ─────────────────────────────────────────────────────────
function StaffComboField({
  label, physicians, value, onSelect, freeText, onFreeText
}: {
  label: string;
  physicians: Array<{ id: number; displayName: string | null; inviteEmail: string | null; credentials: string | null }>;
  value: string;
  onSelect: (id: number | null, name: string) => void;
  freeText: string;
  onFreeText: (v: string) => void;
}) {
  const [showFreeText, setShowFreeText] = useState(false);
  const selectedId = physicians.find(p => (p.displayName ?? p.inviteEmail ?? "") === value)?.id ?? null;

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 block">{label}</label>
      {physicians.length > 0 && (
        <Select
          value={selectedId ? String(selectedId) : "__freetext__"}
          onValueChange={(v) => {
            if (v === "__freetext__") {
              setShowFreeText(true);
              onSelect(null, freeText);
            } else {
              setShowFreeText(false);
              const p = physicians.find(ph => String(ph.id) === v);
              if (p) onSelect(p.id, p.displayName ?? p.inviteEmail ?? "");
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select physician..." />
          </SelectTrigger>
          <SelectContent>
            {physicians.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.displayName ?? p.inviteEmail ?? `Physician #${p.id}`}
                {p.credentials ? ` — ${p.credentials}` : ""}
              </SelectItem>
            ))}
            <SelectItem value="__freetext__">Enter manually...</SelectItem>
          </SelectContent>
        </Select>
      )}
      {(showFreeText || physicians.length === 0) && (
        <Input
          className="h-8 text-xs"
          placeholder={`${label} (free text)`}
          value={freeText}
          onChange={e => { onFreeText(e.target.value); onSelect(null, e.target.value); }}
        />
      )}
    </div>
  );
}

// ─── FindingRow ───────────────────────────────────────────────────────────────
function FindingRow({
  label, options, origValue, overValue, onOrigChange, onOverChange
}: {
  label: string;
  options: string[];
  origValue: string;
  overValue: string;
  onOrigChange: (v: string) => void;
  onOverChange: (v: string) => void;
}) {
  const discordant = origValue && overValue && origValue !== "Not Evaluated" && overValue !== "Not Evaluated" && origValue !== overValue;
  return (
    <div className={`grid grid-cols-3 gap-2 items-center py-1.5 px-2 rounded-lg ${discordant ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
      <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
        {discordant && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
        {label}
      </div>
      <Select value={origValue} onValueChange={onOrigChange}>
        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Original..." /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={overValue} onValueChange={onOverChange}>
        <SelectTrigger className={`h-7 text-xs ${discordant ? "border-red-400" : ""}`}><SelectValue placeholder="Over-read..." /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// ─── Send Feedback Button ─────────────────────────────────────────────────────
function SendFeedbackButton({
  revieweeName,
  reviewerName,
  examType,
  concordanceScore,
  discordantFields,
}: {
  revieweeName: string;
  reviewerName: string;
  examType: string;
  concordanceScore: number | null;
  discordantFields: string[];
}) {
  const notify = trpc.system.notifyOwner.useMutation({
    onSuccess: () => toast.success("Feedback notification sent to lab director."),
    onError: (e) => toast.error(e.message),
  });

  const handleSend = () => {
    const concordanceText = concordanceScore != null
      ? `Concordance Score: ${concordanceScore}%`
      : "Concordance Score: Not calculated";
    const discordantText = discordantFields.length > 0
      ? `Discordant Fields: ${discordantFields.join(", ")}`
      : "No discordant fields identified.";
    notify.mutate({
      title: "Physician Peer Review — Feedback Notification",
      content: [
        `Exam Type: ${examType || "Not specified"}`,
        `Original Interpreting Physician: ${revieweeName || "Not specified"}`,
        `Over-Reading Reviewer: ${reviewerName || "Not specified"}`,
        concordanceText,
        discordantText,
      ].join("\n"),
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSend}
      disabled={notify.isPending}
      className="w-full border-[#189aa1] text-[#189aa1] hover:bg-[#f0fbfc] gap-1.5"
    >
      {notify.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      Send Feedback to Lab Director
    </Button>
  );
}

export default function PhysicianPeerReview() {
  const utils = trpc.useUtils();

  // Staff from Lab Admin
  const { data: staffData } = trpc.physicianPeerReview.getLabStaffForReview.useQuery();
  const physicians = staffData?.physicians ?? [];

  // Existing reviews
  const { data: reviews = [], isLoading } = trpc.physicianPeerReview.list.useQuery({ limit: 50, offset: 0 });

  const createReview = trpc.physicianPeerReview.create.useMutation({
    onSuccess: () => {
      toast.success("Physician Peer Review saved.");
      utils.physicianPeerReview.list.invalidate();
      resetForm();
      setExpanded(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteReview = trpc.physicianPeerReview.delete.useMutation({
    onSuccess: () => { toast.success("Review deleted."); utils.physicianPeerReview.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Form state ──────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState(true);
  const [step, setStep] = useState(0);

  const [header, setHeader] = useState({
    facilityAccountNumber: "", organization: "", dateReviewCompleted: "",
    examIdentifier: "", dob: "", examDos: "", examType: "" as string,
    postStressDopplerPerformed: "",
    qualityReviewAssignedBy: "", reviewerEmail: "",
  });

  // Staff fields
  const [revieweeLabMemberId, setRevieweeLabMemberId] = useState<number | null>(null);
  const [revieweeName, setRevieweeName] = useState("");
  const [revieweeFreeText, setRevieweeFreeText] = useState("");
  const [reviewerLabMemberId, setReviewerLabMemberId] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerFreeText, setReviewerFreeText] = useState("");

  // Original interpreting physician findings
  const [origFindings, setOrigFindings] = useState<FindingsState>({ ...BLANK_FINDINGS });
  // Over-reading physician findings
  const [overFindings, setOverFindings] = useState<FindingsState>({ ...BLANK_FINDINGS });

  const [otherFindings1, setOtherFindings1] = useState("");
  const [otherFindings2, setOtherFindings2] = useState("");
  const [otherFindings3, setOtherFindings3] = useState("");
  const [reviewComments, setReviewComments] = useState("");

  function resetForm() {
    setStep(0);
    setHeader({ facilityAccountNumber: "", organization: "", dateReviewCompleted: "", examIdentifier: "", dob: "", examDos: "", examType: "", postStressDopplerPerformed: "", qualityReviewAssignedBy: "", reviewerEmail: "" });
    setRevieweeLabMemberId(null); setRevieweeName(""); setRevieweeFreeText("");
    setReviewerLabMemberId(null); setReviewerName(""); setReviewerFreeText("");
    setOrigFindings({ ...BLANK_FINDINGS }); setOverFindings({ ...BLANK_FINDINGS });
    setOtherFindings1(""); setOtherFindings2(""); setOtherFindings3(""); setReviewComments("");
  }

  // ── Concordance ─────────────────────────────────────────────────────────────
  const { concordanceScore, discordantFields } = useMemo(() => {
    if (!header.examType) return { concordanceScore: null, discordantFields: [] };
    const fields = getFieldsForExamType(header.examType);
    const { score, discordantFields } = computeConcordanceScore(
      origFindings as unknown as Record<string, string>,
      overFindings as unknown as Record<string, string>,
      fields
    );
    return { concordanceScore: score, discordantFields };
  }, [origFindings, overFindings, header.examType]);

  // ── Steps ───────────────────────────────────────────────────────────────────
  const STEPS = [
    "Exam Info",
    "Physicians",
    header.examType === "Adult Stress Echo" ? "Stress Findings" :
    header.examType === "Fetal Echo" ? "Fetal Findings" :
    "Cardiac Findings",
    ...(header.examType === "Pediatric/Congenital" ? ["Congenital Findings"] : []),
    "Other Findings",
    "Review & Submit",
  ];

  const handleSubmit = () => {
    if (!header.examType) { toast.error("Please select an exam type."); return; }
    if (!revieweeName && !revieweeFreeText) { toast.error("Please enter the Original Interpreting Physician."); return; }
    createReview.mutate({
      ...header,
      revieweeLabMemberId: revieweeLabMemberId ?? undefined,
      revieweeName: revieweeName || revieweeFreeText || undefined,
      reviewerLabMemberId: reviewerLabMemberId ?? undefined,
      reviewerName: reviewerName || reviewerFreeText || undefined,
      // Original findings
      situs: origFindings.situs || undefined,
      cardiacPosition: origFindings.cardiacPosition || undefined,
      leftHeart: origFindings.leftHeart || undefined,
      rightHeart: origFindings.rightHeart || undefined,
      efPercent: origFindings.efPercent || undefined,
      lvWallThickness: origFindings.lvWallThickness || undefined,
      ventricularSeptalDefect: origFindings.ventricularSeptalDefect || undefined,
      atrialSeptalDefect: origFindings.atrialSeptalDefect || undefined,
      patentForamenOvale: origFindings.patentForamenOvale || undefined,
      lvChamberSize: origFindings.lvChamberSize || undefined,
      laChamberSize: origFindings.laChamberSize || undefined,
      rvChamberSize: origFindings.rvChamberSize || undefined,
      raChamberSize: origFindings.raChamberSize || undefined,
      regionalWallMotionAbnormalities: origFindings.regionalWallMotionAbnormalities || undefined,
      aorticValve: origFindings.aorticValve || undefined,
      mitralValve: origFindings.mitralValve || undefined,
      tricuspidValve: origFindings.tricuspidValve || undefined,
      pulmonicValve: origFindings.pulmonicValve || undefined,
      aorticStenosis: origFindings.aorticStenosis || undefined,
      aorticInsufficiency: origFindings.aorticInsufficiency || undefined,
      mitralStenosis: origFindings.mitralStenosis || undefined,
      mitralRegurgitation: origFindings.mitralRegurgitation || undefined,
      tricuspidStenosis: origFindings.tricuspidStenosis || undefined,
      tricuspidRegurgitation: origFindings.tricuspidRegurgitation || undefined,
      pulmonicStenosis: origFindings.pulmonicStenosis || undefined,
      pulmonicInsufficiency: origFindings.pulmonicInsufficiency || undefined,
      rvspmm: origFindings.rvspmm || undefined,
      pericardialEffusion: origFindings.pericardialEffusion || undefined,
      peripheralPulmonaryStenosis: origFindings.peripheralPulmonaryStenosis || undefined,
      pulmonaryVeins: origFindings.pulmonaryVeins || undefined,
      coronaryAnatomy: origFindings.coronaryAnatomy || undefined,
      aorticArch: origFindings.aorticArch || undefined,
      greatVessels: origFindings.greatVessels || undefined,
      pdaDuctalArch: origFindings.pdaDuctalArch || undefined,
      conotruncalAnatomy: origFindings.conotruncalAnatomy || undefined,
      restingEfPercent: origFindings.restingEfPercent || undefined,
      postStressEfPercent: origFindings.postStressEfPercent || undefined,
      restingRwma: origFindings.restingRwma || undefined,
      postStressRwma: origFindings.postStressRwma || undefined,
      responseToStress: origFindings.responseToStress || undefined,
      stressAorticStenosis: origFindings.stressAorticStenosis || undefined,
      stressAorticInsufficiency: origFindings.stressAorticInsufficiency || undefined,
      stressMitralStenosis: origFindings.stressMitralStenosis || undefined,
      stressMitralRegurgitation: origFindings.stressMitralRegurgitation || undefined,
      stressTricuspidStenosis: origFindings.stressTricuspidStenosis || undefined,
      stressTricuspidRegurgitation: origFindings.stressTricuspidRegurgitation || undefined,
      stressPulmonicStenosis: origFindings.stressPulmonicStenosis || undefined,
      stressPulmonicInsufficiency: origFindings.stressPulmonicInsufficiency || undefined,
      stressRvspmm: origFindings.stressRvspmm || undefined,
      fetalBiometry: origFindings.fetalBiometry || undefined,
      fetalPosition: origFindings.fetalPosition || undefined,
      fetalHeartRateRhythm: origFindings.fetalHeartRateRhythm || undefined,
      otherFindings1: otherFindings1 || undefined,
      otherFindings2: otherFindings2 || undefined,
      otherFindings3: otherFindings3 || undefined,
      reviewComments: reviewComments || undefined,
      concordanceScore: concordanceScore ?? undefined,
      discordanceFields: discordantFields.length > 0 ? JSON.stringify(discordantFields) : undefined,
    });
  };

  const isTTE = header.examType === "Adult TTE" || header.examType === "Pediatric/Congenital";
  const isStress = header.examType === "Adult Stress Echo";
  const isFetal = header.examType === "Fetal Echo";
  const isPed = header.examType === "Pediatric/Congenital";

  // ── Concordance badge ────────────────────────────────────────────────────────
  const ConcordanceBadge = ({ score }: { score: number | null }) => {
    if (score === null) return null;
    const color = score >= 90 ? "#16a34a" : score >= 75 ? "#2563eb" : score >= 60 ? "#d97706" : "#dc2626";
    const label = score >= 90 ? "High Concordance" : score >= 75 ? "Good Concordance" : score >= 60 ? "Moderate Concordance" : "Low Concordance";
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: color + "18", color }}>
        <CheckCircle2 className="w-3 h-3" />
        {score}% — {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* New Review Card */}
      <Card className="border border-[#189aa1]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" style={{ color: BRAND }} />
              New Physician Peer Review
              {physicians.length > 0 && (
                <span className="text-xs font-normal text-gray-400">({physicians.length} physician{physicians.length !== 1 ? "s" : ""} in lab)</span>
              )}
            </CardTitle>

          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setStep(i)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                      i === step ? "text-white" : i < step ? "bg-[#189aa1]/15 text-[#189aa1]" : "bg-gray-100 text-gray-400"
                    }`}
                    style={i === step ? { background: BRAND } : {}}
                  >
                    {i + 1}. {s}
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {/* ── Step 0: Exam Info ─────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Type *</label>
                    <Select value={header.examType} onValueChange={v => setHeader(h => ({ ...h, examType: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select exam type" /></SelectTrigger>
                      <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Date Review Completed</label>
                    <Input type="date" className="h-8 text-xs" value={header.dateReviewCompleted} onChange={e => setHeader(h => ({ ...h, dateReviewCompleted: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Facility Account #</label>
                    <Input className="h-8 text-xs" placeholder="e.g. FAC-001" value={header.facilityAccountNumber} onChange={e => setHeader(h => ({ ...h, facilityAccountNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Organization</label>
                    <Input className="h-8 text-xs" placeholder="Lab / Hospital name" value={header.organization} onChange={e => setHeader(h => ({ ...h, organization: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Identifier</label>
                    <Input className="h-8 text-xs" placeholder="Last, First, MRN (de-identified)" value={header.examIdentifier} onChange={e => setHeader(h => ({ ...h, examIdentifier: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">DOB</label>
                    <Input type="date" className="h-8 text-xs" value={header.dob} onChange={e => setHeader(h => ({ ...h, dob: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Date of Service</label>
                    <Input type="date" className="h-8 text-xs" value={header.examDos} onChange={e => setHeader(h => ({ ...h, examDos: e.target.value }))} />
                  </div>
                </div>
                {isStress && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Post-Stress Doppler Performed?</label>
                    <Select value={header.postStressDopplerPerformed} onValueChange={v => setHeader(h => ({ ...h, postStressDopplerPerformed: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Physicians ────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                {physicians.length === 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No physicians found in Lab Admin. Add physician-role members in Lab Admin to enable auto-populated dropdowns. You can still enter names manually below.
                  </div>
                )}
                <StaffComboField
                  label="Original Interpreting Physician *"
                  physicians={physicians}
                  value={revieweeName}
                  onSelect={(id, name) => { setRevieweeLabMemberId(id); setRevieweeName(name); }}
                  freeText={revieweeFreeText}
                  onFreeText={setRevieweeFreeText}
                />
                <StaffComboField
                  label="Over-Reading Physician Reviewer"
                  physicians={physicians}
                  value={reviewerName}
                  onSelect={(id, name) => { setReviewerLabMemberId(id); setReviewerName(name); }}
                  freeText={reviewerFreeText}
                  onFreeText={setReviewerFreeText}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Quality Review Assigned By</label>
                    <Input className="h-8 text-xs" placeholder="Name of assigning reviewer" value={header.qualityReviewAssignedBy} onChange={e => setHeader(h => ({ ...h, qualityReviewAssignedBy: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Reviewer Email</label>
                    <Input type="email" className="h-8 text-xs" placeholder="reviewer@lab.com" value={header.reviewerEmail} onChange={e => setHeader(h => ({ ...h, reviewerEmail: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Cardiac / Stress / Fetal Findings ────────────────── */}
            {step === 2 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 items-center py-1.5 px-2 bg-[#189aa1]/10 rounded-lg">
                  <div className="text-xs font-bold text-[#189aa1]">Finding</div>
                  <div className="text-xs font-bold text-[#189aa1]">Original Physician</div>
                  <div className="text-xs font-bold text-[#189aa1]">Over-Reading Reviewer</div>
                </div>

                {isTTE && (<>
                  <FindingRow label="Situs" options={SITUS_OPTIONS} origValue={origFindings.situs} overValue={overFindings.situs} onOrigChange={v => setOrigFindings(f => ({ ...f, situs: v }))} onOverChange={v => setOverFindings(f => ({ ...f, situs: v }))} />
                  <FindingRow label="Cardiac Position" options={CARDIAC_POSITION} origValue={origFindings.cardiacPosition} overValue={overFindings.cardiacPosition} onOrigChange={v => setOrigFindings(f => ({ ...f, cardiacPosition: v }))} onOverChange={v => setOverFindings(f => ({ ...f, cardiacPosition: v }))} />
                  <FindingRow label="Left Heart" options={NORMAL_ABNORMAL} origValue={origFindings.leftHeart} overValue={overFindings.leftHeart} onOrigChange={v => setOrigFindings(f => ({ ...f, leftHeart: v }))} onOverChange={v => setOverFindings(f => ({ ...f, leftHeart: v }))} />
                  <FindingRow label="Right Heart" options={NORMAL_ABNORMAL} origValue={origFindings.rightHeart} overValue={overFindings.rightHeart} onOrigChange={v => setOrigFindings(f => ({ ...f, rightHeart: v }))} onOverChange={v => setOverFindings(f => ({ ...f, rightHeart: v }))} />
                  <FindingRow label="EF %" options={EF_OPTIONS} origValue={origFindings.efPercent} overValue={overFindings.efPercent} onOrigChange={v => setOrigFindings(f => ({ ...f, efPercent: v }))} onOverChange={v => setOverFindings(f => ({ ...f, efPercent: v }))} />
                  <FindingRow label="LV Wall Thickness" options={NORMAL_ABNORMAL} origValue={origFindings.lvWallThickness} overValue={overFindings.lvWallThickness} onOrigChange={v => setOrigFindings(f => ({ ...f, lvWallThickness: v }))} onOverChange={v => setOverFindings(f => ({ ...f, lvWallThickness: v }))} />
                  <FindingRow label="VSD" options={PRESENT_ABSENT} origValue={origFindings.ventricularSeptalDefect} overValue={overFindings.ventricularSeptalDefect} onOrigChange={v => setOrigFindings(f => ({ ...f, ventricularSeptalDefect: v }))} onOverChange={v => setOverFindings(f => ({ ...f, ventricularSeptalDefect: v }))} />
                  <FindingRow label="ASD" options={PRESENT_ABSENT} origValue={origFindings.atrialSeptalDefect} overValue={overFindings.atrialSeptalDefect} onOrigChange={v => setOrigFindings(f => ({ ...f, atrialSeptalDefect: v }))} onOverChange={v => setOverFindings(f => ({ ...f, atrialSeptalDefect: v }))} />
                  <FindingRow label="PFO" options={PRESENT_ABSENT} origValue={origFindings.patentForamenOvale} overValue={overFindings.patentForamenOvale} onOrigChange={v => setOrigFindings(f => ({ ...f, patentForamenOvale: v }))} onOverChange={v => setOverFindings(f => ({ ...f, patentForamenOvale: v }))} />
                  <FindingRow label="LV Chamber Size" options={CHAMBER_SIZE} origValue={origFindings.lvChamberSize} overValue={overFindings.lvChamberSize} onOrigChange={v => setOrigFindings(f => ({ ...f, lvChamberSize: v }))} onOverChange={v => setOverFindings(f => ({ ...f, lvChamberSize: v }))} />
                  <FindingRow label="LA Chamber Size" options={CHAMBER_SIZE} origValue={origFindings.laChamberSize} overValue={overFindings.laChamberSize} onOrigChange={v => setOrigFindings(f => ({ ...f, laChamberSize: v }))} onOverChange={v => setOverFindings(f => ({ ...f, laChamberSize: v }))} />
                  <FindingRow label="RV Chamber Size" options={CHAMBER_SIZE} origValue={origFindings.rvChamberSize} overValue={overFindings.rvChamberSize} onOrigChange={v => setOrigFindings(f => ({ ...f, rvChamberSize: v }))} onOverChange={v => setOverFindings(f => ({ ...f, rvChamberSize: v }))} />
                  <FindingRow label="RA Chamber Size" options={CHAMBER_SIZE} origValue={origFindings.raChamberSize} overValue={overFindings.raChamberSize} onOrigChange={v => setOrigFindings(f => ({ ...f, raChamberSize: v }))} onOverChange={v => setOverFindings(f => ({ ...f, raChamberSize: v }))} />
                  <FindingRow label="RWMA" options={RWMA_OPTIONS} origValue={origFindings.regionalWallMotionAbnormalities} overValue={overFindings.regionalWallMotionAbnormalities} onOrigChange={v => setOrigFindings(f => ({ ...f, regionalWallMotionAbnormalities: v }))} onOverChange={v => setOverFindings(f => ({ ...f, regionalWallMotionAbnormalities: v }))} />
                  <FindingRow label="Aortic Valve" options={NORMAL_ABNORMAL} origValue={origFindings.aorticValve} overValue={overFindings.aorticValve} onOrigChange={v => setOrigFindings(f => ({ ...f, aorticValve: v }))} onOverChange={v => setOverFindings(f => ({ ...f, aorticValve: v }))} />
                  <FindingRow label="Mitral Valve" options={NORMAL_ABNORMAL} origValue={origFindings.mitralValve} overValue={overFindings.mitralValve} onOrigChange={v => setOrigFindings(f => ({ ...f, mitralValve: v }))} onOverChange={v => setOverFindings(f => ({ ...f, mitralValve: v }))} />
                  <FindingRow label="Tricuspid Valve" options={NORMAL_ABNORMAL} origValue={origFindings.tricuspidValve} overValue={overFindings.tricuspidValve} onOrigChange={v => setOrigFindings(f => ({ ...f, tricuspidValve: v }))} onOverChange={v => setOverFindings(f => ({ ...f, tricuspidValve: v }))} />
                  <FindingRow label="Pulmonic Valve" options={NORMAL_ABNORMAL} origValue={origFindings.pulmonicValve} overValue={overFindings.pulmonicValve} onOrigChange={v => setOrigFindings(f => ({ ...f, pulmonicValve: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pulmonicValve: v }))} />
                  <FindingRow label="Aortic Stenosis" options={VALVE_STENOSIS} origValue={origFindings.aorticStenosis} overValue={overFindings.aorticStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, aorticStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, aorticStenosis: v }))} />
                  <FindingRow label="Aortic Insufficiency" options={VALVE_REGURG} origValue={origFindings.aorticInsufficiency} overValue={overFindings.aorticInsufficiency} onOrigChange={v => setOrigFindings(f => ({ ...f, aorticInsufficiency: v }))} onOverChange={v => setOverFindings(f => ({ ...f, aorticInsufficiency: v }))} />
                  <FindingRow label="Mitral Stenosis" options={VALVE_STENOSIS} origValue={origFindings.mitralStenosis} overValue={overFindings.mitralStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, mitralStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, mitralStenosis: v }))} />
                  <FindingRow label="Mitral Regurgitation" options={VALVE_REGURG} origValue={origFindings.mitralRegurgitation} overValue={overFindings.mitralRegurgitation} onOrigChange={v => setOrigFindings(f => ({ ...f, mitralRegurgitation: v }))} onOverChange={v => setOverFindings(f => ({ ...f, mitralRegurgitation: v }))} />
                  <FindingRow label="Tricuspid Stenosis" options={VALVE_STENOSIS} origValue={origFindings.tricuspidStenosis} overValue={overFindings.tricuspidStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, tricuspidStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, tricuspidStenosis: v }))} />
                  <FindingRow label="Tricuspid Regurgitation" options={VALVE_REGURG} origValue={origFindings.tricuspidRegurgitation} overValue={overFindings.tricuspidRegurgitation} onOrigChange={v => setOrigFindings(f => ({ ...f, tricuspidRegurgitation: v }))} onOverChange={v => setOverFindings(f => ({ ...f, tricuspidRegurgitation: v }))} />
                  <FindingRow label="Pulmonic Stenosis" options={VALVE_STENOSIS} origValue={origFindings.pulmonicStenosis} overValue={overFindings.pulmonicStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, pulmonicStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pulmonicStenosis: v }))} />
                  <FindingRow label="Pulmonic Insufficiency" options={VALVE_REGURG} origValue={origFindings.pulmonicInsufficiency} overValue={overFindings.pulmonicInsufficiency} onOrigChange={v => setOrigFindings(f => ({ ...f, pulmonicInsufficiency: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pulmonicInsufficiency: v }))} />
                  <FindingRow label="RVSP" options={RVSP_OPTIONS} origValue={origFindings.rvspmm} overValue={overFindings.rvspmm} onOrigChange={v => setOrigFindings(f => ({ ...f, rvspmm: v }))} onOverChange={v => setOverFindings(f => ({ ...f, rvspmm: v }))} />
                  <FindingRow label="Pericardial Effusion" options={PERICARDIAL_EFF} origValue={origFindings.pericardialEffusion} overValue={overFindings.pericardialEffusion} onOrigChange={v => setOrigFindings(f => ({ ...f, pericardialEffusion: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pericardialEffusion: v }))} />
                </>)}

                {isStress && (<>
                  <FindingRow label="Resting EF%" options={EF_OPTIONS} origValue={origFindings.restingEfPercent} overValue={overFindings.restingEfPercent} onOrigChange={v => setOrigFindings(f => ({ ...f, restingEfPercent: v }))} onOverChange={v => setOverFindings(f => ({ ...f, restingEfPercent: v }))} />
                  <FindingRow label="Post-Stress EF%" options={EF_OPTIONS} origValue={origFindings.postStressEfPercent} overValue={overFindings.postStressEfPercent} onOrigChange={v => setOrigFindings(f => ({ ...f, postStressEfPercent: v }))} onOverChange={v => setOverFindings(f => ({ ...f, postStressEfPercent: v }))} />
                  <FindingRow label="Resting RWMA" options={RWMA_OPTIONS} origValue={origFindings.restingRwma} overValue={overFindings.restingRwma} onOrigChange={v => setOrigFindings(f => ({ ...f, restingRwma: v }))} onOverChange={v => setOverFindings(f => ({ ...f, restingRwma: v }))} />
                  <FindingRow label="Post-Stress RWMA" options={RWMA_OPTIONS} origValue={origFindings.postStressRwma} overValue={overFindings.postStressRwma} onOrigChange={v => setOrigFindings(f => ({ ...f, postStressRwma: v }))} onOverChange={v => setOverFindings(f => ({ ...f, postStressRwma: v }))} />
                  <FindingRow label="Response to Stress" options={RESPONSE_TO_STRESS} origValue={origFindings.responseToStress} overValue={overFindings.responseToStress} onOrigChange={v => setOrigFindings(f => ({ ...f, responseToStress: v }))} onOverChange={v => setOverFindings(f => ({ ...f, responseToStress: v }))} />
                  <FindingRow label="Aortic Stenosis" options={VALVE_STENOSIS} origValue={origFindings.stressAorticStenosis} overValue={overFindings.stressAorticStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, stressAorticStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressAorticStenosis: v }))} />
                  <FindingRow label="Aortic Insufficiency" options={VALVE_REGURG} origValue={origFindings.stressAorticInsufficiency} overValue={overFindings.stressAorticInsufficiency} onOrigChange={v => setOrigFindings(f => ({ ...f, stressAorticInsufficiency: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressAorticInsufficiency: v }))} />
                  <FindingRow label="Mitral Stenosis" options={VALVE_STENOSIS} origValue={origFindings.stressMitralStenosis} overValue={overFindings.stressMitralStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, stressMitralStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressMitralStenosis: v }))} />
                  <FindingRow label="Mitral Regurgitation" options={VALVE_REGURG} origValue={origFindings.stressMitralRegurgitation} overValue={overFindings.stressMitralRegurgitation} onOrigChange={v => setOrigFindings(f => ({ ...f, stressMitralRegurgitation: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressMitralRegurgitation: v }))} />
                  <FindingRow label="Tricuspid Stenosis" options={VALVE_STENOSIS} origValue={origFindings.stressTricuspidStenosis} overValue={overFindings.stressTricuspidStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, stressTricuspidStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressTricuspidStenosis: v }))} />
                  <FindingRow label="Tricuspid Regurgitation" options={VALVE_REGURG} origValue={origFindings.stressTricuspidRegurgitation} overValue={overFindings.stressTricuspidRegurgitation} onOrigChange={v => setOrigFindings(f => ({ ...f, stressTricuspidRegurgitation: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressTricuspidRegurgitation: v }))} />
                  <FindingRow label="Pulmonic Stenosis" options={VALVE_STENOSIS} origValue={origFindings.stressPulmonicStenosis} overValue={overFindings.stressPulmonicStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, stressPulmonicStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressPulmonicStenosis: v }))} />
                  <FindingRow label="Pulmonic Insufficiency" options={VALVE_REGURG} origValue={origFindings.stressPulmonicInsufficiency} overValue={overFindings.stressPulmonicInsufficiency} onOrigChange={v => setOrigFindings(f => ({ ...f, stressPulmonicInsufficiency: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressPulmonicInsufficiency: v }))} />
                  <FindingRow label="RVSP" options={RVSP_OPTIONS} origValue={origFindings.stressRvspmm} overValue={overFindings.stressRvspmm} onOrigChange={v => setOrigFindings(f => ({ ...f, stressRvspmm: v }))} onOverChange={v => setOverFindings(f => ({ ...f, stressRvspmm: v }))} />
                </>)}

                {isFetal && (<>
                  <FindingRow label="Fetal Biometry" options={FETAL_BIOMETRY} origValue={origFindings.fetalBiometry} overValue={overFindings.fetalBiometry} onOrigChange={v => setOrigFindings(f => ({ ...f, fetalBiometry: v }))} onOverChange={v => setOverFindings(f => ({ ...f, fetalBiometry: v }))} />
                  <FindingRow label="Fetal Position" options={FETAL_POSITION} origValue={origFindings.fetalPosition} overValue={overFindings.fetalPosition} onOrigChange={v => setOrigFindings(f => ({ ...f, fetalPosition: v }))} onOverChange={v => setOverFindings(f => ({ ...f, fetalPosition: v }))} />
                  <FindingRow label="Fetal HR / Rhythm" options={FETAL_HR} origValue={origFindings.fetalHeartRateRhythm} overValue={overFindings.fetalHeartRateRhythm} onOrigChange={v => setOrigFindings(f => ({ ...f, fetalHeartRateRhythm: v }))} onOverChange={v => setOverFindings(f => ({ ...f, fetalHeartRateRhythm: v }))} />
                </>)}

                {/* Live concordance preview */}
                {concordanceScore !== null && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-500">Live Concordance:</span>
                    <ConcordanceBadge score={concordanceScore} />
                    {discordantFields.length > 0 && (
                      <span className="text-xs text-red-500">{discordantFields.length} discordant field{discordantFields.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Congenital Findings (Ped only) ────────────────────── */}
            {step === 3 && isPed && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 items-center py-1.5 px-2 bg-[#189aa1]/10 rounded-lg">
                  <div className="text-xs font-bold text-[#189aa1]">Finding</div>
                  <div className="text-xs font-bold text-[#189aa1]">Original Physician</div>
                  <div className="text-xs font-bold text-[#189aa1]">Over-Reading Reviewer</div>
                </div>
                <FindingRow label="Peripheral Pulmonary Stenosis" options={PRESENT_ABSENT} origValue={origFindings.peripheralPulmonaryStenosis} overValue={overFindings.peripheralPulmonaryStenosis} onOrigChange={v => setOrigFindings(f => ({ ...f, peripheralPulmonaryStenosis: v }))} onOverChange={v => setOverFindings(f => ({ ...f, peripheralPulmonaryStenosis: v }))} />
                <FindingRow label="Pulmonary Veins" options={NORMAL_ABNORMAL} origValue={origFindings.pulmonaryVeins} overValue={overFindings.pulmonaryVeins} onOrigChange={v => setOrigFindings(f => ({ ...f, pulmonaryVeins: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pulmonaryVeins: v }))} />
                <FindingRow label="Coronary Anatomy" options={NORMAL_ABNORMAL} origValue={origFindings.coronaryAnatomy} overValue={overFindings.coronaryAnatomy} onOrigChange={v => setOrigFindings(f => ({ ...f, coronaryAnatomy: v }))} onOverChange={v => setOverFindings(f => ({ ...f, coronaryAnatomy: v }))} />
                <FindingRow label="Aortic Arch" options={NORMAL_ABNORMAL} origValue={origFindings.aorticArch} overValue={overFindings.aorticArch} onOrigChange={v => setOrigFindings(f => ({ ...f, aorticArch: v }))} onOverChange={v => setOverFindings(f => ({ ...f, aorticArch: v }))} />
                <FindingRow label="Great Vessels" options={NORMAL_ABNORMAL} origValue={origFindings.greatVessels} overValue={overFindings.greatVessels} onOrigChange={v => setOrigFindings(f => ({ ...f, greatVessels: v }))} onOverChange={v => setOverFindings(f => ({ ...f, greatVessels: v }))} />
                <FindingRow label="PDA / Ductal Arch" options={PRESENT_ABSENT} origValue={origFindings.pdaDuctalArch} overValue={overFindings.pdaDuctalArch} onOrigChange={v => setOrigFindings(f => ({ ...f, pdaDuctalArch: v }))} onOverChange={v => setOverFindings(f => ({ ...f, pdaDuctalArch: v }))} />
                <FindingRow label="Conotruncal Anatomy" options={NORMAL_ABNORMAL} origValue={origFindings.conotruncalAnatomy} overValue={overFindings.conotruncalAnatomy} onOrigChange={v => setOrigFindings(f => ({ ...f, conotruncalAnatomy: v }))} onOverChange={v => setOverFindings(f => ({ ...f, conotruncalAnatomy: v }))} />
              </div>
            )}

            {/* ── Other Findings step ───────────────────────────────────────── */}
            {((step === 3 && !isPed) || (step === 4 && isPed)) && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Enter any additional findings not captured above (free text, not tracked for concordance scoring).</p>
                {[
                  { label: "Other Finding 1", value: otherFindings1, set: setOtherFindings1 },
                  { label: "Other Finding 2", value: otherFindings2, set: setOtherFindings2 },
                  { label: "Other Finding 3", value: otherFindings3, set: setOtherFindings3 },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                    <Textarea className="text-xs min-h-[56px]" placeholder={`${label}...`} value={value} onChange={e => set(e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Review Comments</label>
                  <Textarea className="text-xs min-h-[72px]" placeholder="Overall comments, clinical context, recommendations..." value={reviewComments} onChange={e => setReviewComments(e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Review & Submit step ──────────────────────────────────────── */}
            {((step === 4 && !isPed) || (step === 5 && isPed)) && (
              <div className="space-y-3">
                <div className="rounded-lg border border-[#189aa1]/20 bg-[#f0fbfc] p-4 space-y-2">
                  <div className="text-xs font-bold text-[#189aa1] mb-2">Review Summary</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-gray-500">Exam Type:</span><span className="font-medium">{header.examType || "—"}</span>
                    <span className="text-gray-500">Exam DOS:</span><span className="font-medium">{header.examDos || "—"}</span>
                    <span className="text-gray-500">Original Physician:</span><span className="font-medium">{revieweeName || revieweeFreeText || "—"}</span>
                    <span className="text-gray-500">Over-Reading Reviewer:</span><span className="font-medium">{reviewerName || reviewerFreeText || "—"}</span>
                  </div>
                  {concordanceScore !== null && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Concordance Score:</span>
                      <ConcordanceBadge score={concordanceScore} />
                    </div>
                  )}
                  {discordantFields.length > 0 && (
                    <div className="pt-1">
                      <span className="text-xs font-semibold text-red-600">Discordant Fields: </span>
                      <span className="text-xs text-red-500">{discordantFields.join(", ")}</span>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createReview.isPending}
                  className="text-white w-full"
                  style={{ background: BRAND }}
                >
                  {createReview.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                  Save Physician Peer Review
                </Button>
                <SendFeedbackButton
                  revieweeName={revieweeName || revieweeFreeText}
                  reviewerName={reviewerName || reviewerFreeText}
                  examType={header.examType}
                  concordanceScore={concordanceScore}
                  discordantFields={discordantFields}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-1">
              <Button size="sm" variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="h-7 text-xs gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </Button>
              {step < STEPS.length - 1 && (
                <Button size="sm" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} className="h-7 text-xs gap-1 text-white" style={{ background: BRAND }}>
                  Next <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Review History ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : reviews.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 py-1.5">
            <span className="text-xs text-gray-500 font-medium">{reviews.length} review{reviews.length !== 1 ? "s" : ""} on file</span>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs gap-1.5 border-[#189aa1] text-[#189aa1] hover:bg-[#f0fbfc]"
              onClick={() => { reviews.forEach(r => exportPhysicianPeerReviewPDF(r)); toast.success("All PDFs downloaded."); }}
            >
              <Download className="w-3.5 h-3.5" /> Export All as PDF
            </Button>
          </div>
          {reviews.map(r => {
            const concordance = r.concordanceScore;
            const concordColor = concordance == null ? "#6b7280" : concordance >= 90 ? "#16a34a" : concordance >= 75 ? "#2563eb" : concordance >= 60 ? "#d97706" : "#dc2626";
            return (
              <Card key={r.id} className="border border-gray-100">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: BRAND + "15", color: BRAND }}>{r.examType ?? "Unknown"}</span>
                        {r.revieweeName && <span className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" />{r.revieweeName}</span>}
                        {concordance != null && (
                          <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: concordColor + "18", color: concordColor }}>
                            {concordance}% concordance
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {r.reviewerName && <span>Reviewer: <span className="font-medium">{r.reviewerName}</span></span>}
                        {r.examDos && <span>DOS: <span className="font-medium">{r.examDos}</span></span>}
                        {r.examIdentifier && <span>ID: <span className="font-medium">{r.examIdentifier}</span></span>}
                      </div>
                      {r.reviewComments && <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">"{r.reviewComments}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</div>
                      <div className="flex gap-1">
                        <button
                          title="Export PDF"
                          className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-[#189aa1]/40 text-[#189aa1] hover:bg-[#f0fbfc] transition-colors"
                          onClick={() => { exportPhysicianPeerReviewPDF(r); toast.success("PDF downloaded."); }}
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                        <button
                          title="Delete"
                          className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                          onClick={() => { if (confirm("Delete this review?")) deleteReview.mutate({ id: r.id }); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No physician peer reviews yet. Add your first review above.</div>
      )}
    </div>
  );
}
