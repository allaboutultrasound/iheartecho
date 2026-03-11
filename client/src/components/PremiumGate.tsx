/**
 * PremiumGate — wraps content that requires an active Premium Access subscription.
 *
 * Usage:
 *   <PremiumGate>
 *     <MyPremiumFeature />
 *   </PremiumGate>
 *
 * If the user is not premium, renders an upgrade prompt instead.
 * If the user is not logged in, renders a sign-in prompt.
 */
import { Link } from "wouter";
import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface PremiumGateProps {
  children: React.ReactNode;
  /** Optional custom message to show in the upgrade prompt */
  featureName?: string;
  /** If true, show a compact inline lock badge instead of the full upgrade card */
  compact?: boolean;
}

export function PremiumGate({ children, featureName, compact = false }: PremiumGateProps) {
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

  // Not logged in
  if (!user) {
    return (
      <NotLoggedInPrompt compact={compact} featureName={featureName} />
    );
  }

  // Has premium
  if (status?.isPremium) {
    return <>{children}</>;
  }

  // Not premium
  return <UpgradePrompt compact={compact} featureName={featureName} checkoutUrl={status?.checkoutUrl} />;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotLoggedInPrompt({ compact, featureName }: { compact: boolean; featureName?: string }) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Sign in to access {featureName ?? "this feature"}</span>
        <a href="/login" className="text-[#189aa1] font-medium hover:underline">Sign in</a>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#189aa1]/20 bg-gradient-to-br from-[#f0fbfc] to-white p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-[#189aa1]/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-[#189aa1]" />
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2" style={{ fontFamily: "Merriweather, serif" }}>
        Sign in to Continue
      </h3>
      <p className="text-gray-500 text-sm mb-5">
        {featureName
          ? `${featureName} requires an account.`
          : "Please sign in to access this feature."}
      </p>
      <a href="/login">
        <Button className="bg-[#189aa1] hover:bg-[#147a80] text-white">
          Sign In <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </a>
    </div>
  );
}

function UpgradePrompt({
  compact,
  featureName,
  checkoutUrl,
}: {
  compact: boolean;
  featureName?: string;
  checkoutUrl?: string;
}) {
  const url = checkoutUrl ?? "https://member.allaboutultrasound.com/enroll/3703267?price_id=4651832";

  if (compact) {
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

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <Crown className="w-7 h-7 text-amber-500" />
      </div>
      <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
        <Sparkles className="w-3 h-3" />
        Premium Feature
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2" style={{ fontFamily: "Merriweather, serif" }}>
        {featureName ? `${featureName} requires Premium Access` : "Premium Access Required"}
      </h3>
      <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
        Unlock the full iHeartEcho™ clinical suite for <strong>$19.97/month</strong> — including advanced
        protocols, 500+ echo cases, and all premium tools.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button className="bg-[#189aa1] hover:bg-[#147a80] text-white">
            <Crown className="w-4 h-4 mr-1.5" />
            Upgrade — $19.97/month
          </Button>
        </a>
        <Link href="/premium">
          <Button variant="outline">
            Learn More <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
