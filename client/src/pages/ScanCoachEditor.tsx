/*
  ScanCoachEditor.tsx — WYSIWYG ScanCoach content editor for platform admins.
  Allows admins to:
    • Select any ScanCoach module (TTE, TEE, ICE, UEA, Strain)
    • Browse all views in a sidebar list
    • Upload / replace / remove images (echo, anatomy, transducer) via drag-and-drop or file picker
    • Edit text fields (description, howToGet, tips, pitfalls, structures, measurements, criticalFindings)
    • Save changes — persisted to DB and reflected live in the ScanCoach pages
  Access: platform_admin or owner role only.
*/
import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  SCANCOACH_MODULES,
  IMAGE_SLOTS,
  TEXT_FIELDS,
  type ScanCoachModule,
  type ImageSlotKey,
} from "@/lib/scanCoachRegistry";
import {
  Upload, Trash2, Save, ChevronLeft, ChevronRight,
  Image as ImageIcon, Edit3, Eye, Loader2, CheckCircle2,
  AlertCircle, RefreshCw, ExternalLink, Layers
} from "lucide-react";

const BRAND = "#189aa1";

// ─── Types ────────────────────────────────────────────────────────────────────

type Override = {
  id: number;
  module: string;
  viewId: string;
  viewName: string | null;
  echoImageUrl: string | null;
  anatomyImageUrl: string | null;
  transducerImageUrl: string | null;
  description: string | null;
  howToGet: string | null;
  tips: string | null;
  pitfalls: string | null;
  structures: string | null;
  measurements: string | null;
  criticalFindings: string | null;
  updatedAt: Date;
};

type DraftState = {
  description: string;
  howToGet: string;
  tips: string;
  pitfalls: string;
  structures: string;
  measurements: string;
  criticalFindings: string;
};

// ─── Helper: parse JSON array field ──────────────────────────────────────────

function parseArrayField(value: string | null): string {
  if (!value) return "";
  try {
    const arr = JSON.parse(value);
    if (Array.isArray(arr)) return arr.join("\n");
  } catch {
    // not JSON, return as-is
  }
  return value;
}

