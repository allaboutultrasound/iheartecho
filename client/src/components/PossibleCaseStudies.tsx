/**
 * PossibleCaseStudies — IAC Case Submission Candidate Tracker
 *
 * Lists and manages echo cases identified during quality reviews as potential
 * IAC accreditation case submissions. Each case gets a unique ID (CS-YYYY-NNN).
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const BRAND = "#189aa1";

const EXAM_TYPE_OPTIONS = [
  { value: "AETTE", label: "Adult TTE" },
  { value: "AETEE", label: "Adult TEE" },
  { value: "AE_STRESS", label: "Stress Echo" },
  { value: "PETTE", label: "Pediatric/Congenital TTE" },
  { value: "PETEE", label: "Pediatric/Congenital TEE" },
  { value: "FE", label: "Fetal Echo" },
];

const STATUS_OPTIONS = [
  { value: "identified",  label: "Identified",   color: "#6b7280", step: 1 },
  { value: "under_review",label: "Under Review", color: "#d97706", step: 2 },
  { value: "submitted",   label: "Submitted",    color: "#2563eb", step: 3 },
  { value: "accepted",    label: "Accepted",     color: "#16a34a", step: 4 },
];

// Progression stepper shown inside each card
function StatusStepper({ current }: { current: string }) {
  const idx = STATUS_OPTIONS.findIndex(s => s.value === current);
  return (
    <div className="flex items-center gap-0 mt-2">
      {STATUS_OPTIONS.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={s.value} className="flex items-center">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border-2 transition-all"
              style={{
                background: done ? s.color : "transparent",
                borderColor: done ? s.color : "#d1d5db",
                color: done ? "white" : "#9ca3af",
                boxShadow: active ? `0 0 0 3px ${s.color}30` : "none",
              }}
            >
              {s.step}
            </div>
            <span
              className="hidden sm:block text-[10px] font-medium ml-1 mr-1"
              style={{ color: done ? s.color : "#9ca3af" }}
            >
              {s.label}
            </span>
            {i < STATUS_OPTIONS.length - 1 && (
              <div
                className="h-0.5 w-6 sm:w-8 mx-0.5"
                style={{ background: i < idx ? STATUS_OPTIONS[i + 1].color : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const ACCREDITATION_TYPE_OPTIONS = [
  "Adult Echo",
  "Pediatric/Fetal Echo",
  "Stress Echo",
  "TEE",
];

type SubmissionStatus = "identified" | "under_review" | "submitted" | "accepted";

interface CaseFormData {
  examType: string;
  examDate: string;
  patientMrn: string;
  diagnosis: string;
  clinicalNotes: string;
  sonographerName: string;
  sonographerEmail: string;
  interpretingPhysicianName: string;
  interpretingPhysicianEmail: string;
  accreditationType: string;
  submissionStatus: SubmissionStatus;
  submissionNotes: string;
}

const EMPTY_FORM: CaseFormData = {
  examType: "",
  examDate: "",
  patientMrn: "",
  diagnosis: "",
  clinicalNotes: "",
  sonographerName: "",
  sonographerEmail: "",
  interpretingPhysicianName: "",
  interpretingPhysicianEmail: "",
  accreditationType: "",
  submissionStatus: "identified" as SubmissionStatus,
  submissionNotes: "",
};

function statusBadge(status: string) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  if (!opt) return <Badge variant="outline">{status}</Badge>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: opt.color + "18", color: opt.color, border: `1px solid ${opt.color}40` }}
    >
      {opt.label}
    </span>
  );
}

function examTypeLabel(code: string) {
  return EXAM_TYPE_OPTIONS.find(e => e.value === code)?.label ?? code;
}

export default function PossibleCaseStudies() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [filterExamType, setFilterExamType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CaseFormData>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: cases = [], isLoading } = trpc.caseStudies.list.useQuery(
    { examType: filterExamType || undefined, status: filterStatus || undefined },
    { enabled: isAuthenticated }
  );

  const createCase = trpc.caseStudies.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Case study ${data.caseStudyId} created successfully.`);
      utils.caseStudies.list.invalidate();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCase = trpc.caseStudies.update.useMutation({
    onSuccess: () => {
      toast.success("Case study updated.");
      utils.caseStudies.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCase = trpc.caseStudies.delete.useMutation({
    onSuccess: () => {
      toast.success("Case study removed.");
      utils.caseStudies.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (key: keyof CaseFormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      examType: c.examType ?? "",
      examDate: c.examDate ?? "",
      patientMrn: c.patientMrn ?? "",
      diagnosis: c.diagnosis ?? "",
      clinicalNotes: c.clinicalNotes ?? "",
      sonographerName: c.sonographerName ?? "",
      sonographerEmail: c.sonographerEmail ?? "",
      interpretingPhysicianName: c.interpretingPhysicianName ?? "",
      interpretingPhysicianEmail: c.interpretingPhysicianEmail ?? "",
      accreditationType: c.accreditationType ?? "",
      submissionStatus: c.submissionStatus ?? "identified",
      submissionNotes: c.submissionNotes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.examType) { toast.error("Please select an exam type."); return; }
    if (editingId !== null) {
      updateCase.mutate({ id: editingId, ...form });
    } else {
      createCase.mutate(form);
    }
  };

  const filteredCases = useMemo(() =>
    cases.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.caseStudyId?.toLowerCase().includes(q) ||
        c.diagnosis?.toLowerCase().includes(q) ||
        c.sonographerName?.toLowerCase().includes(q) ||
        c.interpretingPhysicianName?.toLowerCase().includes(q) ||
        c.patientMrn?.toLowerCase().includes(q)
      );
    }),
    [cases, search]
  );

  // Summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => { counts[c.submissionStatus] = (counts[c.submissionStatus] ?? 0) + 1; });
    return counts;
  }, [cases]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            Possible Case Studies
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track echo cases identified through quality reviews as potential IAC case submissions.
            Each case is assigned a unique ID for tracking.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 text-white text-xs"
          style={{ background: BRAND }}
        >
          <Plus className="w-4 h-4" /> Add Case Study
        </Button>
      </div>

      {/* Status summary pills */}
      {cases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => {
            const count = statusCounts[s.value] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={s.value}
                onClick={() => setFilterStatus(filterStatus === s.value ? "" : s.value)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filterStatus === s.value ? s.color : s.color + "15",
                  color: filterStatus === s.value ? "white" : s.color,
                  border: `1px solid ${s.color}40`,
                }}
              >
                {s.label} <span className="font-bold">{count}</span>
              </button>
            );
          })}
          {filterStatus && (
            <button
              onClick={() => setFilterStatus("")}
              className="px-2.5 py-1 rounded-full text-xs text-gray-500 border border-gray-200 hover:bg-gray-50"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, diagnosis, sonographer, physician..."
            className="pl-8 text-xs h-8"
          />
        </div>
        <select
          value={filterExamType}
          onChange={e => setFilterExamType(e.target.value)}
          className="h-8 px-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1"
          style={{ "--tw-ring-color": BRAND } as any}
        >
          <option value="">All Exam Types</option>
          {EXAM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Case list */}
      {isLoading ? (
        <div className="text-xs text-gray-400 py-8 text-center">Loading case studies...</div>
      ) : filteredCases.length === 0 ? (
        <Card className="border border-dashed border-gray-200">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 mb-1">No case studies yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Add cases identified during quality reviews as potential IAC submissions.
            </p>
            <Button onClick={openCreate} className="text-white text-xs" style={{ background: BRAND }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add First Case Study
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map(c => {
            const isExpanded = expandedId === c.id;
            return (
              <Card key={c.id} className="border border-gray-100 hover:border-[#189aa1]/30 transition-colors">
                <CardContent className="p-4">
                  {/* Row 1: ID + exam type + status + actions */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#f0fbfc] text-[#189aa1] border border-[#189aa1]/20">
                          {c.caseStudyId}
                        </span>
                        {c.examType && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {examTypeLabel(c.examType)}
                          </span>
                        )}
                        {statusBadge(c.submissionStatus)}
                        {c.accreditationType && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {c.accreditationType}
                          </span>
                        )}
                      </div>
                      {c.diagnosis && (
                        <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{c.diagnosis}</p>
                      )}
                      <StatusStepper current={c.submissionStatus} />
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        {c.sonographerName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {c.sonographerName}
                          </span>
                        )}
                        {c.interpretingPhysicianName && (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" /> {c.interpretingPhysicianName}
                          </span>
                        )}
                        {c.examDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {c.examDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#189aa1] hover:bg-[#189aa1]/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete case study ${c.caseStudyId}?`)) {
                            deleteCase.mutate({ id: c.id });
                          }
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {c.patientMrn && (
                        <div>
                          <span className="font-semibold text-gray-500">MRN / Patient ID</span>
                          <p className="text-gray-700 mt-0.5">{c.patientMrn}</p>
                        </div>
                      )}
                      {c.sonographerEmail && (
                        <div>
                          <span className="font-semibold text-gray-500">Sonographer Email</span>
                          <p className="text-gray-700 mt-0.5">{c.sonographerEmail}</p>
                        </div>
                      )}
                      {c.interpretingPhysicianEmail && (
                        <div>
                          <span className="font-semibold text-gray-500">Physician Email</span>
                          <p className="text-gray-700 mt-0.5">{c.interpretingPhysicianEmail}</p>
                        </div>
                      )}
                      {c.clinicalNotes && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-gray-500">Clinical Notes</span>
                          <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{c.clinicalNotes}</p>
                        </div>
                      )}
                      {c.submissionNotes && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-gray-500">Submission Notes</span>
                          <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{c.submissionNotes}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-500">Created</span>
                        <p className="text-gray-700 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ fontFamily: "Merriweather, serif" }}>
              {editingId !== null ? "Edit Case Study" : "Add Possible Case Study"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Exam Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Exam Type *</Label>
                <Select value={form.examType} onValueChange={v => set("examType", v)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Exam Date</Label>
                <Input
                  type="date"
                  value={form.examDate}
                  onChange={e => set("examDate", e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Patient MRN / ID (optional)</Label>
                <Input
                  value={form.patientMrn}
                  onChange={e => set("patientMrn", e.target.value)}
                  placeholder="De-identified if needed"
                  className="text-xs h-9"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Accreditation Type</Label>
                <Select value={form.accreditationType} onValueChange={v => set("accreditationType", v)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCREDITATION_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Diagnosis / Findings</Label>
              <Input
                value={form.diagnosis}
                onChange={e => set("diagnosis", e.target.value)}
                placeholder="e.g. Severe aortic stenosis with preserved EF"
                className="text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Clinical Notes</Label>
              <Textarea
                value={form.clinicalNotes}
                onChange={e => set("clinicalNotes", e.target.value)}
                placeholder="Why this case is a good IAC submission candidate..."
                className="text-xs min-h-[80px]"
              />
            </div>

            {/* Sonographer */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Sonographer
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Name</Label>
                  <Input
                    value={form.sonographerName}
                    onChange={e => set("sonographerName", e.target.value)}
                    placeholder="Sonographer name"
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    value={form.sonographerEmail}
                    onChange={e => set("sonographerEmail", e.target.value)}
                    placeholder="sonographer@lab.com"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Interpreting Physician */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> Interpreting Physician
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Name</Label>
                  <Input
                    value={form.interpretingPhysicianName}
                    onChange={e => set("interpretingPhysicianName", e.target.value)}
                    placeholder="Physician name"
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    value={form.interpretingPhysicianEmail}
                    onChange={e => set("interpretingPhysicianEmail", e.target.value)}
                    placeholder="physician@lab.com"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Status & Notes */}
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Submission Status</Label>
                  <Select value={form.submissionStatus} onValueChange={v => set("submissionStatus", v as SubmissionStatus)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Submission Notes</Label>
                <Textarea
                  value={form.submissionNotes}
                  onChange={e => set("submissionNotes", e.target.value)}
                  placeholder="Notes about submission progress, reviewer feedback, etc."
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createCase.isPending || updateCase.isPending}
              className="text-white"
              style={{ background: BRAND }}
            >
              {createCase.isPending || updateCase.isPending ? "Saving..." : editingId !== null ? "Save Changes" : "Add Case Study"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
