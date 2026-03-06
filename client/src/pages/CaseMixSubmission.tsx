/**
 * Case Mix Submission
 * IAC-aligned case submission system for accreditation applications.
 * Tracks required case volumes per modality with staff linkage.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CheckCircle2, AlertCircle, Info, Stethoscope, Activity, Baby, Heart, Microscope, Users } from "lucide-react";
import { toast } from "sonner";

// ─── IAC Case Mix Requirements ────────────────────────────────────────────────

interface ModalityConfig {
  id: string;
  label: string;
  fullName: string;
  icon: React.ElementType;
  color: string;
  requiredTotal: number;
  requiredTechDirectorCases: number;
  requiredMedDirectorCases: number;
  caseTypes: string[];
  description: string;
}

const MODALITIES: ModalityConfig[] = [
  {
    id: "ATTE",
    label: "Adult TTE",
    fullName: "Adult Transthoracic Echocardiography",
    icon: Heart,
    color: "#189aa1",
    requiredTotal: 150,
    requiredTechDirectorCases: 10,
    requiredMedDirectorCases: 10,
    caseTypes: [
      "Normal / Screening",
      "LV Systolic Dysfunction (EF < 50%)",
      "LV Diastolic Dysfunction",
      "Aortic Stenosis",
      "Aortic Regurgitation",
      "Mitral Stenosis",
      "Mitral Regurgitation",
      "Tricuspid Regurgitation",
      "Pulmonary Hypertension",
      "Pericardial Effusion / Tamponade",
      "Hypertrophic Cardiomyopathy",
      "Dilated Cardiomyopathy",
      "Regional Wall Motion Abnormality",
      "Intracardiac Mass / Thrombus",
      "Aortic Pathology",
      "Prosthetic Valve",
      "Congenital Anomaly (Adult)",
      "Post-Procedure / Post-Op",
      "Other Pathology",
    ],
    description: "Minimum 150 cases required. Must include a representative mix of pathology including LV dysfunction, valvular disease, and other findings.",
  },
  {
    id: "ATEE",
    label: "Adult TEE",
    fullName: "Adult Transesophageal Echocardiography",
    icon: Microscope,
    color: "#0e6b72",
    requiredTotal: 50,
    requiredTechDirectorCases: 5,
    requiredMedDirectorCases: 5,
    caseTypes: [
      "Pre-Operative Cardiac Surgery",
      "Intraoperative Monitoring",
      "Atrial Fibrillation / LAA Thrombus",
      "Infective Endocarditis",
      "Aortic Pathology",
      "Valvular Disease Assessment",
      "Structural Heart Disease",
      "Intracardiac Mass",
      "Hemodynamic Instability",
      "Stroke / TIA Workup",
      "Other Indication",
    ],
    description: "Minimum 50 TEE cases required. Must include intraoperative and diagnostic indications.",
  },
  {
    id: "STRESS",
    label: "Stress Echo",
    fullName: "Stress Echocardiography",
    icon: Activity,
    color: "#d97706",
    requiredTotal: 50,
    requiredTechDirectorCases: 5,
    requiredMedDirectorCases: 5,
    caseTypes: [
      "Exercise Stress Echo — Treadmill",
      "Exercise Stress Echo — Bicycle",
      "Dobutamine Stress Echo (DSE)",
      "Dobutamine Stress Echo + Doppler",
      "Dipyridamole Stress Echo",
      "Adenosine Stress Echo",
      "Normal / No Inducible Ischemia",
      "Inducible Wall Motion Abnormality",
      "Valvular Disease Assessment (Stress)",
      "Diastolic Stress Echo",
      "Other Indication",
    ],
    description: "Minimum 50 stress echo cases required. Must include exercise and pharmacologic stress types.",
  },
  {
    id: "ACTE",
    label: "Adult Congenital",
    fullName: "Adult Congenital Echocardiography",
    icon: Heart,
    color: "#7c3aed",
    requiredTotal: 50,
    requiredTechDirectorCases: 5,
    requiredMedDirectorCases: 5,
    caseTypes: [
      "Atrial Septal Defect (ASD)",
      "Ventricular Septal Defect (VSD)",
      "Patent Ductus Arteriosus (PDA)",
      "Tetralogy of Fallot",
      "Transposition of Great Arteries",
      "Coarctation of Aorta",
      "Bicuspid Aortic Valve",
      "Ebstein Anomaly",
      "Fontan Circulation",
      "Post-Repair Congenital",
      "Other Congenital Lesion",
    ],
    description: "Minimum 50 adult congenital cases required. Must include a variety of lesion types.",
  },
  {
    id: "PTTE",
    label: "Pediatric TTE",
    fullName: "Pediatric Transthoracic Echocardiography",
    icon: Users,
    color: "#059669",
    requiredTotal: 100,
    requiredTechDirectorCases: 10,
    requiredMedDirectorCases: 10,
    caseTypes: [
      "Normal / Screening",
      "Atrial Septal Defect (ASD)",
      "Ventricular Septal Defect (VSD)",
      "Patent Ductus Arteriosus (PDA)",
      "Tetralogy of Fallot",
      "Transposition of Great Arteries",
      "Coarctation of Aorta",
      "Pulmonary Stenosis",
      "Aortic Stenosis",
      "Hypoplastic Left Heart Syndrome",
      "Cardiomyopathy",
      "Kawasaki Disease",
      "Pericardial Effusion",
      "Post-Operative Congenital",
      "Other Congenital Lesion",
    ],
    description: "Minimum 100 pediatric TTE cases required. Must include a variety of congenital lesions.",
  },
  {
    id: "PTEE",
    label: "Pediatric TEE",
    fullName: "Pediatric Transesophageal Echocardiography",
    icon: Microscope,
    color: "#0891b2",
    requiredTotal: 25,
    requiredTechDirectorCases: 3,
    requiredMedDirectorCases: 3,
    caseTypes: [
      "Pre-Operative Congenital Surgery",
      "Intraoperative Monitoring",
      "Valvular Disease Assessment",
      "Intracardiac Shunt",
      "Post-Operative Assessment",
      "Other Indication",
    ],
    description: "Minimum 25 pediatric TEE cases required.",
  },
  {
    id: "FETAL",
    label: "Fetal Echo",
    fullName: "Fetal Echocardiography",
    icon: Baby,
    color: "#db2777",
    requiredTotal: 50,
    requiredTechDirectorCases: 5,
    requiredMedDirectorCases: 5,
    caseTypes: [
      "Normal Fetal Heart",
      "Ventricular Septal Defect (VSD)",
      "Atrial Septal Defect (ASD)",
      "Hypoplastic Left Heart Syndrome",
      "Tetralogy of Fallot",
      "Transposition of Great Arteries",
      "Coarctation of Aorta",
      "Pulmonary Stenosis / Atresia",
      "Aortic Stenosis / Atresia",
      "Ebstein Anomaly",
      "Cardiac Arrhythmia",
      "Cardiomegaly / Hydrops",
      "Pericardial Effusion",
      "Other Fetal Cardiac Finding",
    ],
    description: "Minimum 50 fetal echo cases required. Must include normal and pathologic cases.",
  },
];

// ─── Add Case Form ────────────────────────────────────────────────────────────

interface AddCaseFormProps {
  onSuccess: () => void;
}

function AddCaseForm({ onSuccess }: AddCaseFormProps) {
  const [modality, setModality] = useState("");
  const [caseType, setCaseType] = useState("");
  const [studyIdentifier, setStudyIdentifier] = useState("");
  const [studyDate, setStudyDate] = useState("");
  const [sonographerLabMemberId, setSonographerLabMemberId] = useState<number | undefined>();
  const [sonographerName, setSonographerName] = useState("");
  const [physicianLabMemberId, setPhysicianLabMemberId] = useState<number | undefined>();
  const [physicianName, setPhysicianName] = useState("");
  const [isTechDirectorCase, setIsTechDirectorCase] = useState(false);
  const [isMedDirectorCase, setIsMedDirectorCase] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: staffData } = trpc.caseMix.getLabStaff.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.caseMix.create.useMutation({
    onSuccess: () => {
      toast.success("Case submitted successfully.");
      utils.caseMix.list.invalidate();
      utils.caseMix.summary.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedModality = MODALITIES.find(m => m.id === modality);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modality || !caseType || !studyIdentifier) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createMutation.mutate({
      modality: modality as "ATTE" | "ATEE" | "STRESS" | "ACTE" | "PTTE" | "PTEE" | "FETAL",
      caseType,
      studyIdentifier,
      studyDate: studyDate || undefined,
      sonographerLabMemberId,
      sonographerName: sonographerName || undefined,
      physicianLabMemberId,
      physicianName: physicianName || undefined,
      isTechDirectorCase,
      isMedDirectorCase,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Modality */}
        <div className="space-y-1.5">
          <Label>Modality <span className="text-red-500">*</span></Label>
          <Select value={modality} onValueChange={(v) => { setModality(v); setCaseType(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select modality..." />
            </SelectTrigger>
            <SelectContent>
              {MODALITIES.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label} — {m.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Case Type */}
        <div className="space-y-1.5">
          <Label>Case Type / Pathology <span className="text-red-500">*</span></Label>
          <Select value={caseType} onValueChange={setCaseType} disabled={!modality}>
            <SelectTrigger>
              <SelectValue placeholder="Select case type..." />
            </SelectTrigger>
            <SelectContent>
              {selectedModality?.caseTypes.map(ct => (
                <SelectItem key={ct} value={ct}>{ct}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Study Identifier */}
        <div className="space-y-1.5">
          <Label>Study Identifier (MRN / Accession) <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g., MRN-12345 or ACC-2024-001"
            value={studyIdentifier}
            onChange={e => setStudyIdentifier(e.target.value)}
          />
        </div>

        {/* Study Date */}
        <div className="space-y-1.5">
          <Label>Study Date</Label>
          <Input type="date" value={studyDate} onChange={e => setStudyDate(e.target.value)} />
        </div>

        {/* Sonographer */}
        <div className="space-y-1.5">
          <Label>Sonographer</Label>
          <Select
            value={sonographerLabMemberId?.toString() ?? "manual"}
            onValueChange={(v) => {
              if (v === "manual") { setSonographerLabMemberId(undefined); }
              else { setSonographerLabMemberId(Number(v)); setSonographerName(""); }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sonographer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Enter name manually</SelectItem>
              {staffData?.sonographers.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.displayName || s.inviteEmail}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!sonographerLabMemberId && (
            <Input
              placeholder="Sonographer name (optional)"
              value={sonographerName}
              onChange={e => setSonographerName(e.target.value)}
              className="mt-1"
            />
          )}
        </div>

        {/* Physician */}
        <div className="space-y-1.5">
          <Label>Interpreting Physician</Label>
          <Select
            value={physicianLabMemberId?.toString() ?? "manual"}
            onValueChange={(v) => {
              if (v === "manual") { setPhysicianLabMemberId(undefined); }
              else { setPhysicianLabMemberId(Number(v)); setPhysicianName(""); }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select physician..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Enter name manually</SelectItem>
              {staffData?.physicians.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.displayName || p.inviteEmail}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!physicianLabMemberId && (
            <Input
              placeholder="Physician name (optional)"
              value={physicianName}
              onChange={e => setPhysicianName(e.target.value)}
              className="mt-1"
            />
          )}
        </div>
      </div>

      {/* Director Flags */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTechDirectorCase}
            onChange={e => setIsTechDirectorCase(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Technical Director case</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isMedDirectorCase}
            onChange={e => setIsMedDirectorCase(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Medical Director case</span>
        </label>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="Any additional notes about this case..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="h-16 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full text-white"
        style={{ background: "#189aa1" }}
      >
        {createMutation.isPending ? "Submitting..." : "Submit Case"}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BRAND = "#189aa1";

export default function CaseMixSubmission() {
  const [activeModality, setActiveModality] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterModality, setFilterModality] = useState<string>("all");

  const { data: cases = [], isLoading } = trpc.caseMix.list.useQuery();
  const { data: summary = [] } = trpc.caseMix.summary.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.caseMix.delete.useMutation({
    onSuccess: () => {
      toast.success("Case removed.");
      utils.caseMix.list.invalidate();
      utils.caseMix.summary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Build progress per modality
  const getModalityProgress = (modalityId: string) => {
    const config = MODALITIES.find(m => m.id === modalityId)!;
    const modalityCases = cases.filter(c => c.modality === modalityId);
    const total = modalityCases.length;
    const techDirectorCases = modalityCases.filter(c => c.isTechDirectorCase).length;
    const medDirectorCases = modalityCases.filter(c => c.isMedDirectorCase).length;
    const pct = Math.min(100, Math.round((total / config.requiredTotal) * 100));
    return { total, pct, techDirectorCases, medDirectorCases, config };
  };

  const filteredCases = filterModality === "all" ? cases : cases.filter(c => c.modality === filterModality);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            Case Mix Submission
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track and submit cases for IAC accreditation. Each modality has minimum volume requirements.
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 text-white" style={{ background: BRAND }}>
              <Plus className="w-4 h-4" />
              Add Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit New Case</DialogTitle>
            </DialogHeader>
            <AddCaseForm onSuccess={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Modality Progress Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {MODALITIES.map((modality) => {
          const { total, pct, techDirectorCases, medDirectorCases, config } = getModalityProgress(modality.id);
          const Icon = modality.icon;
          const isComplete = total >= config.requiredTotal;
          const techComplete = techDirectorCases >= config.requiredTechDirectorCases;
          const medComplete = medDirectorCases >= config.requiredMedDirectorCases;

          return (
            <Card
              key={modality.id}
              className={`cursor-pointer transition-all border-2 ${activeModality === modality.id ? "border-[#189aa1]" : "border-transparent hover:border-gray-200"}`}
              onClick={() => setActiveModality(activeModality === modality.id ? null : modality.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: modality.color + "18" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: modality.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">{modality.label}</div>
                    </div>
                  </div>
                  {isComplete
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  }
                </div>
                <div className="text-2xl font-bold mb-0.5" style={{ color: modality.color }}>
                  {total}<span className="text-sm font-normal text-gray-400">/{config.requiredTotal}</span>
                </div>
                <Progress value={pct} className="h-1.5 mb-2" />
                <div className="flex gap-3 text-xs">
                  <span className={techComplete ? "text-green-600" : "text-amber-600"}>
                    TD: {techDirectorCases}/{config.requiredTechDirectorCases}
                  </span>
                  <span className={medComplete ? "text-green-600" : "text-amber-600"}>
                    MD: {medDirectorCases}/{config.requiredMedDirectorCases}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modality Detail (expanded) */}
      {activeModality && (() => {
        const config = MODALITIES.find(m => m.id === activeModality)!;
        const modalityCases = cases.filter(c => c.modality === activeModality);
        const caseTypeCounts: Record<string, number> = {};
        modalityCases.forEach(c => { caseTypeCounts[c.caseType] = (caseTypeCounts[c.caseType] || 0) + 1; });

        return (
          <Card className="border border-[#189aa1]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800">{config.fullName} — Case Type Breakdown</CardTitle>
              <p className="text-xs text-gray-500">{config.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {config.caseTypes.map(ct => (
                  <div key={ct} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600 truncate mr-2">{ct}</span>
                    <Badge variant="outline" className="text-xs flex-shrink-0" style={{ borderColor: config.color, color: config.color }}>
                      {caseTypeCounts[ct] ?? 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Case List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base text-gray-800">Submitted Cases ({cases.length})</CardTitle>
            <Select value={filterModality} onValueChange={setFilterModality}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by modality..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                {MODALITIES.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No cases submitted yet. Click "Add Case" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modality</TableHead>
                    <TableHead className="text-xs">Case Type</TableHead>
                    <TableHead className="text-xs">Study ID</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Sonographer</TableHead>
                    <TableHead className="text-xs">Physician</TableHead>
                    <TableHead className="text-xs">Flags</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((c) => {
                    const mod = MODALITIES.find(m => m.id === c.modality);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: mod?.color, color: mod?.color }}>
                            {c.modality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 max-w-[160px] truncate">{c.caseType}</TableCell>
                        <TableCell className="text-xs font-mono text-gray-600">{c.studyIdentifier}</TableCell>
                        <TableCell className="text-xs text-gray-500">{c.studyDate ? new Date(c.studyDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">{c.sonographerName || "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">{c.physicianName || "—"}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex gap-1">
                            {c.isTechDirectorCase && <Badge variant="secondary" className="text-xs px-1 py-0">TD</Badge>}
                            {c.isMedDirectorCase && <Badge variant="secondary" className="text-xs px-1 py-0">MD</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            onClick={() => {
                              if (confirm("Remove this case?")) deleteMutation.mutate({ id: c.id });
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IAC Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <strong>IAC Case Mix Requirements:</strong> Case volume minimums shown above are based on IAC Echocardiography standards. Your final application must include the required number of cases per modality, with a representative mix of pathology. Technical Director (TD) and Medical Director (MD) cases must be separately identified. Consult the IAC application guide for the most current requirements at <a href="https://intersocietal.org" target="_blank" rel="noopener noreferrer" className="underline">intersocietal.org</a>.
        </div>
      </div>
    </div>
  );
}
