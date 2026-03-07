/**
 * useScanCoachOverrides.ts
 * Fetches DB overrides for a ScanCoach module and provides a helper to merge
 * them over a static view object.  Any non-null override field replaces the
 * corresponding field on the static view.
 *
 * Usage:
 *   const { mergeView, isLoading } = useScanCoachOverrides("tte");
 *   const view = mergeView(staticViewObject);
 */
import { useMemo } from "react";
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

/** Merge a single override row onto a static view object */
function applyOverride<T extends Record<string, unknown>>(view: T, override: OverrideRow | undefined): T {
  if (!override) return view;

  const merged: Record<string, unknown> = { ...view };

  // Image URL overrides
  if (override.echoImageUrl)       merged.echoImageUrl       = override.echoImageUrl;
  if (override.anatomyImageUrl)    merged.anatomyImageUrl    = override.anatomyImageUrl;
  if (override.transducerImageUrl) merged.transducerImageUrl = override.transducerImageUrl;

  // Text overrides
  if (override.description) merged.description = override.description;

  // Array overrides
  const howToGet = parseJsonArray(override.howToGet);
  if (howToGet) merged.howToGet = howToGet;

  const tips = parseJsonArray(override.tips);
  if (tips) merged.tips = tips;

  const pitfalls = parseJsonArray(override.pitfalls);
  if (pitfalls) merged.pitfalls = pitfalls;

  const structures = parseJsonArray(override.structures);
  if (structures) merged.structures = structures;

  const measurements = parseJsonArray(override.measurements);
  if (measurements) merged.measurements = measurements;

  const criticalFindings = parseJsonArray(override.criticalFindings);
  if (criticalFindings) merged.criticalFindings = criticalFindings;

  return merged as T;
}

export function useScanCoachOverrides(module: ScanCoachModule) {
  const { data: overrides = [], isLoading } = trpc.scanCoachAdmin.listOverrides.useQuery(
    { module },
    {
      staleTime: 30_000,
      // Don't block rendering — overrides are a progressive enhancement
      refetchOnWindowFocus: false,
    }
  );

  // Build a lookup map: viewId → override row
  const overrideMap = useMemo(() => {
    const map = new Map<string, OverrideRow>();
    for (const row of overrides as OverrideRow[]) {
      map.set(row.viewId, row);
    }
    return map;
  }, [overrides]);

  /** Merge DB overrides onto a static view object */
  function mergeView<T extends Record<string, unknown>>(view: T & { id: string }): T {
    return applyOverride(view, overrideMap.get(view.id));
  }

  /** Check if a specific view has any override */
  function hasOverride(viewId: string): boolean {
    return overrideMap.has(viewId);
  }

  return { mergeView, hasOverride, isLoading, overrideMap };
}
