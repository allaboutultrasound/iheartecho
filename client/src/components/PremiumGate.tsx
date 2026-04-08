/**
 * PremiumGate — wraps content that requires an active Premium Access subscription.
 *
 * Shows a compact inline teaser-lock bar over blurred content, consistent with
 * PremiumPearlGate style. Replaces the old large modal card overlay.
 *
 * Usage:
 *   <PremiumGate featureName="Diastology — Special Populations">
 *     <MyPremiumFeature />
 *   </PremiumGate>
 */
import { Link } from "wouter";
import { Crown, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface PremiumGateProps {
  children: React.ReactNode;
  /** Optional feature name shown in the upgrade prompt */
  featureName?: string;
  /** If true, show a compact inline lock badge instead of the full overlay */
  compact?: boolean;
}

export function PremiumGate({ children, featureName, compact = false }: PremiumGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: status, isLoading: statusLoading } = trpc.premium.getStatus.useQuery(undefined, {
    enabled: !!user,
  });

  // Only reveal content once we have CONFIRMED premium status.
  const isConfirmedPremium = !authLoading && !statusLoading && !!user && !!status?.isPremium;

  if (isConfirmedPremium) {
    return <>{children}</>;
  }

  // Compact variant — no preview overlay, just an inline badge
  if (compact) {
    if (authLoading || (!!user && statusLoading)) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3 h-3 animate-pulse" />
          <span>Checking access…</span>
        </div>
      );
    }
    if (!user) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>Sign in to access {featureName ?? "this feature"}</span>
          <a href="/login" className="text-[#189aa1] font-medium hover:underline">Sign in</a>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-600">
        <Crown className="w-3 h-3" />
        <span>{featureName ?? "Premium"} feature</span>
        <Link href="/premium">
          <span className="text-[#189aa1] font-medium hover:underline cursor-pointer">Upgrade →</span>
        </Link>
      </div>
    );
  }

  // Full-size variant — compact inline lock bar over blurred content
  const isLoading = authLoading || (!!user && statusLoading);
  const isNotLoggedIn = !isLoading && !user;

  const label = isNotLoggedIn
    ? (featureName ? `${featureName} — Sign In Required` : "Sign In Required")
    : (featureName ? `${featureName} — Premium Only` : "Premium Feature");

  const subtext = isNotLoggedIn
    ? "Create a free account to access this feature and core tools."
    : "Upgrade to iHeartEcho™ Premium to unlock this and the full clinical suite.";

  const btnBg = isNotLoggedIn
    ? "linear-gradient(135deg, #0e4a50, #189aa1)"
    : "linear-gradient(135deg, #b45309, #d97706)";

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview */}
      <div
        className="select-none pointer-events-none"
        style={{ filter: "blur(5px)", opacity: 0.3, maxHeight: "220px", overflow: "hidden" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Compact inline lock bar */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, rgba(14,30,46,0.93), rgba(14,74,80,0.93))" }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Lock className="w-4 h-4 animate-pulse" />
            <span>Checking access…</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full max-w-md">
            {/* Icon circle */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: btnBg }}
            >
              {isNotLoggedIn
                ? <LogIn className="w-4 h-4 text-white" />
                : <Lock className="w-4 h-4 text-white" />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-tight truncate">{label}</p>
              <p className="text-white/55 text-xs leading-tight mt-0.5 line-clamp-2">{subtext}</p>
            </div>

            {/* CTA button */}
            {isNotLoggedIn ? (
              <a href="/login" className="flex-shrink-0">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: btnBg }}
                >
                  <LogIn className="w-3 h-3" />
                  Sign In
                </button>
              </a>
            ) : (
              <Link href="/premium">
                <button
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: btnBg }}
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
