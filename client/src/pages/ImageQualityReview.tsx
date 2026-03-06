/*
  iHeartEcho — Image Quality Review™
  Full rebuild from Formsite IMAGE-QUALITY-REVIEW API
  6 exam types, full branching logic, auto-queried staff dropdowns from Lab Admin
*/
import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import {
  ChevronLeft, ChevronRight, FileText, Download, CheckCircle2,
  ClipboardList, Eye, Stethoscope, Activity, BarChart2, Save,
  Trash2, Plus, Users, RefreshCw,
} from "lucide-react";
import {
  EXAM_TYPES, STRESS_TYPES, INDICATION_OPTIONS, GAIN_DEPTH_FOCAL_OPTIONS,
  COLORIZE_ZOOM_OPTIONS, YES_NO_NA, YES_NO, ADEQUATE_DEFICIENT,
  COMPLETE_OPTIONS, PROTOCOL_SEQUENCE_OPTIONS, ON_AXIS_OPTIONS,
  EFFORT_SUBOPTIMAL_OPTIONS, CONTRAST_USE_OPTIONS, CONTRAST_SETTINGS_OPTIONS,
  PSAX_LV_OPTIONS, VENTRICULAR_FUNCTION_OPTIONS, EF_MEASUREMENTS_OPTIONS,
  SIMPSONS_OPTIONS, LA_VOLUME_OPTIONS, DOPPLER_SETTINGS_OPTIONS,
  DOPPLER_MEASUREMENTS_OPTIONS, PEDOFF_OPTIONS, MR_EVAL_OPTIONS, PISA_OPTIONS,
  STRAIN_CORRECT_OPTIONS, IAC_OPTIONS, REPORT_CONCORDANT_OPTIONS,
  COMPARABLE_OPTIONS, IMAGE_OPT_SUMMARY_OPTIONS, DIASTOLOGY_OPTIONS,
  RH_SYSTOLIC_OPTIONS, ADDITIONAL_IMAGING_OPTIONS, SCANNING_TIME_OPTIONS,
  DIASTOLIC_FUNCTION_OPTIONS, RIGHT_HEART_OPTIONS, REQUIRED_VIEWS,
  EMPTY_FORM, calculateQualityScore, getScoreTier,
  type IQRFormData, type ExamType,
} from "./iqr/iqrData";

const TEAL = "#189aa1";

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Header Info",        shortLabel: "Header",    icon: FileText },
  { id: 2, label: "Exam Info",          shortLabel: "Exam",      icon: ClipboardList },
  { id: 3, label: "Required Views",     shortLabel: "Views",     icon: Eye },
  { id: 4, label: "Image Quality",      shortLabel: "Image",     icon: Eye },
  { id: 5, label: "Measurements",       shortLabel: "Measure",   icon: BarChart2 },
  { id: 6, label: "Doppler Quality",    shortLabel: "Doppler",   icon: Activity },
  { id: 7, label: "Cardiac Evaluation", shortLabel: "Cardiac",   icon: Stethoscope },
  { id: 8, label: "Additional",         shortLabel: "Additional",icon: Plus },
  { id: 9, label: "Summary",            shortLabel: "Summary",   icon: CheckCircle2 },
];

// ─── Reusable UI components ───────────────────────────────────────────────────
function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
      {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
    </label>
  );
}

