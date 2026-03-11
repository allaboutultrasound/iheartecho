/*
  PremiumOverlay.tsx — iHeartEcho™
  Transparent premium gate: shows content blurred behind a lock overlay
  so free users can see what they're missing before upgrading.
  Usage:
    <PremiumOverlay featureName="LAP Estimation">
      <YourPremiumContent />
    </PremiumOverlay>
*/
import { Link } from "wouter";
import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface PremiumOverlayProps {
  children: React.ReactNode;
  /** Feature name shown in the overlay prompt */
  featureName?: string;
  /** Optional: custom checkout URL override */
  checkoutUrl?: string;
}

export function PremiumOverlay({ children, featureName, checkoutUrl }: PremiumOverlayProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: status, isLoading: statusLoading } = trpc.premium.getStatus.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Has premium — render children normally
  if (user && status?.isPremium) {
    return <>{children}</>;
  }

  // Not premium or not logged in — show transparent overlay
  const upgradeUrl = checkoutUrl ?? status?.checkoutUrl ?? "https://member.allaboutultrasound.com/enroll/3703267?price_id=4651832";  // monthly $9.97
  const isLoggedIn = !!user;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(3px)", opacity: 0.45 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className="mx-4 rounded-2xl border shadow-xl px-6 py-6 text-center max-w-sm w-full"
          style={{
            background: "rgba(14, 30, 46, 0.92)",
            borderColor: "rgba(74, 217, 224, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(24, 154, 161, 0.2)", border: "1px solid rgba(74, 217, 224, 0.3)" }}
          >
            <Lock className="w-6 h-6 text-[#4ad9e0]" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-xs font-semibold"
            style={{ background: "rgba(24, 154, 161, 0.2)", color: "#4ad9e0", border: "1px solid rgba(74, 217, 224, 0.2)" }}>
            <Crown className="w-3 h-3" />
            Premium Feature
          </div>

          <h3 className="font-bold text-white text-base mb-1.5" style={{ fontFamily: "Merriweather, serif" }}>
            {featureName ?? "Premium Content"}
          </h3>
          <p className="text-white/60 text-xs mb-4 leading-relaxed">
            {isLoggedIn
              ? "Upgrade to iHeartEcho™ Premium to unlock this calculator and the full clinical suite."
              : "Sign in and upgrade to access this calculator and the full iHeartEcho™ clinical suite."}
          </p>

          <div className="flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    className="w-full text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Upgrade — $9.97/month
                  </Button>
                </a>
                <Link href="/premium">
                  <Button variant="outline" className="w-full text-xs border-white/20 text-white/70 hover:bg-white/10">
                    Learn More <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <a href="/login">
                  <Button
                    className="w-full text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}
                  >
                    Sign In to Continue
                  </Button>
                </a>
                <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full text-xs border-white/20 text-white/70 hover:bg-white/10">
                    <Crown className="w-3 h-3 mr-1" />
                    View Premium Plans
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
