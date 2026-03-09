/*
  ImageQualityReview — 7-step form mapped from Formsite
  Exam-type identifiers: AETTE, AETEE, AE_STRESS, PETTE, PETEE, FE
  Fields without a prefix apply to all exam types.
  Review Type is hardcoded as "QUALITY REVIEW".
*/
import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const BRAND = "#189aa1";
const TOTAL_STEPS = 7;

type ExamType = "ADULT TTE" | "ADULT TEE" | "ADULT STRESS" | "PEDIATRIC TTE" | "PEDIATRIC TEE" | "FETAL ECHO" | "";

interface IQRForm {
  // Page 1 — Header Info
  reviewDate: string;
  examDate: string;
  examIdentifier: string;
  referringPhysician: string;
  examType: ExamType;
  examScope: string; // Complete Exam / Limited
  stressStudyType: string; // AE_STRESS only
  examIndication: string;
  indicationAppropriateness: string;
  demographicsAccurate: string;
  demographicsExplain: string;
  // Page 2 — Protocol Sequence
  tteViewsObtained: string[]; // AETTE only
  tteViewsObtainedOther: string;
  // Page 3 — Basic Exam Quality
  required2dViews: string;
  required2dViewsExplain: string;
  mModeViewsObtained: string; // AETTE, PETTE
  mModeViewsObtainedOther: string;
  imageOptimized: string;
  imageOptimizedExplain: string;
  harmonicImagingAppropriate: string;
  harmonicImagingOther: string;
  contrastUtilized: string; // AETTE, PETTE, FE
  contrastUtilizedOther: string;
  patientPositioned: string;
  patientPositionedOther: string;
  // Page 4 — Measurements
  allMeasurementsObtained: string;
  allMeasurementsExplain: string;
  measurements2dAccurate: string;
  measurements2dExplain: string;
  psaxLvCompleteness: string; // AETTE, PETTE
  psaxLvCompletenessOther: string;
  efMeasurementsAccurate: string; // AETTE, PETTE
  efMeasurementsExplain: string;
  simpsonsEfObtained: string; // AETTE, PETTE
  simpsonsEfObtainedOther: string;
  biplaneLaVolume: string; // AETTE only
  biplaneLaVolumeOther: string;
  measurementPlacementSummary: string;
  measurementPlacementExplain: string;
  ventricularFunctionAccurate: string;
  ventricularFunctionExplain: string;
  // Page 5 — Doppler Quality
  dopplerWaveformSettings: string;
  dopplerWaveformExplain: string;
  forwardFlowSpectrum: string;
  forwardFlowExplain: string;
  dopplerSampleVolumes: string;
  dopplerSampleVolumesExplain: string;
  spectralEnvelopePeaks: string;
  spectralEnvelopeExplain: string;
  colorFlowInterrogation: string; // AETTE, PETTE, FE
  colorFlowExplain: string;
  colorDopplerIasIvs: string; // AETTE, PETTE, FE
  colorDopplerExplain: string;
  diastolicFunctionEval: string[]; // AETTE only
  diastolicFunctionEvalOther: string;
  pulmonaryVeinInflow: string; // AETTE, PETTE, FE
  pulmonaryVeinInflowExplain: string;
  rightHeartFunctionEval: string[]; // AETTE, PETTE
  rightHeartFunctionEvalOther: string;
  tapseAccurate: string; // AETTE only
  tapseExplain: string;
  tissueDopplerAdequate: string; // AETTE, PETTE
  tissueDopplerExplain: string;
  // Page 6 — Cardiac Evaluation
  aorticValveEval: string;
  aorticValveExplain: string;
  lvotSampleVolume: string;
  lvotSampleVolumeExplain: string;
  pedoffCwUtilized: string; // AETTE only
  pedoffCwUtilizedOther: string;
  pedoffCwEnvelope: string; // AETTE only
  pedoffCwEnvelopeOther: string;
  pedoffCwLabelled: string; // AETTE only
  pedoffCwLabelledOther: string;
  mitralValveEval: string;
  mitralValveExplain: string;
  pisaEroEval: string; // AETTE only
  pisaEroExplain: string;
  pisaEroMeasurements: string; // AETTE only
  pisaEroMeasurementsOther: string;
  tricuspidValveEval: string;
  tricuspidValveExplain: string;
  pulmonicValveEval: string;
  pulmonicValveExplain: string;
  additionalImagingMethods: string[]; // All
  additionalImagingMethodsOther: string;
  strainCorrect: string; // AETTE only
  strainCorrectOther: string;
  // Overall Findings
  images2dOptimized: string;
  images2dOptimizedExplain: string;
  measurementsAccurateSummary: string;
  measurementsAccurateExplain: string;
  dopplerSettingsSummary: string;
  dopplerSettingsExplain: string;
  protocolSequence: string;
  protocolSequenceExplain: string;
  pathologyDocumented: string;
  pathologyDocumentedExplain: string;
  clinicalQuestionAnswered: string;
  clinicalQuestionExplain: string;
  concordantWithPhysician: string;
  concordantExplain: string;
  comparableToPrevious: string;
  iacAcceptable: string;
  // Page 7 — Review Summary
  qualityScore: string;
  reviewComments: string;
  notifyAdmin: string;
  notifyAdminEmail: string;
  notifyAdminComments: string;
  notifySonographer: string;
  notifySonographerEmail: string;
  notifySonographerComments: string;
}

