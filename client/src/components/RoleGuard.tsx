/**
 * RoleGuard — wraps routes that require specific app roles.
 *
 * Usage:
 *   <RoleGuard roles={["diy_admin", "diy_user"]}>
 *     <AccreditationTool />
 *   </RoleGuard>
 *
 * Behaviour:
 *  - While auth is loading: shows a full-page spinner (no flash)
 *  - If unauthenticated: redirects to login
 *  - If authenticated but missing required role: shows "Access Required" page
 *  - If authorised: renders children
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

type AppRole = "user" | "premium_user" | "diy_admin" | "diy_user" | "platform_admin";

interface RoleGuardProps {
  /** At least one of these roles must be present for access */
  roles: AppRole[];
  /** Optional: also allow platform_admin through (default: true) */
  allowAdmin?: boolean;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<AppRole, string> = {
  user: "User",
  premium_user: "Premium User",
  diy_admin: "DIY Accreditation Admin",
  diy_user: "DIY Accreditation User",
  platform_admin: "Platform Administrator",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  diy_admin: "Lab Admin access to the DIY Accreditation Tool",
  diy_user: "Seat-based access to the DIY Accreditation Tool",
  premium_user: "Premium subscription access",
  platform_admin: "Platform administrator access",
};

export function RoleGuard({ roles, allowAdmin = true, children }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // Loading state — don't flash the access-denied page
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#189aa1]" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show minimal loading while redirect fires
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#189aa1]" />
      </div>
    );
  }

  // Check roles — appRoles is the array returned by auth.me
  const userRoles: AppRole[] = (user as any).appRoles ?? [];
  const isPlatformAdmin = userRoles.includes("platform_admin");
  const hasRequiredRole = roles.some(r => userRoles.includes(r));
  const isAuthorised = hasRequiredRole || (allowAdmin && isPlatformAdmin);

  if (isAuthorised) {
    return <>{children}</>;
  }

  // Access denied — show clear message with contact CTA
  const requiredRoleLabels = roles.map(r => ROLE_LABELS[r]).join(" or ");
  const description = roles.map(r => ROLE_DESCRIPTIONS[r] ?? ROLE_LABELS[r]).join(" or ");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}
          >
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            Access Required
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This section requires <strong>{requiredRoleLabels}</strong> access.
            {description && (
              <span className="block mt-1 text-xs text-muted-foreground/70">
                {description} is needed to view this page.
              </span>
            )}
          </p>
        </div>

        {/* Role info */}
        <div
          className="rounded-xl p-4 text-left space-y-2 border"
          style={{ borderColor: "#189aa1" + "30", background: "#189aa1" + "08" }}
        >
          <p className="text-xs font-semibold text-[#189aa1] uppercase tracking-wider">
            Your current roles
          </p>
          {userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles assigned yet</p>
          ) : (
            <ul className="space-y-1">
              {userRoles.map(r => (
                <li key={r} className="text-sm text-foreground flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#189aa1" }}
                  />
                  {ROLE_LABELS[r]}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href="mailto:support@iheartecho.com?subject=DIY%20Accreditation%20Tool%20Access"
            className="w-full"
          >
            <Button
              className="w-full font-semibold"
              style={{ background: "#189aa1" }}
            >
              Request Access
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          If you believe this is an error, contact your Lab Admin or{" "}
          <a
            href="mailto:support@iheartecho.com"
            className="underline"
            style={{ color: "#189aa1" }}
          >
            support@iheartecho.com
          </a>
        </p>
      </div>
    </div>
  );
}
