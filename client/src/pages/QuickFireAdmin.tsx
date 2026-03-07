/**
 * QuickFireAdmin.tsx — Admin Question Builder for Daily QuickFire
 *
 * Allows admins to:
 *  - Create questions of three types: scenario (MCQ), image-based (image + MCQ), quick-review (flashcard)
 *  - Browse, filter, edit, and deactivate existing questions
 *  - Generate the daily set for today (or a specific date)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  RefreshCw,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_META = {
  scenario: { label: "Scenario (MCQ)", icon: Stethoscope, color: "bg-blue-100 text-blue-700" },
  image: { label: "Image-Based (MCQ)", icon: ImageIcon, color: "bg-purple-100 text-purple-700" },
  quickReview: { label: "Quick Review (Flashcard)", icon: FileText, color: "bg-teal-100 text-teal-700" },
} as const;

type QuestionType = keyof typeof TYPE_META;
type Difficulty = "beginner" | "intermediate" | "advanced";

interface QuestionForm {
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | null;
  explanation: string;
  reviewAnswer: string;
  imageUrl: string;
  difficulty: Difficulty;
  tags: string;
}

const EMPTY_FORM: QuestionForm = {
  type: "scenario",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: null,
  explanation: "",
  reviewAnswer: "",
  imageUrl: "",
  difficulty: "intermediate",
  tags: "",
};

export default function QuickFireAdmin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // List state
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM);

  // Daily set generator
  const [genDate, setGenDate] = useState(new Date().toISOString().slice(0, 10));
  const [genOpen, setGenOpen] = useState(false);
  // CSV Import
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<{ row: number; message: string }[]>([]);
  const [csvSelected, setCsvSelected] = useState<Set<number>>(new Set());
  const [csvDragging, setCsvDragging] = useState(false);

  const bulkImportMutation = trpc.quickfire.bulkImportQuestions.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.inserted} question${data.inserted !== 1 ? "s" : ""} successfully`);
      setCsvOpen(false);
      setCsvRows([]);
      setCsvErrors([]);
      setCsvSelected(new Set());
      utils.quickfire.listAllQuestions.invalidate();
    },
    onError: (err) => toast.error(`Import failed: ${err.message}`),
  });

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setCsvErrors([{ row: 0, message: "File must have a header row and at least one data row." }]);
      setCsvRows([]);
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["type", "question", "difficulty"];
    const missing = required.filter((r) => !header.includes(r));
    if (missing.length > 0) {
      setCsvErrors([{ row: 0, message: `Missing required columns: ${missing.join(", ")}` }]);
      setCsvRows([]);
      return;
    }
    const rows: any[] = [];
    const errors: { row: number; message: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols: string[] = [];
      let cur = "";
      let inQuote = false;
      for (const ch of lines[i]) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      const get = (key: string) => cols[header.indexOf(key)] ?? "";
      const type = get("type").toLowerCase();
      const question = get("question");
      const difficulty = get("difficulty").toLowerCase();
      const rowErrors: string[] = [];
      if (!["scenario", "image", "quickreview"].includes(type)) rowErrors.push(`type must be scenario, image, or quickReview`);
      if (question.length < 5) rowErrors.push("question must be at least 5 characters");
      if (!["beginner", "intermediate", "advanced"].includes(difficulty)) rowErrors.push(`difficulty must be beginner, intermediate, or advanced`);
      if (rowErrors.length > 0) { errors.push({ row: i, message: rowErrors.join("; ") }); continue; }
      const optionKeys = ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"];
      const options = optionKeys.map((k) => get(k)).filter((v) => v.length > 0);
      const correctAnswerRaw = get("correct_answer");
      const correctAnswer = correctAnswerRaw !== "" ? parseInt(correctAnswerRaw, 10) : undefined;
      const tags = get("tags") ? get("tags").split("|").map((t: string) => t.trim()).filter(Boolean) : [];
      rows.push({
        type: type === "quickreview" ? "quickReview" : type,
        question,
        options: options.length >= 2 ? options : undefined,
        correctAnswer: correctAnswer !== undefined && !isNaN(correctAnswer) ? correctAnswer : undefined,
        explanation: get("explanation") || undefined,
        reviewAnswer: get("review_answer") || undefined,
        imageUrl: get("image_url") || undefined,
        difficulty,
        tags,
      });
    }
    setCsvRows(rows);
    setCsvErrors(errors);
    setCsvSelected(new Set(rows.map((_: any, i: number) => i)));
  }

  function handleCsvFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") { toast.error("Please upload a .csv file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => parseCsv((e.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const header = "type,question,option_a,option_b,option_c,option_d,correct_answer,explanation,review_answer,image_url,difficulty,tags";
    const examples = [
      `scenario,"A 65-year-old presents with exertional dyspnea. Echo shows peak gradient 64 mmHg and AVA 0.8 cm². What is the severity?",Mild AS,Moderate AS,Severe AS,Very Severe AS,2,"AVA <1.0 cm² and mean gradient >40 mmHg meets criteria for severe AS per ASE 2021 guidelines.",,, intermediate,"aortic stenosis|ASE 2021|Doppler"`,
      `quickReview,"What is the normal range for LVEF by biplane Simpson's method?",,,,,,, "55-70% is considered normal LVEF by biplane Simpson's method.",, beginner,"LVEF|LV function"`,
    ];
    const csv = [header, ...examples].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quickfire_questions_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // AI generator
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiType, setAiType] = useState<QuestionType>("scenario");
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("intermediate");
  const [aiCount, setAiCount] = useState(5);
  const [aiPreview, setAiPreview] = useState<any[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiImporting, setAiImporting] = useState(false);

  // Queries
  const listQuery = trpc.quickfire.listAllQuestions.useQuery({
    page,
    limit: 20,
    type: typeFilter === "all" ? undefined : typeFilter,
    includeInactive,
  });

  const createMutation = trpc.quickfire.createQuestion.useMutation({
    onSuccess: () => {
      toast.success("Question created.");
      utils.quickfire.listAllQuestions.invalidate();
      setFormOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message || "Failed to create question."),
  });

  const updateMutation = trpc.quickfire.updateQuestion.useMutation({
    onSuccess: () => {
      toast.success("Question updated.");
      utils.quickfire.listAllQuestions.invalidate();
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message || "Failed to update question."),
  });

  const deleteMutation = trpc.quickfire.deleteQuestion.useMutation({
    onSuccess: () => {
      toast.success("Question deactivated.");
      utils.quickfire.listAllQuestions.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to deactivate question."),
  });

  const aiGenerateMutation = trpc.quickfire.aiGenerateQuestions.useMutation({
    onSuccess: (data: any) => {
      setAiPreview(data.questions);
      setAiSelected(new Set(data.questions.map((_: any, i: number) => i)));
      toast.success(`Generated ${data.questions.length} questions — review and import below.`);
    },
    onError: (err: any) => toast.error(err.message || "AI generation failed."),
  });

  const generateMutation = trpc.quickfire.generateDailySet.useMutation({
    onSuccess: () => {
      toast.success(`Daily set generated for ${genDate}.`);
      setGenOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to generate daily set."),
  });

  // Guard: admin only
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2 font-semibold">Admin Access Required</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/quickfire")}>
            Back to QuickFire
          </Button>
        </div>
      </Layout>
    );
  }

  const questions = listQuery.data?.questions ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (q: any) => {
    setEditingId(q.id);
    setForm({
      type: q.type,
      question: q.question,
      options: q.options ?? ["", "", "", ""],
      correctAnswer: q.correctAnswer ?? null,
      explanation: q.explanation ?? "",
      reviewAnswer: q.reviewAnswer ?? "",
      imageUrl: q.imageUrl ?? "",
      difficulty: q.difficulty,
      tags: (q.tags ?? []).join(", "),
    });
    setFormOpen(true);
  };

  const handleSubmitForm = () => {
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const isMCQ = form.type !== "quickReview";

    if (form.question.trim().length < 5) {
      toast.error("Question text must be at least 5 characters.");
      return;
    }
    if (isMCQ) {
      const validOptions = form.options.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        toast.error("Please provide at least 2 answer options.");
        return;
      }
      if (form.correctAnswer === null) {
        toast.error("Please select the correct answer.");
        return;
      }
    }
    if (form.type === "quickReview" && form.reviewAnswer.trim().length < 2) {
      toast.error("Please provide a review answer (the flashcard back).");
      return;
    }
    if (form.type === "image" && !form.imageUrl.trim()) {
      toast.error("Please provide an image URL for image-based questions.");
      return;
    }

    const payload = {
      type: form.type,
      question: form.question.trim(),
      options: isMCQ ? form.options.filter((o) => o.trim().length > 0) : undefined,
      correctAnswer: isMCQ ? (form.correctAnswer ?? undefined) : undefined,
      explanation: form.explanation.trim() || undefined,
      reviewAnswer: form.type === "quickReview" ? form.reviewAnswer.trim() : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      difficulty: form.difficulty,
      tags,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const setOption = (idx: number, value: string) => {
    const opts = [...form.options];
    opts[idx] = value;
    setForm((f) => ({ ...f, options: opts }));
  };

  const addOption = () => {
    if (form.options.length < 6) {
      setForm((f) => ({ ...f, options: [...f.options, ""] }));
    }
  };

  const removeOption = (idx: number) => {
    const opts = form.options.filter((_, i) => i !== idx);
    setForm((f) => ({
      ...f,
      options: opts,
      correctAnswer: f.correctAnswer === idx ? null : f.correctAnswer !== null && f.correctAnswer > idx ? f.correctAnswer - 1 : f.correctAnswer,
    }));
  };

  const isMCQ = form.type !== "quickReview";

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/quickfire")} className="text-gray-400 hover:text-[#189aa1]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                QuickFire Question Builder
              </h1>
              <p className="text-xs text-gray-400">Create and manage daily challenge questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-green-500 text-green-600"
              onClick={() => { setCsvRows([]); setCsvErrors([]); setCsvSelected(new Set()); setCsvOpen(true); }}
            >
              <Upload className="w-4 h-4" /> CSV Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-purple-400 text-purple-600"
              onClick={() => { setAiPreview([]); setAiOpen(true); }}
            >
              <Sparkles className="w-4 h-4" /> AI Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#189aa1] text-[#189aa1]"
              onClick={() => setGenOpen(true)}
            >
              <Calendar className="w-4 h-4" /> Generate Daily Set
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-white"
              style={{ background: "#189aa1" }}
              onClick={openCreate}
            >
              <Plus className="w-4 h-4" /> New Question
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["scenario", "image", "quickReview"] as QuestionType[]).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            return (
              <div key={t} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}>
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="scenario">Scenario (MCQ)</SelectItem>
              <SelectItem value="image">Image-Based (MCQ)</SelectItem>
              <SelectItem value="quickReview">Quick Review</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeInactive((v) => !v)}
            className={includeInactive ? "border-[#189aa1] text-[#189aa1]" : ""}
          >
            {includeInactive ? "Hide Inactive" : "Show Inactive"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => utils.quickfire.listAllQuestions.invalidate()}
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </Button>
          <span className="ml-auto text-sm text-gray-400 self-center">{total} question{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Question list */}
        {listQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No questions found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first QuickFire question to get started.</p>
            <Button className="mt-4 text-white" style={{ background: "#189aa1" }} onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create Question
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {questions.map((q: any) => {
                const meta = TYPE_META[q.type as QuestionType] ?? TYPE_META.scenario;
                const Icon = meta.icon;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition-all ${q.isActive ? "border-gray-100 hover:border-[#189aa1]/30" : "border-gray-100 opacity-50"}`}
                  >
                    {/* Type badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                      {q.type === "quickReview" ? "QR" : q.type === "image" ? "IMG" : "MCQ"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          q.difficulty === "beginner" ? "bg-green-50 text-green-600" :
                          q.difficulty === "advanced" ? "bg-red-50 text-red-600" :
                          "bg-blue-50 text-blue-600"
                        }`}>{q.difficulty}</span>
                        {q.imageUrl && <ImageIcon className="w-3 h-3 text-purple-400" />}
                        {(q.tags ?? []).slice(0, 3).map((t: string) => (
                          <span key={t} className="text-xs text-gray-400">#{t}</span>
                        ))}
                        {!q.isActive && <Badge variant="outline" className="text-xs text-gray-400">inactive</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-[#189aa1]"
                        onClick={() => openEdit(q)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {q.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          onClick={() => {
                            if (confirm("Deactivate this question?")) {
                              deleteMutation.mutate({ id: q.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Question Form Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Merriweather, serif" }}>
              {editingId !== null ? "Edit Question" : "New QuickFire Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Question Type */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Question Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TYPE_META) as [QuestionType, typeof TYPE_META[QuestionType]][]).map(([type, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type, correctAnswer: null }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                        form.type === type
                          ? "border-[#189aa1] bg-[#189aa1]/5 text-[#189aa1]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image URL (image type only) */}
            {form.type === "image" && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://example.com/echo-image.jpg"
                />
                {form.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 max-h-48">
                    <img src={form.imageUrl} alt="Preview" className="w-full max-h-48 object-contain" onError={() => {}} />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Use a publicly accessible URL. Upload images via the media upload endpoint first.</p>
              </div>
            )}

            {/* Question text */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Question Text <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder={
                  form.type === "quickReview"
                    ? "e.g. What is the normal range for LV ejection fraction?"
                    : form.type === "image"
                    ? "e.g. Based on this echo image, what is the most likely diagnosis?"
                    : "e.g. A 65-year-old presents with dyspnea. TTE shows LVEF 35%, E/e' ratio 18. What is the most likely diagnosis?"
                }
                rows={3}
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">{form.question.length}/2000</p>
            </div>

            {/* MCQ Options (scenario + image) */}
            {isMCQ && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Answer Options <span className="text-red-500">*</span>
                  <span className="ml-1 font-normal text-gray-400">(click radio to mark correct)</span>
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, correctAnswer: idx }))}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          form.correctAnswer === idx
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                        title="Mark as correct answer"
                      >
                        {form.correctAnswer === idx && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <span className="text-xs font-bold text-gray-400 w-4">{String.fromCharCode(65 + idx)}</span>
                      <Input
                        value={opt}
                        onChange={(e) => setOption(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1"
                      />
                      {form.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {form.options.length < 6 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-gray-400 gap-1" onClick={addOption}>
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Review Answer (quickReview only) */}
            {form.type === "quickReview" && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Answer / Flashcard Back <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={form.reviewAnswer}
                  onChange={(e) => setForm((f) => ({ ...f, reviewAnswer: e.target.value }))}
                  placeholder="e.g. Normal LVEF is 52–72% (men) and 54–74% (women) per ASE 2015 guidelines."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Explanation <span className="text-gray-400 font-normal">(shown after answer)</span>
              </label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                placeholder="Brief teaching point or guideline reference…"
                rows={2}
                maxLength={2000}
              />
            </div>

            {/* Difficulty + Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Difficulty</label>
                <Select value={form.difficulty} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v as Difficulty }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. LV function, diastology, AS"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); setEditingId(null); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button
              className="text-white gap-2"
              style={{ background: "#189aa1" }}
              onClick={handleSubmitForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingId !== null ? "Save Changes" : "Create Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AI Question Generator Dialog ─────────────────────────────────────── */}
      <Dialog open={aiOpen} onOpenChange={(o) => { setAiOpen(o); if (!o) { setAiPreview([]); setAiTopic(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Question Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Describe a clinical topic and the AI will generate ready-to-use QuickFire questions with options, correct answers, and explanations.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Clinical Topic <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="e.g. Aortic stenosis severity grading by Doppler, diastolic dysfunction assessment, TAPSE and RV function..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Question Type</label>
                  <Select value={aiType} onValueChange={(v) => setAiType(v as QuestionType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scenario">Scenario (MCQ)</SelectItem>
                      <SelectItem value="image">Image-Based (MCQ)</SelectItem>
                      <SelectItem value="quickReview">Quick Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Difficulty</label>
                  <Select value={aiDifficulty} onValueChange={(v) => setAiDifficulty(v as Difficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Count (1–20)</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={aiCount}
                    onChange={(e) => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full gap-2 text-white"
              style={{ background: "#7c3aed" }}
              onClick={() => aiGenerateMutation.mutate({ topic: aiTopic, type: aiType, difficulty: aiDifficulty, count: aiCount, insertImmediately: false })}
              disabled={!aiTopic.trim() || aiGenerateMutation.isPending}
            >
              {aiGenerateMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate Questions</>}
            </Button>
            {aiPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{aiPreview.length} questions — select which to import:</p>
                  <div className="flex gap-2">
                    <button className="text-xs text-[#189aa1] hover:underline" onClick={() => setAiSelected(new Set(aiPreview.map((_: any, i: number) => i)))}>All</button>
                    <button className="text-xs text-gray-400 hover:underline" onClick={() => setAiSelected(new Set())}>None</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {aiPreview.map((q: any, i: number) => (
                    <div
                      key={i}
                      className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        aiSelected.has(i) ? "border-purple-300 bg-purple-50" : "border-gray-100 bg-white opacity-60"
                      }`}
                      onClick={() => setAiSelected((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {aiSelected.has(i) ? <CheckSquare className="w-4 h-4 text-purple-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{q.question}</p>
                        {q.options && (
                          <div className="mt-1.5 space-y-0.5">
                            {q.options.map((opt: string, oi: number) => (
                              <p key={oi} className={`text-xs ${oi === q.correctAnswer ? "text-green-700 font-semibold" : "text-gray-500"}`}>
                                {oi === q.correctAnswer ? "✓" : "○"} {opt}
                              </p>
                            ))}
                          </div>
                        )}
                        {q.reviewAnswer && <p className="text-xs text-green-700 font-semibold mt-1">Answer: {q.reviewAnswer}</p>}
                        {q.explanation && <p className="text-xs text-gray-400 mt-1 italic">{q.explanation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full gap-2 text-white"
                  style={{ background: "#189aa1" }}
                  disabled={aiSelected.size === 0 || aiImporting}
                  onClick={async () => {
                    const selectedQs = aiPreview.filter((_: any, i: number) => aiSelected.has(i));
                    setAiImporting(true);
                    try {
                      await Promise.all(
                        selectedQs.map((q: any) =>
                          createMutation.mutateAsync({
                            type: aiType,
                            question: q.question,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            reviewAnswer: q.reviewAnswer,
                            difficulty: aiDifficulty,
                            tags: q.tags ?? [],
                          } as any)
                        )
                      );
                      toast.success(`${selectedQs.length} question${selectedQs.length !== 1 ? "s" : ""} imported.`);
                      utils.quickfire.listAllQuestions.invalidate();
                      setAiOpen(false);
                      setAiPreview([]);
                      setAiTopic("");
                    } catch (err: any) {
                      toast.error(err.message || "Import failed.");
                    } finally {
                      setAiImporting(false);
                    }
                  }}
                >
                  {aiImporting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Import {aiSelected.size} Question{aiSelected.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAiOpen(false); setAiPreview([]); setAiTopic(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CSV Import Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={csvOpen} onOpenChange={(open) => { setCsvOpen(open); if (!open) { setCsvRows([]); setCsvErrors([]); setCsvSelected(new Set()); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" /> Bulk Import Questions via CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template download */}
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-green-800">Download Template</p>
                <p className="text-xs text-green-600">Required columns: type, question, difficulty. Optional: option_a–f, correct_answer, explanation, review_answer, image_url, tags (pipe-separated)</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 border-green-500 text-green-600 flex-shrink-0" onClick={downloadTemplate}>
                <Download className="w-4 h-4" /> Template
              </Button>
            </div>

            {/* Drag-and-drop upload zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                csvDragging ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setCsvDragging(true); }}
              onDragLeave={() => setCsvDragging(false)}
              onDrop={(e) => { e.preventDefault(); setCsvDragging(false); const file = e.dataTransfer.files[0]; if (file) handleCsvFile(file); }}
              onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".csv,text/csv"; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleCsvFile(file); }; input.click(); }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Drop a CSV file here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports .csv files up to 500 rows</p>
            </div>

            {/* Validation errors */}
            {csvErrors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {csvErrors.length} row{csvErrors.length !== 1 ? "s" : ""} with errors (skipped)</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {csvErrors.map((e) => (
                    <div key={e.row} className="text-xs bg-red-50 border border-red-100 rounded px-3 py-1.5">
                      <span className="font-semibold text-red-600">Row {e.row}:</span> {e.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            {csvRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{csvRows.length} valid row{csvRows.length !== 1 ? "s" : ""} ready to import</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCsvSelected(new Set(csvRows.map((_: any, i: number) => i)))}>
                      <CheckSquare className="w-3.5 h-3.5 mr-1" /> Select All
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCsvSelected(new Set())}>
                      <Square className="w-3.5 h-3.5 mr-1" /> Deselect All
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                  {csvRows.map((row: any, i: number) => {
                    const meta = TYPE_META[row.type as QuestionType] ?? TYPE_META.scenario;
                    const Icon = meta.icon;
                    const selected = csvSelected.has(i);
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          selected ? "bg-green-50" : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          const next = new Set(csvSelected);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          setCsvSelected(next);
                        }}
                      >
                        <div className="mt-0.5">{selected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-300" />}</div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>
                          <Icon className="w-3 h-3" />{row.type === "quickReview" ? "QR" : row.type === "image" ? "IMG" : "MCQ"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 line-clamp-2">{row.question}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1 rounded ${
                              row.difficulty === "beginner" ? "bg-green-50 text-green-600" :
                              row.difficulty === "advanced" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                            }`}>{row.difficulty}</span>
                            {row.options && <span className="text-xs text-gray-400">{row.options.length} options</span>}
                            {(row.tags ?? []).slice(0, 2).map((t: string) => <span key={t} className="text-xs text-gray-400">#{t}</span>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400">{csvSelected.size} of {csvRows.length} selected for import</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvOpen(false)}>Cancel</Button>
            <Button
              className="text-white gap-2"
              style={{ background: "#189aa1" }}
              disabled={csvSelected.size === 0 || bulkImportMutation.isPending}
              onClick={() => {
                const selectedRows = csvRows.filter((_: any, i: number) => csvSelected.has(i));
                bulkImportMutation.mutate({ questions: selectedRows });
              }}
            >
              {bulkImportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {bulkImportMutation.isPending ? "Importing…" : `Import ${csvSelected.size} Question${csvSelected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Daily Set Dialog ────────────────────────────────────────── */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#189aa1]" /> Generate Daily Set
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              This will create (or regenerate) the QuickFire set for the selected date — a balanced mix of scenario, image, and quick-review questions.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Date</label>
              <Input
                type="date"
                value={genDate}
                onChange={(e) => setGenDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button
              className="text-white gap-2"
              style={{ background: "#189aa1" }}
              onClick={() => generateMutation.mutate({ date: genDate })}
              disabled={generateMutation.isPending}
            >
              <Zap className="w-4 h-4" />
              {generateMutation.isPending ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
