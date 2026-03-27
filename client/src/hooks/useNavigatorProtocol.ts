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
 * Each section must have: { view, probe, items: { id, label, detail?, critical? }[] }
 */
import { trpc } from "@/lib/trpc";

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  critical?: boolean;
}

export interface ProtocolSection {
  view: string;
  probe: string;
  items: ChecklistItem[];
}

export function useNavigatorProtocol(
  module: string,
  staticProtocol: ProtocolSection[]
): { sections: ProtocolSection[]; isLoading: boolean; isFromDb: boolean } {
  const { data: dbSections, isLoading } = trpc.navigatorAdmin.getModuleSections.useQuery(
    { module },
    {
      staleTime: 5 * 60 * 1000, // 5 min cache — protocol data changes rarely
      retry: 1,
    }
  );

  // If DB has sections for this module, use them; otherwise fall back to static
  if (!isLoading && dbSections && dbSections.length > 0) {
    const sections: ProtocolSection[] = dbSections.map((s) => ({
      view: s.sectionTitle,
      probe: s.probeNote ?? "",
      items: s.items,
    }));
    return { sections, isLoading: false, isFromDb: true };
  }

  return { sections: staticProtocol, isLoading, isFromDb: false };
}
