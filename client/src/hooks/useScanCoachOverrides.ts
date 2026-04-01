/**
 * useScanCoachOverrides.ts
 * Fetches DB overrides for a ScanCoach module and provides a helper to merge
 * them over a static view object.  Any non-null override field replaces the
 * corresponding field on the static view.
 *
 * Usage:
 *   const { mergeView, isLoading } = useScanCoachOverrides("tte");
 *   const view = mergeView(staticViewObject);
 *
 * Fix (2026-03-09): mergeView is now wrapped in useCallback so its reference
 * only changes when overrideMap changes (i.e. when DB data loads). Previously
 * it was a plain function re-created every render, causing useMemo dependencies
 * to always be "new" and images to not appear until a forced re-render.
 *
 * Field mapping (2026-04-01):
 * Different ScanCoach modules use different field names in their live UI.
 * The DB has 7 text columns that are reused with module-specific semantics:
 *
 * TTE:  structures→structures, measurements→measurements, tips→tips,
 *       pitfalls→pitfalls  (direct match — no remapping needed)
 *
 * TEE:  description→description, howToGet→howToGet, structures→structures,
 *       tips→tips, pitfalls→pitfalls, measurements→measurements,
 *       criticalFindings→criticalFindings  (direct match)
 *
 * UEA:  howToGet→howToGet (Step-by-Step Acquisition),
 *       structures→structures (Structures Visible),
 *       tips→contrastTips (Contrast-Specific Tips),
 *       pitfalls→pitfalls (Common Pitfalls),
 *       criticalFindings→clinicalPearls (Clinical Pearls)
 *
 * MCS:  howToGet→acquisition (Acquisition tab),
 *       structures→whatToSee (What to See tab),
 *       tips→tips (Tips tab),
 *       pitfalls→pitfalls (Common Pitfalls)
 *
 * CHD:  description→overview, howToGet→keyViews, measurements→keyMeasurements,
 *       structures→doppler, pitfalls→normalCriteria, criticalFindings→redFlags,
 *       tips→tips
 */
import { useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import type { ScanCoachModule } from "@/lib/scanCoachRegistry";

type OverrideRow = {
  viewId: string;
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
};

/** Parse a JSON-array field back to string[] (or return the original if already an array) */
function parseJsonArray(value: string | null): string[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // plain text — split by newline
    return value.split("\n").map((l) => l.trim()).filter(Boolean);
  }
  return null;
}

/** Determine if a module key is an MCS module */
function isMCSModule(module: ScanCoachModule): boolean {
  return module.startsWith("mcs_");
}

