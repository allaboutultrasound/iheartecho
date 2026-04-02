/*
  NavigatorEditor.tsx — iHeartEcho™ Platform Admin
  Allows admins to edit Navigator protocol checklist sections for all modules.
  Features:
    • Module selector (TTE, TEE, HOCM, Fetal, POCUS Cardiac, UEA, Stress)
    • "Load from static defaults" button to seed DB from hardcoded content
    • Drag-to-reorder sections
    • Inline section editing: title, probe note, add/edit/delete/reorder items
    • Mark items as critical
    • Save individual sections or all at once
  Access: platform_admin or owner role only.
*/
import React, { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronLeft, ChevronDown, ChevronUp, GripVertical,
  Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle2,
  RotateCcw, Edit3, X, Check,
} from "lucide-react";
import { NAVIGATOR_PROTOCOL_DEFAULTS } from "@/lib/navigatorProtocolDefaults";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChecklistItem = {
  id: string;
  label: string;
  detail?: string;
  critical?: boolean;
};

type Section = {
  id: number; // DB id (0 = unsaved)
  module: string;
  sectionId: string;
  sectionTitle: string;
  probeNote: string;
  items: ChecklistItem[];
  sortOrder: number;
  dirty: boolean; // has unsaved changes
};

// STATIC_DEFAULTS is now imported from navigatorProtocolDefaults.ts (single source of truth)
const STATIC_DEFAULTS = NAVIGATOR_PROTOCOL_DEFAULTS;
// ─── Module List ──────────────────────────────────────────────────────────────
const MODULES = [
  { id: "tte", label: "TTE Navigator" },
  { id: "tee", label: "TEE Navigator" },
  { id: "pocus_cardiac", label: "POCUS Cardiac Navigator" },
  { id: "hocm", label: "HOCM-Assist™ Navigator" },
  { id: "fetal", label: "Fetal Navigator" },
  { id: "uea", label: "UEA (Contrast Echo) Navigator" },
  { id: "ice", label: "ICE Navigator" },
  { id: "diastology", label: "Diastology Navigator" },
  { id: "pulm_htn", label: "Pulmonary HTN Navigator" },
  { id: "mcs_lvad", label: "MechanicalSupportAssist™ — LVAD" },
  { id: "mcs_ecmo", label: "MechanicalSupportAssist™ — ECMO" },
  { id: "mcs_impella_25",  label: "MechanicalSupportAssist™ — Impella 2.5" },
  { id: "mcs_impella_cp",  label: "MechanicalSupportAssist™ — Impella CP" },
  { id: "mcs_impella_55",  label: "MechanicalSupportAssist™ — Impella 5.5" },
  { id: "mcs_impella_ecp", label: "MechanicalSupportAssist™ — Impella ECP" },
  { id: "mcs_impella_rp",  label: "MechanicalSupportAssist™ — Impella RP" },
  { id: "mcs_lifevest", label: "MechanicalSupportAssist™ — LifeVest (WCD)" },
  { id: "mcs_icd", label: "MechanicalSupportAssist™ — ICD / CRT-D" },
];

const BRAND = "#189aa1";

