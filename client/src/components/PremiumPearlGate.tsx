/**
 * PremiumPearlGate — inline premium gate for small content sections (pearls, red flags, tips).
 *
 * Shows a blurred preview of the first item + a compact upgrade card inline.
 * Much less intrusive than a full-page BlurredOverlay.
 *
 * Usage:
 *   <PremiumPearlGate isPremium={isPremium} label="Clinical Pearls" count={pearls.length}>
 *     {/* full pearl content here *\/}
 *   </PremiumPearlGate>
 */

import { Crown, Lock } from "lucide-react";
import { Link } from "wouter";

interface PremiumPearlGateProps {
  isPremium: boolean;
  /** Section label shown in the upgrade card, e.g. "Clinical Pearls" */
  label?: string;
  /** Total count of gated items, shown in the CTA */
  count?: number;
  children: React.ReactNode;
  /** Optional custom context message */
  context?: string;
}

export function PremiumPearlGate({
  isPremium,
  label = "Clinical Pearls",
  count,
  children,
  context,
}: PremiumPearlGateProps) {
  if (isPremium) return <>{children}</>;

  const countLabel = count ? ` all ${count}` : "";
  const defaultContext = `Unlock${countLabel} ${label} with Premium — guideline-based clinical insights for every view.`;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred preview */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(5px)", opacity: 0.3, maxHeight: "80px", overflow: "hidden" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Inline upgrade card */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3"
        style={{ background: "linear-gradient(135deg, rgba(14,30,46,0.92), rgba(14,74,80,0.92))" }}
      >
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #b45309, #d97706)" }}
          >
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold leading-tight truncate">
              {label} — Premium Only
            </p>
            <p className="text-white/55 text-xs leading-tight mt-0.5 line-clamp-1">
              {context ?? defaultContext}
            </p>
          </div>
          <Link href="/premium">
            <button
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #b45309, #d97706)" }}
            >
              <Crown className="w-3 h-3" />
              Upgrade
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * PremiumUpgradeBanner — a slightly larger inline banner for section-level gating.
 * Use this when gating a whole card (e.g., "Surgical Triggers") rather than a list.
 */
interface PremiumUpgradeBannerProps {
  isPremium: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function PremiumUpgradeBanner({
  isPremium,
  title,
  description,
  children,
}: PremiumUpgradeBannerProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(14,30,46,0.97), rgba(14,74,80,0.97))",
        borderColor: "#d9770633",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg, #b45309, #d97706)" }}
      >
        <Crown className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{title}</p>
        {description && (
          <p className="text-white/55 text-xs mt-0.5 leading-relaxed">{description}</p>
        )}
        <Link href="/premium">
          <button
            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #b45309, #d97706)" }}
          >
            <Crown className="w-3 h-3" />
            Upgrade to Premium
          </button>
        </Link>
      </div>
    </div>
  );
}