function RadioGroup({ name, options, value, onChange, cols = 1 }: {
  name: string; options: string[]; value: string;
  onChange: (v: string) => void; cols?: number;
}) {
  return (
    <div className={`mt-1 grid gap-1.5 ${cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
      {options.map(opt => (
        <label key={opt} className={`flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all ${value === opt ? "border-[#189aa1] bg-[#189aa1]/8 font-medium" : "border-gray-200 hover:border-[#189aa1]/40 bg-white"}`}>
          <input
            type="radio" name={name} value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-[#189aa1] w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <span className="text-sm text-gray-700 leading-snug">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, values, onChange }: {
  name: string; options: string[]; values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter(v => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };
  return (
    <div className="mt-1 space-y-1.5">
      {options.map(opt => (
        <label key={opt} className={`flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all ${values.includes(opt) ? "border-[#189aa1] bg-[#189aa1]/8 font-medium" : "border-gray-200 hover:border-[#189aa1]/40 bg-white"}`}>
          <input
            type="checkbox"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
            className="accent-[#189aa1] w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <span className="text-sm text-gray-700 leading-snug">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SelectField({ options, value, onChange, placeholder }: {
  options: string[]; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white resize-none"
    />
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-[#189aa1] uppercase tracking-wider mb-3 pb-1 border-b border-[#189aa1]/20">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} hint={hint} />
      {children}
    </div>
  );
}

// ─── Staff dropdown with auto-query + free-text fallback ──────────────────────
function StaffDropdown({
  label, roleFilter, staffList, selectedId, freeText,
  onIdChange, onTextChange, placeholder,
}: {
  label: string;
  roleFilter: "sonographer" | "physician";
  staffList: { id: number; name: string; role: string }[];
  selectedId: string;
  freeText: string;
  onIdChange: (id: string) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
}) {
  const filtered = staffList.filter(m =>
    roleFilter === "sonographer"
      ? ["sonographer", "admin", "reviewer"].includes(m.role)
      : ["physician", "admin"].includes(m.role)
  );
  const hasStaff = filtered.length > 0;

  return (
    <div>
      <FieldLabel label={label} />
      {hasStaff ? (
        <div className="space-y-2">
          <select
            value={selectedId}
            onChange={e => { onIdChange(e.target.value); if (e.target.value) onTextChange(""); }}
            className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
          >
            <option value="">— Select from Lab Admin staff —</option>
            {filtered.map(m => (
              <option key={m.id} value={String(m.id)}>{m.name}</option>
            ))}
            <option value="__other__">Other (enter manually)</option>
          </select>
          {(selectedId === "__other__" || (!selectedId && freeText)) && (
            <input
              type="text"
              value={freeText}
              onChange={e => { onTextChange(e.target.value); onIdChange("__other__"); }}
              placeholder={placeholder ?? `Enter ${label.toLowerCase()} name`}
              className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
            />
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            value={freeText}
            onChange={e => onTextChange(e.target.value)}
            placeholder={placeholder ?? `Enter ${label.toLowerCase()} name`}
            className="w-full border border-[#189aa1]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#189aa1]/40 bg-white"
          />
          <p className="text-xs text-gray-400">Add staff in Lab Admin to enable dropdown selection</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ImageQualityReview() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IQRFormData>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-query lab staff
  const { data: labStaff, isLoading: staffLoading } = trpc.iqr.getLabStaffForReview.useQuery();
  const allStaff = labStaff ? [...labStaff.sonographers, ...labStaff.physicians] : [];

  const utils = trpc.useUtils();
  const createMutation = trpc.iqr.create.useMutation({
    onSuccess: () => {
      toast.success("Review saved successfully!");
      utils.iqr.list.invalidate();
      utils.iqr.getStats.invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.iqr.update.useMutation({
    onSuccess: () => {
      toast.success("Review updated!");
      utils.iqr.list.invalidate();
      setEditingId(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.iqr.delete.useMutation({
    onSuccess: () => { toast.success("Review deleted."); utils.iqr.list.invalidate(); },
  });

  const { data: reviews } = trpc.iqr.list.useQuery({ limit: 50, offset: 0 });
  const { data: stats } = trpc.iqr.getStats.useQuery();

  const qualityScore = useMemo(() => calculateQualityScore(form), [form]);
  const scoreTier = useMemo(() => getScoreTier(qualityScore), [qualityScore]);

  const set = useCallback(<K extends keyof IQRFormData>(key: K, val: IQRFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setStep(1);
    setEditingId(null);
  }

  function loadReview(r: typeof reviews extends (infer T)[] | undefined ? T : never) {
    if (!r) return;
    const f: IQRFormData = { ...EMPTY_FORM };
    Object.keys(f).forEach(k => {
      const key = k as keyof IQRFormData;
      const val = (r as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) {
        if (Array.isArray(f[key])) {
          try {
            (f as Record<string, unknown>)[key] = typeof val === "string" ? JSON.parse(val) : val;
          } catch { (f as Record<string, unknown>)[key] = []; }
        } else {
          (f as Record<string, unknown>)[key] = String(val);
        }
      }
    });
    setForm(f);
    setEditingId((r as { id: number }).id);
    setStep(1);
    setShowHistory(false);
  }

  function handleSubmit() {
    const sonographerName = form.performingSonographerId && form.performingSonographerId !== "__other__"
      ? allStaff.find(s => String(s.id) === form.performingSonographerId)?.name ?? form.performingSonographerText
      : form.performingSonographerText;
    const physicianName = form.interpretingPhysicianId && form.interpretingPhysicianId !== "__other__"
      ? allStaff.find(s => String(s.id) === form.interpretingPhysicianId)?.name ?? form.interpretingPhysicianText
      : form.interpretingPhysicianText;

    // Strip UI-only fields that aren't in the router schema
    const {
      requiredViews, diastolicFunctionEval, rightHeartFunctionEval,
      additionalImagingMethods, performingSonographerId, performingSonographerText,
      interpretingPhysicianId, interpretingPhysicianText,
      ...formRest
    } = form;

    const payload = {
      ...formRest,
      performingSonographer: sonographerName,
      interpretingPhysician: physicianName,
      protocolViews: JSON.stringify(requiredViews),
      diastolicFunctionEval: JSON.stringify(diastolicFunctionEval),
      rightHeartFunctionEval: JSON.stringify(rightHeartFunctionEval),
      additionalImagingMethods: JSON.stringify(additionalImagingMethods),
      qualityScore,
      imagingTimeMinutes: form.imagingTimeMinutes ? parseInt(form.imagingTimeMinutes) : undefined,
      comparableToPrevious: form.comparableToPrevious,
      // Link to lab member if selected from dropdown
      revieweeLabMemberId: form.performingSonographerId && form.performingSonographerId !== "__other__"
        ? parseInt(form.performingSonographerId) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const examType = form.examType as ExamType | "";
  const isStress = examType === "ADULT STRESS";
  const isTEE = examType === "ADULT TEE" || examType === "PEDIATRIC TEE";
  const isFetal = examType === "FETAL ECHO";
  const isPed = examType === "PEDIATRIC TTE" || examType === "PEDIATRIC TEE";
  const requiredViews = examType ? REQUIRED_VIEWS[examType as ExamType] ?? [] : [];

  // ─── Step renderers ──────────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <>
        <FormSection title="Review Header">
          <FormField label="Review Type" required>
            <RadioGroup name="reviewType" options={["QUALITY REVIEW", "PEER REVIEW"]}
              value={form.reviewType} onChange={v => set("reviewType", v)} cols={2} />
          </FormField>
          <FormField label="Organization / Facility Name">
            <TextInput value={form.organization} onChange={v => set("organization", v)}
              placeholder="e.g. Regional Medical Center" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date Review Completed" required>
              <TextInput type="date" value={form.dateReviewCompleted}
                onChange={v => set("dateReviewCompleted", v)} />
            </FormField>
            <FormField label="Exam Date of Service" required>
              <TextInput type="date" value={form.examDos}
                onChange={v => set("examDos", v)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Exam Identifier (LAS / FIR / MRN)" required>
              <TextInput value={form.examIdentifier} onChange={v => set("examIdentifier", v)}
                placeholder="e.g. MRN-12345" />
            </FormField>
            <FormField label="Patient DOB">
              <TextInput type="date" value={form.dob} onChange={v => set("dob", v)} />
            </FormField>
          </div>
          <FormField label="Facility Location">
            <TextInput value={form.facilityLocation} onChange={v => set("facilityLocation", v)}
              placeholder="e.g. Main Hospital, Outpatient Center" />
          </FormField>
        </FormSection>

        <FormSection title="Staff">
          {staffLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading lab staff...
            </div>
          )}
          {labStaff?.labName && (
            <div className="flex items-center gap-2 text-xs text-[#189aa1] bg-[#189aa1]/8 rounded-lg px-3 py-2 mb-2">
              <Users className="w-3.5 h-3.5" />
              Lab: <strong>{labStaff.labName}</strong> — staff loaded automatically
            </div>
          )}
          <StaffDropdown
            label="Performing Sonographer"
            roleFilter="sonographer"
            staffList={allStaff}
            selectedId={form.performingSonographerId}
            freeText={form.performingSonographerText}
            onIdChange={v => set("performingSonographerId", v)}
            onTextChange={v => set("performingSonographerText", v)}
            placeholder="e.g. Smith, Jane"
          />
          <StaffDropdown
            label="Interpreting Physician"
            roleFilter="physician"
            staffList={allStaff}
            selectedId={form.interpretingPhysicianId}
            freeText={form.interpretingPhysicianText}
            onIdChange={v => set("interpretingPhysicianId", v)}
            onTextChange={v => set("interpretingPhysicianText", v)}
            placeholder="e.g. Johnson, MD"
          />
          <FormField label="Referring Physician">
            <TextInput value={form.referringPhysician} onChange={v => set("referringPhysician", v)}
              placeholder="e.g. Williams, MD" />
          </FormField>
        </FormSection>
      </>
    );
  }

  function renderStep2() {
    return (
      <>
        <FormSection title="Exam Information">
          <FormField label="Exam Type" required>
            <SelectField options={[...EXAM_TYPES]} value={form.examType}
              onChange={v => { set("examType", v as ExamType); set("requiredViews", []); }}
              placeholder="Select exam type..." />
          </FormField>

          {isStress && (
            <FormField label="What type of stress study was performed?" required>
              <RadioGroup name="stressType" options={[...STRESS_TYPES]}
                value={form.stressType} onChange={v => set("stressType", v)} />
            </FormField>
          )}

          {!isStress && !isFetal && (
            <FormField label="Limited / Complete Exam">
              <RadioGroup name="examScope" options={["Complete Exam", "Limited Exam"]}
                value={form.examScope} onChange={v => set("examScope", v)} cols={2} />
            </FormField>
          )}

          <FormField label="Exam Indication">
            <TextInput value={form.examIndication} onChange={v => set("examIndication", v)}
              placeholder="e.g. Chest pain, dyspnea, valvular disease" />
          </FormField>

          <FormField label="Indication Appropriateness">
            <SelectField options={INDICATION_OPTIONS} value={form.indicationAppropriateness}
              onChange={v => set("indicationAppropriateness", v)}
              placeholder="Select appropriateness..." />
          </FormField>

          <FormField label="Are patient demographics, charges, reporting and charting notes entered appropriately and accurately?">
            <RadioGroup name="demographicsAccurate" options={YES_NO}
              value={form.demographicsAccurate} onChange={v => set("demographicsAccurate", v)} cols={2} />
          </FormField>
        </FormSection>
      </>
    );
  }

  function renderStep3() {
    if (!examType) {
      return (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please select an exam type in Step 2 first.</p>
        </div>
      );
    }

    const allSelected = requiredViews.length > 0 && form.requiredViews.length === requiredViews.length;
    const pct = requiredViews.length > 0 ? Math.round((form.requiredViews.length / requiredViews.length) * 100) : 0;

    return (
      <FormSection title={`Required Views — ${examType} (${form.requiredViews.length}/${requiredViews.length})`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2 mr-3">
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: TEAL }} />
          </div>
          <span className="text-xs font-bold" style={{ color: TEAL }}>{pct}%</span>
          <button
            type="button"
            onClick={() => set("requiredViews", allSelected ? [] : [...requiredViews])}
            className="ml-3 text-xs px-2 py-1 rounded border border-[#189aa1]/40 text-[#189aa1] hover:bg-[#189aa1]/8"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
        <CheckboxGroup
          name="requiredViews"
          options={requiredViews}
          values={form.requiredViews}
          onChange={v => set("requiredViews", v)}
        />
      </FormSection>
    );
  }

  function renderStep4() {
    return (
      <>
        <FormSection title="2D Image Quality Settings">
          <FormField label="2D Gain Settings">
            <RadioGroup name="gainSettings" options={GAIN_DEPTH_FOCAL_OPTIONS}
              value={form.gainSettings} onChange={v => set("gainSettings", v)} cols={3} />
          </FormField>
          <FormField label="Depth Settings">
            <RadioGroup name="depthSettings" options={GAIN_DEPTH_FOCAL_OPTIONS}
              value={form.depthSettings} onChange={v => set("depthSettings", v)} cols={3} />
          </FormField>
          <FormField label="Focal Zone Settings">
            <RadioGroup name="focalZoneSettings" options={GAIN_DEPTH_FOCAL_OPTIONS}
              value={form.focalZoneSettings} onChange={v => set("focalZoneSettings", v)} cols={3} />
          </FormField>
          <FormField label="Colorize Settings">
            <RadioGroup name="colorizeSettings" options={COLORIZE_ZOOM_OPTIONS}
              value={form.colorizeSettings} onChange={v => set("colorizeSettings", v)} cols={3} />
          </FormField>
          <FormField label="Zoom Settings">
            <RadioGroup name="zoomSettings" options={COLORIZE_ZOOM_OPTIONS}
              value={form.zoomSettings} onChange={v => set("zoomSettings", v)} cols={3} />
          </FormField>
          <FormField label="ECG on Image Display">
            <RadioGroup name="ecgDisplay" options={YES_NO}
              value={form.ecgDisplay} onChange={v => set("ecgDisplay", v)} cols={2} />
          </FormField>
        </FormSection>

        <FormSection title="Contrast / UEA">
          <FormField label="Was contrast/UAE used if it was appropriate to do so?">
            <RadioGroup name="contrastUseAppropriate" options={CONTRAST_USE_OPTIONS}
              value={form.contrastUseAppropriate} onChange={v => set("contrastUseAppropriate", v)} />
          </FormField>
          {form.contrastUseAppropriate?.startsWith("Yes") && (
            <FormField label="If contrast was used, were the settings appropriate for contrast imaging?">
              <RadioGroup name="contrastSettingsAppropriate" options={CONTRAST_SETTINGS_OPTIONS}
                value={form.contrastSettingsAppropriate}
                onChange={v => set("contrastSettingsAppropriate", v)} cols={3} />
            </FormField>
          )}
        </FormSection>

        <FormSection title="On-Axis Imaging">
          <FormField label="Does the study demonstrate standard on axis imaging planes without foreshortening?">
            <RadioGroup name="onAxisImaging" options={ON_AXIS_OPTIONS}
              value={form.onAxisImaging} onChange={v => set("onAxisImaging", v)} />
          </FormField>
          <FormField label="Was an effort made to better define any suboptimal views?">
            <RadioGroup name="effortSuboptimalViews" options={EFFORT_SUBOPTIMAL_OPTIONS}
              value={form.effortSuboptimalViews} onChange={v => set("effortSuboptimalViews", v)} />
          </FormField>
        </FormSection>
      </>
    );
  }

  function renderStep5() {
    return (
      <>
        <FormSection title="2D Measurements">
          <FormField label="Were all protocol measurements obtained?">
            <RadioGroup name="measurements2dComplete" options={COMPLETE_OPTIONS}
              value={form.measurements2dComplete} onChange={v => set("measurements2dComplete", v)} />
          </FormField>
          <FormField label="Are 2D measurements placed accurately in the correct window/location/angle/anatomy landmarks/ECG cycle?">
            <RadioGroup name="measurements2dAccurate" options={YES_NO}
              value={form.measurements2dAccurate} onChange={v => set("measurements2dAccurate", v)} cols={2} />
          </FormField>
          {!isTEE && !isFetal && (
            <FormField label="PSAX LV — Was the complete LV series obtained?">
              <RadioGroup name="psaxLvComplete" options={PSAX_LV_OPTIONS}
                value={form.psaxLvComplete} onChange={v => set("psaxLvComplete", v)} />
            </FormField>
          )}
        </FormSection>

        <FormSection title="Ventricular Function">
          <FormField label="Does the study accurately measure ventricular function?">
            <RadioGroup name="ventricularFunctionAccurate" options={VENTRICULAR_FUNCTION_OPTIONS}
              value={form.ventricularFunctionAccurate}
              onChange={v => set("ventricularFunctionAccurate", v)} cols={2} />
          </FormField>
          {!isFetal && (
            <>
              <FormField label="Are 2D and/or M-Mode EF measurements obtained accurately?">
                <RadioGroup name="efMeasurementsAccurate" options={EF_MEASUREMENTS_OPTIONS}
                  value={form.efMeasurementsAccurate}
                  onChange={v => set("efMeasurementsAccurate", v)} cols={3} />
              </FormField>
              {!isTEE && (
                <FormField label="Are Simpson's EF measurements placed accurately, in the correct window?">
                  <RadioGroup name="simpsonsEfAccurate" options={SIMPSONS_OPTIONS}
                    value={form.simpsonsEfAccurate}
                    onChange={v => set("simpsonsEfAccurate", v)} />
                </FormField>
              )}
              <FormField label="Is LA volume measured accurately?">
                <RadioGroup name="laVolumeAccurate" options={LA_VOLUME_OPTIONS}
                  value={form.laVolumeAccurate}
                  onChange={v => set("laVolumeAccurate", v)} />
              </FormField>
            </>
          )}
        </FormSection>
      </>
    );
  }

  function renderStep6() {
    return (
      <>
        <FormSection title="Doppler Settings">
          <FormField label="Are Doppler waveform settings correct (Baseline/PRF-Scale)?">
            <RadioGroup name="dopplerWaveformSettings" options={DOPPLER_SETTINGS_OPTIONS}
              value={form.dopplerWaveformSettings}
              onChange={v => set("dopplerWaveformSettings", v)} cols={3} />
          </FormField>
          <FormField label="Are Doppler measurements accurate (correct placement/no contrast blooming)?">
            <RadioGroup name="dopplerMeasurementAccuracy" options={DOPPLER_MEASUREMENTS_OPTIONS}
              value={form.dopplerMeasurementAccuracy}
              onChange={v => set("dopplerMeasurementAccuracy", v)} cols={3} />
          </FormField>
        </FormSection>

        <FormSection title="Spectral Doppler">
          {!isStress && (
            <FormField label="Does the study demonstrate a forward flow spectrum for each of the valves?">
              <RadioGroup name="forwardFlowSpectrum" options={YES_NO}
                value={form.forwardFlowSpectrum}
                onChange={v => set("forwardFlowSpectrum", v)} cols={2} />
            </FormField>
          )}
          <FormField label="Are PW Doppler sample volumes placed in the correct location consistently?">
            <RadioGroup name="pwDopplerPlacement" options={YES_NO}
              value={form.pwDopplerPlacement}
              onChange={v => set("pwDopplerPlacement", v)} cols={2} />
          </FormField>
          <FormField label="Are CW Doppler sample volumes placed in the correct location/angle consistently?">
            <RadioGroup name="cwDopplerPlacement" options={YES_NO}
              value={form.cwDopplerPlacement}
              onChange={v => set("cwDopplerPlacement", v)} cols={2} />
          </FormField>
          <FormField label="Were spectral envelope peaks clearly defined or attempted multiple times when difficult?">
            <RadioGroup name="spectralEnvelopePeaks" options={YES_NO_NA}
              value={form.spectralEnvelopePeaks}
              onChange={v => set("spectralEnvelopePeaks", v)} cols={3} />
          </FormField>
        </FormSection>

        <FormSection title="Color Doppler">
          <FormField label="Does the study demonstrate color flow interrogation of all normal and abnormal flows?">
            <RadioGroup name="colorFlowInterrogation" options={YES_NO}
              value={form.colorFlowInterrogation}
              onChange={v => set("colorFlowInterrogation", v)} cols={2} />
          </FormField>
          {!isTEE && !isFetal && (
            <FormField label="Was Color Doppler utilized on both the IAS & IVS appropriately?">
              <RadioGroup name="colorDopplerIasIvs" options={YES_NO}
                value={form.colorDopplerIasIvs}
                onChange={v => set("colorDopplerIasIvs", v)} cols={2} />
            </FormField>
          )}
        </FormSection>
      </>
    );
  }

  function renderStep7() {
    return (
      <>
        {!isStress && !isFetal && (
          <FormSection title="Diastolic Function">
            <FormField label="Was Diastolic Function/LAP evaluated appropriately?" hint="Select all that apply">
              <CheckboxGroup
                name="diastolicFunctionEval"
                options={DIASTOLIC_FUNCTION_OPTIONS}
                values={form.diastolicFunctionEval}
                onChange={v => set("diastolicFunctionEval", v)}
              />
            </FormField>
            <FormField label="Was Tissue Doppler adequate and measured/assessed properly?">
              <RadioGroup name="tissueDopplerAdequate" options={YES_NO}
                value={form.tissueDopplerAdequate}
                onChange={v => set("tissueDopplerAdequate", v)} cols={2} />
            </FormField>
          </FormSection>
        )}

        <FormSection title="Right Heart Function">
          <FormField label="Was Right Heart Function evaluated appropriately?" hint="Select all that apply">
            <CheckboxGroup
              name="rightHeartFunctionEval"
              options={RIGHT_HEART_OPTIONS}
              values={form.rightHeartFunctionEval}
              onChange={v => set("rightHeartFunctionEval", v)}
            />
          </FormField>
          {!isStress && !isFetal && (
            <FormField label="Were TAPSE measurements performed accurately?">
              <RadioGroup name="tapseAccurate" options={YES_NO_NA}
                value={form.tapseAccurate}
                onChange={v => set("tapseAccurate", v)} cols={3} />
            </FormField>
          )}
        </FormSection>

        <FormSection title="Valve Evaluation">
          <FormField label="Is the Aortic Valve evaluated with Color/CW Doppler appropriately?">
            <RadioGroup name="aorticValveDoppler" options={YES_NO_NA}
              value={form.aorticValveDoppler}
              onChange={v => set("aorticValveDoppler", v)} cols={3} />
          </FormField>
          {!isTEE && !isFetal && (
            <FormField label="Is the LVOT pulsed Doppler sample volume placed in the correct location?">
              <RadioGroup name="lvotDopplerPlacement" options={YES_NO}
                value={form.lvotDopplerPlacement}
                onChange={v => set("lvotDopplerPlacement", v)} cols={2} />
            </FormField>
          )}

          {/* AS-specific Pedoff branching */}
          <FormField label="If Aortic Stenosis was present, was the dedicated Pedoff CW transducer utilized from multiple views?">
            <RadioGroup name="pedoffCwUtilized" options={PEDOFF_OPTIONS}
              value={form.pedoffCwUtilized}
              onChange={v => set("pedoffCwUtilized", v)} />
          </FormField>
          {form.pedoffCwUtilized === "Yes" && (
            <>
              <FormField label="Was a clear envelope obtained using the dedicated Pedoff CW transducer?">
                <RadioGroup name="pedoffCwEnvelope" options={PEDOFF_OPTIONS}
                  value={form.pedoffCwEnvelope}
                  onChange={v => set("pedoffCwEnvelope", v)} />
              </FormField>
              <FormField label="Were the dedicated Pedoff CW transducer views labelled according to view location (Apical, RSB, Subcostal, SSN)?">
                <RadioGroup name="pedoffCwLabelled" options={PEDOFF_OPTIONS}
                  value={form.pedoffCwLabelled}
                  onChange={v => set("pedoffCwLabelled", v)} />
              </FormField>
            </>
          )}

          <FormField label="Is the Mitral Valve evaluated with Color/CW/PW Doppler appropriately?">
            <RadioGroup name="mitralValveDoppler" options={YES_NO_NA}
              value={form.mitralValveDoppler}
              onChange={v => set("mitralValveDoppler", v)} cols={3} />
          </FormField>

          {/* MR PISA branching */}
          <FormField label="If significant Mitral Regurgitation is present, was it evaluated with appropriate methods (PISA, ERO, Vena Contracta)?">
            <RadioGroup name="mrEvaluationMethods" options={MR_EVAL_OPTIONS}
              value={form.mrEvaluationMethods}
              onChange={v => set("mrEvaluationMethods", v)} />
          </FormField>
          {form.mrEvaluationMethods === "Yes" && (
            <FormField label="Were PISA, ERO, Vena Contracta measurements performed correctly (baseline shift), if applicable?">
              <RadioGroup name="pisaEroMeasurements" options={PISA_OPTIONS}
                value={form.pisaEroMeasurements}
                onChange={v => set("pisaEroMeasurements", v)} />
            </FormField>
          )}

          <FormField label="Is the Tricuspid Valve evaluated with Color/CW Doppler appropriately?">
            <RadioGroup name="tricuspidValveDoppler" options={YES_NO_NA}
              value={form.tricuspidValveDoppler}
              onChange={v => set("tricuspidValveDoppler", v)} cols={3} />
          </FormField>
          <FormField label="Is the Pulmonic Valve evaluated with Color/CW/PW Doppler appropriately?">
            <RadioGroup name="pulmonicValveDoppler" options={YES_NO_NA}
              value={form.pulmonicValveDoppler}
              onChange={v => set("pulmonicValveDoppler", v)} cols={3} />
          </FormField>
        </FormSection>
      </>
    );
  }

  function renderStep8() {
    return (
      <>
        <FormSection title="Additional Imaging Methods">
          <FormField label="Additional Imaging Methods Performed" hint="Select all that apply">
            <CheckboxGroup
              name="additionalImagingMethods"
              options={ADDITIONAL_IMAGING_OPTIONS}
              values={form.additionalImagingMethods}
              onChange={v => set("additionalImagingMethods", v)}
            />
          </FormField>
        </FormSection>

        <FormSection title="Strain Imaging">
          <FormField label="Was strain imaging / speckle tracking performed?">
            <RadioGroup name="strainPerformed" options={YES_NO}
              value={form.strainPerformed}
              onChange={v => set("strainPerformed", v)} cols={2} />
          </FormField>
          {form.strainPerformed === "Yes" && (
            <FormField label="If strain imaging was performed, was it performed correctly with correct reporting (Bullet Export)?">
              <RadioGroup name="strainCorrect" options={STRAIN_CORRECT_OPTIONS}
                value={form.strainCorrect}
                onChange={v => set("strainCorrect", v)} />
            </FormField>
          )}
        </FormSection>

        <FormSection title="3D Imaging">
          <FormField label="Was 3D imaging performed?">
            <RadioGroup name="threeDPerformed" options={YES_NO}
              value={form.threeDPerformed}
              onChange={v => set("threeDPerformed", v)} cols={2} />
          </FormField>
        </FormSection>

        <FormSection title="Scan Timing">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Exam/Scan Start Time">
              <TextInput type="time" value={form.scanStartTime}
                onChange={v => set("scanStartTime", v)} />
            </FormField>
            <FormField label="Exam/Scan End Time">
              <TextInput type="time" value={form.scanEndTime}
                onChange={v => set("scanEndTime", v)} />
            </FormField>
          </div>
          <FormField label="Sonographer Imaging Time with Patient (minutes)">
            <TextInput type="number" value={form.imagingTimeMinutes}
              onChange={v => set("imagingTimeMinutes", v)} placeholder="e.g. 30" />
          </FormField>
          <FormField label="Scanning Time Type">
            <RadioGroup name="scanningTimeType" options={SCANNING_TIME_OPTIONS}
              value={form.scanningTimeType}
              onChange={v => set("scanningTimeType", v)} cols={2} />
          </FormField>
        </FormSection>
      </>
    );
  }

  function renderStep9() {
    const tier = scoreTier;
    return (
      <>
        {/* Live score display */}
        <div className="rounded-xl p-5 mb-6 text-center"
          style={{ background: `linear-gradient(135deg, #0e1e2e, #0e4a50)` }}>
          <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Calculated Quality Score</div>
          <div className="text-5xl font-black text-white mb-2">{qualityScore}</div>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: tier.bg, color: tier.color }}>
            {tier.label}
          </span>
        </div>

        <FormSection title="Protocol & Pathology">
          <FormField label="Was the department protocol image sequence followed?">
            <RadioGroup name="protocolSequenceFollowed" options={PROTOCOL_SEQUENCE_OPTIONS}
              value={form.protocolSequenceFollowed}
              onChange={v => set("protocolSequenceFollowed", v)} />
          </FormField>
          <FormField label="Was all pathology documented/measured/evaluated appropriately?">
            <RadioGroup name="pathologyDocumented" options={YES_NO_NA}
              value={form.pathologyDocumented}
              onChange={v => set("pathologyDocumented", v)} cols={3} />
          </FormField>
          <FormField label="Was all pathology documented/measured/evaluated appropriately and the overall clinical concern answered?">
            <RadioGroup name="clinicalQuestionAnswered" options={YES_NO}
              value={form.clinicalQuestionAnswered}
              onChange={v => set("clinicalQuestionAnswered", v)} cols={2} />
          </FormField>
          <FormField label="Is the sonographer preliminary report concordant with final physician report?">
            <RadioGroup name="reportConcordant" options={REPORT_CONCORDANT_OPTIONS}
              value={form.reportConcordant}
              onChange={v => set("reportConcordant", v)} />
          </FormField>
          <FormField label="Is the exam comparable to the previous study, if applicable?">
            <RadioGroup name="comparableToPrevious" options={COMPARABLE_OPTIONS}
              value={form.comparableToPrevious}
              onChange={v => set("comparableToPrevious", v)} cols={3} />
          </FormField>
        </FormSection>

        <FormSection title="IAC Submission">
          <FormField label="Are the images in this case acceptable for submission to the IAC?">
            <SelectField options={IAC_OPTIONS} value={form.iacAcceptable}
              onChange={v => set("iacAcceptable", v)}
              placeholder="Select IAC status..." />
          </FormField>
        </FormSection>

        <FormSection title="Review Notes">
          <FormField label="Review Comments">
            <TextArea value={form.reviewComments} onChange={v => set("reviewComments", v)}
              placeholder="Enter any additional comments, observations, or feedback for the sonographer..." rows={4} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Reviewer Name">
              <TextInput value={form.reviewer} onChange={v => set("reviewer", v)}
                placeholder="Your name" />
            </FormField>
            <FormField label="Reviewer Email">
              <TextInput type="email" value={form.reviewerEmail}
                onChange={v => set("reviewerEmail", v)} placeholder="your@email.com" />
            </FormField>
          </div>
          <FormField label="Notify Sonographer of Results?">
            <RadioGroup name="notifySonographer" options={["YES", "NO"]}
              value={form.notifySonographer}
              onChange={v => set("notifySonographer", v)} cols={2} />
          </FormField>
        </FormSection>
      </>
    );
  }

  const stepRenderers = [
    renderStep1, renderStep2, renderStep3, renderStep4,
    renderStep5, renderStep6, renderStep7, renderStep8, renderStep9,
  ];

  // ─── History view ────────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <Layout>
        <div className="container py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                IQR History
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {reviews?.length ?? 0} reviews on record
              </p>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: TEAL }}
            >
              <Plus className="w-4 h-4" /> New Review
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Reviews", value: stats.total ?? 0 },
                { label: "Avg Score", value: stats.avgScore ? `${Math.round(Number(stats.avgScore))}%` : "—" },
                { label: "Exam Types", value: stats.byExamType?.length ?? 0 },
                { label: "Reviews", value: reviews?.length ?? 0 },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-[#189aa1]/15 text-center">
                  <div className="text-2xl font-black" style={{ color: TEAL }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {(reviews ?? []).map(r => {
              const score = r.qualityScore ?? 0;
              const tier = getScoreTier(score);
              return (
                <div key={r.id} className="bg-white rounded-xl border border-[#189aa1]/15 p-4 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: tier.bg }}>
                    <span className="text-xl font-black" style={{ color: tier.color }}>{score}</span>
                    <span className="text-[9px] font-bold" style={{ color: tier.color }}>pts</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{r.examType ?? "Unknown"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: tier.bg, color: tier.color }}>{tier.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.performingSonographer && <span>Sonographer: {r.performingSonographer} · </span>}
                      {r.examDos && <span>DOS: {r.examDos} · </span>}
                      {r.examIdentifier && <span>ID: {r.examIdentifier}</span>}
                    </div>
                    {r.reviewComments && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{r.reviewComments}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => loadReview(r)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#189aa1]/40 text-[#189aa1] hover:bg-[#189aa1]/8 font-medium">
                      Edit
                    </button>
                    <button onClick={() => deleteMutation.mutate({ id: r.id })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            {(reviews ?? []).length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No reviews yet. Start your first review!</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Main form view ──────────────────────────────────────────────────────────
  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  return (
    <Layout>
      <div className="container py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              Image Quality Review™
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingId ? `Editing Review #${editingId}` : "New Review"} · {form.examType || "Select exam type"}
            </p>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button onClick={resetForm}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                Cancel Edit
              </button>
            )}
            <button onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[#189aa1]/40 text-[#189aa1] hover:bg-[#189aa1]/8 font-medium">
              <ClipboardList className="w-3.5 h-3.5" /> History
            </button>
          </div>
        </div>

        {/* Live score badge */}
        {form.examType && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-[#189aa1]/20 bg-white">
            <div className="text-xs text-gray-500">Live Score:</div>
            <div className="text-lg font-black" style={{ color: TEAL }}>{qualityScore}</div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: scoreTier.bg, color: scoreTier.color }}>
              {scoreTier.label}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${qualityScore}%`, background: TEAL }} />
            </div>
          </div>
        )}

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isCurrent = step === s.id;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${isCurrent ? "text-white" : isDone ? "text-[#189aa1] bg-[#189aa1]/10" : "text-gray-400 bg-gray-50 hover:bg-gray-100"}`}
                style={isCurrent ? { background: TEAL } : {}}>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.shortLabel}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-[#189aa1]/15 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${TEAL}18` }}>
              <StepIcon className="w-4 h-4" style={{ color: TEAL }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">{currentStep.label}</h2>
              <p className="text-xs text-gray-400">Step {step} of {STEPS.length}</p>
            </div>
          </div>
          {stepRenderers[step - 1]()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-xs text-gray-400">{step} / {STEPS.length}</div>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: TEAL }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: TEAL }}
            >
              <Save className="w-4 h-4" />
              {editingId ? "Update Review" : "Save Review"}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
