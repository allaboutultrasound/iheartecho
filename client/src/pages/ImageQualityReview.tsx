/*
  iHeartEcho — Image Quality Review Form
  Replicates the All About Ultrasound / IAC Image Quality Review form
  10-step wizard with PDF export and review history
*/
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  ChevronLeft, ChevronRight, FileText, Download, CheckCircle2,
  ClipboardList, Eye, Stethoscope, Activity, BarChart2, Save, Trash2,
  Plus, ArrowLeft
} from "lucide-react";

// ─── Brand colors ─────────────────────────────────────────────────────────────
const TEAL = "#189aa1";
const AQUA = "#4ad9e0";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = Record<string, string | number | string[]>;

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Header", shortLabel: "Header", icon: FileText, pct: 10 },
  { id: 2, label: "Exam Info", shortLabel: "Exam", icon: ClipboardList, pct: 20 },
  { id: 3, label: "Protocol Sequence", shortLabel: "Protocol", icon: Eye, pct: 30 },
  { id: 4, label: "Basic Exam Quality", shortLabel: "Quality", icon: Stethoscope, pct: 40 },
  { id: 5, label: "Overall Image Quality", shortLabel: "Image", icon: Eye, pct: 50 },
  { id: 6, label: "Measurements", shortLabel: "Measure", icon: BarChart2, pct: 60 },
  { id: 7, label: "Doppler Quality", shortLabel: "Doppler", icon: Activity, pct: 70 },
  { id: 8, label: "Cardiac Evaluation", shortLabel: "Cardiac", icon: Stethoscope, pct: 80 },
  { id: 9, label: "Additional Components", shortLabel: "Additional", icon: Plus, pct: 90 },
  { id: 10, label: "Review Summary", shortLabel: "Summary", icon: CheckCircle2, pct: 100 },
];