function toJsonArray(value: string): string {
  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
  return JSON.stringify(lines);
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

function ImageUploadZone({
  slot,
  currentUrl,
  onUploaded,
  onCleared,
  isUploading,
  setIsUploading,
}: {
  slot: typeof IMAGE_SLOTS[number];
  currentUrl: string | null | undefined;
  onUploaded: (url: string) => void;
  onCleared: () => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPEG, PNG, GIF, WebP, or SVG)");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be under 8 MB");
        return;
      }
      setIsUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data:image/...;base64, prefix
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // We call the mutation from the parent — pass data up via callback
        onUploaded(base64 + "|" + file.type + "|" + file.name);
      } catch {
        toast.error("Failed to read image file");
        setIsUploading(false);
      }
    },
    [onUploaded, setIsUploading]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">{slot.label}</span>
        {currentUrl && (
          <button
            onClick={onCleared}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">{slot.hint}</p>

      {/* Current image preview */}
      {currentUrl && (
        <div className="relative rounded-lg overflow-hidden bg-gray-950 border border-gray-200" style={{ minHeight: 120 }}>
          <img
            src={currentUrl}
            alt={slot.label}
            className="w-full object-contain max-h-48"
          />
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 bg-black/60 rounded p-1 text-white hover:bg-black/80"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-[#189aa1] bg-[#189aa1]/5" : "border-gray-200 hover:border-[#189aa1]/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2 text-[#189aa1]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload className="w-5 h-5" />
            <span className="text-xs">{currentUrl ? "Replace image" : "Upload image"}</span>
            <span className="text-[10px]">JPEG, PNG, GIF, WebP, SVG · max 8 MB</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export default function ScanCoachEditor() {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ScanCoachModule>("tte");
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<ImageSlotKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const utils = trpc.useUtils();

  // Fetch all overrides for the selected module
  const { data: overrides = [], isLoading: loadingOverrides } = trpc.scanCoachAdmin.listOverrides.useQuery(
    { module: selectedModule },
    { staleTime: 10_000 }
  );

  // Check admin access
  const { data: isAdmin, isLoading: checkingAdmin } = trpc.platformAdmin.isAdmin.useQuery();

  const upsertMutation = trpc.scanCoachAdmin.upsertOverride.useMutation({
    onSuccess: () => {
      utils.scanCoachAdmin.listOverrides.invalidate();
      toast.success("Changes saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImageMutation = trpc.scanCoachAdmin.uploadImage.useMutation({
    onSuccess: () => {
      utils.scanCoachAdmin.listOverrides.invalidate();
      setUploadingSlot(null);
      toast.success("Image uploaded and saved");
    },
    onError: (e) => {
      setUploadingSlot(null);
      toast.error(e.message);
    },
  });

  const clearImageMutation = trpc.scanCoachAdmin.clearImageField.useMutation({
    onSuccess: () => {
      utils.scanCoachAdmin.listOverrides.invalidate();
      toast.success("Image removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteOverrideMutation = trpc.scanCoachAdmin.deleteOverride.useMutation({
    onSuccess: () => {
      utils.scanCoachAdmin.listOverrides.invalidate();
      setDraft(null);
      toast.success("Override deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const moduleMeta = SCANCOACH_MODULES.find((m) => m.key === selectedModule)!;
  const currentOverride: Override | undefined = overrides.find(
    (o: Override) => o.viewId === selectedViewId
  );

  // When a view is selected, populate the draft from the existing override (or empty)
  const handleSelectView = (viewId: string) => {
    setSelectedViewId(viewId);
    const ov = overrides.find((o: Override) => o.viewId === viewId);
    setDraft({
      description: ov?.description ?? "",
      howToGet: parseArrayField(ov?.howToGet ?? null),
      tips: parseArrayField(ov?.tips ?? null),
      pitfalls: parseArrayField(ov?.pitfalls ?? null),
      structures: parseArrayField(ov?.structures ?? null),
      measurements: parseArrayField(ov?.measurements ?? null),
      criticalFindings: parseArrayField(ov?.criticalFindings ?? null),
    });
  };

  const handleSaveText = () => {
    if (!selectedViewId || !draft) return;
    const viewMeta = moduleMeta.views.find((v) => v.id === selectedViewId);
    upsertMutation.mutate({
      module: selectedModule,
      viewId: selectedViewId,
      viewName: viewMeta?.name,
      description: draft.description || null,
      howToGet: draft.howToGet ? toJsonArray(draft.howToGet) : null,
      tips: draft.tips ? toJsonArray(draft.tips) : null,
      pitfalls: draft.pitfalls ? toJsonArray(draft.pitfalls) : null,
      structures: draft.structures ? toJsonArray(draft.structures) : null,
      measurements: draft.measurements ? toJsonArray(draft.measurements) : null,
      criticalFindings: draft.criticalFindings ? toJsonArray(draft.criticalFindings) : null,
    });
  };

  const handleImageUploaded = (slot: ImageSlotKey, rawData: string) => {
    if (!selectedViewId) return;
    const [base64Data, mimeType, fileName] = rawData.split("|");
    setUploadingSlot(slot);
    const slotKey = slot === "echoImageUrl" ? "echo" : slot === "anatomyImageUrl" ? "anatomy" : "transducer";
    uploadImageMutation.mutate({
      module: selectedModule,
      viewId: selectedViewId,
      slot: slotKey,
      base64Data,
      mimeType,
      fileName,
    });
  };

  const handleClearImage = (slot: ImageSlotKey) => {
    if (!currentOverride) return;
    clearImageMutation.mutate({ id: currentOverride.id, field: slot });
  };

  const handleDeleteOverride = () => {
    if (!currentOverride) return;
    if (!confirm("Delete all overrides for this view? The static defaults will be restored.")) return;
    deleteOverrideMutation.mutate({ id: currentOverride.id });
  };

  if (checkingAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">Platform admin access is required to use the ScanCoach Editor.</p>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page header */}
      <div
        className="border-b"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-[#4ad9e0]" />
                <span className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider">Platform Admin</span>
              </div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>
                ScanCoach™ Editor
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Upload images and edit content for any ScanCoach view. Changes are reflected live.
              </p>
            </div>
            <Link href="/platform-admin">
              <Button variant="outline" size="sm" className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                <ChevronLeft className="w-4 h-4 mr-1" /> Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Module tabs */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {SCANCOACH_MODULES.map((mod) => {
              const overrideCount = overrides.filter((o: Override) => o.module === mod.key).length;
              return (
                <button
                  key={mod.key}
                  onClick={() => {
                    setSelectedModule(mod.key);
                    setSelectedViewId(null);
                    setDraft(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedModule === mod.key
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  style={selectedModule === mod.key ? { background: BRAND } : {}}
                >
                  {mod.label}
                  {overrideCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        selectedModule === mod.key ? "bg-white/20 text-white" : "bg-[#189aa1]/10 text-[#189aa1]"
                      }`}
                    >
                      {overrideCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + editor */}
      <div className="container py-6">
        <div className="flex gap-6 min-h-[70vh]">
          {/* View list sidebar */}
          <div
            className={`transition-all duration-200 ${sidebarOpen ? "w-64 flex-shrink-0" : "w-10 flex-shrink-0"}`}
          >
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                {sidebarOpen && (
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Views</span>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
              {sidebarOpen && (
                <div className="divide-y divide-gray-50">
                  {loadingOverrides ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-[#189aa1]" />
                    </div>
                  ) : (
                    moduleMeta.views.map((view) => {
                      const hasOverride = overrides.some((o: Override) => o.viewId === view.id);
                      const isSelected = selectedViewId === view.id;
                      return (
                        <button
                          key={view.id}
                          onClick={() => handleSelectView(view.id)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#189aa1]/10 text-[#189aa1] font-semibold"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="truncate">{view.name}</span>
                          {hasOverride && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BRAND }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Editor panel */}
          <div className="flex-1 min-w-0">
            {!selectedViewId ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Edit3 className="w-10 h-10 text-gray-200 mb-3" />
                <h3 className="font-bold text-gray-500 mb-1">Select a view to edit</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Choose a view from the list on the left to upload images or edit content.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: BRAND }} />
                  Views with a teal dot have existing overrides
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* View header */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs" style={{ borderColor: BRAND, color: BRAND }}>
                          {moduleMeta.label}
                        </Badge>
                        {currentOverride && (
                          <Badge className="text-xs text-white" style={{ background: BRAND }}>
                            Has Overrides
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                        {moduleMeta.views.find((v) => v.id === selectedViewId)?.name}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">View ID: <code className="font-mono">{selectedViewId}</code></p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={moduleMeta.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#189aa1] hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </a>
                      {currentOverride && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteOverride}
                          className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete Override
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image uploads */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-4 h-4" style={{ color: BRAND }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
                      Reference Images
                    </h3>
                    <span className="text-xs text-gray-400">Upload images to override the static defaults</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {IMAGE_SLOTS.map((slot) => (
                      <ImageUploadZone
                        key={slot.key}
                        slot={slot}
                        currentUrl={currentOverride?.[slot.key]}
                        isUploading={uploadingSlot === slot.key}
                        setIsUploading={(v) => setIsUploading(v ? slot.key : null)}
                        onUploaded={(rawData) => handleImageUploaded(slot.key, rawData)}
                        onCleared={() => handleClearImage(slot.key)}
                      />
                    ))}
                  </div>
                </div>

                {/* Text content editor */}
                {draft && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" style={{ color: BRAND }} />
                        <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
                          Text Content
                        </h3>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveText}
                        disabled={upsertMutation.isPending}
                        style={{ background: BRAND }}
                        className="text-white hover:opacity-90"
                      >
                        {upsertMutation.isPending ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving…</>
                        ) : (
                          <><Save className="w-3 h-3 mr-1" /> Save Changes</>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-5">
                      {TEXT_FIELDS.map((field) => {
                        const value = draft[field.key as keyof DraftState];
                        return (
                          <div key={field.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold text-gray-600">{field.label}</label>
                              {field.isArray && (
                                <span className="text-[10px] text-gray-400">One item per line</span>
                              )}
                            </div>
                            <Textarea
                              value={value}
                              onChange={(e) =>
                                setDraft((d) => d ? { ...d, [field.key]: e.target.value } : d)
                              }
                              placeholder={
                                field.isArray
                                  ? `Enter each ${field.label.toLowerCase()} item on a new line…`
                                  : `Enter ${field.label.toLowerCase()}…`
                              }
                              rows={field.isArray ? 4 : 3}
                              className="text-sm font-mono resize-y"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Leave a field blank to use the static default from the component.
                        {currentOverride && (
                          <span className="ml-1">
                            Last updated: {new Date(currentOverride.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSaveText}
                        disabled={upsertMutation.isPending}
                        style={{ background: BRAND }}
                        className="text-white hover:opacity-90"
                      >
                        {upsertMutation.isPending ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving…</>
                        ) : (
                          <><Save className="w-3 h-3 mr-1" /> Save Changes</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Override summary */}
                {currentOverride && (
                  <div className="bg-[#189aa1]/5 border border-[#189aa1]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#189aa1]" />
                      <span className="text-sm font-semibold text-[#189aa1]">Active Overrides</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_SLOTS.map((slot) =>
                        currentOverride[slot.key] ? (
                          <Badge key={slot.key} variant="outline" className="text-xs" style={{ borderColor: BRAND, color: BRAND }}>
                            {slot.label}
                          </Badge>
                        ) : null
                      )}
                      {TEXT_FIELDS.map((field) =>
                        currentOverride[field.key as keyof Override] ? (
                          <Badge key={field.key} variant="outline" className="text-xs" style={{ borderColor: BRAND, color: BRAND }}>
                            {field.label}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );

  function setIsUploading(slot: ImageSlotKey | null) {
    setUploadingSlot(slot);
  }
}
