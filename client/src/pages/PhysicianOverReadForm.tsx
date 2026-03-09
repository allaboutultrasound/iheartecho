/**
 * PhysicianOverReadForm.tsx
 * Public page (no login required) — accessed via a secure token link sent by email.
 * This is Step 1 of the Physician Peer Review workflow:
 *   Physician receives email → opens this form → submits blind over-read findings
 *   → lab admin is notified to complete Step 2 (comparison).
 *
 * Route: /physician-review/:token
 */
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Stethoscope, ClipboardList } from "lucide-react";

const BRAND = "#189aa1";

// ─── Finding options (matching FormSite form) ─────────────────────────────────
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
const WALL_THICKNESS = ["Normal", "Increased (Hypertrophy)", "Decreased", "Not Evaluated"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FRow({ label, options, value, onChange, required }: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 items-center py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <div className="h-0.5 flex-1 bg-[#189aa1]/20" />
      <span className="text-xs font-bold text-[#189aa1] uppercase tracking-widest px-2">{title}</span>
      <div className="h-0.5 flex-1 bg-[#189aa1]/20" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PhysicianOverReadForm() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data: invitation, isLoading: loadingInvitation, error: invitationError } =
    trpc.physicianOverRead.getInvitationByToken.useQuery(
      { token },
      { enabled: !!token, retry: false }
    );

  const submitMutation = trpc.physicianOverRead.submitOverRead.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Over-read submitted successfully. The lab has been notified.");
    },
    onError: (e) => toast.error(e.message),
  });

  const [submitted, setSubmitted] = useState(false);
  const [physicianName, setPhysicianName] = useState("");
  const [dateReviewCompleted, setDateReviewCompleted] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reviewComments, setReviewComments] = useState("");
  const [otherFindings1, setOtherFindings1] = useState("");
  const [otherFindings2, setOtherFindings2] = useState("");
  const [otherFindings3, setOtherFindings3] = useState("");

  // Stress-specific
  const [postStressDopplerPerformed, setPostStressDopplerPerformed] = useState("");

  // Findings state
  const [f, setF] = useState<Record<string, string>>({});
  const setField = (key: string) => (v: string) => setF(prev => ({ ...prev, [key]: v }));

  // Pre-fill physician name from invitation
  useEffect(() => {
    if (invitation?.reviewerName) setPhysicianName(invitation.reviewerName);
  }, [invitation]);

  const examType = invitation?.examType ?? "";
  const isAdultTTE = examType === "Adult TTE" || examType === "Adult TEE";
  const isPediatric = examType === "Pediatric/Congenital TTE" || examType === "Pediatric/Congenital TEE";
  const isStress = examType === "Adult STRESS";
  const isFetal = examType === "FETAL";
  const showCardiac = isAdultTTE || isPediatric;

  const handleSubmit = () => {
    if (!physicianName.trim()) {
      toast.error("Please enter your name as the over-reading physician.");
      return;
    }
    submitMutation.mutate({
      token,
      overReadingPhysicianName: physicianName,
      dateReviewCompleted,
      reviewComments,
      otherFindings1,
      otherFindings2,
      otherFindings3,
      postStressDopplerPerformed: isStress ? postStressDopplerPerformed : undefined,
      ...f,
    });
  };

  // ── Loading / Error states ────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Invalid Link</h2>
            <p className="text-sm text-gray-500">This link is missing a required access token. Please use the link from your email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#189aa1]" />
      </div>
    );
  }

  if (invitationError || !invitation) {
    const msg = (invitationError as any)?.message ?? "This invitation link is invalid or has expired.";
    const isCompleted = msg.includes("already been submitted");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            {isCompleted
              ? <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              : <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />}
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {isCompleted ? "Already Submitted" : "Link Unavailable"}
            </h2>
            <p className="text-sm text-gray-500">{msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Over-Read Submitted</h2>
            <p className="text-sm text-gray-600 mb-4">
              Thank you, <strong>{physicianName}</strong>. Your over-read has been submitted and the lab has been notified to complete the comparison review.
            </p>
            <p className="text-xs text-gray-400">You may close this window.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }} className="px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">iHeartEcho™ — Physician Over-Read</h1>
            <p className="text-sm text-[#4ad9e0]">Step 1: Blind Over-Read Form</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Important notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Blind Over-Read Instructions</p>
                <p className="text-xs text-amber-700 mt-1">
                  Please complete this form as a <strong>blind over-read</strong>. Do NOT review the original physician's report or interpretation before completing this form. Your independent assessment will be compared with the original read to evaluate concordance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Info (read-only) */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#189aa1]" />
              Exam Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Exam Type</p>
                <Badge variant="outline" className="mt-1 text-[#189aa1] border-[#189aa1]">{invitation.examType}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Exam Identifier</p>
                <p className="text-sm font-semibold text-gray-800">{invitation.examIdentifier}</p>
              </div>
              {invitation.examDos && (
                <div>
                  <p className="text-xs text-gray-500">Date of Study</p>
                  <p className="text-sm text-gray-700">{invitation.examDos}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-2">
              ⚠ The original interpreting physician's name is intentionally withheld to preserve blinding.
            </p>
          </CardContent>
        </Card>

        {/* Physician Info */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-bold text-gray-700">Over-Reading Physician</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-9 text-sm"
                placeholder="Dr. Jane Smith, MD"
                value={physicianName}
                onChange={e => setPhysicianName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Date Review Completed</label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={dateReviewCompleted}
                onChange={e => setDateReviewCompleted(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Stress Echo specific ─────────────────────────────────────────────── */}
        {isStress && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">Stress Echo Protocol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <FRow
                label="Post-Stress Doppler Performed"
                options={["Yes", "No", "Not Applicable"]}
                value={postStressDopplerPerformed}
                onChange={setPostStressDopplerPerformed}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Cardiac Findings (Adult TTE / TEE / Pediatric) ───────────────────── */}
        {showCardiac && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">Cardiac Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <SectionHeader title="Cardiac Anatomy" />
              <FRow label="Situs" options={SITUS_OPTIONS} value={f.situs ?? ""} onChange={setField("situs")} />
              <FRow label="Cardiac Position" options={CARDIAC_POSITION} value={f.cardiacPosition ?? ""} onChange={setField("cardiacPosition")} />
              <FRow label="Left Heart" options={NORMAL_ABNORMAL} value={f.leftHeart ?? ""} onChange={setField("leftHeart")} />
              <FRow label="Right Heart" options={NORMAL_ABNORMAL} value={f.rightHeart ?? ""} onChange={setField("rightHeart")} />

              <SectionHeader title="Ventricular Function" />
              <FRow label="Ejection Fraction (EF%)" options={EF_OPTIONS} value={f.efPercent ?? ""} onChange={setField("efPercent")} />
              <FRow label="LV Wall Thickness" options={WALL_THICKNESS} value={f.lvWallThickness ?? ""} onChange={setField("lvWallThickness")} />
              <FRow label="Regional Wall Motion Abnormalities" options={RWMA_OPTIONS} value={f.regionalWallMotionAbnormalities ?? ""} onChange={setField("regionalWallMotionAbnormalities")} />

              <SectionHeader title="Chamber Sizes" />
              <FRow label="LV Chamber Size" options={CHAMBER_SIZE} value={f.lvChamberSize ?? ""} onChange={setField("lvChamberSize")} />
              <FRow label="LA Chamber Size" options={CHAMBER_SIZE} value={f.laChamberSize ?? ""} onChange={setField("laChamberSize")} />
              <FRow label="RV Chamber Size" options={CHAMBER_SIZE} value={f.rvChamberSize ?? ""} onChange={setField("rvChamberSize")} />
              <FRow label="RA Chamber Size" options={CHAMBER_SIZE} value={f.raChamberSize ?? ""} onChange={setField("raChamberSize")} />

              <SectionHeader title="Valve Morphology" />
              <FRow label="Aortic Valve" options={NORMAL_ABNORMAL} value={f.aorticValve ?? ""} onChange={setField("aorticValve")} />
              <FRow label="Mitral Valve" options={NORMAL_ABNORMAL} value={f.mitralValve ?? ""} onChange={setField("mitralValve")} />
              <FRow label="Tricuspid Valve" options={NORMAL_ABNORMAL} value={f.tricuspidValve ?? ""} onChange={setField("tricuspidValve")} />
              <FRow label="Pulmonic Valve" options={NORMAL_ABNORMAL} value={f.pulmonicValve ?? ""} onChange={setField("pulmonicValve")} />

              <SectionHeader title="Valve Stenosis" />
              <FRow label="Aortic Stenosis" options={VALVE_STENOSIS} value={f.aorticStenosis ?? ""} onChange={setField("aorticStenosis")} />
              <FRow label="Mitral Stenosis" options={VALVE_STENOSIS} value={f.mitralStenosis ?? ""} onChange={setField("mitralStenosis")} />
              <FRow label="Tricuspid Stenosis" options={VALVE_STENOSIS} value={f.tricuspidStenosis ?? ""} onChange={setField("tricuspidStenosis")} />
              <FRow label="Pulmonic Stenosis" options={VALVE_STENOSIS} value={f.pulmonicStenosis ?? ""} onChange={setField("pulmonicStenosis")} />

              <SectionHeader title="Valve Regurgitation / Insufficiency" />
              <FRow label="Aortic Insufficiency" options={VALVE_REGURG} value={f.aorticInsufficiency ?? ""} onChange={setField("aorticInsufficiency")} />
              <FRow label="Mitral Regurgitation" options={VALVE_REGURG} value={f.mitralRegurgitation ?? ""} onChange={setField("mitralRegurgitation")} />
              <FRow label="Tricuspid Regurgitation" options={VALVE_REGURG} value={f.tricuspidRegurgitation ?? ""} onChange={setField("tricuspidRegurgitation")} />
              <FRow label="Pulmonic Insufficiency" options={VALVE_REGURG} value={f.pulmonicInsufficiency ?? ""} onChange={setField("pulmonicInsufficiency")} />

              <SectionHeader title="Other Cardiac Findings" />
              <FRow label="RVSP (mmHg)" options={RVSP_OPTIONS} value={f.rvspmm ?? ""} onChange={setField("rvspmm")} />
              <FRow label="Pericardial Effusion" options={PERICARDIAL_EFF} value={f.pericardialEffusion ?? ""} onChange={setField("pericardialEffusion")} />

              <SectionHeader title="Septal Defects / Shunts" />
              <FRow label="Ventricular Septal Defect (VSD)" options={PRESENT_ABSENT} value={f.ventricularSeptalDefect ?? ""} onChange={setField("ventricularSeptalDefect")} />
              <FRow label="Atrial Septal Defect (ASD)" options={PRESENT_ABSENT} value={f.atrialSeptalDefect ?? ""} onChange={setField("atrialSeptalDefect")} />
              <FRow label="Patent Foramen Ovale (PFO)" options={PRESENT_ABSENT} value={f.patentForamenOvale ?? ""} onChange={setField("patentForamenOvale")} />
            </CardContent>
          </Card>
        )}

        {/* ── Pediatric / Congenital Extra ─────────────────────────────────────── */}
        {isPediatric && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">Congenital / Pediatric Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <FRow label="Peripheral Pulmonary Stenosis" options={PRESENT_ABSENT} value={f.peripheralPulmonaryStenosis ?? ""} onChange={setField("peripheralPulmonaryStenosis")} />
              <FRow label="Pulmonary Veins" options={NORMAL_ABNORMAL} value={f.pulmonaryVeins ?? ""} onChange={setField("pulmonaryVeins")} />
              <FRow label="Coronary Anatomy" options={NORMAL_ABNORMAL} value={f.coronaryAnatomy ?? ""} onChange={setField("coronaryAnatomy")} />
              <FRow label="Aortic Arch" options={NORMAL_ABNORMAL} value={f.aorticArch ?? ""} onChange={setField("aorticArch")} />
              <FRow label="Great Vessels" options={NORMAL_ABNORMAL} value={f.greatVessels ?? ""} onChange={setField("greatVessels")} />
              <FRow label="PDA / Ductal Arch" options={PRESENT_ABSENT} value={f.pdaDuctalArch ?? ""} onChange={setField("pdaDuctalArch")} />
              <FRow label="Conotruncal Anatomy" options={NORMAL_ABNORMAL} value={f.conotruncalAnatomy ?? ""} onChange={setField("conotruncalAnatomy")} />
            </CardContent>
          </Card>
        )}

        {/* ── Stress Echo Findings ─────────────────────────────────────────────── */}
        {isStress && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">Stress Echo Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <SectionHeader title="Ventricular Function" />
              <FRow label="Resting EF%" options={EF_OPTIONS} value={f.restingEfPercent ?? ""} onChange={setField("restingEfPercent")} />
              <FRow label="Post-Stress EF%" options={EF_OPTIONS} value={f.postStressEfPercent ?? ""} onChange={setField("postStressEfPercent")} />
              <FRow label="Resting RWMA" options={RWMA_OPTIONS} value={f.restingRwma ?? ""} onChange={setField("restingRwma")} />
              <FRow label="Post-Stress RWMA" options={RWMA_OPTIONS} value={f.postStressRwma ?? ""} onChange={setField("postStressRwma")} />
              <FRow label="Response to Stress" options={RESPONSE_TO_STRESS} value={f.responseToStress ?? ""} onChange={setField("responseToStress")} />

              <SectionHeader title="Valve Stenosis (Stress)" />
              <FRow label="Aortic Stenosis" options={VALVE_STENOSIS} value={f.stressAorticStenosis ?? ""} onChange={setField("stressAorticStenosis")} />
              <FRow label="Mitral Stenosis" options={VALVE_STENOSIS} value={f.stressMitralStenosis ?? ""} onChange={setField("stressMitralStenosis")} />
              <FRow label="Tricuspid Stenosis" options={VALVE_STENOSIS} value={f.stressTricuspidStenosis ?? ""} onChange={setField("stressTricuspidStenosis")} />
              <FRow label="Pulmonic Stenosis" options={VALVE_STENOSIS} value={f.stressPulmonicStenosis ?? ""} onChange={setField("stressPulmonicStenosis")} />

              <SectionHeader title="Valve Regurgitation (Stress)" />
              <FRow label="Aortic Insufficiency" options={VALVE_REGURG} value={f.stressAorticInsufficiency ?? ""} onChange={setField("stressAorticInsufficiency")} />
              <FRow label="Mitral Regurgitation" options={VALVE_REGURG} value={f.stressMitralRegurgitation ?? ""} onChange={setField("stressMitralRegurgitation")} />
              <FRow label="Tricuspid Regurgitation" options={VALVE_REGURG} value={f.stressTricuspidRegurgitation ?? ""} onChange={setField("stressTricuspidRegurgitation")} />
              <FRow label="Pulmonic Insufficiency" options={VALVE_REGURG} value={f.stressPulmonicInsufficiency ?? ""} onChange={setField("stressPulmonicInsufficiency")} />

              <SectionHeader title="Hemodynamics (Stress)" />
              <FRow label="RVSP (mmHg)" options={RVSP_OPTIONS} value={f.stressRvspmm ?? ""} onChange={setField("stressRvspmm")} />
            </CardContent>
          </Card>
        )}

        {/* ── Fetal Echo ───────────────────────────────────────────────────────── */}
        {isFetal && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">Fetal Echo Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <FRow label="Fetal Biometry" options={FETAL_BIOMETRY} value={f.fetalBiometry ?? ""} onChange={setField("fetalBiometry")} />
              <FRow label="Fetal Position" options={FETAL_POSITION} value={f.fetalPosition ?? ""} onChange={setField("fetalPosition")} />
              <FRow label="Fetal Heart Rate / Rhythm" options={FETAL_HR} value={f.fetalHeartRateRhythm ?? ""} onChange={setField("fetalHeartRateRhythm")} />

              <SectionHeader title="Cardiac Anatomy (Fetal)" />
              <FRow label="Situs" options={SITUS_OPTIONS} value={f.situs ?? ""} onChange={setField("situs")} />
              <FRow label="Cardiac Position" options={CARDIAC_POSITION} value={f.cardiacPosition ?? ""} onChange={setField("cardiacPosition")} />
              <FRow label="Left Heart" options={NORMAL_ABNORMAL} value={f.leftHeart ?? ""} onChange={setField("leftHeart")} />
              <FRow label="Right Heart" options={NORMAL_ABNORMAL} value={f.rightHeart ?? ""} onChange={setField("rightHeart")} />
              <FRow label="EF%" options={EF_OPTIONS} value={f.efPercent ?? ""} onChange={setField("efPercent")} />
              <FRow label="VSD" options={PRESENT_ABSENT} value={f.ventricularSeptalDefect ?? ""} onChange={setField("ventricularSeptalDefect")} />
              <FRow label="ASD" options={PRESENT_ABSENT} value={f.atrialSeptalDefect ?? ""} onChange={setField("atrialSeptalDefect")} />
              <FRow label="Aortic Valve" options={NORMAL_ABNORMAL} value={f.aorticValve ?? ""} onChange={setField("aorticValve")} />
              <FRow label="Mitral Valve" options={NORMAL_ABNORMAL} value={f.mitralValve ?? ""} onChange={setField("mitralValve")} />
              <FRow label="Tricuspid Valve" options={NORMAL_ABNORMAL} value={f.tricuspidValve ?? ""} onChange={setField("tricuspidValve")} />
              <FRow label="Pulmonic Valve" options={NORMAL_ABNORMAL} value={f.pulmonicValve ?? ""} onChange={setField("pulmonicValve")} />
              <FRow label="Aortic Arch" options={NORMAL_ABNORMAL} value={f.aorticArch ?? ""} onChange={setField("aorticArch")} />
              <FRow label="Great Vessels" options={NORMAL_ABNORMAL} value={f.greatVessels ?? ""} onChange={setField("greatVessels")} />
              <FRow label="Pulmonary Veins" options={NORMAL_ABNORMAL} value={f.pulmonaryVeins ?? ""} onChange={setField("pulmonaryVeins")} />
              <FRow label="Pericardial Effusion" options={PERICARDIAL_EFF} value={f.pericardialEffusion ?? ""} onChange={setField("pericardialEffusion")} />
            </CardContent>
          </Card>
        )}

        {/* ── Other Findings ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-bold text-gray-700">Other Findings / Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Other Finding 1</label>
              <Textarea
                className="text-sm min-h-[60px]"
                placeholder="Describe any additional finding..."
                value={otherFindings1}
                onChange={e => setOtherFindings1(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Other Finding 2</label>
              <Textarea
                className="text-sm min-h-[60px]"
                placeholder="Describe any additional finding..."
                value={otherFindings2}
                onChange={e => setOtherFindings2(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Other Finding 3</label>
              <Textarea
                className="text-sm min-h-[60px]"
                placeholder="Describe any additional finding..."
                value={otherFindings3}
                onChange={e => setOtherFindings3(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Review Comments</label>
              <Textarea
                className="text-sm min-h-[80px]"
                placeholder="Any additional comments or clinical notes..."
                value={reviewComments}
                onChange={e => setReviewComments(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="pb-8">
          <Button
            className="w-full h-12 text-base font-bold text-white"
            style={{ background: "#189aa1" }}
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending
              ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</>
              : <><CheckCircle2 className="w-5 h-5 mr-2" />Submit Over-Read</>}
          </Button>
          <p className="text-xs text-gray-400 text-center mt-2">
            By submitting, you confirm this is your independent blind over-read assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
