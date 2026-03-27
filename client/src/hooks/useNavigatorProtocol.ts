/**
 * useNavigatorProtocol — iHeartEcho™
 *
 * Returns the protocol sections for a given navigator module.
 * If DB overrides exist (seeded/edited via the Navigator Editor), they are used.
 * Otherwise, the static default sections are returned as a fallback.
 *
 * Usage:
 *   const { sections, isLoading } = useNavigatorProtocol("tte", tteProtocol);
 *
 * The `staticProtocol` arg is the hardcoded array from the navigator page.
 * Each section must have at minimum: { view, probe, items: { id, label, detail?, critical? }[] }
 * Navigator-specific extra fields (position, angle, depth, clinicalUse, window, tips,
 * pearls, normalFindings, abnormalFindings, etc.) are carried through transparently.
 */
import { trpc } from "@/lib/trpc";

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  critical?: boolean;
  // TEE-specific
  angle?: string;
  [key: string]: unknown;
}

export interface ProtocolSection {
  // Core fields (required)
  view: string;
  probe: string;
  items: ChecklistItem[];
  // Optional identifier (used by some navigators as section key)
  id?: string;
  // TEE-specific
  position?: string;
  angle?: string;
  depth?: string;
  clinicalUse?: string;
  // UEA-specific
  window?: string;
  tips?: string[];
  normalFindings?: string[];
  abnormalFindings?: string[];
  // POCUS Cardiac-specific
  pearls?: string[];
  // Allow any additional navigator-specific fields
  [key: string]: unknown;
}

export function useNavigatorProtocol<T extends ProtocolSection>(
  module: string,
  staticProtocol: T[]
): { sections: T[]; isLoading: boolean; isFromDb: boolean } {
  const { data: dbSections, isLoading } = trpc.navigatorAdmin.getModuleSections.useQuery(
    { module },
    {
      staleTime: 5 * 60 * 1000, // 5 min cache — protocol data changes rarely
      retry: 1,
    }
  );

  // If DB has sections for this module, use them; otherwise fall back to static
  if (!isLoading && dbSections && dbSections.length > 0) {
    const sections = dbSections.map((s) => ({
      id: s.sectionId,
      view: s.sectionTitle,
      probe: s.probeNote ?? "",
      items: s.items,
    })) as unknown as T[];
    return { sections, isLoading: false, isFromDb: true };
  }

  return { sections: staticProtocol, isLoading, isFromDb: false };
}