const EMPTY_FORM: IQRForm = {
  reviewDate: "", examDate: "", examIdentifier: "", referringPhysician: "",
  examType: "", examScope: "", stressStudyType: "", examIndication: "",
  indicationAppropriateness: "", demographicsAccurate: "", demographicsExplain: "",
  tteViewsObtained: [], tteViewsObtainedOther: "",
  required2dViews: "", required2dViewsExplain: "",
  mModeViewsObtained: "", mModeViewsObtainedOther: "",
  imageOptimized: "", imageOptimizedExplain: "",
  harmonicImagingAppropriate: "", harmonicImagingOther: "",
  contrastUtilized: "", contrastUtilizedOther: "",
  patientPositioned: "", patientPositionedOther: "",
  allMeasurementsObtained: "", allMeasurementsExplain: "",
  measurements2dAccurate: "", measurements2dExplain: "",
  psaxLvCompleteness: "", psaxLvCompletenessOther: "",
  efMeasurementsAccurate: "", efMeasurementsExplain: "",
  simpsonsEfObtained: "", simpsonsEfObtainedOther: "",
  biplaneLaVolume: "", biplaneLaVolumeOther: "",
  measurementPlacementSummary: "", measurementPlacementExplain: "",
  ventricularFunctionAccurate: "", ventricularFunctionExplain: "",
  dopplerWaveformSettings: "", dopplerWaveformExplain: "",
  forwardFlowSpectrum: "", forwardFlowExplain: "",
  dopplerSampleVolumes: "", dopplerSampleVolumesExplain: "",
  spectralEnvelopePeaks: "", spectralEnvelopeExplain: "",
  colorFlowInterrogation: "", colorFlowExplain: "",
  colorDopplerIasIvs: "", colorDopplerExplain: "",
  diastolicFunctionEval: [], diastolicFunctionEvalOther: "",
  pulmonaryVeinInflow: "", pulmonaryVeinInflowExplain: "",
  rightHeartFunctionEval: [], rightHeartFunctionEvalOther: "",
  tapseAccurate: "", tapseExplain: "",
  tissueDopplerAdequate: "", tissueDopplerExplain: "",
  aorticValveEval: "", aorticValveExplain: "",
  lvotSampleVolume: "", lvotSampleVolumeExplain: "",
  pedoffCwUtilized: "", pedoffCwUtilizedOther: "",
  pedoffCwEnvelope: "", pedoffCwEnvelopeOther: "",
  pedoffCwLabelled: "", pedoffCwLabelledOther: "",
  mitralValveEval: "", mitralValveExplain: "",
  pisaEroEval: "", pisaEroExplain: "",
  pisaEroMeasurements: "", pisaEroMeasurementsOther: "",
  tricuspidValveEval: "", tricuspidValveExplain: "",
  pulmonicValveEval: "", pulmonicValveExplain: "",
  additionalImagingMethods: [], additionalImagingMethodsOther: "",
  strainCorrect: "", strainCorrectOther: "",
  images2dOptimized: "", images2dOptimizedExplain: "",
  measurementsAccurateSummary: "", measurementsAccurateExplain: "",
  dopplerSettingsSummary: "", dopplerSettingsExplain: "",
  protocolSequence: "", protocolSequenceExplain: "",
  pathologyDocumented: "", pathologyDocumentedExplain: "",
  clinicalQuestionAnswered: "", clinicalQuestionExplain: "",
  concordantWithPhysician: "", concordantExplain: "",
  comparableToPrevious: "", iacAcceptable: "",
  qualityScore: "", reviewComments: "",
  notifyAdmin: "No", notifyAdminEmail: "", notifyAdminComments: "",
  notifySonographer: "No", notifySonographerEmail: "", notifySonographerComments: "",
};

const STEP_TITLES = [
  "Header Info",
  "Protocol Sequence",
  "Basic Exam Quality",
  "Measurements",
  "Doppler Quality",
  "Cardiac Evaluation",
  "Review Summary",
];

const TTE_VIEWS = [
  "Parasternal long axis view",
  "Parasternal long axis m-mode",
  "Parasternal short axis views (at all levels AV/basal/mid/apical)",
  "Right ventricular inflow view",
  "Right ventricular outflow view",
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
  "If limited exam - all components obtained or attempted",
  "Other",
];

const DIASTOLIC_EVAL_OPTIONS = [
  "Not Fully Evaluated",
  "Mitral Annulus TDI Performed (BOTH Lateral & Medial)",
  "Mitral Inflow PW Performed",
  "TR RVSP/PASP",
  "Pulmonary Vein Inflow Performed",
  "LARS Performed when indicated",
  "E/SR IVRT",
  "Deceleration Time",
  "Mitral Inflow PW with Valsalva Performed (if indicated)",
  "N/A - Limited Exam",
];

const RIGHT_HEART_OPTIONS = [
  "Not Fully Evaluated",
  "Appropriate RV Focused View",
  "Tricuspid Inflow Performed",
  "Tricuspid Annulus TDI Performed",
  "TAPSE Performed",
  "RV1 and RV2 Diameter Measurements",
  "RA Volume Measurements",
  "N/A - Limited Exam",
];

const ADDITIONAL_IMAGING_OPTIONS = ["None Performed", "2D Strain", "3D Imaging", "3D EF", "Other"];

// Helpers
function isAETTE(et: ExamType) { return et === "ADULT TTE"; }
function isAETEE(et: ExamType) { return et === "ADULT TEE"; }
function isStress(et: ExamType) { return et === "ADULT STRESS"; }
function isPETTE(et: ExamType) { return et === "PEDIATRIC TTE"; }
function isPETEE(et: ExamType) { return et === "PEDIATRIC TEE"; }
function isFE(et: ExamType) { return et === "FETAL ECHO"; }
function isAETTE_PETTE(et: ExamType) { return isAETTE(et) || isPETTE(et); }
function isAETTE_PETTE_FE(et: ExamType) { return isAETTE(et) || isPETTE(et) || isFE(et); }

