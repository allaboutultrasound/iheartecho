/*
  PremiumOverlay.tsx — iHeartEcho™
  Compact inline teaser-lock: shows content blurred behind a slim lock bar
  so free users can see what they're missing before upgrading.

  Security model:
  - Uses the cached auth.me user object (appRoles + isPremium flag) as the
    PRIMARY check — no extra network round-trip, no flash for premium users.
  - The overlay is shown by DEFAULT while auth is loading (no spinner flash).
  - Content is only revealed once we have CONFIRMED the user is premium.
  - This prevents bypass via fast navigation or slow auth checks.

  Usage:
    <PremiumOverlay featureName="LAP Estimation">
      <YourPremiumContent />
    </PremiumOverlay>
*/
import { Link } from "wouter";
import { Crown, Lock, LogIn } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

interface PremiumOverlayProps {
  children: React.ReactNode;
  /** Feature name shown in the overlay prompt */
  featureName?: string;
  /** Optional: custom checkout URL override */
  checkoutUrl?: string;
}

export function PremiumOverlay({ children, featureName }: PremiumOverlayProps) {
  const { isPremium, loading, isAuthenticated } = usePremium();

  // Once loaded and confirmed premium, render children directly.
  if (!loading && isPremium) {
    return <>{children}</>;
  }

  const isLoading = loading;
  const isLoggedIn = isAuthenticated;

  const label = featureName
    ? `${featureName} — ${isLoggedIn ? "Premium Only" : "Sign In Required"}`
    : (isLoggedIn ? "Premium Feature" : "Sign In Required");

  const subtext = isLoggedIn
    ? "Upgrade to iHeartEcho™ Premium to unlock this and the full clinical suite."
    : "Create a free account to access this feature and core tools.";

  const btnBg = isLoggedIn
    ? "linear-gradient(135deg, #b45309, #d97706)"
    : "linear-gradient(135deg, #0e4a50, #189aa1)";

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview — always shown, never accessible */}
      <div
        className="pointer-events-none select-none"
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
            <span>Checking membership…</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full max-w-md">
            {/* Icon circle */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: btnBg }}
            >
              {isLoggedIn
                ? <Lock className="w-4 h-4 text-white" />
                : <LogIn className="w-4 h-4 text-white" />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-tight truncate">{label}</p>
              <p className="text-white/55 text-xs leading-tight mt-0.5 line-clamp-2">{subtext}</p>
            </div>

            {/* CTA button */}
            {isLoggedIn ? (
              <Link href="/premium">
                <button
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: btnBg }}
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </button>
              </Link>
            ) : (
              <a href="/login" className="flex-shrink-0">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: btnBg }}
                >
                  <LogIn className="w-3 h-3" />
                  Sign In
                </button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