// ─── Reusable field components ────────────────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function RadioGroup({ name, options, value, onChange }: {
  name: string; options: { label: string; value: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio" name={name} value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-[#189aa1] w-4 h-4"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function SelectField({ name, options, value, onChange, placeholder }: {
  name: string; options: string[]; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <select
      name={name} value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TextInput({ name, value, onChange, placeholder, type = "text" }: {
  name: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} name={name} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40"
    />
  );
}

function TextArea({ name, value, onChange, placeholder, rows = 3 }: {
  name: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      name={name} value={value} rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 resize-none"
    />
  );
}

function CheckboxGroup({ name, options, values, onChange }: {
  name: string; options: string[]; values: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter(v => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {options.map(opt => (
        <label key={opt} className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox" checked={values.includes(opt)}
            onChange={() => toggle(opt)}
            className="accent-[#189aa1] w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#189aa1]/20 p-5 mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: TEAL }}>{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <FieldLabel label={label} required={required} />
      {children}
    </div>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generateIqrPdf(data: FormData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const margin = 15; const lineH = 6;
  let y = 20;

  const addText = (text: string, x: number, size = 10, bold = false, color = "#222") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const [r, g, b] = color === TEAL ? [24, 154, 161] : [34, 34, 34];
    doc.setTextColor(r, g, b);
    doc.text(text, x, y);
  };

  const newPage = () => { doc.addPage(); y = 20; };
  const checkPage = (needed = 12) => { if (y + needed > 280) newPage(); };

  // Header
  doc.setFillColor(14, 30, 46);
  doc.rect(0, 0, W, 28, "F");
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("iHeartEcho™ — Image Quality Review", margin, 12);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(74, 217, 224);
  doc.text(`${data.reviewType || "QUALITY REVIEW"} | ${data.organization || ""} | ${data.dateReviewCompleted || ""}`, margin, 20);
  y = 36;

  const addSection = (title: string) => {
    checkPage(14);
    doc.setFillColor(240, 251, 252);
    doc.rect(margin, y - 4, W - margin * 2, 8, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(24, 154, 161);
    doc.text(title.toUpperCase(), margin + 2, y + 1);
    y += 8;
  };

  const addField = (label: string, value: string | string[] | number | undefined) => {
    checkPage(8);
    const val = Array.isArray(value) ? value.join(", ") : (value ?? "—");
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(34, 34, 34);
    const lines = doc.splitTextToSize(String(val), W - margin * 2 - 60);
    doc.text(lines, margin + 62, y);
    y += Math.max(lineH, lines.length * lineH);
  };

  // Exam Info
  addSection("Exam Information");
  addField("Exam Date", data.examDos as string);
  addField("Exam Identifier", data.examIdentifier as string);
  addField("Patient DOB", data.patientDob as string);
  addField("Facility Location", data.facilityLocation as string);
  addField("Performing Sonographer", data.performingSonographer as string);
  addField("Interpreting Physician", data.interpretingPhysician as string);
  addField("Referring Physician", data.referringPhysician as string);
  addField("Exam Type", data.examType as string);
  addField("Exam Scope", data.examScope as string);
  addField("Exam Indication", data.examIndication as string);
  addField("Indication Appropriateness", data.indicationAppropriateness as string);
  addField("Demographics Accurate", data.demographicsAccurate as string);
  y += 4;

  // Protocol
  addSection("Protocol Sequence");
  const views = data.protocolViews ? JSON.parse(data.protocolViews as string) as string[] : [];
  addField("Views Obtained", views);
  if (data.protocolViewsOther) addField("Other Views", data.protocolViewsOther as string);
  y += 4;

  // Basic Quality
  addSection("Basic Exam Quality");
  addField("2D Gain Settings", data.gainSettings as string);
  addField("Depth Settings", data.depthSettings as string);
  addField("Focal Zone Settings", data.focalZoneSettings as string);
  addField("Colorize Settings", data.colorizeSettings as string);
  addField("Zoom Settings", data.zoomSettings as string);
  addField("ECG Display", data.ecgDisplay as string);
  y += 4;

  // Overall Image Quality
  addSection("Overall Image Quality");
  addField("Contrast/UAE Use", data.contrastUseAppropriate as string);
  addField("On-Axis Imaging", data.onAxisImaging as string);
  addField("Effort for Suboptimal Views", data.effortSuboptimalViews as string);
  y += 4;

  // Measurements
  addSection("Measurements / Accuracy");
  addField("2D Measurements Complete", data.measurements2dComplete as string);
  addField("2D Measurements Accurate", data.measurements2dAccurate as string);
  addField("PSAX LV Complete", data.psaxLvComplete as string);
  addField("Ventricular Function Accurate", data.ventricularFunctionAccurate as string);
  addField("EF Measurements Accurate", data.efMeasurementsAccurate as string);
  addField("Simpson's EF Accurate", data.simpsonsEfAccurate as string);
  addField("LA Volume Accurate", data.laVolumeAccurate as string);
  addField("Doppler Measurements Complete", data.dopplerMeasurementsComplete as string);
  addField("Doppler Measurements Accurate", data.dopplerMeasurementsAccurate as string);
  y += 4;

  // Doppler
  addSection("Doppler Quality");
  addField("Doppler Waveform Settings", data.dopplerWaveformSettings as string);
  addField("Forward Flow Spectrum", data.forwardFlowSpectrum as string);
  addField("PW Doppler Placement", data.pwDopplerPlacement as string);
  addField("CW Doppler Placement", data.cwDopplerPlacement as string);
  addField("Spectral Envelope Peaks", data.spectralEnvelopePeaks as string);
  addField("Color Flow Interrogation", data.colorFlowInterrogation as string);
  addField("Color Doppler IAS/IVS", data.colorDopplerIasIvs as string);
  const diastEval = data.diastolicFunctionEval ? JSON.parse(data.diastolicFunctionEval as string) as string[] : [];
  addField("Diastolic Function Eval", diastEval);
  addField("Pulmonary Vein Inflow", data.pulmonaryVeinInflow as string);
  const rhEval = data.rightHeartFunctionEval ? JSON.parse(data.rightHeartFunctionEval as string) as string[] : [];
  addField("Right Heart Function Eval", rhEval);
  addField("TAPSE Accurate", data.tapseAccurate as string);
  addField("Tissue Doppler Adequate", data.tissueDopplerAdequate as string);
  y += 4;

  // Cardiac Evaluation
  addSection("Cardiac Evaluation");
  addField("Aortic Valve Doppler", data.aorticValveDoppler as string);
  addField("LVOT Doppler Placement", data.lvotDopplerPlacement as string);
  addField("Pedoff CW Utilized", data.pedoffCwUtilized as string);
  addField("Mitral Valve Doppler", data.mitralValveDoppler as string);
  addField("MR Evaluation Methods", data.mrEvaluationMethods as string);
  addField("Tricuspid Valve Doppler", data.tricuspidValveDoppler as string);
  addField("Pulmonic Valve Doppler", data.pulmonicValveDoppler as string);
  y += 4;

  // Additional
  addSection("Additional Exam Components");
  addField("Strain Imaging Performed", data.strainPerformed as string);
  if (data.strainPerformed === "Yes") addField("Strain Performed Correctly", data.strainCorrect as string);
  addField("3D Imaging Performed", data.threeDPerformed as string);
  y += 4;

  // Summary
  addSection("Review Summary");
  addField("Image Optimization", data.imageOptimizationSummary as string);
  addField("Measurement Accuracy", data.measurementAccuracySummary as string);
  addField("Doppler Settings", data.dopplerSettingsSummary as string);
  addField("Protocol Sequence Followed", data.protocolSequenceFollowed as string);
  addField("Pathology Documented", data.pathologyDocumented as string);
  addField("Clinical Question Answered", data.clinicalQuestionAnswered as string);
  addField("Report Concordant", data.reportConcordant as string);
  addField("Comparable to Previous", data.comparableToPreview as string);
  addField("IAC Acceptable", data.iacAcceptable as string);
  addField("Scan Start Time", data.scanStartTime as string);
  addField("Scan End Time", data.scanEndTime as string);
  addField("Imaging Time (min)", String(data.imagingTimeMinutes ?? ""));
  addField("Scanning Time Type", data.scanningTimeType as string);
  y += 4;

  // Quality Score box
  checkPage(24);
  const qs = Number(data.qualityScore ?? 0);
  const tier = qs >= 90 ? "Excellent" : qs >= 75 ? "Good" : qs >= 60 ? "Adequate" : "Needs Improvement";
  const tierColor: [number, number, number] = qs >= 90 ? [22, 163, 74] : qs >= 75 ? [24, 154, 161] : qs >= 60 ? [234, 179, 8] : [220, 38, 38];
  doc.setFillColor(...tierColor);
  doc.roundedRect(margin, y, 80, 18, 3, 3, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(`Quality Score: ${qs}/110`, margin + 6, y + 7);
  doc.setFontSize(9);
  doc.text(`Tier: ${tier}`, margin + 6, y + 13);
  y += 24;

  // Comments
  if (data.reviewComments) {
    addSection("Review Comments");
    checkPage(20);
    const lines = doc.splitTextToSize(data.reviewComments as string, W - margin * 2);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(34, 34, 34);
    doc.text(lines, margin, y);
    y += lines.length * lineH + 4;
  }

  // Reviewer
  addSection("Reviewer Information");
  addField("Reviewer", data.reviewer as string);
  addField("Reviewer Email", data.reviewerEmail as string);
  addField("Notify Admin", data.notifyAdmin as string);
  addField("Notify Sonographer", data.notifySonographer as string);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`iHeartEcho™ Image Quality Review — Page ${i} of ${pageCount} — Generated ${new Date().toLocaleDateString()}`, margin, 292);
  }

  doc.save(`IQR_${data.performingSonographer || "review"}_${data.examDos || new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Protocol views list ──────────────────────────────────────────────────────
const PROTOCOL_VIEWS = [
  "Parasternal long axis view",
  "Parasternal long axis m-mode",
  "Parasternal short axis views (at all levels AV, basal, mid & apical)",
  "Right ventricular inflow view (from anteriorly directed PLAX view)",
  "Right ventricular outflow view (from both PLAX and PSAX with correct measurements)",
  "Apical four-chamber view",
  "Apical five-chamber view",
  "Apical two-chamber view",
  "Apical long-axis/three-chamber view",
  "Subcostal four-chamber view",
  "Subcostal short axis view (when indicated)",
  "Subcostal IVC/hepatic vein view",
  "Subcostal Abdominal Aorta view",
  "Suprasternal notch view (with Color & CW Doppler)",
  "Right Parasternal view (when indicated)",
];

const DIASTOLIC_EVAL_OPTIONS = [
  "Not Fully Evaluated",
  "Mitral Inflow PW Performed",
  "Mitral Annulus TDI Performed (BOTH Lateral & Medial)",
  "Pulmonary Vein Inflow Performed",
  "Mitral Inflow PW with Valsalva Performed (if indicated)",
  "N/A - Limited Exam",
];

const RIGHT_HEART_EVAL_OPTIONS = [
  "Not Fully Evaluated",
  "Appropriate RV Focused View",
  "Tricuspid Inflow Performed",
  "Tricuspid Annulus TDI Performed",
  "TAPSE Performed",
  "RV1 and RV2 Diameter Measurements",
  "RA Volume Measurements",
  "N/A - Limited Exam",
];

const ADDITIONAL_IMAGING_OPTIONS = [
  "None Performed",
  "2D Strain",
  "3D Imaging",
  "3D EF",
  "Other",
];

const IAC_OPTIONS = [
  "Not IAC Acceptable - No pathology to submit",
  "Not IAC Acceptable - Case images not IAC acceptable",
  "Not IAC Acceptable - Reporting Issues (not sonographer related)",
  "Accreditation Acceptable - ADULT: AS",
  "Accreditation Acceptable - ADULT: LVDF/RWMA",
  "Accreditation Acceptable - PED: Simple Obstruction",
  "Accreditation Acceptable - PED: Shunt",
  "Accreditation Acceptable - PED: Complex Defect",
  "Accreditation Acceptable - FETAL: Arrhythmia",
  "Accreditation Acceptable - FETAL: Complex Defect",
  "Accreditation Acceptable - FETAL: Simple Obstruction",
  "Accreditation Acceptable - STRESS: Wall Motion at Rest",
  "Accreditation Acceptable - STRESS: Ischemia during Stress",
  "Accreditation Acceptable - STRESS: with Contrast",
  "Accreditation Acceptable - TEE: More than Mild MR",
  "Accreditation Acceptable - TEE: Source of emboli",
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function ImageQualityReview() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"form" | "history">("form");
  const [form, setForm] = useState<FormData>({
    reviewType: "QUALITY REVIEW",
    organization: "",
    dateReviewCompleted: new Date().toISOString().slice(0, 10),
    examDos: "",
    examIdentifier: "",
    patientDob: "",
    facilityLocation: "",
    performingSonographer: "",
    interpretingPhysician: "",
    referringPhysician: "",
    examType: "",
    examScope: "",
    stressType: "",
    examIndication: "",
    indicationAppropriateness: "",
    demographicsAccurate: "",
    protocolViews: "[]",
    protocolViewsOther: "",
    gainSettings: "",
    gainSettingsOther: "",
    depthSettings: "",
    depthSettingsOther: "",
    focalZoneSettings: "",
    focalZoneDeficiencies: "",
    colorizeSettings: "",
    colorizeSettingsOther: "",
    zoomSettings: "",
    zoomSettingsOther: "",
    ecgDisplay: "",
    ecgDisplayDeficiencies: "",
    contrastUseAppropriate: "",
    contrastSettingsAppropriate: "",
    onAxisImaging: "",
    effortSuboptimalViews: "",
    measurements2dComplete: "",
    measurements2dAccurate: "",
    psaxLvComplete: "",
    ventricularFunctionAccurate: "",
    efMeasurementsAccurate: "",
    simpsonsEfAccurate: "",
    laVolumeAccurate: "",
    dopplerMeasurementsComplete: "",
    dopplerMeasurementsAccurate: "",
    dopplerVentricularFunction: "",
    dopplerWaveformSettings: "",
    dopplerMeasurementAccuracy: "",
    forwardFlowSpectrum: "",
    pwDopplerPlacement: "",
    cwDopplerPlacement: "",
    spectralEnvelopePeaks: "",
    colorFlowInterrogation: "",
    colorDopplerIasIvs: "",
    diastolicFunctionEval: "[]",
    pulmonaryVeinInflow: "",
    rightHeartFunctionEval: "[]",
    tapseAccurate: "",
    tissueDopplerAdequate: "",
    dopplerWaveformSettingsPeer: "",
    dopplerSampleVolumesPeer: "",
    aorticValveDoppler: "",
    lvotDopplerPlacement: "",
    pedoffCwUtilized: "",
    pedoffCwEnvelope: "",
    pedoffCwLabelled: "",
    mitralValveDoppler: "",
    mrEvaluationMethods: "",
    pisaEroMeasurements: "",
    tricuspidValveDoppler: "",
    pulmonicValveDoppler: "",
    aorticValvePeer: "",
    mitralValvePeer: "",
    tricuspidValvePeer: "",
    pulmonicValvePeer: "",
    diastologyPeer: "",
    rightHeartPeer: "",
    additionalImagingMethods: "[]",
    strainPerformed: "",
    strainCorrect: "",
    threeDPerformed: "",
    imageOptimizationSummary: "",
    measurementAccuracySummary: "",
    dopplerSettingsSummary: "",
    protocolSequenceFollowed: "",
    pathologyDocumented: "",
    clinicalQuestionAnswered: "",
    reportConcordant: "",
    comparableToPreview: "",
    iacAcceptable: "",
    scanStartTime: "",
    scanEndTime: "",
    imagingTimeMinutes: 0,
    scanningTimeType: "",
    qualityScore: 0,
    reviewComments: "",
    reviewer: "",
    reviewerEmail: "",
    notifyAdmin: "",
    notifySonographer: "",
  });

  const set = (key: string) => (val: string | string[] | number) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };
  const setStr = (key: string) => (val: string) => set(key)(val);
  const setArr = (key: string) => (vals: string[]) => set(key)(JSON.stringify(vals));
  const getArr = (key: string): string[] => {
    try { return JSON.parse(form[key] as string ?? "[]") as string[]; } catch { return []; }
  };

  const createMutation = trpc.iqr.create.useMutation({
    onSuccess: () => {
      toast.success("Review saved successfully!");
      setView("history");
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

  const { data: reviews, refetch } = trpc.iqr.list.useQuery({ limit: 50, offset: 0 }, { enabled: view === "history" });
  const deleteMutation = trpc.iqr.delete.useMutation({ onSuccess: () => { toast.success("Review deleted."); refetch(); } });

  const handleSubmit = () => {
    const payload: Record<string, string | number | undefined> = {};
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === "number") payload[k] = v;
      else payload[k] = v as string;
    }
    createMutation.mutate({ ...payload, reviewType: form.reviewType as string });
  };

  const progressPct = STEPS[step - 1]?.pct ?? 0;

  // ─── Step renderers ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <SectionCard title="Review Header">
      <FieldRow label="Review Type" required>
        <RadioGroup name="reviewType"
          options={[{ label: "Quality Review", value: "QUALITY REVIEW" }, { label: "Peer Review", value: "PEER REVIEW" }]}
          value={form.reviewType as string} onChange={setStr("reviewType")} />
      </FieldRow>
      <FieldRow label="Organization / Facility Name">
        <TextInput name="organization" value={form.organization as string} onChange={setStr("organization")} placeholder="e.g. All About Ultrasound Echo Lab" />
      </FieldRow>
      <FieldRow label="Date Review Completed">
        <TextInput name="dateReviewCompleted" type="date" value={form.dateReviewCompleted as string} onChange={setStr("dateReviewCompleted")} />
      </FieldRow>
    </SectionCard>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="Exam Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="Exam Date of Service (DOS)" required>
            <TextInput name="examDos" type="date" value={form.examDos as string} onChange={setStr("examDos")} />
          </FieldRow>
          <FieldRow label="Exam Identifier (LAS/FIR/MRN)">
            <TextInput name="examIdentifier" value={form.examIdentifier as string} onChange={setStr("examIdentifier")} placeholder="De-identified ID" />
          </FieldRow>
          <FieldRow label="Patient DOB">
            <TextInput name="patientDob" type="date" value={form.patientDob as string} onChange={setStr("patientDob")} />
          </FieldRow>
          <FieldRow label="Facility Location">
            <TextInput name="facilityLocation" value={form.facilityLocation as string} onChange={setStr("facilityLocation")} placeholder="Site location" />
          </FieldRow>
          <FieldRow label="Performing Sonographer" required>
            <TextInput name="performingSonographer" value={form.performingSonographer as string} onChange={setStr("performingSonographer")} placeholder="Sonographer name/initials" />
          </FieldRow>
          <FieldRow label="Interpreting Physician" required>
            <TextInput name="interpretingPhysician" value={form.interpretingPhysician as string} onChange={setStr("interpretingPhysician")} placeholder="Physician name" />
          </FieldRow>
        </div>
      </SectionCard>
      <SectionCard title="Order / Indication Information">
        <FieldRow label="Referring Physician">
          <TextInput name="referringPhysician" value={form.referringPhysician as string} onChange={setStr("referringPhysician")} />
        </FieldRow>
        <FieldRow label="Exam Type" required>
          <SelectField name="examType"
            options={["ADULT TTE", "ADULT TEE", "ADULT STRESS", "PEDIATRIC TTE", "PEDIATRIC TEE", "FETAL ECHO"]}
            value={form.examType as string} onChange={setStr("examType")} />
        </FieldRow>
        <FieldRow label="Exam Scope">
          <RadioGroup name="examScope"
            options={[{ label: "Complete Exam", value: "Complete" }, { label: "Limited/Follow Up Exam", value: "Limited" }]}
            value={form.examScope as string} onChange={setStr("examScope")} />
        </FieldRow>
        {form.examType === "ADULT STRESS" && (
          <FieldRow label="Type of Stress Study">
            <SelectField name="stressType"
              options={["Treadmill/Bike without Doppler", "Treadmill/Bike with Doppler", "Dobutamine/Chemical without Doppler", "Dobutamine/Chemical with Doppler"]}
              value={form.stressType as string} onChange={setStr("stressType")} />
          </FieldRow>
        )}
        <FieldRow label="Exam Indication">
          <TextArea name="examIndication" value={form.examIndication as string} onChange={setStr("examIndication")} placeholder="Clinical indication for the exam" />
        </FieldRow>
        <FieldRow label="Indication Appropriateness">
          <SelectField name="indicationAppropriateness"
            options={["Appropriate A9/A8/A7", "Uncertain U6/U5/U4", "Inappropriate I3/I2/I1"]}
            value={form.indicationAppropriateness as string} onChange={setStr("indicationAppropriateness")} />
        </FieldRow>
        <FieldRow label="Are patient demographics, charges, reporting and charting notes entered appropriately?">
          <RadioGroup name="demographicsAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
            value={form.demographicsAccurate as string} onChange={setStr("demographicsAccurate")} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <SectionCard title="Protocol Sequence — Basic Exam Components">
      <p className="text-xs text-gray-500 mb-3">Check all views obtained or attempted during this exam:</p>
      <CheckboxGroup name="protocolViews" options={PROTOCOL_VIEWS}
        values={getArr("protocolViews")} onChange={setArr("protocolViews")} />
      <FieldRow label="Other Views Obtained">
        <TextInput name="protocolViewsOther" value={form.protocolViewsOther as string} onChange={setStr("protocolViewsOther")} placeholder="Describe any additional views" />
      </FieldRow>
    </SectionCard>
  );

  const renderStep4 = () => (
    <SectionCard title="Basic Exam Quality">
      <FieldRow label="2D Gain Settings">
        <RadioGroup name="gainSettings"
          options={[{ label: "Adequate", value: "Adequate" }, { label: "Too Bright", value: "Too Bright" }, { label: "Too Dark", value: "Too Dark" }, { label: "Other", value: "Other" }]}
          value={form.gainSettings as string} onChange={setStr("gainSettings")} />
        {form.gainSettings === "Other" && <TextInput name="gainSettingsOther" value={form.gainSettingsOther as string} onChange={setStr("gainSettingsOther")} placeholder="Describe..." />}
      </FieldRow>
      <FieldRow label="Depth Settings">
        <RadioGroup name="depthSettings"
          options={[{ label: "Adequate", value: "Adequate" }, { label: "Too Deep", value: "Too Deep" }, { label: "Too Shallow", value: "Too Shallow" }, { label: "Other", value: "Other" }]}
          value={form.depthSettings as string} onChange={setStr("depthSettings")} />
        {form.depthSettings === "Other" && <TextInput name="depthSettingsOther" value={form.depthSettingsOther as string} onChange={setStr("depthSettingsOther")} placeholder="Describe..." />}
      </FieldRow>
      <FieldRow label="Focal Zone Settings">
        <RadioGroup name="focalZoneSettings"
          options={[{ label: "Adequate", value: "Adequate" }, { label: "Deficiencies Noted", value: "Deficiencies Noted" }]}
          value={form.focalZoneSettings as string} onChange={setStr("focalZoneSettings")} />
        {form.focalZoneSettings === "Deficiencies Noted" && <TextInput name="focalZoneDeficiencies" value={form.focalZoneDeficiencies as string} onChange={setStr("focalZoneDeficiencies")} placeholder="Describe deficiencies..." />}
      </FieldRow>
      <FieldRow label="Colorize Settings">
        <RadioGroup name="colorizeSettings"
          options={[{ label: "Adequate", value: "Adequate" }, { label: "Over-Utilized", value: "Over-Utilized" }, { label: "Other", value: "Other" }]}
          value={form.colorizeSettings as string} onChange={setStr("colorizeSettings")} />
        {form.colorizeSettings === "Other" && <TextInput name="colorizeSettingsOther" value={form.colorizeSettingsOther as string} onChange={setStr("colorizeSettingsOther")} placeholder="Describe..." />}
      </FieldRow>
      <FieldRow label="Zoom Settings">
        <RadioGroup name="zoomSettings"
          options={[{ label: "Adequate", value: "Adequate" }, { label: "Over-Utilized", value: "Over-Utilized" }, { label: "Not Utilized", value: "Not Utilized" }, { label: "Other", value: "Other" }]}
          value={form.zoomSettings as string} onChange={setStr("zoomSettings")} />
        {form.zoomSettings === "Other" && <TextInput name="zoomSettingsOther" value={form.zoomSettingsOther as string} onChange={setStr("zoomSettingsOther")} placeholder="Describe..." />}
      </FieldRow>
      <FieldRow label="ECG on Image Display">
        <RadioGroup name="ecgDisplay"
          options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }, { label: "Deficiencies in Display", value: "Deficiencies" }]}
          value={form.ecgDisplay as string} onChange={setStr("ecgDisplay")} />
        {form.ecgDisplay === "Deficiencies" && <TextInput name="ecgDisplayDeficiencies" value={form.ecgDisplayDeficiencies as string} onChange={setStr("ecgDisplayDeficiencies")} placeholder="Describe deficiencies..." />}
      </FieldRow>
    </SectionCard>
  );

  const renderStep5 = () => (
    <SectionCard title="Overall Image Quality">
      <FieldRow label="Was contrast/UAE used if appropriate?">
        <SelectField name="contrastUseAppropriate"
          options={[
            "Yes (appropriate use + good settings)",
            "Yes (appropriate use but deficient settings)",
            "Contrast/UEA Not Available",
            "Patient Refused",
            "N/A - Limited/Not Needed",
            "No - not used when needed",
            "Contrast used in TDS but image optimization not performed",
            "Contrast not used in TDS, image optimization not performed",
          ]}
          value={form.contrastUseAppropriate as string} onChange={setStr("contrastUseAppropriate")} />
      </FieldRow>
      <FieldRow label="If contrast used, were settings appropriate (mechanical index, free of attenuation/swirling)?">
        <RadioGroup name="contrastSettingsAppropriate"
          options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
          value={form.contrastSettingsAppropriate as string} onChange={setStr("contrastSettingsAppropriate")} />
      </FieldRow>
      <FieldRow label="Does study demonstrate standard on-axis imaging planes (avoidance of foreshortening)?">
        <SelectField name="onAxisImaging"
          options={[
            "Yes - On axis no foreshortening",
            "Some Deficiencies - No documentation",
            "Some Deficiencies - Annotations noted",
            "No - Off axis significant foreshortening",
          ]}
          value={form.onAxisImaging as string} onChange={setStr("onAxisImaging")} />
      </FieldRow>
      <FieldRow label="Was effort made to better define suboptimal views?">
        <RadioGroup name="effortSuboptimalViews"
          options={[{ label: "Yes - Image optimization attempted", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
          value={form.effortSuboptimalViews as string} onChange={setStr("effortSuboptimalViews")} />
      </FieldRow>
    </SectionCard>
  );

  const renderStep6 = () => (
    <>
      <SectionCard title="Measurements / Accuracy (2D)">
        <FieldRow label="Were all protocol measurements obtained?">
          <SelectField name="measurements2dComplete"
            options={["Complete", "Sufficient attempts in TDS", "Limited exam: all appropriate", "Deficiencies Noted"]}
            value={form.measurements2dComplete as string} onChange={setStr("measurements2dComplete")} />
        </FieldRow>
        <FieldRow label="Are 2D measurements placed accurately?">
          <RadioGroup name="measurements2dAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited Exam", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.measurements2dAccurate as string} onChange={setStr("measurements2dAccurate")} />
        </FieldRow>
        <FieldRow label="Did PSAX View LV include all appropriate image clips?">
          <SelectField name="psaxLvComplete"
            options={["Complete (MV, Pap, Apex)", "Apex Not Visualized", "N/A - Limited", "Not Fully Visualized"]}
            value={form.psaxLvComplete as string} onChange={setStr("psaxLvComplete")} />
        </FieldRow>
        <FieldRow label="Does study accurately measure ventricular function?">
          <RadioGroup name="ventricularFunctionAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.ventricularFunctionAccurate as string} onChange={setStr("ventricularFunctionAccurate")} />
        </FieldRow>
        <FieldRow label="Are 2D and/or M-Mode EF measurements accurate?">
          <RadioGroup name="efMeasurementsAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.efMeasurementsAccurate as string} onChange={setStr("efMeasurementsAccurate")} />
        </FieldRow>
        <FieldRow label="Are Simpson's EF Measurements accurate?">
          <RadioGroup name="simpsonsEfAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.simpsonsEfAccurate as string} onChange={setStr("simpsonsEfAccurate")} />
        </FieldRow>
        <FieldRow label="Are bi-plane volume measurements of Left Atrium accurate?">
          <RadioGroup name="laVolumeAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.laVolumeAccurate as string} onChange={setStr("laVolumeAccurate")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Measurements / Accuracy (Doppler/Other)">
        <FieldRow label="Were all protocol Doppler measurements obtained?">
          <SelectField name="dopplerMeasurementsComplete"
            options={["Complete", "Sufficient attempts in TDS", "Limited exam: all appropriate", "Deficiencies Noted"]}
            value={form.dopplerMeasurementsComplete as string} onChange={setStr("dopplerMeasurementsComplete")} />
        </FieldRow>
        <FieldRow label="Are Doppler measurements placed accurately?">
          <SelectField name="dopplerMeasurementsAccurate"
            options={["Excellent", "Adequate", "Some Deficiencies", "N/A - Limited", "No"]}
            value={form.dopplerMeasurementsAccurate as string} onChange={setStr("dopplerMeasurementsAccurate")} />
        </FieldRow>
        <FieldRow label="Does study accurately measure ventricular function (Doppler)?">
          <SelectField name="dopplerVentricularFunction"
            options={["Excellent", "Adequate", "Some Deficiencies", "N/A - Limited", "No"]}
            value={form.dopplerVentricularFunction as string} onChange={setStr("dopplerVentricularFunction")} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const renderStep7 = () => (
    <>
      <SectionCard title="Doppler Quality — Adult TTE">
        <FieldRow label="Are Doppler waveform settings correct (Baseline/PRF-Scale)?">
          <RadioGroup name="dopplerWaveformSettings"
            options={[{ label: "Adequate", value: "Adequate" }, { label: "N/A - Limited", value: "N/A" }, { label: "Deficiencies Noted", value: "Deficiencies" }]}
            value={form.dopplerWaveformSettings as string} onChange={setStr("dopplerWaveformSettings")} />
        </FieldRow>
        <FieldRow label="Are Doppler measurements accurate (correct placement/no contrast blooming)?">
          <RadioGroup name="dopplerMeasurementAccuracy"
            options={[{ label: "Adequate", value: "Adequate" }, { label: "N/A - Limited", value: "N/A" }, { label: "Deficiencies Noted", value: "Deficiencies" }]}
            value={form.dopplerMeasurementAccuracy as string} onChange={setStr("dopplerMeasurementAccuracy")} />
        </FieldRow>
        <FieldRow label="Does study demonstrate forward flow spectrum for each valve?">
          <RadioGroup name="forwardFlowSpectrum"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.forwardFlowSpectrum as string} onChange={setStr("forwardFlowSpectrum")} />
        </FieldRow>
        <FieldRow label="Are PW Doppler sample volumes placed correctly consistently?">
          <RadioGroup name="pwDopplerPlacement"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.pwDopplerPlacement as string} onChange={setStr("pwDopplerPlacement")} />
        </FieldRow>
        <FieldRow label="Are CW Doppler sample volumes placed correctly/angle consistently?">
          <RadioGroup name="cwDopplerPlacement"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.cwDopplerPlacement as string} onChange={setStr("cwDopplerPlacement")} />
        </FieldRow>
        <FieldRow label="Were spectral envelope peaks clearly defined or attempted multiple times?">
          <RadioGroup name="spectralEnvelopePeaks"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.spectralEnvelopePeaks as string} onChange={setStr("spectralEnvelopePeaks")} />
        </FieldRow>
        <FieldRow label="Does study demonstrate color flow interrogation of all normal and abnormal flows?">
          <RadioGroup name="colorFlowInterrogation"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.colorFlowInterrogation as string} onChange={setStr("colorFlowInterrogation")} />
        </FieldRow>
        <FieldRow label="Was Color Doppler utilized on both IAS & IVS appropriately?">
          <RadioGroup name="colorDopplerIasIvs"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A - Limited", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.colorDopplerIasIvs as string} onChange={setStr("colorDopplerIasIvs")} />
        </FieldRow>
        <FieldRow label="Was Diastolic Function/LAP evaluated appropriately? (check all that apply)">
          <CheckboxGroup name="diastolicFunctionEval" options={DIASTOLIC_EVAL_OPTIONS}
            values={getArr("diastolicFunctionEval")} onChange={setArr("diastolicFunctionEval")} />
        </FieldRow>
        <FieldRow label="Was Pulmonary Vein Inflow Doppler measured/assessed properly?">
          <RadioGroup name="pulmonaryVeinInflow"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.pulmonaryVeinInflow as string} onChange={setStr("pulmonaryVeinInflow")} />
        </FieldRow>
        <FieldRow label="Was Right Heart Function evaluated appropriately? (check all that apply)">
          <CheckboxGroup name="rightHeartFunctionEval" options={RIGHT_HEART_EVAL_OPTIONS}
            values={getArr("rightHeartFunctionEval")} onChange={setArr("rightHeartFunctionEval")} />
        </FieldRow>
        <FieldRow label="Were TAPSE measurements performed accurately?">
          <RadioGroup name="tapseAccurate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.tapseAccurate as string} onChange={setStr("tapseAccurate")} />
        </FieldRow>
        <FieldRow label="Was Tissue Doppler adequate and measured/assessed properly?">
          <RadioGroup name="tissueDopplerAdequate"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.tissueDopplerAdequate as string} onChange={setStr("tissueDopplerAdequate")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Doppler Quality — Peer Review / TEE">
        <FieldRow label="Are Doppler waveform settings correct (Baseline/PRF-Scale)?">
          <SelectField name="dopplerWaveformSettingsPeer"
            options={["Excellent", "Adequate", "N/A - Limited", "Deficiencies Noted"]}
            value={form.dopplerWaveformSettingsPeer as string} onChange={setStr("dopplerWaveformSettingsPeer")} />
        </FieldRow>
        <FieldRow label="Are Doppler sample volumes and measurement calipers placed correctly?">
          <SelectField name="dopplerSampleVolumesPeer"
            options={["Yes", "Some Deficiencies", "N/A - Limited", "No"]}
            value={form.dopplerSampleVolumesPeer as string} onChange={setStr("dopplerSampleVolumesPeer")} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const renderStep8 = () => (
    <>
      <SectionCard title="Cardiac Evaluation — Aortic Valve">
        <FieldRow label="Is Aortic Valve evaluated with Color/CW Doppler appropriately?">
          <RadioGroup name="aorticValveDoppler"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.aorticValveDoppler as string} onChange={setStr("aorticValveDoppler")} />
        </FieldRow>
        <FieldRow label="Is LVOT pulsed Doppler sample volume placed correctly?">
          <RadioGroup name="lvotDopplerPlacement"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.lvotDopplerPlacement as string} onChange={setStr("lvotDopplerPlacement")} />
        </FieldRow>
        <FieldRow label="If AS present, was dedicated Pedoff CW transducer utilized from multiple views?">
          <SelectField name="pedoffCwUtilized"
            options={["Yes", "N/A (Limited or No AS >2m/s)", "No"]}
            value={form.pedoffCwUtilized as string} onChange={setStr("pedoffCwUtilized")} />
        </FieldRow>
        <FieldRow label="Was clear envelope obtained using dedicated Pedoff CW transducer?">
          <SelectField name="pedoffCwEnvelope"
            options={["Yes", "N/A (Limited or No AS >2m/s)", "No"]}
            value={form.pedoffCwEnvelope as string} onChange={setStr("pedoffCwEnvelope")} />
        </FieldRow>
        <FieldRow label="Were dedicated Pedoff CW transducer views labelled by location?">
          <SelectField name="pedoffCwLabelled"
            options={["Yes", "N/A (Limited or No AS >2m/s)", "No"]}
            value={form.pedoffCwLabelled as string} onChange={setStr("pedoffCwLabelled")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Cardiac Evaluation — Mitral Valve">
        <FieldRow label="Is Mitral Valve evaluated with Color/CW/PW Doppler appropriately?">
          <RadioGroup name="mitralValveDoppler"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.mitralValveDoppler as string} onChange={setStr("mitralValveDoppler")} />
        </FieldRow>
        <FieldRow label="If significant MR present, evaluated with appropriate methods (PISA, ERO, Vena Contracta)?">
          <SelectField name="mrEvaluationMethods"
            options={["Yes", "N/A (limited/eccentric/no significant MR)", "No (more than mild MR & no PISA/ERO)"]}
            value={form.mrEvaluationMethods as string} onChange={setStr("mrEvaluationMethods")} />
        </FieldRow>
        <FieldRow label="Were PISA, ERO, Vena Contracta measurements performed correctly (baseline shift)?">
          <RadioGroup name="pisaEroMeasurements"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.pisaEroMeasurements as string} onChange={setStr("pisaEroMeasurements")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Cardiac Evaluation — Tricuspid & Pulmonic Valves">
        <FieldRow label="Is Tricuspid Valve evaluated with Color/CW Doppler appropriately?">
          <RadioGroup name="tricuspidValveDoppler"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.tricuspidValveDoppler as string} onChange={setStr("tricuspidValveDoppler")} />
        </FieldRow>
        <FieldRow label="Is Pulmonic Valve evaluated with Color/CW/PW Doppler appropriately?">
          <RadioGroup name="pulmonicValveDoppler"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.pulmonicValveDoppler as string} onChange={setStr("pulmonicValveDoppler")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Cardiac Evaluation — Peer Review / TEE">
        <FieldRow label="Is Aortic Valve evaluated with 2D/Color/CW/Pedoff Doppler appropriately?">
          <SelectField name="aorticValvePeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.aorticValvePeer as string} onChange={setStr("aorticValvePeer")} />
        </FieldRow>
        <FieldRow label="Is Mitral Valve evaluated with 2D/Color/CW/PW Doppler appropriately?">
          <SelectField name="mitralValvePeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.mitralValvePeer as string} onChange={setStr("mitralValvePeer")} />
        </FieldRow>
        <FieldRow label="Is Tricuspid Valve evaluated with 2D/Color/CW Doppler appropriately?">
          <SelectField name="tricuspidValvePeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.tricuspidValvePeer as string} onChange={setStr("tricuspidValvePeer")} />
        </FieldRow>
        <FieldRow label="Is Pulmonic Valve evaluated with 2D/Color/CW/PW Doppler appropriately?">
          <SelectField name="pulmonicValvePeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.pulmonicValvePeer as string} onChange={setStr("pulmonicValvePeer")} />
        </FieldRow>
        <FieldRow label="Is left heart diastology evaluated appropriately?">
          <SelectField name="diastologyPeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.diastologyPeer as string} onChange={setStr("diastologyPeer")} />
        </FieldRow>
        <FieldRow label="Is right heart systolic function evaluated appropriately?">
          <SelectField name="rightHeartPeer" options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.rightHeartPeer as string} onChange={setStr("rightHeartPeer")} />
        </FieldRow>
        <FieldRow label="Additional Imaging Methods (check all that apply)">
          <CheckboxGroup name="additionalImagingMethods" options={ADDITIONAL_IMAGING_OPTIONS}
            values={getArr("additionalImagingMethods")} onChange={setArr("additionalImagingMethods")} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const renderStep9 = () => (
    <SectionCard title="Additional Exam Components">
      <FieldRow label="Was strain imaging / speckle tracking performed?">
        <RadioGroup name="strainPerformed"
          options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
          value={form.strainPerformed as string} onChange={setStr("strainPerformed")} />
      </FieldRow>
      {form.strainPerformed === "Yes" && (
        <FieldRow label="If strain performed, was it performed correctly with correct reporting (e.g. Bullet Export)?">
          <SelectField name="strainCorrect"
            options={["Yes", "N/A - Strain Not Performed", "No"]}
            value={form.strainCorrect as string} onChange={setStr("strainCorrect")} />
        </FieldRow>
      )}
      <FieldRow label="Was 3D imaging performed?">
        <RadioGroup name="threeDPerformed"
          options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
          value={form.threeDPerformed as string} onChange={setStr("threeDPerformed")} />
      </FieldRow>
    </SectionCard>
  );

  const renderStep10 = () => (
    <>
      <SectionCard title="Review Summary — Image & Technical Quality">
        <FieldRow label="Are 2D images optimized appropriately (Gain/Depth/Focus/Sector)?">
          <SelectField name="imageOptimizationSummary"
            options={["Excellent", "Adequate", "N/A - Limited", "Deficiencies Noted"]}
            value={form.imageOptimizationSummary as string} onChange={setStr("imageOptimizationSummary")} />
        </FieldRow>
        <FieldRow label="Are measurements placed accurately (correct ECG timing, correct placement per ASE guidelines)?">
          <SelectField name="measurementAccuracySummary"
            options={["Excellent", "Adequate", "N/A", "Deficiencies Noted"]}
            value={form.measurementAccuracySummary as string} onChange={setStr("measurementAccuracySummary")} />
        </FieldRow>
        <FieldRow label="Are Color/Doppler settings optimized appropriately (Gain/Sector/Angle/Baseline/PRF-Scale)?">
          <SelectField name="dopplerSettingsSummary"
            options={["Excellent", "Adequate", "N/A - Limited", "Deficiencies Noted"]}
            value={form.dopplerSettingsSummary as string} onChange={setStr("dopplerSettingsSummary")} />
        </FieldRow>
        <FieldRow label="Was department protocol image sequence followed?">
          <SelectField name="protocolSequenceFollowed"
            options={[
              "Complete (to BEST ability)",
              "Minor Deficiencies (all required images present/in order, missing measurements)",
              "Minor Deficiencies (images/measurements documented but out of protocol sequence)",
              "Minor Deficiencies (see review comments)",
              "Moderate Deficiencies (missing images, measurements and/or documentation)",
              "Major Deficiencies (missing views, images and/or measurements)",
            ]}
            value={form.protocolSequenceFollowed as string} onChange={setStr("protocolSequenceFollowed")} />
        </FieldRow>
        <FieldRow label="Was all pathology documented/measured/evaluated appropriately?">
          <RadioGroup name="pathologyDocumented"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.pathologyDocumented as string} onChange={setStr("pathologyDocumented")} />
        </FieldRow>
        <FieldRow label="Was all pathology documented and overall clinical concern/question answered or BEST attempts made?">
          <RadioGroup name="clinicalQuestionAnswered"
            options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
            value={form.clinicalQuestionAnswered as string} onChange={setStr("clinicalQuestionAnswered")} />
        </FieldRow>
        <FieldRow label="Is sonographer preliminary report concordant with final physician report?">
          <SelectField name="reportConcordant"
            options={["Yes", "N/A - NOT COMPLETED", "N/A - UNABLE TO CONFIRM", "No"]}
            value={form.reportConcordant as string} onChange={setStr("reportConcordant")} />
        </FieldRow>
        <FieldRow label="Is exam comparable to previous study, if applicable?">
          <RadioGroup name="comparableToPreview"
            options={[{ label: "Yes", value: "Yes" }, { label: "N/A", value: "N/A" }, { label: "No", value: "No" }]}
            value={form.comparableToPreview as string} onChange={setStr("comparableToPreview")} />
        </FieldRow>
        <FieldRow label="Are images in this case acceptable for submission to the IAC?">
          <SelectField name="iacAcceptable" options={IAC_OPTIONS}
            value={form.iacAcceptable as string} onChange={setStr("iacAcceptable")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Scan Timing">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldRow label="Scan Start Time">
            <TextInput name="scanStartTime" type="time" value={form.scanStartTime as string} onChange={setStr("scanStartTime")} />
          </FieldRow>
          <FieldRow label="Scan End Time">
            <TextInput name="scanEndTime" type="time" value={form.scanEndTime as string} onChange={setStr("scanEndTime")} />
          </FieldRow>
          <FieldRow label="Imaging Time (minutes)">
            <TextInput name="imagingTimeMinutes" type="number" value={String(form.imagingTimeMinutes ?? "")} onChange={v => set("imagingTimeMinutes")(Number(v))} placeholder="1–90" />
          </FieldRow>
        </div>
        <FieldRow label="Scanning Time Type">
          <RadioGroup name="scanningTimeType"
            options={[{ label: "Actual", value: "Actual" }, { label: "Estimated", value: "Estimated" }]}
            value={form.scanningTimeType as string} onChange={setStr("scanningTimeType")} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Quality Score & Comments">
        <FieldRow label="Quality Score (1–110)">
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={110} value={Number(form.qualityScore ?? 0)}
              onChange={e => set("qualityScore")(Number(e.target.value))}
              className="flex-1 accent-[#189aa1]" />
            <div className="text-2xl font-black w-16 text-center rounded-lg py-1"
              style={{ color: Number(form.qualityScore) >= 90 ? "#16a34a" : Number(form.qualityScore) >= 75 ? TEAL : Number(form.qualityScore) >= 60 ? "#ca8a04" : "#dc2626" }}>
              {form.qualityScore}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Number(form.qualityScore) >= 90 ? "Excellent" : Number(form.qualityScore) >= 75 ? "Good" : Number(form.qualityScore) >= 60 ? "Adequate" : "Needs Improvement"}
          </div>
        </FieldRow>
        <FieldRow label="Review Comments">
          <TextArea name="reviewComments" value={form.reviewComments as string} onChange={setStr("reviewComments")}
            placeholder="Detailed feedback, recommendations, and clinical notes..." rows={5} />
        </FieldRow>
      </SectionCard>
      <SectionCard title="Reviewer Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="Reviewer Name">
            <TextInput name="reviewer" value={form.reviewer as string} onChange={setStr("reviewer")} />
          </FieldRow>
          <FieldRow label="Reviewer Email">
            <TextInput name="reviewerEmail" type="email" value={form.reviewerEmail as string} onChange={setStr("reviewerEmail")} />
          </FieldRow>
        </div>
        <FieldRow label="Send review result to administrator/manager?">
          <RadioGroup name="notifyAdmin"
            options={[{ label: "YES", value: "YES" }, { label: "NO", value: "NO" }]}
            value={form.notifyAdmin as string} onChange={setStr("notifyAdmin")} />
        </FieldRow>
        <FieldRow label="Send review result to performing sonographer?">
          <RadioGroup name="notifySonographer"
            options={[{ label: "YES", value: "YES" }, { label: "NO", value: "NO" }]}
            value={form.notifySonographer as string} onChange={setStr("notifySonographer")} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9, renderStep10];

  // ─── History view ─────────────────────────────────────────────────────────────
  const renderHistory = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Review History</h2>
        <button onClick={() => setView("form")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL }}>
          <Plus className="w-4 h-4" /> New Review
        </button>
      </div>
      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No reviews yet. Start your first Image Quality Review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => {
            const qs = r.qualityScore ?? 0;
            const tier = qs >= 90 ? "Excellent" : qs >= 75 ? "Good" : qs >= 60 ? "Adequate" : "Needs Improvement";
            const tierColor = qs >= 90 ? "#16a34a" : qs >= 75 ? TEAL : qs >= 60 ? "#ca8a04" : "#dc2626";
            return (
              <div key={r.id} className="bg-white rounded-xl border border-[#189aa1]/20 p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">{r.performingSonographer || "Unknown Sonographer"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: TEAL + "15", color: TEAL }}>{r.examType || "Exam"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: tierColor + "15", color: tierColor }}>{tier}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    <span>DOS: {r.examDos || "—"}</span>
                    <span>Reviewed: {r.dateReviewCompleted || "—"}</span>
                    <span>Reviewer: {r.reviewer || "—"}</span>
                    <span className="font-semibold" style={{ color: tierColor }}>Score: {qs}/110</span>
                  </div>
                  {r.reviewComments && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.reviewComments}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => generateIqrPdf(r as unknown as FormData)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: TEAL }}>
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => deleteMutation.mutate({ id: r.id })}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/accreditation")} className="p-2 rounded-lg border border-[#189aa1]/30 text-[#189aa1] hover:bg-[#189aa1]/5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              Image Quality Review™
            </h1>
            <p className="text-xs text-gray-500">IAC-aligned quality review form for echo lab accreditation</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setView("form")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "form" ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
              style={view === "form" ? { background: TEAL } : {}}>
              New Review
            </button>
            <button onClick={() => setView("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "history" ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
              style={view === "history" ? { background: TEAL } : {}}>
              History
            </button>
          </div>
        </div>

        {view === "history" ? renderHistory() : (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Step {step} of {STEPS.length}: {STEPS[step - 1]?.label}</span>
                <span className="text-xs font-bold" style={{ color: TEAL }}>{progressPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${TEAL}, ${AQUA})` }} />
              </div>
              {/* Step pills */}
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
                {STEPS.map(s => (
                  <button key={s.id} onClick={() => setStep(s.id)}
                    className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold transition-all"
                    style={step === s.id
                      ? { background: TEAL, color: "white" }
                      : step > s.id
                        ? { background: TEAL + "20", color: TEAL }
                        : { background: "#f3f4f6", color: "#6b7280" }}>
                    {s.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="mb-6">
              {stepContent[step - 1]?.()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-[#189aa1]/30 text-[#189aa1] disabled:opacity-40 hover:bg-[#189aa1]/5">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex gap-2">
                {step === STEPS.length ? (
                  <>
                    <button onClick={() => generateIqrPdf(form)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-[#189aa1] text-[#189aa1] hover:bg-[#189aa1]/5">
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={handleSubmit} disabled={createMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                      style={{ background: TEAL }}>
                      <Save className="w-4 h-4" />
                      {createMutation.isPending ? "Saving..." : "Save Review"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: TEAL }}>
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