/** Merge a single override row onto a static view object */
function applyOverride<T extends Record<string, unknown>>(
  view: T,
  override: OverrideRow | undefined,
  module: ScanCoachModule
): T {
  if (!override) return view;

  const merged: Record<string, unknown> = { ...view };

  // Image URL overrides — only replace if the override has a non-empty value
  if (override.echoImageUrl)       merged.echoImageUrl       = override.echoImageUrl;
  if (override.anatomyImageUrl)    merged.anatomyImageUrl    = override.anatomyImageUrl;
  if (override.transducerImageUrl) merged.transducerImageUrl = override.transducerImageUrl;

  // Parse all array fields upfront
  const howToGet        = parseJsonArray(override.howToGet);
  const tips            = parseJsonArray(override.tips);
  const pitfalls        = parseJsonArray(override.pitfalls);
  const structures      = parseJsonArray(override.structures);
  const measurements    = parseJsonArray(override.measurements);
  const criticalFindings = parseJsonArray(override.criticalFindings);

  // ── CHD stage field mapping ──────────────────────────────────────────────────
  // CHD stages use different field names than standard ScanCoach views.
  // DB columns are reused with the following semantic mapping:
  //   description      → overview        (paragraph text)
  //   howToGet         → keyViews        (string[])
  //   measurements     → keyMeasurements (string[])
  //   structures       → doppler         (string[])
  //   pitfalls         → normalCriteria  (string[])
  //   criticalFindings → redFlags        (string[])
  //   tips             → tips            (same)
  // Only apply if the view object has CHD stage fields (duck-typing check).
  if ('overview' in view) {
    if (override.description)  merged.overview        = override.description;
    if (howToGet)              merged.keyViews        = howToGet;
    if (measurements)          merged.keyMeasurements = measurements;
    if (structures)            merged.doppler         = structures;
    if (pitfalls)              merged.normalCriteria  = pitfalls;
    if (criticalFindings)      merged.redFlags        = criticalFindings;
    if (tips)                  merged.tips            = tips;
    return merged as T;
  }

  // ── MCS field mapping ────────────────────────────────────────────────────────
  // MCS ScanCoach views use acquisition/whatToSee/doppler tabs.
  // DB columns are reused with the following semantic mapping:
  //   howToGet   → acquisition  (Acquisition tab — step-by-step)
  //   structures → whatToSee   (What to See tab)
  //   tips       → tips        (Tips tab — same field name)
  //   pitfalls   → pitfalls    (Common Pitfalls — same field name)
  if (isMCSModule(module)) {
    if (howToGet)   merged.acquisition = howToGet;
    if (structures) merged.whatToSee   = structures;
    if (tips)       merged.tips        = tips;
    if (pitfalls)   merged.pitfalls    = pitfalls;
    return merged as T;
  }

  // ── UEA field mapping ────────────────────────────────────────────────────────
  // UEA ScanCoach views use contrastTips and clinicalPearls instead of generic tips/criticalFindings.
  // DB columns are reused with the following semantic mapping:
  //   howToGet         → howToGet      (Step-by-Step Acquisition — same field name)
  //   structures       → structures    (Structures Visible — same field name)
  //   tips             → contrastTips  (Contrast-Specific Tips)
  //   pitfalls         → pitfalls      (Common Pitfalls — same field name)
  //   criticalFindings → clinicalPearls (Clinical Pearls)
  if (module === "uea") {
    if (howToGet)          merged.howToGet       = howToGet;
    if (structures)        merged.structures     = structures;
    if (tips)              merged.contrastTips   = tips;
    if (pitfalls)          merged.pitfalls       = pitfalls;
    if (criticalFindings)  merged.clinicalPearls = criticalFindings;
    return merged as T;
  }

  // ── Default / TTE / TEE field mapping ───────────────────────────────────────
  // TTE and TEE use the same field names as DB columns (direct mapping).
  if (override.description) merged.description = override.description;
  if (howToGet)             merged.howToGet    = howToGet;
  if (tips)                 merged.tips        = tips;
  if (pitfalls)             merged.pitfalls    = pitfalls;
  if (structures)           merged.structures  = structures;
  if (measurements)         merged.measurements = measurements;
  if (criticalFindings)     merged.criticalFindings = criticalFindings;

  return merged as T;
}

export function useScanCoachOverrides(module: ScanCoachModule) {
  const { data: overrides = [], isLoading } = trpc.scanCoachAdmin.listOverrides.useQuery(
    { module },
    {
      // staleTime: 0 ensures the live view always fetches fresh data on mount
      // (important because the editor opens the live page in a new tab with a
      // separate React Query cache — without this, saved changes won't appear
      // until a hard refresh)
      staleTime: 0,
      // Re-fetch when the user switches back to the live-view tab after saving
      // in the editor tab
      refetchOnWindowFocus: true,
    }
  );

  // Build a lookup map: viewId → override row
  // This only recomputes when the DB data changes (not on every render)
  const overrideMap = useMemo(() => {
    const map = new Map<string, OverrideRow>();
    for (const row of overrides as OverrideRow[]) {
      map.set(row.viewId, row);
    }
    return map;
  }, [overrides]);

  /**
   * Merge DB overrides onto a static view object.
   * Wrapped in useCallback so the function reference is stable between renders —
   * it only changes when overrideMap changes (i.e. when DB data loads/updates).
   * This prevents useMemo dependencies in consumer components from always being
   * "new" and ensures images appear as soon as the query resolves.
   */
  const mergeView = useCallback(
    function mergeViewFn<T extends Record<string, unknown>>(view: T & { id: string }): T {
      return applyOverride(view, overrideMap.get(view.id), module);
    },
    [overrideMap, module]
  );

  /** Check if a specific view has any override */
  const hasOverride = useCallback(
    (viewId: string): boolean => overrideMap.has(viewId),
    [overrideMap]
  );

  return { mergeView, hasOverride, isLoading, overrideMap };
}