// ─── Sortable Checklist Item ─────────────────────────────────────────────────
function SortableChecklistItem({
  item,
  idx,
  editingItemIdx,
  setEditingItemIdx,
  updateItem,
  deleteItem,
}: {
  item: ChecklistItem;
  idx: number;
  editingItemIdx: number | null;
  setEditingItemIdx: (idx: number | null) => void;
  updateItem: (idx: number, patch: Partial<ChecklistItem>) => void;
  deleteItem: (idx: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isEditing = editingItemIdx === idx;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5"
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      {isEditing ? (
        <div className="flex-1 space-y-1.5">
          <Input
            className="h-7 text-xs"
            value={item.label}
            placeholder="Item label"
            autoFocus
            onChange={(e) => updateItem(idx, { label: e.target.value })}
          />
          <Textarea
            className="text-xs min-h-[50px] resize-none"
            value={item.detail ?? ""}
            placeholder="Detail / clinical note (optional)"
            onChange={(e) => updateItem(idx, { detail: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={!!item.critical}
                onChange={(e) => updateItem(idx, { critical: e.target.checked })}
                className="w-3 h-3"
              />
              <span className="text-amber-600 font-medium">Critical item</span>
            </label>
            <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto" onClick={() => setEditingItemIdx(null)}>
              <Check className="w-3 h-3 text-green-600" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            {item.critical && (
              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-xs font-medium text-gray-800 leading-snug">{item.label}</span>
          </div>
          {item.detail && (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.detail}</p>
          )}
        </div>
      )}
      <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setEditingItemIdx(isEditing ? null : idx)}
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => deleteItem(idx)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Sortable Section ─────────────────────────────────────────────────────────
function SortableSection({
  section,
  onUpdate,
  onDelete,
  onSave,
  saving,
}: {
  section: Section;
  onUpdate: (updated: Section) => void;
  onDelete: (id: string) => void;
  onSave: (section: Section) => void;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.sectionId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const itemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingProbe, setEditingProbe] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<ChecklistItem>({ id: "", label: "", detail: "", critical: false });;

  const updateItem = (idx: number, patch: Partial<ChecklistItem>) => {
    const items = [...section.items];
    items[idx] = { ...items[idx], ...patch };
    onUpdate({ ...section, items, dirty: true });
  };

  const deleteItem = (idx: number) => {
    const items = section.items.filter((_, i) => i !== idx);
    onUpdate({ ...section, items, dirty: true });
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    const id = newItem.id.trim() || `${section.sectionId}_${Date.now()}`;
    const items = [...section.items, { ...newItem, id }];
    onUpdate({ ...section, items, dirty: true });
    setNewItem({ id: "", label: "", detail: "", critical: false });
    setAddingItem(false);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const items = [...section.items];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    onUpdate({ ...section, items, dirty: true });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${section.dirty ? "border-amber-300" : "border-gray-200"} shadow-sm overflow-hidden`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {editingTitle ? (
          <Input
            className="flex-1 h-7 text-sm font-semibold"
            value={section.sectionTitle}
            autoFocus
            onChange={(e) => onUpdate({ ...section, sectionTitle: e.target.value, dirty: true })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
          />
        ) : (
          <button
            className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-[#189aa1] transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {section.sectionTitle}
          </button>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="outline" className="text-xs">{section.items.length} items</Badge>
          {section.dirty && (
            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300">Unsaved</Badge>
          )}
          {section.id > 0 && !section.dirty && (
            <Badge className="text-xs bg-green-50 text-green-700 border-green-200">Saved</Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => onSave(section)}
            disabled={saving || !section.dirty}
            title="Save this section"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-red-400 hover:text-red-600"
            onClick={() => onDelete(section.sectionId)}
            title="Delete section"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Probe note */}
      {expanded && (
        <div className="px-4 pb-1">
          {editingProbe ? (
            <Input
              className="h-7 text-xs text-gray-500"
              value={section.probeNote}
              autoFocus
              placeholder="Probe note / position hint"
              onChange={(e) => onUpdate({ ...section, probeNote: e.target.value, dirty: true })}
              onBlur={() => setEditingProbe(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingProbe(false)}
            />
          ) : (
            <button
              className="text-xs text-gray-400 hover:text-[#189aa1] text-left w-full"
              onClick={() => setEditingProbe(true)}
            >
              {section.probeNote || <span className="italic">Click to add probe note…</span>}
            </button>
          )}
        </div>
      )}

      {/* Items */}
      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 mt-2">
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const oldIdx = section.items.findIndex((it) => it.id === active.id);
              const newIdx = section.items.findIndex((it) => it.id === over.id);
              const reordered = arrayMove(section.items, oldIdx, newIdx);
              onUpdate({ ...section, items: reordered, dirty: true });
            }}
          >
            <SortableContext
              items={section.items.map((it) => it.id)}
              strategy={verticalListSortingStrategy}
            >
          {section.items.map((item, idx) => (
            <SortableChecklistItem
              key={item.id}
              item={item}
              idx={idx}
              editingItemIdx={editingItemIdx}
              setEditingItemIdx={setEditingItemIdx}
              updateItem={updateItem}
              deleteItem={deleteItem}
            />
          ))}
            </SortableContext>
          </DndContext>

          {/* Add item */}
          {addingItem ? (
            <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-1.5 border border-blue-200">
              <Input
                className="h-7 text-xs"
                value={newItem.label}
                placeholder="Item label (required)"
                autoFocus
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Textarea
                className="text-xs min-h-[50px] resize-none"
                value={newItem.detail ?? ""}
                placeholder="Detail / clinical note (optional)"
                onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.critical}
                    onChange={(e) => setNewItem({ ...newItem, critical: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <span className="text-amber-600 font-medium">Critical item</span>
                </label>
                <div className="flex gap-1 ml-auto">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-gray-500" onClick={() => setAddingItem(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                  <Button size="sm" className="h-6 px-2 text-xs" style={{ background: BRAND }} onClick={addItem}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#189aa1] py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-dashed border-gray-200 hover:border-[#189aa1]"
              onClick={() => setAddingItem(true)}
            >
              <Plus className="w-3 h-3" />
              Add checklist item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NavigatorEditor() {
  const { user, loading: authLoading } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>("tte");
  const [sections, setSections] = useState<Section[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const trpcUtils = trpc.useUtils();

  const sectionsQuery = trpc.navigatorAdmin.getModuleSections.useQuery(
    { module: selectedModule },
    { enabled: !!user }
  );

  const upsertMutation = trpc.navigatorAdmin.upsertSection.useMutation();
  const deleteMutation = trpc.navigatorAdmin.deleteSection.useMutation();
  const reorderMutation = trpc.navigatorAdmin.reorderSections.useMutation();
  const seedMutation = trpc.navigatorAdmin.seedFromStatic.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load sections: always start from static defaults, then overlay any DB overrides.
  // This ensures saving one section never hides the other static sections in the editor.
  useEffect(() => {
    if (!sectionsQuery.data) return;
    const defaults = STATIC_DEFAULTS[selectedModule] ?? [];
    if (sectionsQuery.data.length > 0) {
      // Build a lookup of DB rows by sectionId
      const dbMap = new Map(sectionsQuery.data.map((s) => [s.sectionId, s]));
      // Merge: for each static default, use DB row if one exists, else show static (unsaved)
      const merged: Section[] = defaults.map((d) => {
        const dbRow = dbMap.get(d.sectionId);
        if (dbRow) {
          return {
            id: dbRow.id,
            module: dbRow.module,
            sectionId: dbRow.sectionId,
            sectionTitle: dbRow.sectionTitle,
            probeNote: dbRow.probeNote,
            items: dbRow.items,
            sortOrder: dbRow.sortOrder,
            dirty: false,
          };
        }
        // No DB override for this section — show static default (not yet saved)
        return { ...d, id: 0, dirty: false };
      });
      setSections(merged);
    } else {
      // No DB data at all — load all static defaults (none saved yet)
      setSections(
        defaults.map((d) => ({
          ...d,
          id: 0,
          dirty: false,
        }))
      );
    }
  }, [sectionsQuery.data, selectedModule]);

  const handleModuleChange = (mod: string) => {
    setSelectedModule(mod);
    setSections([]);
  };

  const handleUpdate = useCallback((updated: Section) => {
    setSections((prev) => prev.map((s) => (s.sectionId === updated.sectionId ? updated : s)));
  }, []);

  const handleDelete = useCallback(
    async (sectionId: string) => {
      const section = sections.find((s) => s.sectionId === sectionId);
      if (!section) return;
      if (section.id > 0) {
        try {
          await deleteMutation.mutateAsync({ id: section.id });
          toast.success("Section deleted");
        } catch {
          toast.error("Failed to delete section");
          return;
        }
      }
      setSections((prev) => prev.filter((s) => s.sectionId !== sectionId));
      trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    },
    [sections, deleteMutation, trpcUtils, selectedModule]
  );

  const handleSaveSection = useCallback(
    async (section: Section) => {
      setSavingId(section.sectionId);
      try {
        await upsertMutation.mutateAsync({
          module: section.module,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          probeNote: section.probeNote,
          items: section.items,
          sortOrder: section.sortOrder,
        });
        setSections((prev) =>
          prev.map((s) => (s.sectionId === section.sectionId ? { ...s, dirty: false } : s))
        );
        toast.success(`"${section.sectionTitle}" saved`);
        trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
      } catch {
        toast.error("Failed to save section");
      } finally {
        setSavingId(null);
      }
    },
    [upsertMutation, trpcUtils, selectedModule]
  );

  const handleSaveAll = async () => {
    const dirty = sections.filter((s) => s.dirty);
    if (dirty.length === 0) { toast.info("No unsaved changes"); return; }
    setSavingAll(true);
    let saved = 0;
    for (const section of dirty) {
      try {
        await upsertMutation.mutateAsync({
          module: section.module,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          probeNote: section.probeNote,
          items: section.items,
          sortOrder: section.sortOrder,
        });
        saved++;
      } catch {
        // continue
      }
    }
    setSections((prev) => prev.map((s) => ({ ...s, dirty: false })));
    toast.success(`${saved} section${saved !== 1 ? "s" : ""} saved`);
    trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    setSavingAll(false);
  };

  const handleReloadDefaults = async () => {
    const defaults = STATIC_DEFAULTS[selectedModule] ?? [];
    if (defaults.length === 0) { toast.info("No static defaults for this module"); return; }
    try {
      await seedMutation.mutateAsync({
        module: selectedModule,
        sections: defaults.map((d) => ({ ...d, module: selectedModule })),
        force: true,
      });
      toast.success("Reloaded from static defaults");
      trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reload defaults");
    }
  };

  const handleAddSection = () => {
    const newSectionId = `section_${Date.now()}`;
    const newSection: Section = {
      id: 0,
      module: selectedModule,
      sectionId: newSectionId,
      sectionTitle: "New Section",
      probeNote: "",
      items: [],
      sortOrder: sections.length,
      dirty: true,
    };
    setSections((prev) => [...prev, newSection]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.sectionId === active.id);
    const newIdx = sections.findIndex((s) => s.sectionId === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({
      ...s,
      sortOrder: i,
    }));
    setSections(reordered);
    // Upsert ALL sections with their new sortOrder so reorder always persists
    // (sections with id=0 are static defaults that haven't been saved yet — upsert creates them)
    try {
      await Promise.all(
        reordered.map((s) =>
          upsertMutation.mutateAsync({
            module: selectedModule,
            sectionId: s.sectionId,
            sectionTitle: s.sectionTitle,
            probeNote: s.probeNote,
            items: s.items,
            sortOrder: s.sortOrder,
          })
        )
      );
      toast.success("Section order saved");
    } catch {
      toast.error("Failed to save order");
    }
  };

  // Auth guard
  if (authLoading) return null;
  const isAdmin = user?.role === "admin" || user?.appRoles?.includes("platform_admin");
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-gray-500">Admin access required.</p>
          <Link href="/"><Button className="mt-4" variant="outline">Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  const dirtyCount = sections.filter((s) => s.dirty).length;

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/platform-admin">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
              Navigator Protocol Editor
            </h1>
            <p className="text-sm text-gray-500">Edit checklist sections for each Navigator module</p>
          </div>
        </div>

        {/* Module Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleModuleChange(mod.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedModule === mod.id
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={selectedModule === mod.id ? { background: BRAND } : {}}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            className="gap-1.5 text-white"
            style={{ background: BRAND }}
            onClick={handleSaveAll}
            disabled={savingAll || dirtyCount === 0}
          >
            {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save All {dirtyCount > 0 && `(${dirtyCount})`}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAddSection}>
            <Plus className="w-3.5 h-3.5" /> Add Section
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-gray-500 ml-auto"
            onClick={handleReloadDefaults}
            disabled={seedMutation.isPending}
            title="Reset this module to the built-in static defaults (overwrites DB)"
          >
            {seedMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reload Defaults
          </Button>
        </div>

        {/* Loading */}
        {sectionsQuery.isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading sections…</span>
          </div>
        )}

        {/* Sections */}
        {!sectionsQuery.isLoading && (
          <>
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-3">No sections yet for this module.</p>
                <Button size="sm" variant="outline" onClick={handleAddSection} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add First Section
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={sections.map((s) => s.sectionId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <SortableSection
                        key={section.sectionId}
                        section={section}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onSave={handleSaveSection}
                        saving={savingId === section.sectionId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {dirtyCount > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {dirtyCount} unsaved section{dirtyCount !== 1 ? "s" : ""} — click <strong>Save All</strong> to persist changes.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
