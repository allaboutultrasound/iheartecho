/**
 * BlurredOverlay — wraps page content with a blur + compact inline lock bar.
 *
 * Replaces the old full-page modal card with a slim teaser-lock bar that sits
 * over the blurred content — consistent with PremiumPearlGate style.
 *
 * Types:
 *   "login"   — unauthenticated users, CTA: Sign In / Create Free Account
 *   "premium" — authenticated free users, CTA: Upgrade to Premium
 *   "diy"     — users without DIY membership, CTA: Join DIY Accreditation
 */

import { getLoginUrl } from "@/const";
import { Crown, Lock, LogIn, Layers } from "lucide-react";
import { Link } from "wouter";

type OverlayType = "login" | "premium" | "diy";

interface BlurredOverlayProps {
  type: OverlayType;
  featureName?: string;
  children: React.ReactNode;
  /** When true, renders children directly without any overlay (passthrough mode) */
  disabled?: boolean;
}

export function BlurredOverlay({ type, featureName, children, disabled }: BlurredOverlayProps) {
  if (disabled) return <>{children}</>;

  const loginUrl = getLoginUrl();

  const isLogin = type === "login";
  const isDiy = type === "diy";

  const icon = isLogin ? (
    <LogIn className="w-4 h-4 text-white" />
  ) : isDiy ? (
    <Layers className="w-4 h-4 text-white" />
  ) : (
    <Lock className="w-4 h-4 text-white" />
  );

  const iconBg = isLogin || isDiy
    ? "linear-gradient(135deg, #0e4a50, #189aa1)"
    : "linear-gradient(135deg, #b45309, #d97706)";

  const label = isLogin
    ? (featureName ? `${featureName} — Sign In Required` : "Sign In Required")
    : isDiy
    ? (featureName ? `${featureName} — DIY Membership Required` : "DIY Membership Required")
    : (featureName ? `${featureName} — Premium Only` : "Premium Feature");

  const subtext = isLogin
    ? "Create a free account to access this feature and core tools."
    : isDiy
    ? "Join DIY Accreditation to access this feature."
    : "Upgrade to iHeartEcho™ Premium to unlock this and the full clinical suite.";

  const btnLabel = isLogin ? "Sign In" : isDiy ? "View Plans" : "Upgrade";
  const btnBg = isLogin || isDiy
    ? "linear-gradient(135deg, #0e4a50, #189aa1)"
    : "linear-gradient(135deg, #b45309, #d97706)";

  const btnHref = isLogin ? loginUrl : isDiy ? "/diy-accreditation-plans" : "/premium";
  const btnIsExternal = isLogin;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview */}
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
        <div className="flex items-center gap-3 w-full max-w-md">
          {/* Icon circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}
          >
            {icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold leading-tight truncate">{label}</p>
            <p className="text-white/55 text-xs leading-tight mt-0.5 line-clamp-2">{subtext}</p>
          </div>

          {/* CTA button */}
          {btnIsExternal ? (
            <a href={btnHref} className="flex-shrink-0">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: btnBg }}
              >
                <LogIn className="w-3 h-3" />
                {btnLabel}
              </button>
            </a>
          ) : (
            <Link href={btnHref}>
              <button
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: btnBg }}
              >
                {isDiy ? <Layers className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                {btnLabel}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
