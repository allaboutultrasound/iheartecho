/**
 * QuickFireAdmin.tsx — Admin Question Builder for Daily Challenge
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
import RichTextEditor from "@/components/RichTextEditor";
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
  Bell,
  Send,
  ListOrdered,
  PlayCircle,
  Archive,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Clock,
  Tag,
  ListPlus,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeSearch, setChallengeSearch] = useState("");
  const [flashcardSearch, setFlashcardSearch] = useState("");
  const [flashcardEchoCategory, setFlashcardEchoCategory] = useState<"all" | "adult" | "pediatric_congenital" | "fetal">("all");
  const [flashcardAiOpen, setFlashcardAiOpen] = useState(false);
  const [flashcardAiTopic, setFlashcardAiTopic] = useState("");
  const [flashcardAiDifficulty, setFlashcardAiDifficulty] = useState<Difficulty>("intermediate");
  const [flashcardAiCount, setFlashcardAiCount] = useState(5);
  const [flashcardAiPreview, setFlashcardAiPreview] = useState<any[]>([]);
  const [flashcardAiSelected, setFlashcardAiSelected] = useState<Set<number>>(new Set());
  const [flashcardAiImporting, setFlashcardAiImporting] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM);
  const [imageUploading, setImageUploading] = useState(false);

  async function handleImageUpload(file: File) {
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-question-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Image upload failed");
    } finally {
      setImageUploading(false);
    }
  }

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
    a.href = url; a.download = "daily_challenge_questions_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Challenge Queue state ────────────────────────────────────────────────
  const [activeAdminTab, setActiveAdminTab] = useState<"questions" | "challenges" | "archive" | "flashcards">("questions");

  // ── Challenge Archive state ──────────────────────────────────────────────
  const archivedChallengesQuery = trpc.quickfire.adminListArchivedChallenges.useQuery();
  const archivedChallenges = archivedChallengesQuery.data ?? [];

  const cloneChallengeMutation = trpc.quickfire.adminCloneChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge cloned and added to queue.");
      archivedChallengesQuery.refetch();
      challengeListQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to clone challenge."),
  });

  // ── Flashcard Management state ───────────────────────────────────────────
  const [flashcardFormOpen, setFlashcardFormOpen] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<number | null>(null);
  const [flashcardForm, setFlashcardForm] = useState<QuestionForm>({ ...EMPTY_FORM, type: "quickReview" });
  const [flashcardUploadingMedia, setFlashcardUploadingMedia] = useState(false);
  const [challengeFormOpen, setChallengeFormOpen] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    category: "Adult Echo",
    publishDate: "",
    priority: 100,
    selectedQuestionIds: [] as number[],
  });

  const challengeListQuery = trpc.quickfire.adminListChallenges.useQuery({ includeArchived: false });
  const challenges = challengeListQuery.data ?? [];

  const createChallengeMutation = trpc.quickfire.adminCreateChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge created and added to queue.");
      challengeListQuery.refetch();
      setChallengeFormOpen(false);
      setChallengeForm({ title: "", description: "", category: "Adult Echo", publishDate: "", priority: 100, selectedQuestionIds: [] });
    },
    onError: (err) => toast.error(err.message || "Failed to create challenge."),
  });

  const updateChallengeMutation = trpc.quickfire.adminUpdateChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge updated.");
      challengeListQuery.refetch();
      setChallengeFormOpen(false);
      setEditingChallengeId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to update challenge."),
  });

  const deleteChallengeMutation = trpc.quickfire.adminDeleteChallenge.useMutation({
    onSuccess: () => { toast.success("Challenge removed from queue."); challengeListQuery.refetch(); },
    onError: (err) => toast.error(err.message || "Failed to delete challenge."),
  });

  const publishNextMutation = trpc.quickfire.adminPublishNextChallenge.useMutation({
    onSuccess: (data) => {
      if (data.published) toast.success(`Challenge "${data.title}" is now live!`);
      else toast.info(data.message ?? "No challenges to publish.");
      challengeListQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to publish challenge."),
  });

  const reorderMutation = trpc.quickfire.adminReorderChallenges.useMutation({
    onError: (err) => toast.error(err.message || "Failed to reorder."),
  });

  function moveChallengeUp(idx: number) {
    if (idx === 0) return;
    const draft = [...challenges.filter((c) => c.status !== "live")];
    const live = challenges.filter((c) => c.status === "live");
    const item = draft[idx - live.length];
    if (!item) return;
    const draftIdx = idx - live.length;
    if (draftIdx <= 0) return;
    const reordered = [...draft];
    [reordered[draftIdx - 1], reordered[draftIdx]] = [reordered[draftIdx], reordered[draftIdx - 1]];
    reorderMutation.mutate({ orderedIds: reordered.map((c) => c.id) });
    challengeListQuery.refetch();
  }

  function moveChallengeDown(idx: number) {
    const draft = [...challenges.filter((c) => c.status !== "live")];
    const live = challenges.filter((c) => c.status === "live");
    const draftIdx = idx - live.length;
    if (draftIdx < 0 || draftIdx >= draft.length - 1) return;
    const reordered = [...draft];
    [reordered[draftIdx], reordered[draftIdx + 1]] = [reordered[draftIdx + 1], reordered[draftIdx]];
    reorderMutation.mutate({ orderedIds: reordered.map((c) => c.id) });
    challengeListQuery.refetch();
  }

  function openCreateChallenge() {
    setEditingChallengeId(null);
    setChallengeForm({ title: "", description: "", category: "Adult Echo", publishDate: "", priority: 100, selectedQuestionIds: [] });
    setChallengeFormOpen(true);
  }

  function openEditChallenge(c: any) {
    setEditingChallengeId(c.id);
    setChallengeForm({
      title: c.title,
      description: c.description ?? "",
      category: c.category ?? "Adult Echo",
      publishDate: c.publishDate ?? "",
      priority: c.priority ?? 100,
      selectedQuestionIds: Array.isArray(c.questionIds) ? c.questionIds : [],
    });
    setChallengeFormOpen(true);
  }

  function handleSubmitChallenge() {
    if (!challengeForm.title.trim()) { toast.error("Challenge title is required."); return; }
    if (challengeForm.selectedQuestionIds.length === 0) { toast.error("Select at least one question."); return; }
    const payload = {
      title: challengeForm.title.trim(),
      description: challengeForm.description.trim() || undefined,
      questionIds: challengeForm.selectedQuestionIds,
      priority: challengeForm.priority,
      category: challengeForm.category || undefined,
      publishDate: challengeForm.publishDate || undefined,
    };
    if (editingChallengeId !== null) {
      updateChallengeMutation.mutate({ id: editingChallengeId, ...payload });
    } else {
      createChallengeMutation.mutate(payload as any);
    }
  }

  // Streak Reminders
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ sent: number; skipped: number; total: number } | null>(null);
  const triggerRemindersMutation = trpc.quickfire.triggerStreakReminders.useMutation({
    onSuccess: (data) => {
      setReminderResult(data);
      toast.success(`Reminders sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(`Failed to send reminders: ${err.message}`),
  });

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
    search: searchQuery.trim() || undefined,
  });

  const flashcardListQuery = trpc.quickfire.listAllQuestions.useQuery({
    page: 1,
    limit: 100,
    type: "quickReview",
    includeInactive: false,
    search: flashcardSearch.trim() || undefined,
    echoCategory: flashcardEchoCategory === "all" ? undefined : flashcardEchoCategory,
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

  const approveToQueueMutation = trpc.quickfire.adminApproveQuestionToQueue.useMutation({
    onSuccess: () => {
      toast.success("Question approved and added to the daily queue.");
      challengeListQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to approve question."),
  });

  const aiGenerateMutation = trpc.quickfire.aiGenerateQuestions.useMutation({
    onSuccess: (data: any) => {
      if (flashcardAiOpen) {
        setFlashcardAiPreview(data.questions);
        setFlashcardAiSelected(new Set(data.questions.map((_: any, i: number) => i)));
      } else {
        setAiPreview(data.questions);
        setAiSelected(new Set(data.questions.map((_: any, i: number) => i)));
      }
      toast.success(`Generated ${data.questions.length} ${flashcardAiOpen ? "flashcard" : "question"}${data.questions.length !== 1 ? "s" : ""} — review and import below.`);
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
            Back to Daily Challenge
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
                Daily Challenge Question Builder
              </h1>
              <p className="text-xs text-gray-400">Create and manage daily challenge questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-orange-400 text-orange-600"
              onClick={() => { setReminderResult(null); setReminderOpen(true); }}
            >
              <Bell className="w-4 h-4" /> Send Reminders
            </Button>
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

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveAdminTab("questions")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAdminTab === "questions" ? "bg-white text-[#189aa1] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Zap className="w-4 h-4" /> Question Bank
          </button>
          <button
            onClick={() => setActiveAdminTab("challenges")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAdminTab === "challenges" ? "bg-white text-[#189aa1] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListOrdered className="w-4 h-4" /> Challenge Queue
            {challenges.filter((c) => c.status === "live").length > 0 && (
              <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">LIVE</span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab("archive")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAdminTab === "archive" ? "bg-white text-[#189aa1] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Archive className="w-4 h-4" /> Challenge Archive
            {archivedChallenges.length > 0 && (
              <span className="ml-1 bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5">{archivedChallenges.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab("flashcards")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAdminTab === "flashcards" ? "bg-white text-[#189aa1] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" /> Flashcard Management
          </button>
        </div>

        {/* ── CHALLENGE QUEUE TAB ──────────────────────────────────────────── */}
        {activeAdminTab === "challenges" && (
          <div className="space-y-4">
            {/* Queue header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Daily Challenge Queue</h2>
                <p className="text-xs text-gray-400 mt-0.5">One question per day. Approve individual questions from the Question Bank to add them to this queue.</p>
              </div>
              <Input
                value={challengeSearch}
                onChange={(e) => setChallengeSearch(e.target.value)}
                placeholder="Search queue…"
                className="w-52"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-green-500 text-green-600"
                  onClick={() => publishNextMutation.mutate({ sendNotification: true })}
                  disabled={publishNextMutation.isPending || challenges.filter((c) => c.status !== "live").length === 0}
                >
                  {publishNextMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Publish Next Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setActiveAdminTab("questions")}
                >
                  <ListPlus className="w-4 h-4" /> Go to Question Bank
                </Button>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-xs text-teal-700">
              <strong>How to add questions:</strong> Go to the <button className="underline font-semibold" onClick={() => setActiveAdminTab("questions")}>Question Bank</button> tab, find any Scenario or Image question, and click the <strong>Queue</strong> button to approve it for the daily challenge. Each question is served individually — one per day.
            </div>

            {/* Challenge list */}
            {challengeListQuery.isLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-16">
                <ListOrdered className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No questions in queue</p>
                <p className="text-sm text-gray-400 mt-1">Go to the Question Bank and click <strong>Queue</strong> on any question to add it here.</p>
                <Button className="mt-4 gap-2" variant="outline" onClick={() => setActiveAdminTab("questions")}>
                  <ListPlus className="w-4 h-4" /> Go to Question Bank
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {challenges.filter((c: any) => !challengeSearch.trim() || c.title?.toLowerCase().includes(challengeSearch.toLowerCase()) || c.description?.toLowerCase().includes(challengeSearch.toLowerCase())).map((c: any, idx: number) => {
                  const isLive = c.status === "live";
                  const isScheduled = c.status === "scheduled";
                  const isDraft = c.status === "draft";
                  const qCount = Array.isArray(c.questionIds) ? c.questionIds.length : 0;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition-all ${
                        isLive ? "border-green-300 bg-green-50" :
                        isScheduled ? "border-blue-200" :
                        "border-gray-100 hover:border-[#189aa1]/30"
                      }`}
                    >
                      {/* Reorder buttons (draft/scheduled only) */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
                        {!isLive && (
                          <>
                            <button onClick={() => moveChallengeUp(idx)} className="text-gray-300 hover:text-[#189aa1] transition-colors" title="Move up">
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => moveChallengeDown(idx)} className="text-gray-300 hover:text-[#189aa1] transition-colors" title="Move down">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isLive && <PlayCircle className="w-4 h-4 text-green-500" />}
                      </div>

                      {/* Priority badge */}
                      <div className="flex-shrink-0 w-8 text-center">
                        <span className="text-xs font-bold text-gray-300">#{idx + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-800">{c.title}</span>
                          {isLive && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">LIVE</span>}
                          {isScheduled && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">SCHEDULED</span>}
                          {isDraft && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">DRAFT</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {c.category && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Tag className="w-3 h-3" />{c.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{qCount} question{qCount !== 1 ? "s" : ""}</span>
                          {c.publishDate && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />Scheduled: {c.publishDate}
                            </span>
                          )}
                          {isLive && c.publishedAt && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Clock className="w-3 h-3" />Live since {new Date(c.publishedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.description}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isLive && (
                          <>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-[#189aa1]" onClick={() => openEditChallenge(c)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              onClick={() => { if (confirm("Remove this challenge from the queue?")) deleteChallengeMutation.mutate({ id: c.id }); }}
                              disabled={deleteChallengeMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── QUESTION BANK TAB (existing content below) ─────────────────── */}
        {activeAdminTab === "questions" && (
        <div>
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
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search questions…"
            className="w-56"
          />
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(1); }}>
            <SelectTrigger className="w-44">
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
            <p className="text-sm text-gray-400 mt-1">Create your first Daily Challenge question to get started.</p>
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
                      {q.isActive && q.type !== "quickReview" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs gap-1 text-[#189aa1] hover:bg-[#189aa1]/10 border border-[#189aa1]/30"
                          title="Approve to daily queue"
                          onClick={() => {
                            if (confirm(`Add "${q.question.slice(0, 60)}..." to the daily challenge queue?`)) {
                              approveToQueueMutation.mutate({ questionId: q.id });
                            }
                          }}
                          disabled={approveToQueueMutation.isPending}
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                          Queue
                        </Button>
                      )}
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
        )}

        {/* ── CHALLENGE ARCHIVE TAB ──────────────────────────────────────────── */}
        {activeAdminTab === "archive" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Challenge Archive</h2>
                <p className="text-xs text-gray-400 mt-0.5">Past challenges that have been published and archived. Push any to the queue to reuse.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => archivedChallengesQuery.refetch()} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            {archivedChallengesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" /></div>
            ) : archivedChallenges.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No archived challenges yet. Challenges are archived after they go live and are replaced.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedChallenges.map((challenge) => (
                  <div key={challenge.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Archive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-sm text-gray-800 truncate">{challenge.title}</span>
                          {challenge.category && (
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">{challenge.category}</Badge>
                          )}
                        </div>
                        {challenge.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: challenge.description }} />
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{challenge.questionIds.length} questions</span>
                          {challenge.archivedAt && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Archived {new Date(challenge.archivedAt).toLocaleDateString()}</span>
                          )}
                          {challenge.publishedAt && (
                            <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" />Published {new Date(challenge.publishedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="flex-shrink-0 gap-1.5 bg-[#189aa1] hover:bg-[#0e7a80] text-white"
                        onClick={() => cloneChallengeMutation.mutate({ id: challenge.id })}
                        disabled={cloneChallengeMutation.isPending}
                      >
                        {cloneChallengeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Push to Queue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FLASHCARD MANAGEMENT TAB ──────────────────────────────────────── */}
        {activeAdminTab === "flashcards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Flashcard Manager</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create and manage Echo Flashcards by category. Supports AI generation.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-purple-400 text-purple-600"
                  onClick={() => { setFlashcardAiPreview([]); setFlashcardAiTopic(""); setFlashcardAiOpen(true); }}
                >
                  <Sparkles className="w-4 h-4" /> AI Generate
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#189aa1] hover:bg-[#0e7a80] text-white"
                  onClick={() => {
                    setFlashcardForm({ ...EMPTY_FORM, type: "quickReview" });
                    setEditingFlashcardId(null);
                    setFlashcardFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> New Flashcard
                </Button>
              </div>
            </div>

            {/* Search + Category filter */}
            <div className="flex gap-2 flex-wrap">
              <Input
                value={flashcardSearch}
                onChange={(e) => setFlashcardSearch(e.target.value)}
                placeholder="Search flashcards…"
                className="w-56"
              />
              <div className="flex gap-1 flex-wrap">
                {(["all", "adult", "pediatric", "fetal"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFlashcardEchoCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      flashcardEchoCategory === cat
                        ? "border-[#189aa1] bg-[#189aa1] text-white"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1]"
                    }`}
                  >
                    {cat === "all" ? "All" : cat === "adult" ? "Adult Echo" : cat === "pediatric" ? "Pediatric/Congenital" : "Fetal Echo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcard list */}
            {flashcardListQuery.isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" /></div>
            ) : (
              <div className="space-y-3">
                {(flashcardListQuery.data?.questions ?? []).map((q: any) => (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                          <span className="font-semibold text-sm text-gray-800 truncate" dangerouslySetInnerHTML={{ __html: q.question ?? "" }} />
                        </div>
                        {q.reviewAnswer && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.reviewAnswer }} />
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          {q.imageUrl && <span className="flex items-center gap-1 text-purple-500"><ImageIcon className="w-3 h-3" />Has image</span>}
                          {(q as any).videoUrl && <span className="flex items-center gap-1 text-blue-500"><PlayCircle className="w-3 h-3" />Has video</span>}
                          {q.difficulty && <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>}
                          {!q.isActive && <Badge className="text-[10px] bg-red-100 text-red-600 border-0">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tags: string[] = q.tags ? JSON.parse(q.tags) : [];
                            setFlashcardForm({
                              type: "quickReview",
                              question: q.question ?? "",
                              options: ["", "", "", ""],
                              correctAnswer: null,
                              explanation: q.explanation ?? "",
                              reviewAnswer: q.reviewAnswer ?? "",
                              imageUrl: q.imageUrl ?? "",
                              difficulty: (q.difficulty as Difficulty) ?? "intermediate",
                              tags: tags.join(", "),
                            });
                            setEditingFlashcardId(q.id);
                            setFlashcardFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Deactivate this flashcard?")) {
                              deleteMutation.mutate({ id: q.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(flashcardListQuery.data?.questions ?? []).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No flashcards found. Create your first one or use AI Generate.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
      {/* ── Challenge Form Dialog ────────────────────────────────────────────── */}
      <Dialog open={challengeFormOpen} onOpenChange={(open) => { if (!open) { setChallengeFormOpen(false); setEditingChallengeId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Merriweather, serif" }}>
              {editingChallengeId !== null ? "Edit Challenge" : "New Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Challenge Title <span className="text-red-500">*</span></label>
              <Input
                value={challengeForm.title}
                onChange={(e) => setChallengeForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. ACS Echo Essentials — Week 1"
                maxLength={300}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <RichTextEditor
                value={challengeForm.description}
                onChange={(v) => setChallengeForm((f) => ({ ...f, description: v }))}
                placeholder="Brief description shown to users before they start…"
                minHeight="70px"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category</label>
                <Select value={challengeForm.category} onValueChange={(v) => setChallengeForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACS">ACS</SelectItem>
                    <SelectItem value="Adult Echo">Adult Echo</SelectItem>
                    <SelectItem value="Pediatric Echo">Pediatric Echo</SelectItem>
                    <SelectItem value="Fetal Echo">Fetal Echo</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Scheduled Publish Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input
                  type="date"
                  value={challengeForm.publishDate}
                  onChange={(e) => setChallengeForm((f) => ({ ...f, publishDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Select Questions <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-400 mb-2">Pick questions from your bank to include in this challenge.</p>
              {listQuery.isLoading ? (
                <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                  {(listQuery.data?.questions ?? []).map((q: any) => {
                    const selected = challengeForm.selectedQuestionIds.includes(q.id);
                    const meta = TYPE_META[q.type as QuestionType] ?? TYPE_META.scenario;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={q.id}
                        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          selected ? "bg-teal-50" : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setChallengeForm((f) => ({
                            ...f,
                            selectedQuestionIds: selected
                              ? f.selectedQuestionIds.filter((id) => id !== q.id)
                              : [...f.selectedQuestionIds, q.id],
                          }));
                        }}
                      >
                        <div className="mt-0.5">{selected ? <CheckSquare className="w-4 h-4 text-[#189aa1]" /> : <Square className="w-4 h-4 text-gray-300" />}</div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>
                          <Icon className="w-3 h-3" />{q.type === "quickReview" ? "QR" : q.type === "image" ? "IMG" : "MCQ"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 line-clamp-2">{q.question}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1 rounded ${
                              q.difficulty === "beginner" ? "bg-green-50 text-green-600" :
                              q.difficulty === "advanced" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                            }`}>{q.difficulty}</span>
                            {(q.tags ?? []).slice(0, 2).map((t: string) => <span key={t} className="text-xs text-gray-400">#{t}</span>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">{challengeForm.selectedQuestionIds.length} question{challengeForm.selectedQuestionIds.length !== 1 ? "s" : ""} selected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setChallengeFormOpen(false); setEditingChallengeId(null); }}>Cancel</Button>
            <Button
              className="text-white gap-2"
              style={{ background: "#189aa1" }}
              onClick={handleSubmitChallenge}
              disabled={createChallengeMutation.isPending || updateChallengeMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingChallengeId !== null ? "Save Changes" : "Create Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Question Form Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Merriweather, serif" }}>
              {editingId !== null ? "Edit Question" : "New Daily Challenge Question"}
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
                  Echo Image <span className="text-red-500">*</span>
                </label>

                {/* Upload zone */}
                <div
                  className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  onClick={() => document.getElementById('question-image-input')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageUpload(file);
                  }}
                >
                  {imageUploading ? (
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading…</span>
                    </div>
                  ) : form.imageUrl ? (
                    <div className="relative">
                      <img src={form.imageUrl} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, imageUrl: "" })); }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      <p className="text-xs text-purple-600 mt-1">Click to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <ImageIcon className="w-8 h-8 text-purple-300" />
                      <p className="text-sm text-gray-600 font-medium">Click or drag to upload echo image</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, WEBP · Max 20 MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="question-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />

                {/* Manual URL fallback */}
                <div className="mt-2">
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="Or paste a public image URL…"
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* Question text */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Question Text <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={form.question}
                onChange={(v) => setForm((f) => ({ ...f, question: v }))}
                placeholder={
                  form.type === "quickReview"
                    ? "e.g. What is the normal range for LV ejection fraction?"
                    : form.type === "image"
                    ? "e.g. Based on this echo image, what is the most likely diagnosis?"
                    : "e.g. A 65-year-old presents with dyspnea. TTE shows LVEF 35%, E/e' ratio 18. What is the most likely diagnosis?"
                }
                minHeight="90px"
              />
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
                <RichTextEditor
                  value={form.reviewAnswer}
                  onChange={(v) => setForm((f) => ({ ...f, reviewAnswer: v }))}
                  placeholder="e.g. Normal LVEF is 52–72% (men) and 54–74% (women) per ASE guidelines."
                   minHeight="90px"
                />
              </div>
            )}
            {/* Explanation */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Explanation <span className="text-gray-400 font-normal">(shown after answer)</span>
              </label>
              <RichTextEditor
                value={form.explanation}
                onChange={(v) => setForm((f) => ({ ...f, explanation: v }))}
                placeholder="Brief teaching point or guideline reference…"
                minHeight="70px"
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
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["ACS", "Adult Echo", "Pediatric Echo", "Fetal Echo"].map((cat) => {
                    const currentTags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
                    const isActive = currentTags.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
                          const updated = isActive
                            ? tags.filter((t) => t !== cat)
                            : [...tags, cat];
                          setForm((f) => ({ ...f, tags: updated.join(", ") }));
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          isActive
                            ? "border-[#189aa1] bg-[#189aa1] text-white"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1]"
                        }`}
                      >
                        {isActive ? "✓ " : ""}{cat}
                      </button>
                    );
                  })}
                </div>
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
              Describe a clinical topic and the AI will generate ready-to-use Daily Challenge questions with options, correct answers, and explanations.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Clinical Topic <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: "ACS", topic: "Echocardiographic assessment in Acute Coronary Syndrome (ACS) — RWMA, LV function, complications" },
                    { label: "Adult Echo", topic: "Adult transthoracic echocardiography — valvular disease, LV/RV function, Doppler assessment" },
                    { label: "HOCM", topic: "Hypertrophic obstructive cardiomyopathy (HOCM) — LVOT obstruction, SAM, Doppler gradients, septal morphology, provocable obstruction" },
                    { label: "Strain / GLS", topic: "Myocardial strain imaging and global longitudinal strain (GLS) — LV GLS, RV strain, layer-specific strain, clinical applications" },
                    { label: "Diastolic Function", topic: "Diastolic function assessment — grading diastolic dysfunction, E/A ratio, E/e\u2019, LAVI, TR velocity, ASE 2025 guidelines" },
                    { label: "Dilated CM", topic: "Dilated cardiomyopathy — LV dilation, reduced EF, functional MR, LV dyssynchrony, CRT criteria" },
                    { label: "Restrictive CM", topic: "Restrictive cardiomyopathy — amyloid, sarcoid, Fabry disease, restrictive filling pattern, biatrial enlargement" },
                    { label: "Constrictive Pericarditis", topic: "Constrictive pericarditis — respiratory variation, septal bounce, annulus reversus, hepatic vein flow, differentiation from restriction" },
                    { label: "Tamponade", topic: "Cardiac tamponade — pericardial effusion, chamber collapse, respiratory variation, IVC plethora, equalization of pressures" },
                    { label: "Pulmonary HTN", topic: "Pulmonary hypertension — RVSP estimation, TR velocity, RV remodeling, PA pressures, ASE 2025 PH guidelines" },
                    { label: "Pulmonary Embolism", topic: "Pulmonary embolism — RV strain pattern, McConnell sign, D-sign, TR, IVC, risk stratification by echo" },
                    { label: "Pediatric Echo", topic: "Pediatric echocardiography — congenital heart disease, Z-scores, shunt assessment, CHD lesions" },
                    { label: "Fetal Echo", topic: "Fetal echocardiography — fetal cardiac anatomy, CHD screening, biometry, situs, arch patterns" },
                  ].map(({ label, topic }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAiTopic(topic)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        aiTopic === topic
                          ? "border-[#189aa1] bg-[#189aa1] text-white"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <RichTextEditor
                  value={aiTopic}
                  onChange={setAiTopic}
                  placeholder="e.g. Aortic stenosis severity grading by Doppler, diastolic dysfunction assessment, TAPSE and RV function..."
                  minHeight="70px"
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

      {/* ── Flashcard AI Generator Dialog ─────────────────────────────────── */}
      <Dialog open={flashcardAiOpen} onOpenChange={(o) => { setFlashcardAiOpen(o); if (!o) { setFlashcardAiPreview([]); setFlashcardAiTopic(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Flashcard Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Describe a clinical topic and the AI will generate ready-to-use Echo Flashcards with concise answers and explanations.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Clinical Topic <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: "Adult Echo", topic: "Adult transthoracic echocardiography — valvular disease, LV/RV function, Doppler assessment" },
                    { label: "Diastolic Function", topic: "Diastolic function assessment — grading diastolic dysfunction, E/A ratio, E/e\u2019, LAVI, TR velocity, ASE 2025 guidelines" },
                    { label: "Aortic Stenosis", topic: "Aortic stenosis severity grading — AVA, mean gradient, peak velocity, low-flow low-gradient AS, dobutamine stress echo" },
                    { label: "Mitral Valve", topic: "Mitral valve disease — MR severity, MS area, MVA by PHT and planimetry, mitral valve anatomy" },
                    { label: "HOCM", topic: "Hypertrophic obstructive cardiomyopathy (HOCM) — LVOT obstruction, SAM, Doppler gradients, septal morphology" },
                    { label: "Strain / GLS", topic: "Myocardial strain imaging and global longitudinal strain (GLS) — LV GLS, RV strain, clinical applications" },
                    { label: "Pediatric Echo", topic: "Pediatric echocardiography — congenital heart disease, Z-scores, shunt assessment, CHD lesions" },
                    { label: "Fetal Echo", topic: "Fetal echocardiography — fetal cardiac anatomy, CHD screening, biometry, situs, arch patterns" },
                    { label: "Pulmonary HTN", topic: "Pulmonary hypertension — RVSP estimation, TR velocity, RV remodeling, PA pressures" },
                    { label: "Pericardial Disease", topic: "Pericardial disease — tamponade, constrictive pericarditis, pericardial effusion, respiratory variation" },
                  ].map(({ label, topic }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFlashcardAiTopic(topic)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        flashcardAiTopic === topic
                          ? "border-[#189aa1] bg-[#189aa1] text-white"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Input
                  value={flashcardAiTopic}
                  onChange={(e) => setFlashcardAiTopic(e.target.value)}
                  placeholder="e.g. Aortic stenosis severity grading, diastolic dysfunction, TAPSE and RV function..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Difficulty</label>
                  <Select value={flashcardAiDifficulty} onValueChange={(v) => setFlashcardAiDifficulty(v as Difficulty)}>
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
                    value={flashcardAiCount}
                    onChange={(e) => setFlashcardAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full gap-2 text-white"
              style={{ background: "#7c3aed" }}
              onClick={() => aiGenerateMutation.mutate({ topic: flashcardAiTopic, type: "quickReview", difficulty: flashcardAiDifficulty, count: flashcardAiCount, insertImmediately: false })}
              disabled={!flashcardAiTopic.trim() || aiGenerateMutation.isPending}
            >
              {aiGenerateMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating\u2026</>
                : <><Sparkles className="w-4 h-4" /> Generate {flashcardAiCount} Flashcard{flashcardAiCount !== 1 ? "s" : ""}</>}
            </Button>
            {flashcardAiPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{flashcardAiPreview.length} flashcards — select which to import:</p>
                  <div className="flex gap-2">
                    <button className="text-xs text-[#189aa1] hover:underline" onClick={() => setFlashcardAiSelected(new Set(flashcardAiPreview.map((_: any, i: number) => i)))}>All</button>
                    <button className="text-xs text-gray-400 hover:underline" onClick={() => setFlashcardAiSelected(new Set())}>None</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {flashcardAiPreview.map((q: any, i: number) => (
                    <div
                      key={i}
                      className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        flashcardAiSelected.has(i) ? "border-purple-300 bg-purple-50" : "border-gray-100 bg-white opacity-60"
                      }`}
                      onClick={() => setFlashcardAiSelected((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {flashcardAiSelected.has(i) ? <CheckSquare className="w-4 h-4 text-purple-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{q.question}</p>
                        {q.reviewAnswer && <p className="text-xs text-green-700 font-semibold mt-1">Answer: {q.reviewAnswer}</p>}
                        {q.explanation && <p className="text-xs text-gray-400 mt-1 italic">{q.explanation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full gap-2 text-white"
                  style={{ background: "#189aa1" }}
                  disabled={flashcardAiSelected.size === 0 || flashcardAiImporting}
                  onClick={async () => {
                    const selectedQs = flashcardAiPreview.filter((_: any, i: number) => flashcardAiSelected.has(i));
                    setFlashcardAiImporting(true);
                    try {
                      await Promise.all(
                        selectedQs.map((q: any) =>
                          createMutation.mutateAsync({
                            type: "quickReview",
                            question: q.question,
                            reviewAnswer: q.reviewAnswer,
                            explanation: q.explanation,
                            difficulty: flashcardAiDifficulty,
                            tags: q.tags ?? [],
                          } as any)
                        )
                      );
                      toast.success(`${selectedQs.length} flashcard${selectedQs.length !== 1 ? "s" : ""} imported.`);
                      flashcardListQuery.refetch();
                      setFlashcardAiOpen(false);
                      setFlashcardAiPreview([]);
                      setFlashcardAiTopic("");
                    } catch (err: any) {
                      toast.error(err.message || "Import failed.");
                    } finally {
                      setFlashcardAiImporting(false);
                    }
                  }}
                >
                  {flashcardAiImporting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing\u2026</>
                    : <><CheckCircle2 className="w-4 h-4" /> Import {flashcardAiSelected.size} Flashcard{flashcardAiSelected.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFlashcardAiOpen(false); setFlashcardAiPreview([]); setFlashcardAiTopic(""); }}>Close</Button>
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
              This will create (or regenerate) the Daily Challenge set for the selected date — a balanced mix of scenario, image, and quick-review questions.
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

      {/* ── Streak Reminders Dialog ──────────────────────────────────────────── */}
      <Dialog open={reminderOpen} onOpenChange={(o) => { setReminderOpen(o); if (!o) setReminderResult(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Send Daily Challenge Reminders
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!reminderResult ? (
              <>
                <p className="text-sm text-gray-600">
                  This will send a reminder email to all users who have opted in to Daily Challenge reminders and have not yet completed today's session. Users who have already completed today's set will be skipped.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-orange-700 font-medium">Note: This action sends real emails. Use sparingly — once per day is recommended.</p>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-sm">Reminders sent successfully</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{reminderResult.sent}</div>
                    <div className="text-xs text-green-600">Sent</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-600">{reminderResult.skipped}</div>
                    <div className="text-xs text-gray-500">Skipped</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-700">{reminderResult.total}</div>
                    <div className="text-xs text-blue-600">Total Users</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Skipped users either already completed today's set or have opted out of reminders.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderOpen(false)}>Close</Button>
            {!reminderResult && (
              <Button
                className="text-white gap-2"
                style={{ background: "#f97316" }}
                onClick={() => triggerRemindersMutation.mutate({})}
                disabled={triggerRemindersMutation.isPending}
              >
                {triggerRemindersMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Reminders</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Flashcard Create/Edit Dialog ──────────────────────────────────── */}
      <Dialog open={flashcardFormOpen} onOpenChange={(open) => { if (!open) { setFlashcardFormOpen(false); setEditingFlashcardId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Merriweather, serif" }}>
              {editingFlashcardId !== null ? "Edit Flashcard" : "New Flashcard"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Front — Question */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Front (Question / Prompt)</label>
              <RichTextEditor
                value={flashcardForm.question}
                onChange={(v) => setFlashcardForm((f) => ({ ...f, question: v }))}
                placeholder="Enter the question or prompt shown on the front of the card..."
                minHeight="100px"
              />
            </div>

            {/* Back — Answer */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Back (Answer / Explanation)</label>
              <RichTextEditor
                value={flashcardForm.reviewAnswer}
                onChange={(v) => setFlashcardForm((f) => ({ ...f, reviewAnswer: v }))}
                placeholder="Enter the answer shown on the back of the card..."
                minHeight="120px"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image (optional)</label>
              <div className="flex gap-2 items-center">
                <Input
                  value={flashcardForm.imageUrl}
                  onChange={(e) => setFlashcardForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="Paste image URL or upload below..."
                  className="flex-1 text-sm"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFlashcardUploadingMedia(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload/question-media", { method: "POST", body: fd, credentials: "include" });
                        const data = await res.json();
                        if (data.url) setFlashcardForm((f) => ({ ...f, imageUrl: data.url }));
                        else toast.error("Upload failed");
                      } catch { toast.error("Upload failed"); }
                      finally { setFlashcardUploadingMedia(false); }
                    }}
                  />
                  <Button variant="outline" size="sm" asChild disabled={flashcardUploadingMedia}>
                    <span className="gap-1.5">
                      {flashcardUploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
              {flashcardForm.imageUrl && (
                <img src={flashcardForm.imageUrl} alt="Preview" className="mt-2 max-h-32 rounded-lg border border-gray-200 object-contain" />
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Video (optional)</label>
              <div className="flex gap-2 items-center">
                <Input
                  value={(flashcardForm as any).videoUrl ?? ""}
                  onChange={(e) => setFlashcardForm((f) => ({ ...f, videoUrl: e.target.value } as any))}
                  placeholder="Paste video URL or upload below..."
                  className="flex-1 text-sm"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFlashcardUploadingMedia(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload/question-media", { method: "POST", body: fd, credentials: "include" });
                        const data = await res.json();
                        if (data.url) setFlashcardForm((f) => ({ ...f, videoUrl: data.url } as any));
                        else toast.error("Upload failed");
                      } catch { toast.error("Upload failed"); }
                      finally { setFlashcardUploadingMedia(false); }
                    }}
                  />
                  <Button variant="outline" size="sm" asChild disabled={flashcardUploadingMedia}>
                    <span className="gap-1.5">
                      {flashcardUploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Difficulty & Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
                <Select
                  value={flashcardForm.difficulty}
                  onValueChange={(v) => setFlashcardForm((f) => ({ ...f, difficulty: v as Difficulty }))}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma-separated)</label>
                <Input
                  value={flashcardForm.tags}
                  onChange={(e) => setFlashcardForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. AS, diastology, MR"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlashcardFormOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#189aa1] hover:bg-[#0e7a80] text-white"
              onClick={() => {
                const payload = {
                  type: "quickReview" as const,
                  question: flashcardForm.question,
                  options: [],
                  correctAnswer: undefined,
                  explanation: flashcardForm.explanation,
                  reviewAnswer: flashcardForm.reviewAnswer,
                  imageUrl: flashcardForm.imageUrl || undefined,
                  videoUrl: (flashcardForm as any).videoUrl || undefined,
                  difficulty: flashcardForm.difficulty,
                  tags: flashcardForm.tags ? flashcardForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
                  category: "Flashcard",
                };
                if (editingFlashcardId !== null) {
                  updateMutation.mutate({ id: editingFlashcardId, ...payload }, {
                    onSuccess: () => { setFlashcardFormOpen(false); toast.success("Flashcard updated."); },
                  });
                } else {
                  createMutation.mutate(payload, {
                    onSuccess: () => { setFlashcardFormOpen(false); setFlashcardForm({ ...EMPTY_FORM, type: "quickReview" }); toast.success("Flashcard created."); },
                  });
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingFlashcardId !== null ? "Save Changes" : "Create Flashcard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
