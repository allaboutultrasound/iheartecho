/**
 * SoundBytes™ Admin — Platform Admin panel for creating, editing, and publishing
 * SoundBytes micro-lessons. Includes view analytics visible only to admins.
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Play,
  Plus,
  Pencil,
  Trash2,
  Eye,
  BarChart2,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Crown,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "acs", label: "ACS" },
  { id: "adult_echo", label: "Adult Echo" },
  { id: "pediatric_echo", label: "Pediatric Echo" },
  { id: "fetal_echo", label: "Fetal Echo" },
  { id: "pocus", label: "POCUS" },
  { id: "physics", label: "Physics" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  acs: "ACS",
  adult_echo: "Adult Echo",
  pediatric_echo: "Pediatric Echo",
  fetal_echo: "Fetal Echo",
  pocus: "POCUS",
  physics: "Physics",
};

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  body: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: CategoryId;
  sortOrder: number;
  displayViews: number;
  status: "draft" | "published";
}

const DEFAULT_FORM: FormState = {
  title: "",
  body: "",
  videoUrl: "",
  thumbnailUrl: "",
  category: "adult_echo",
  sortOrder: 0,
  displayViews: 0,
  status: "draft",
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function SoundBytesAdmin() {
  const { user } = useAuth();
  // toast is imported from sonner directly
  const utils = trpc.useUtils();

  const [view, setView] = useState<"list" | "create" | "edit" | "analytics">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [analyticsId, setAnalyticsId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Guard: admin only
  if ((user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Admin access required.</p>
          <Link href="/">
            <Button variant="outline" className="mt-3">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: items = [], isLoading, refetch } = trpc.soundBytes.adminList.useQuery();
  const { data: viewerStats = [] } = trpc.soundBytes.adminViewerStats.useQuery(
    { soundByteId: analyticsId! },
    { enabled: analyticsId !== null }
  );

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMutation = trpc.soundBytes.adminCreate.useMutation({
    onSuccess: () => {
      toast.success("SoundByte created — micro-lesson saved.");
      utils.soundBytes.adminList.invalidate();
      setView("list");
      setForm(DEFAULT_FORM);
    },
    onError: (e) => toast.error(e.message || "Failed to create."),
  });

  const updateMutation = trpc.soundBytes.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("SoundByte updated.");
      utils.soundBytes.adminList.invalidate();
      setView("list");
      setEditingId(null);
      setForm(DEFAULT_FORM);
    },
    onError: (e) => toast.error(e.message || "Failed to update."),
  });

  const deleteMutation = trpc.soundBytes.adminDelete.useMutation({
    onSuccess: () => {
      toast.success("SoundByte deleted.");
      utils.soundBytes.adminList.invalidate();
      setDeleteConfirmId(null);
    },
    onError: (e) => toast.error(e.message || "Failed to delete."),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleEdit(item: (typeof items)[0]) {
    setForm({
      title: item.title,
      body: "",
      videoUrl: "",
      thumbnailUrl: "",
      category: item.category as CategoryId,
      sortOrder: item.sortOrder,
      displayViews: item.displayViews,
      status: item.status as "draft" | "published",
    });
    setEditingId(item.id);
    // Fetch full item for body/videoUrl
    utils.soundBytes.adminGetById.fetch({ id: item.id }).then((full) => {
      setForm((prev) => ({
        ...prev,
        body: full.body ?? "",
        videoUrl: full.videoUrl ?? "",
        thumbnailUrl: full.thumbnailUrl ?? "",
      }));
    });
    setView("edit");
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.videoUrl.trim()) {
      toast.error("Video URL is required.");
      return;
    }
    if (view === "create") {
      createMutation.mutate({
        ...form,
        thumbnailUrl: form.thumbnailUrl || undefined,
      });
    } else if (view === "edit" && editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        ...form,
        thumbnailUrl: form.thumbnailUrl || null,
      });
    }
  }

  function handleQuickPublish(id: number, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    updateMutation.mutate({ id, status: newStatus });
  }

  // ── Analytics view ────────────────────────────────────────────────────────────

  if (view === "analytics" && analyticsId !== null) {
    const item = items.find((i) => i.id === analyticsId);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-6 max-w-4xl">
          <button
            onClick={() => { setView("list"); setAnalyticsId(null); }}
            className="flex items-center gap-1.5 text-sm text-[#189aa1] font-semibold mb-5 hover:opacity-80"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to SoundBytes
          </button>
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
            <h2 className="font-bold text-gray-800 text-base mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              {item?.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item?.trueViews ?? 0} true views</span>
              <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {item?.completions ?? 0} completions</span>
              <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /> {item?.displayViews ?? 0} display views</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Viewer Log</h3>
            </div>
            {viewerStats.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No views recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-2 text-left">User ID</th>
                    <th className="px-5 py-2 text-left">Watched (s)</th>
                    <th className="px-5 py-2 text-left">Completed</th>
                    <th className="px-5 py-2 text-left">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {viewerStats.map((v) => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-2 text-gray-600">{v.userId ?? "—"}</td>
                      <td className="px-5 py-2 text-gray-600">{v.watchedSeconds}s</td>
                      <td className="px-5 py-2">
                        {v.completed ? (
                          <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In progress</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-gray-400 text-xs">
                        {new Date(v.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit form ────────────────────────────────────────────────────────

  if (view === "create" || view === "edit") {
    const isEdit = view === "edit";
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-6 max-w-3xl">
          <button
            onClick={() => { setView("list"); setEditingId(null); setForm(DEFAULT_FORM); }}
            className="flex items-center gap-1.5 text-sm text-[#189aa1] font-semibold mb-5 hover:opacity-80"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to SoundBytes
          </button>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2
              className="text-lg font-bold text-gray-800 mb-5"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              {isEdit ? "Edit SoundByte" : "New SoundByte"}
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Aortic Stenosis: Doppler Grading"
                  className="text-sm"
                />
              </div>

              {/* Category + Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as CategoryId }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#189aa1]/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#189aa1]/30"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Video URL *</label>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                  placeholder="YouTube, Vimeo, or direct video URL"
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Supports YouTube, Vimeo, or direct MP4/embed URLs.</p>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thumbnail URL (optional)</label>
                <Input
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>

              {/* Sort order + display views row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order</label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="text-sm"
                    min={0}
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower = appears first.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Views</label>
                  <Input
                    type="number"
                    value={form.displayViews}
                    onChange={(e) => setForm((p) => ({ ...p, displayViews: parseInt(e.target.value) || 0 }))}
                    className="text-sm"
                    min={0}
                  />
                  <p className="text-xs text-gray-400 mt-1">Cosmetic count shown to members.</p>
                </div>
              </div>

              {/* Rich text body */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body (rich text)</label>
                <RichTextEditor
                  value={form.body}
                  onChange={(html) => setForm((p) => ({ ...p, body: html }))}
                  placeholder="Add clinical notes, key takeaways, or references…"
                  minHeight={200}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="text-white font-semibold"
                  style={{ background: "#189aa1" }}
                >
                  {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create SoundByte"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setView("list"); setEditingId(null); setForm(DEFAULT_FORM); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/platform-admin">
              <button className="flex items-center gap-1.5 text-sm text-[#189aa1] font-semibold hover:opacity-80">
                <ChevronLeft className="w-4 h-4" />
                Platform Admin
              </button>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#189aa115" }}
              >
                <Play className="w-4 h-4" style={{ color: "#189aa1" }} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                  SoundBytes™ Admin
                </h1>
                <p className="text-xs text-gray-400">Manage premium micro-lesson videos</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => { setForm(DEFAULT_FORM); setView("create"); }}
            className="text-white font-semibold text-sm flex items-center gap-1.5"
            style={{ background: "#189aa1" }}
          >
            <Plus className="w-4 h-4" />
            New SoundByte
          </Button>
        </div>

        {/* Stats summary */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total", value: items.length, color: "#189aa1" },
              { label: "Published", value: items.filter((i) => i.status === "published").length, color: "#16a34a" },
              { label: "Drafts", value: items.filter((i) => i.status === "draft").length, color: "#d97706" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading && (
            <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="py-16 text-center">
              <Play className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No SoundBytes yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click "New SoundByte" to create your first micro-lesson.</p>
            </div>
          )}
          {!isLoading && items.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Completions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-800 line-clamp-1">{item.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#189aa115", color: "#189aa1" }}
                      >
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleQuickPublish(item.id, item.status)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-all hover:opacity-80 ${
                          item.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                        title={item.status === "published" ? "Click to unpublish" : "Click to publish"}
                      >
                        {item.status === "published" ? (
                          <><CheckCircle2 className="w-3 h-3" /> Published</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Draft</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-semibold text-gray-800">{(item.trueViews ?? 0).toLocaleString()}</span>
                        <span className="text-xs text-gray-400">({(item.displayViews ?? 0).toLocaleString()} display)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{(item.completions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setAnalyticsId(item.id); setView("analytics"); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#189aa1] hover:bg-[#189aa1]/10 transition-all"
                          title="View analytics"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate({ id: item.id })}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-0.5 rounded bg-red-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