// UI helpers
function RadioGroup({ label, name, options, value, onChange, explain, onExplainChange, showExplain }: {
  label: string; name: string; options: string[]; value: string;
  onChange: (v: string) => void; explain?: string; onExplainChange?: (v: string) => void; showExplain?: boolean;
}) {
  return (
    <div className="mb-5">
      <Label className="text-sm font-semibold text-gray-700 mb-2 block">{label}</Label>
      <div className="flex flex-col gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-[#189aa1] w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
      {showExplain && onExplainChange && (
        <div className="mt-2">
          <Textarea
            placeholder="Please explain..."
            value={explain ?? ""}
            onChange={e => onExplainChange(e.target.value)}
            className="text-sm min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}

function CheckboxGroup({ label, options, values, onChange, explain, onExplainChange }: {
  label: string; options: string[]; values: string[];
  onChange: (v: string[]) => void; explain?: string; onExplainChange?: (v: string) => void;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter(v => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="mb-5">
      <Label className="text-sm font-semibold text-gray-700 mb-2 block">{label}</Label>
      <div className="flex flex-col gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <Checkbox
              checked={values.includes(opt)}
              onCheckedChange={() => toggle(opt)}
              className="data-[state=checked]:bg-[#189aa1] data-[state=checked]:border-[#189aa1]"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
      {onExplainChange && (
        <div className="mt-2">
          <Textarea
            placeholder="Additional notes..."
            value={explain ?? ""}
            onChange={e => onExplainChange(e.target.value)}
            className="text-sm min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
      {title && (
        <div className="px-5 py-3 border-b border-gray-100" style={{ background: BRAND + "10" }}>
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface Props { embedded?: boolean; }

export default function ImageQualityReview({ embedded = false }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IQRForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const createMutation = trpc.iqr.create.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success("Quality review submitted successfully!"); },
    onError: (e) => { toast.error(e.message || "Failed to submit review. Please try again."); },
  });

  const et = form.examType;

  function set<K extends keyof IQRForm>(key: K, value: IQRForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function goToStep(n: number) {
    setStep(n);
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function handleSubmit() {
    const payload = {
      reviewType: "QUALITY REVIEW" as const,
      reviewDate: form.reviewDate || undefined,
      examDate: form.examDate || undefined,
      examIdentifier: form.examIdentifier || undefined,
      referringPhysician: form.referringPhysician || undefined,
      examType: form.examType || undefined,
      examScope: form.examScope || undefined,
      stressStudyType: form.stressStudyType || undefined,
      examIndication: form.examIndication || undefined,
      indicationAppropriateness: form.indicationAppropriateness || undefined,
      demographicsAccurate: form.demographicsAccurate || undefined,
      demographicsExplain: form.demographicsExplain || undefined,
      tteViewsObtained: form.tteViewsObtained.length ? JSON.stringify(form.tteViewsObtained) : undefined,
      required2dViews: form.required2dViews || undefined,
      required2dViewsExplain: form.required2dViewsExplain || undefined,
      mModeViewsObtained: form.mModeViewsObtained || undefined,
      mModeViewsObtainedOther: form.mModeViewsObtainedOther || undefined,
      imageOptimized: form.imageOptimized || undefined,
      imageOptimizedExplain: form.imageOptimizedExplain || undefined,
      harmonicImagingAppropriate: form.harmonicImagingAppropriate || undefined,
      harmonicImagingOther: form.harmonicImagingOther || undefined,
      contrastUtilized: form.contrastUtilized || undefined,
      contrastUtilizedOther: form.contrastUtilizedOther || undefined,
      patientPositioned: form.patientPositioned || undefined,
      patientPositionedOther: form.patientPositionedOther || undefined,
      allMeasurementsObtained: form.allMeasurementsObtained || undefined,
      allMeasurementsExplain: form.allMeasurementsExplain || undefined,
      measurements2dAccurate: form.measurements2dAccurate || undefined,
      measurements2dExplain: form.measurements2dExplain || undefined,
      psaxLvCompleteness: form.psaxLvCompleteness || undefined,
      psaxLvCompletenessOther: form.psaxLvCompletenessOther || undefined,
      efMeasurementsAccurate: form.efMeasurementsAccurate || undefined,
      efMeasurementsExplain: form.efMeasurementsExplain || undefined,
      simpsonsEfObtained: form.simpsonsEfObtained || undefined,
      simpsonsEfObtainedOther: form.simpsonsEfObtainedOther || undefined,
      biplaneLaVolume: form.biplaneLaVolume || undefined,
      biplaneLaVolumeOther: form.biplaneLaVolumeOther || undefined,
      measurementPlacementSummary: form.measurementPlacementSummary || undefined,
      measurementPlacementExplain: form.measurementPlacementExplain || undefined,
      ventricularFunctionAccurate: form.ventricularFunctionAccurate || undefined,
      ventricularFunctionExplain: form.ventricularFunctionExplain || undefined,
      dopplerWaveformSettings: form.dopplerWaveformSettings || undefined,
      dopplerWaveformExplain: form.dopplerWaveformExplain || undefined,
      forwardFlowSpectrum: form.forwardFlowSpectrum || undefined,
      forwardFlowExplain: form.forwardFlowExplain || undefined,
      dopplerSampleVolumes: form.dopplerSampleVolumes || undefined,
      dopplerSampleVolumesExplain: form.dopplerSampleVolumesExplain || undefined,
      spectralEnvelopePeaks: form.spectralEnvelopePeaks || undefined,
      spectralEnvelopeExplain: form.spectralEnvelopeExplain || undefined,
      colorFlowInterrogation: form.colorFlowInterrogation || undefined,
      colorFlowExplain: form.colorFlowExplain || undefined,
      colorDopplerIasIvs: form.colorDopplerIasIvs || undefined,
      colorDopplerExplain: form.colorDopplerExplain || undefined,
      diastolicFunctionEval: form.diastolicFunctionEval.length ? JSON.stringify(form.diastolicFunctionEval) : undefined,
      diastolicFunctionEvalOther: form.diastolicFunctionEvalOther || undefined,
      pulmonaryVeinInflow: form.pulmonaryVeinInflow || undefined,
      pulmonaryVeinInflowExplain: form.pulmonaryVeinInflowExplain || undefined,
      rightHeartFunctionEval: form.rightHeartFunctionEval.length ? JSON.stringify(form.rightHeartFunctionEval) : undefined,
      rightHeartFunctionEvalOther: form.rightHeartFunctionEvalOther || undefined,
      tapseAccurate: form.tapseAccurate || undefined,
      tapseExplain: form.tapseExplain || undefined,
      tissueDopplerAdequate: form.tissueDopplerAdequate || undefined,
      tissueDopplerExplain: form.tissueDopplerExplain || undefined,
      aorticValveEval: form.aorticValveEval || undefined,
      aorticValveExplain: form.aorticValveExplain || undefined,
      lvotSampleVolume: form.lvotSampleVolume || undefined,
      lvotSampleVolumeExplain: form.lvotSampleVolumeExplain || undefined,
      pedoffCwUtilized: form.pedoffCwUtilized || undefined,
      pedoffCwUtilizedOther: form.pedoffCwUtilizedOther || undefined,
      pedoffCwEnvelope: form.pedoffCwEnvelope || undefined,
      pedoffCwEnvelopeOther: form.pedoffCwEnvelopeOther || undefined,
      pedoffCwLabelled: form.pedoffCwLabelled || undefined,
      pedoffCwLabelledOther: form.pedoffCwLabelledOther || undefined,
      mitralValveEval: form.mitralValveEval || undefined,
      mitralValveExplain: form.mitralValveExplain || undefined,
      pisaEroEval: form.pisaEroEval || undefined,
      pisaEroExplain: form.pisaEroExplain || undefined,
      pisaEroMeasurements: form.pisaEroMeasurements || undefined,
      pisaEroMeasurementsOther: form.pisaEroMeasurementsOther || undefined,
      tricuspidValveEval: form.tricuspidValveEval || undefined,
      tricuspidValveExplain: form.tricuspidValveExplain || undefined,
      pulmonicValveEval: form.pulmonicValveEval || undefined,
      pulmonicValveExplain: form.pulmonicValveExplain || undefined,
      additionalImagingMethods: form.additionalImagingMethods.length ? JSON.stringify(form.additionalImagingMethods) : undefined,
      additionalImagingMethodsOther: form.additionalImagingMethodsOther || undefined,
      strainCorrect: form.strainCorrect || undefined,
      strainCorrectOther: form.strainCorrectOther || undefined,
      images2dOptimized: form.images2dOptimized || undefined,
      images2dOptimizedExplain: form.images2dOptimizedExplain || undefined,
      measurementsAccurateSummary: form.measurementsAccurateSummary || undefined,
      measurementsAccurateExplain: form.measurementsAccurateExplain || undefined,
      dopplerSettingsSummary: form.dopplerSettingsSummary || undefined,
      dopplerSettingsExplain: form.dopplerSettingsExplain || undefined,
      protocolSequence: form.protocolSequence || undefined,
      protocolSequenceExplain: form.protocolSequenceExplain || undefined,
      pathologyDocumented: form.pathologyDocumented || undefined,
      pathologyDocumentedExplain: form.pathologyDocumentedExplain || undefined,
      clinicalQuestionAnswered: form.clinicalQuestionAnswered || undefined,
      clinicalQuestionExplain: form.clinicalQuestionExplain || undefined,
      concordantWithPhysician: form.concordantWithPhysician || undefined,
      concordantExplain: form.concordantExplain || undefined,
      comparableToPrevious: form.comparableToPrevious || undefined,
      iacAcceptable: form.iacAcceptable || undefined,
      qualityScore: form.qualityScore || undefined,
      reviewComments: form.reviewComments || undefined,
      notifyAdmin: form.notifyAdmin || undefined,
      notifyAdminEmail: form.notifyAdminEmail || undefined,
      notifyAdminComments: form.notifyAdminComments || undefined,
      notifySonographer: form.notifySonographer || undefined,
      notifySonographerEmail: form.notifySonographerEmail || undefined,
      notifySonographerComments: form.notifySonographerComments || undefined,
    };
    createMutation.mutate(payload);
  }

  // ── Step renderers ──────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <SectionCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Date Review Completed</Label>
            <Input type="date" value={form.reviewDate} onChange={e => set("reviewDate", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Exam DOS</Label>
            <Input type="date" value={form.examDate} onChange={e => set("examDate", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Exam Identifier (LAS, FIR, MRN)</Label>
            <Input value={form.examIdentifier} onChange={e => set("examIdentifier", e.target.value)} placeholder="e.g. MRN123" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Referring Physician</Label>
            <Input value={form.referringPhysician} onChange={e => set("referringPhysician", e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Exam Type</Label>
          <Select value={form.examType} onValueChange={v => set("examType", v as ExamType)}>
            <SelectTrigger><SelectValue placeholder="Select exam type..." /></SelectTrigger>
            <SelectContent>
              {["ADULT TTE", "ADULT TEE", "ADULT STRESS", "PEDIATRIC TTE", "PEDIATRIC TEE", "FETAL ECHO"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Limited/Complete Exam</Label>
          <Select value={form.examScope} onValueChange={v => set("examScope", v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Complete Exam">Complete Exam</SelectItem>
              <SelectItem value="Limited/Follow Up Exam">Limited/Follow Up Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isStress(et) && (
          <div className="mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">What type of stress study was performed?</Label>
            <Input value={form.stressStudyType} onChange={e => set("stressStudyType", e.target.value)} placeholder="e.g. Exercise, DSE, Pharmacologic" />
          </div>
        )}

        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Exam Indication</Label>
          <Textarea value={form.examIndication} onChange={e => set("examIndication", e.target.value)} className="min-h-[60px]" />
        </div>

        <RadioGroup
          label="Indication Appropriateness"
          name="indicationAppropriateness"
          options={["Appropriate A9/A8/A7", "Uncertain U6/U5/U4", "Inappropriate I3/I2/I1"]}
          value={form.indicationAppropriateness}
          onChange={v => set("indicationAppropriateness", v)}
        />

        <RadioGroup
          label="Are patient demographics, charges, reporting and charting notes entered appropriately and accurately?"
          name="demographicsAccurate"
          options={["Yes", "No"]}
          value={form.demographicsAccurate}
          onChange={v => set("demographicsAccurate", v)}
          explain={form.demographicsExplain}
          onExplainChange={v => set("demographicsExplain", v)}
          showExplain={form.demographicsAccurate === "No"}
        />
      </SectionCard>
    );
  }

  function renderStep2() {
    if (!isAETTE(et)) {
      return (
        <SectionCard>
          <p className="text-sm text-gray-500 italic">Protocol sequence checklist applies to Adult TTE exams only. No items required for <strong>{et || "the selected exam type"}</strong>.</p>
        </SectionCard>
      );
    }
    return (
      <SectionCard title="All required TTE views obtained or attempted">
        <CheckboxGroup
          label=""
          options={TTE_VIEWS}
          values={form.tteViewsObtained}
          onChange={v => set("tteViewsObtained", v)}
        />
        {form.tteViewsObtained.includes("Other") && (
          <div className="mt-2">
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Other (specify)</Label>
            <Input value={form.tteViewsObtainedOther} onChange={e => set("tteViewsObtainedOther", e.target.value)} />
          </div>
        )}
      </SectionCard>
    );
  }

  function renderStep3() {
    return (
      <>
        <SectionCard title="2D Views">
          <RadioGroup
            label="Were all required 2D views obtained or attempted?"
            name="required2dViews"
            options={["Yes", "Deficiencies Noted", "N/A - Limited Exam"]}
            value={form.required2dViews}
            onChange={v => set("required2dViews", v)}
            explain={form.required2dViewsExplain}
            onExplainChange={v => set("required2dViewsExplain", v)}
            showExplain={form.required2dViews === "Deficiencies Noted"}
          />

          {isAETTE_PETTE(et) && (
            <RadioGroup
              label="Were all required M-Mode views obtained?"
              name="mModeViewsObtained"
              options={["Yes", "N/A", "Deficiencies Noted"]}
              value={form.mModeViewsObtained}
              onChange={v => set("mModeViewsObtained", v)}
              explain={form.mModeViewsObtainedOther}
              onExplainChange={v => set("mModeViewsObtainedOther", v)}
              showExplain={form.mModeViewsObtained === "Deficiencies Noted"}
            />
          )}

          <RadioGroup
            label="Was image depth, gain, focus and sector width optimized?"
            name="imageOptimized"
            options={["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"]}
            value={form.imageOptimized}
            onChange={v => set("imageOptimized", v)}
            explain={form.imageOptimizedExplain}
            onExplainChange={v => set("imageOptimizedExplain", v)}
            showExplain={form.imageOptimized === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Were harmonic imaging settings utilized appropriately?"
            name="harmonicImagingAppropriate"
            options={["Yes", "N/A - Limited Exam", "No"]}
            value={form.harmonicImagingAppropriate}
            onChange={v => set("harmonicImagingAppropriate", v)}
            explain={form.harmonicImagingOther}
            onExplainChange={v => set("harmonicImagingOther", v)}
            showExplain={form.harmonicImagingAppropriate === "No"}
          />

          {isAETTE_PETTE_FE(et) && (
            <RadioGroup
              label="Was contrast utilized when indicated?"
              name="contrastUtilized"
              options={["Yes", "N/A - Not Indicated", "No"]}
              value={form.contrastUtilized}
              onChange={v => set("contrastUtilized", v)}
              explain={form.contrastUtilizedOther}
              onExplainChange={v => set("contrastUtilizedOther", v)}
              showExplain={form.contrastUtilized === "No"}
            />
          )}

          <RadioGroup
            label="Was the patient positioned appropriately for optimal image acquisition?"
            name="patientPositioned"
            options={["Yes", "N/A - Limited Exam", "No"]}
            value={form.patientPositioned}
            onChange={v => set("patientPositioned", v)}
            explain={form.patientPositionedOther}
            onExplainChange={v => set("patientPositionedOther", v)}
            showExplain={form.patientPositioned === "No"}
          />
        </SectionCard>
      </>
    );
  }

  function renderStep4() {
    return (
      <>
        <SectionCard title="Measurements Completeness">
          <RadioGroup
            label="Were all protocol measurements obtained?"
            name="allMeasurementsObtained"
            options={["Complete", "Sufficient attempts made in a TDS", "Limited exam: all appropriate measurements performed", "Deficiencies Noted"]}
            value={form.allMeasurementsObtained}
            onChange={v => set("allMeasurementsObtained", v)}
            explain={form.allMeasurementsExplain}
            onExplainChange={v => set("allMeasurementsExplain", v)}
            showExplain={form.allMeasurementsObtained === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Are 2D measurements placed accurately in the correct window location/angle/anatomy landmarks?"
            name="measurements2dAccurate"
            options={["Yes", "N/A - Limited Exam", "No"]}
            value={form.measurements2dAccurate}
            onChange={v => set("measurements2dAccurate", v)}
            explain={form.measurements2dExplain}
            onExplainChange={v => set("measurements2dExplain", v)}
            showExplain={form.measurements2dAccurate === "No"}
          />

          {isAETTE_PETTE(et) && (
            <>
              <RadioGroup
                label="Did the PSAX View Left Ventricle include all appropriate image clips?"
                name="psaxLvCompleteness"
                options={["Complete - Includes MV, Pap, Apex Views", "Apex Not Visualized", "N/A - Limited Exam", "Not Fully Visualized"]}
                value={form.psaxLvCompleteness}
                onChange={v => set("psaxLvCompleteness", v)}
                explain={form.psaxLvCompletenessOther}
                onExplainChange={v => set("psaxLvCompletenessOther", v)}
                showExplain={form.psaxLvCompleteness === "Not Fully Visualized"}
              />

              <RadioGroup
                label="Are 2D and/or M-Mode EF measurements obtained accurately, in the correct ECG timing/cardiac cycle?"
                name="efMeasurementsAccurate"
                options={["Yes", "N/A - Limited Exam", "No"]}
                value={form.efMeasurementsAccurate}
                onChange={v => set("efMeasurementsAccurate", v)}
                explain={form.efMeasurementsExplain}
                onExplainChange={v => set("efMeasurementsExplain", v)}
                showExplain={form.efMeasurementsAccurate === "No"}
              />

              <RadioGroup
                label="Are Simpson's EF Measurements placed accurately, in the correct ECG timing/Cardiac cycle and correlate with 2D images?"
                name="simpsonsEfObtained"
                options={["Yes", "N/A", "No"]}
                value={form.simpsonsEfObtained}
                onChange={v => set("simpsonsEfObtained", v)}
                explain={form.simpsonsEfObtainedOther}
                onExplainChange={v => set("simpsonsEfObtainedOther", v)}
                showExplain={form.simpsonsEfObtained === "No"}
              />
            </>
          )}

          {isAETTE(et) && (
            <RadioGroup
              label="Are bi-plane volume measurements of the Left Atrium obtained accurately and in the correct ECG timing/cardiac cycle?"
              name="biplaneLaVolume"
              options={["Yes", "N/A", "No"]}
              value={form.biplaneLaVolume}
              onChange={v => set("biplaneLaVolume", v)}
              explain={form.biplaneLaVolumeOther}
              onExplainChange={v => set("biplaneLaVolumeOther", v)}
              showExplain={form.biplaneLaVolume === "No"}
            />
          )}
        </SectionCard>

        <SectionCard title="Measurement Accuracy Summary">
          <RadioGroup
            label="Are measurements placed accurately in the correct window location/angle/anatomy landmarks/ECG cycle?"
            name="measurementPlacementSummary"
            options={["Excellent", "Adequate", "Some Deficiencies", "N/A - Limited Exam"]}
            value={form.measurementPlacementSummary}
            onChange={v => set("measurementPlacementSummary", v)}
            explain={form.measurementPlacementExplain}
            onExplainChange={v => set("measurementPlacementExplain", v)}
            showExplain={form.measurementPlacementSummary === "Some Deficiencies"}
          />

          <RadioGroup
            label="Does the study accurately measure ventricular function?"
            name="ventricularFunctionAccurate"
            options={["Excellent", "Adequate", "Some Deficiencies", "N/A - Limited Exam"]}
            value={form.ventricularFunctionAccurate}
            onChange={v => set("ventricularFunctionAccurate", v)}
            explain={form.ventricularFunctionExplain}
            onExplainChange={v => set("ventricularFunctionExplain", v)}
            showExplain={form.ventricularFunctionAccurate === "Some Deficiencies"}
          />
        </SectionCard>
      </>
    );
  }

  function renderStep5() {
    return (
      <>
        <SectionCard title="Doppler Settings">
          <RadioGroup
            label="Are Doppler waveform settings correct (Baseline/PRF-Scale)?"
            name="dopplerWaveformSettings"
            options={["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"]}
            value={form.dopplerWaveformSettings}
            onChange={v => set("dopplerWaveformSettings", v)}
            explain={form.dopplerWaveformExplain}
            onExplainChange={v => set("dopplerWaveformExplain", v)}
            showExplain={form.dopplerWaveformSettings === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Does the study demonstrate a forward flow spectrum for each of the valves?"
            name="forwardFlowSpectrum"
            options={["Yes", "N/A - Limited Exam", "No"]}
            value={form.forwardFlowSpectrum}
            onChange={v => set("forwardFlowSpectrum", v)}
            explain={form.forwardFlowExplain}
            onExplainChange={v => set("forwardFlowExplain", v)}
            showExplain={form.forwardFlowSpectrum === "No"}
          />

          <RadioGroup
            label="Are Doppler sample volumes and measurement calipers placed in the correct location/angle consistently?"
            name="dopplerSampleVolumes"
            options={["Yes", "Some Deficiencies", "N/A - Limited Exam", "No"]}
            value={form.dopplerSampleVolumes}
            onChange={v => set("dopplerSampleVolumes", v)}
            explain={form.dopplerSampleVolumesExplain}
            onExplainChange={v => set("dopplerSampleVolumesExplain", v)}
            showExplain={["Some Deficiencies", "No"].includes(form.dopplerSampleVolumes)}
          />

          <RadioGroup
            label="Were spectral envelope peaks clearly defined or attempted multiple times when difficult?"
            name="spectralEnvelopePeaks"
            options={["Yes", "N/A", "No"]}
            value={form.spectralEnvelopePeaks}
            onChange={v => set("spectralEnvelopePeaks", v)}
            explain={form.spectralEnvelopeExplain}
            onExplainChange={v => set("spectralEnvelopeExplain", v)}
            showExplain={form.spectralEnvelopePeaks === "No"}
          />
        </SectionCard>

        {isAETTE_PETTE_FE(et) && (
          <SectionCard title="Color Doppler">
            <RadioGroup
              label="Does the study demonstrate color flow interrogation of all normal and abnormal flows within the heart?"
              name="colorFlowInterrogation"
              options={["Yes", "N/A - Limited Exam", "No"]}
              value={form.colorFlowInterrogation}
              onChange={v => set("colorFlowInterrogation", v)}
              explain={form.colorFlowExplain}
              onExplainChange={v => set("colorFlowExplain", v)}
              showExplain={form.colorFlowInterrogation === "No"}
            />

            <RadioGroup
              label="Was Color Doppler utilized on both the IAS & IVS appropriately?"
              name="colorDopplerIasIvs"
              options={["Yes", "N/A - Limited Exam", "No"]}
              value={form.colorDopplerIasIvs}
              onChange={v => set("colorDopplerIasIvs", v)}
              explain={form.colorDopplerExplain}
              onExplainChange={v => set("colorDopplerExplain", v)}
              showExplain={form.colorDopplerIasIvs === "No"}
            />
          </SectionCard>
        )}

        {isAETTE(et) && (
          <SectionCard title="Diastolic Function">
            <CheckboxGroup
              label="Was Diastolic Function/LAP evaluated appropriately?"
              options={DIASTOLIC_EVAL_OPTIONS}
              values={form.diastolicFunctionEval}
              onChange={v => set("diastolicFunctionEval", v)}
              explain={form.diastolicFunctionEvalOther}
              onExplainChange={v => set("diastolicFunctionEvalOther", v)}
            />
          </SectionCard>
        )}

        {isAETTE_PETTE_FE(et) && (
          <SectionCard title="Pulmonary Vein">
            <RadioGroup
              label="Was Pulmonary Vein Inflow Doppler measured/assessed properly (if applicable)?"
              name="pulmonaryVeinInflow"
              options={["Yes", "N/A", "No"]}
              value={form.pulmonaryVeinInflow}
              onChange={v => set("pulmonaryVeinInflow", v)}
              explain={form.pulmonaryVeinInflowExplain}
              onExplainChange={v => set("pulmonaryVeinInflowExplain", v)}
              showExplain={form.pulmonaryVeinInflow === "No"}
            />
          </SectionCard>
        )}

        {isAETTE_PETTE(et) && (
          <SectionCard title="Right Heart Function">
            <CheckboxGroup
              label="Was Right Heart Function evaluated appropriately?"
              options={RIGHT_HEART_OPTIONS}
              values={form.rightHeartFunctionEval}
              onChange={v => set("rightHeartFunctionEval", v)}
              explain={form.rightHeartFunctionEvalOther}
              onExplainChange={v => set("rightHeartFunctionEvalOther", v)}
            />

            {isAETTE(et) && (
              <RadioGroup
                label="Were TAPSE measurements performed accurately?"
                name="tapseAccurate"
                options={["Yes", "N/A", "No"]}
                value={form.tapseAccurate}
                onChange={v => set("tapseAccurate", v)}
                explain={form.tapseExplain}
                onExplainChange={v => set("tapseExplain", v)}
                showExplain={form.tapseAccurate === "No"}
              />
            )}

            <RadioGroup
              label="Was Tissue Doppler adequate and measured/assessed properly?"
              name="tissueDopplerAdequate"
              options={["Yes", "N/A", "No"]}
              value={form.tissueDopplerAdequate}
              onChange={v => set("tissueDopplerAdequate", v)}
              explain={form.tissueDopplerExplain}
              onExplainChange={v => set("tissueDopplerExplain", v)}
              showExplain={form.tissueDopplerAdequate === "No"}
            />
          </SectionCard>
        )}
      </>
    );
  }

  function renderStep6() {
    return (
      <>
        <SectionCard title="Aortic Valve">
          <RadioGroup
            label="Is the Aortic Valve evaluated with Color/CW Doppler appropriately?"
            name="aorticValveEval"
            options={["Yes", "N/A", "No"]}
            value={form.aorticValveEval}
            onChange={v => set("aorticValveEval", v)}
            explain={form.aorticValveExplain}
            onExplainChange={v => set("aorticValveExplain", v)}
            showExplain={form.aorticValveEval === "No"}
          />

          <RadioGroup
            label="Is the LVOT pulsed Doppler sample volume placed in the correct location?"
            name="lvotSampleVolume"
            options={["Yes", "N/A", "No"]}
            value={form.lvotSampleVolume}
            onChange={v => set("lvotSampleVolume", v)}
            explain={form.lvotSampleVolumeExplain}
            onExplainChange={v => set("lvotSampleVolumeExplain", v)}
            showExplain={form.lvotSampleVolume === "No"}
          />

          {isAETTE(et) && (
            <>
              <RadioGroup
                label="If Aortic Stenosis was present, was the dedicated Pedoff CW transducer utilized from multiple views?"
                name="pedoffCwUtilized"
                options={["Yes", "N/A (Limited Exam or No AS >2m/s)", "No"]}
                value={form.pedoffCwUtilized}
                onChange={v => set("pedoffCwUtilized", v)}
                explain={form.pedoffCwUtilizedOther}
                onExplainChange={v => set("pedoffCwUtilizedOther", v)}
                showExplain={form.pedoffCwUtilized === "No"}
              />
              <RadioGroup
                label="Was a clear envelope obtained using the dedicated Pedoff CW transducer (if applicable)?"
                name="pedoffCwEnvelope"
                options={["Yes", "N/A (Limited Exam or No AS >2m/s)", "No"]}
                value={form.pedoffCwEnvelope}
                onChange={v => set("pedoffCwEnvelope", v)}
                explain={form.pedoffCwEnvelopeOther}
                onExplainChange={v => set("pedoffCwEnvelopeOther", v)}
                showExplain={form.pedoffCwEnvelope === "No"}
              />
              <RadioGroup
                label="Were the dedicated Pedoff CW transducer views labelled according to view location (ie. Apical, RSB, Subcostal, SSN)?"
                name="pedoffCwLabelled"
                options={["Yes", "N/A (Limited Exam or No AS >2m/s)", "No"]}
                value={form.pedoffCwLabelled}
                onChange={v => set("pedoffCwLabelled", v)}
                explain={form.pedoffCwLabelledOther}
                onExplainChange={v => set("pedoffCwLabelledOther", v)}
                showExplain={form.pedoffCwLabelled === "No"}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="Mitral Valve">
          <RadioGroup
            label="Is the Mitral Valve evaluated with 2D/Color/CW/PW Doppler appropriately?"
            name="mitralValveEval"
            options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.mitralValveEval}
            onChange={v => set("mitralValveEval", v)}
            explain={form.mitralValveExplain}
            onExplainChange={v => set("mitralValveExplain", v)}
            showExplain={form.mitralValveEval === "Deficiencies Noted"}
          />

          {isAETTE(et) && (
            <>
              <RadioGroup
                label="If significant Mitral Regurgitation is present, was it evaluated with appropriate methods (ie. PISA, ERO, Vena Contracta)?"
                name="pisaEroEval"
                options={["Yes", "N/A (limited exam, eccentric jet, no significant MR)", "No (more than mild MR present & no PISA/ERO performed)"]}
                value={form.pisaEroEval}
                onChange={v => set("pisaEroEval", v)}
                explain={form.pisaEroExplain}
                onExplainChange={v => set("pisaEroExplain", v)}
                showExplain={form.pisaEroEval.startsWith("No")}
              />
              <RadioGroup
                label="Were PISA, ERO, Vena Contracta measurements performed correctly (ie. baseline shift), if applicable?"
                name="pisaEroMeasurements"
                options={["Yes", "N/A (limited exam, eccentric jet, no significant MR)", "No"]}
                value={form.pisaEroMeasurements}
                onChange={v => set("pisaEroMeasurements", v)}
                explain={form.pisaEroMeasurementsOther}
                onExplainChange={v => set("pisaEroMeasurementsOther", v)}
                showExplain={form.pisaEroMeasurements === "No"}
              />
            </>
          )}
        </SectionCard>

        <SectionCard title="Other Valves">
          <RadioGroup
            label="Is the Tricuspid Valve evaluated with 2D/Color/CW Doppler appropriately?"
            name="tricuspidValveEval"
            options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.tricuspidValveEval}
            onChange={v => set("tricuspidValveEval", v)}
            explain={form.tricuspidValveExplain}
            onExplainChange={v => set("tricuspidValveExplain", v)}
            showExplain={form.tricuspidValveEval === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Is the Pulmonic Valve evaluated with 2D/Color/CW/PW Doppler appropriately?"
            name="pulmonicValveEval"
            options={["Yes", "N/A", "Deficiencies Noted"]}
            value={form.pulmonicValveEval}
            onChange={v => set("pulmonicValveEval", v)}
            explain={form.pulmonicValveExplain}
            onExplainChange={v => set("pulmonicValveExplain", v)}
            showExplain={form.pulmonicValveEval === "Deficiencies Noted"}
          />
        </SectionCard>

        <SectionCard title="Additional Imaging & Overall Findings">
          <CheckboxGroup
            label="Additional Imaging Methods"
            options={ADDITIONAL_IMAGING_OPTIONS}
            values={form.additionalImagingMethods}
            onChange={v => set("additionalImagingMethods", v)}
          />
          {form.additionalImagingMethods.includes("Other") && (
            <div className="mb-4">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Other (specify)</Label>
              <Input value={form.additionalImagingMethodsOther} onChange={e => set("additionalImagingMethodsOther", e.target.value)} />
            </div>
          )}

          {isAETTE(et) && (
            <RadioGroup
              label="If strain imaging / speckle tracking was performed, was it performed correctly with correct reporting (ie. Bullet Export)?"
              name="strainCorrect"
              options={["Yes", "N/A - Strain Not Performed", "No"]}
              value={form.strainCorrect}
              onChange={v => set("strainCorrect", v)}
              explain={form.strainCorrectOther}
              onExplainChange={v => set("strainCorrectOther", v)}
              showExplain={form.strainCorrect === "No"}
            />
          )}

          <RadioGroup
            label="Are 2D images optimized appropriately (Gain/Depth/Focus/Sector)?"
            name="images2dOptimized"
            options={["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"]}
            value={form.images2dOptimized}
            onChange={v => set("images2dOptimized", v)}
            explain={form.images2dOptimizedExplain}
            onExplainChange={v => set("images2dOptimizedExplain", v)}
            showExplain={form.images2dOptimized === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Are measurements placed accurately? (ie. correct cardiac cycle timing, correct placement per ASE guidelines)"
            name="measurementsAccurateSummary"
            options={["Excellent", "Adequate", "N/A", "Deficiencies Noted"]}
            value={form.measurementsAccurateSummary}
            onChange={v => set("measurementsAccurateSummary", v)}
            explain={form.measurementsAccurateExplain}
            onExplainChange={v => set("measurementsAccurateExplain", v)}
            showExplain={form.measurementsAccurateSummary === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Are Color/Doppler settings optimized appropriately (Gain/Sector/Angle/Baseline/PRF-Scale)?"
            name="dopplerSettingsSummary"
            options={["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"]}
            value={form.dopplerSettingsSummary}
            onChange={v => set("dopplerSettingsSummary", v)}
            explain={form.dopplerSettingsExplain}
            onExplainChange={v => set("dopplerSettingsExplain", v)}
            showExplain={form.dopplerSettingsSummary === "Deficiencies Noted"}
          />

          <RadioGroup
            label="Was the department protocol image sequence followed?"
            name="protocolSequence"
            options={[
              "Complete (to BEST ability)",
              "Minor Deficiencies Noted (missing measurements)",
              "Minor Deficiencies Noted (out of protocol sequence)",
              "Minor Deficiencies Noted (see review comments)",
              "Moderate Deficiencies Noted (missing images/measurements/documentation)",
              "Major Deficiencies Noted (missing views/images/measurements)",
            ]}
            value={form.protocolSequence}
            onChange={v => set("protocolSequence", v)}
            explain={form.protocolSequenceExplain}
            onExplainChange={v => set("protocolSequenceExplain", v)}
            showExplain={form.protocolSequence.includes("Deficiencies")}
          />

          <RadioGroup
            label="Was all pathology documented/measured/evaluated appropriately?"
            name="pathologyDocumented"
            options={["Yes", "N/A", "No"]}
            value={form.pathologyDocumented}
            onChange={v => set("pathologyDocumented", v)}
            explain={form.pathologyDocumentedExplain}
            onExplainChange={v => set("pathologyDocumentedExplain", v)}
            showExplain={form.pathologyDocumented === "No"}
          />

          <RadioGroup
            label="Was all pathology documented/measured/evaluated appropriately and the overall clinical concern/question answered?"
            name="clinicalQuestionAnswered"
            options={["Yes", "No"]}
            value={form.clinicalQuestionAnswered}
            onChange={v => set("clinicalQuestionAnswered", v)}
            explain={form.clinicalQuestionExplain}
            onExplainChange={v => set("clinicalQuestionExplain", v)}
            showExplain={form.clinicalQuestionAnswered === "No"}
          />

          <RadioGroup
            label="Is the sonographer preliminary report concordant with final physician report?"
            name="concordantWithPhysician"
            options={["Yes", "N/A - NOT COMPLETED", "N/A - UNABLE TO CONFIRM", "No"]}
            value={form.concordantWithPhysician}
            onChange={v => set("concordantWithPhysician", v)}
            explain={form.concordantExplain}
            onExplainChange={v => set("concordantExplain", v)}
            showExplain={form.concordantWithPhysician === "No"}
          />

          <div className="mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Is the exam comparable to the previous study, if applicable?</Label>
            <Select value={form.comparableToPrevious} onValueChange={v => set("comparableToPrevious", v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {["Yes - Comparable", "No - Not Comparable", "N/A - No Prior Study", "N/A - Limited Exam"].map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Are the images in this case acceptable for submission to the IAC?</Label>
            <Select value={form.iacAcceptable} onValueChange={v => set("iacAcceptable", v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {["Yes", "No", "N/A"].map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
      </>
    );
  }

  function renderStep7() {
    return (
      <SectionCard title="Review Summary">
        <div className="mb-5">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Quality Score (1–10)</Label>
          <Select value={form.qualityScore} onValueChange={v => set("qualityScore", v)}>
            <SelectTrigger><SelectValue placeholder="Select score..." /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-5">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Review Comments</Label>
          <Textarea
            value={form.reviewComments}
            onChange={e => set("reviewComments", e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter review comments..."
          />
        </div>

        {/* Notify Admin */}
        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Would you like to send this review result directly to an administrator/manager?</Label>
          <Select value={form.notifyAdmin} onValueChange={v => set("notifyAdmin", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.notifyAdmin === "Yes" && (
          <>
            <div className="mb-3">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Administrator/Manager Email</Label>
              <Input type="email" value={form.notifyAdminEmail} onChange={e => set("notifyAdminEmail", e.target.value)} placeholder="admin@example.com" />
            </div>
            <div className="mb-5">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Comments to Administrator/Manager</Label>
              <Textarea value={form.notifyAdminComments} onChange={e => set("notifyAdminComments", e.target.value)} className="min-h-[80px]" />
            </div>
          </>
        )}

        {/* Notify Sonographer */}
        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Would you like to send this review result directly to the performing sonographer?</Label>
          <Select value={form.notifySonographer} onValueChange={v => set("notifySonographer", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.notifySonographer === "Yes" && (
          <>
            <div className="mb-3">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sonographer Email</Label>
              <Input type="email" value={form.notifySonographerEmail} onChange={e => set("notifySonographerEmail", e.target.value)} placeholder="sonographer@example.com" />
            </div>
            <div className="mb-5">
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Comments to Sonographer</Label>
              <Textarea value={form.notifySonographerComments} onChange={e => set("notifySonographerComments", e.target.value)} className="min-h-[80px]" />
            </div>
          </>
        )}
      </SectionCard>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    const successContent = (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: BRAND + "18" }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: BRAND }} />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Review Submitted!</h2>
        <p className="text-gray-500 text-sm max-w-md mb-8">Your image quality review has been saved successfully.</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={() => { setForm(EMPTY_FORM); setStep(1); setSubmitted(false); }} style={{ background: BRAND }}>
            Submit Another Review
          </Button>
          {!embedded && (
            <Link href="/diy-accreditation">
              <Button variant="outline">Back to DIY Accreditation</Button>
            </Link>
          )}
        </div>
      </div>
    );
    if (embedded) return successContent;
    return <Layout>{successContent}</Layout>;
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  const progress = Math.round(((step - 1) / TOTAL_STEPS) * 100);

  const content = (
    <div ref={formTopRef}>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-8 md:py-10">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/diy-accreditation">
              <button className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> DIY Accreditation
              </button>
            </Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-white/60 text-xs">Image Quality Review</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Image Quality Review
              </h1>
              <p className="text-[#4ad9e0] text-sm font-medium">Quality Review — Step {step} of {TOTAL_STEPS}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: BRAND }} />
      </div>

      {/* Step tabs */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="container flex gap-0">
          {STEP_TITLES.map((title, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={n}
                onClick={() => goToStep(n)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active ? "border-[#189aa1] text-[#189aa1]" : done ? "border-transparent text-gray-400 hover:text-gray-600" : "border-transparent text-gray-300"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  active ? "bg-[#189aa1] text-white" : done ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"
                }`}>{n}</span>
                {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="container py-6 max-w-3xl">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => goToStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => goToStep(step + 1)}
              className="flex items-center gap-2 text-white"
              style={{ background: BRAND }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 text-white"
              style={{ background: BRAND }}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Review"}
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return content;
  return <Layout>{content}</Layout>;
}
