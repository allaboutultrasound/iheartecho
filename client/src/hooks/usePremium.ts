/**
 * usePremium — shared hook for consistent premium access checks across iHeartEcho™.
 *
 * Uses premium.getStatus as the authoritative source (live DB check) with
 * auth.me as a fast initial value. This ensures that users whose roles were
 * assigned after their last login see the correct premium state immediately
 * without needing to log out and back in.
 *
 * Returns:
 *   isPremium  — true if the user has any premium-tier role or the isPremium DB flag
 *   isDiyUser  — true if the user has DIY Accreditation access
 *   isLabAdmin — true if the user has Lab Admin access
 *   isAdmin    — true if the user is a platform admin
 *   appRoles   — raw array of role strings
 *   loading    — true while either auth or premium status is loading
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  hasPremiumAccess,
  hasDiyAccess,
  hasLabAdminAccess,
  hasPlatformAdminAccess,
} from "@/lib/roles";

export function usePremium() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const appRoles: string[] = (user as any)?.appRoles ?? [];

  // Use premium.getStatus as the authoritative live source.
  // Only enabled when the user is authenticated to avoid unnecessary requests.
  const { data: premiumStatus, isLoading: premiumLoading } =
    trpc.premium.getStatus.useQuery(undefined, {
      enabled: isAuthenticated,
      // Stale time of 2 minutes — fresh enough to catch role changes without
      // hammering the server on every render.
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  // isPremium: authoritative source is premium.getStatus.isPremium.
  // Fall back to auth.me isPremium flag (fast initial value before getStatus resolves).
  // Also check appRoles as a tertiary fallback.
  const isPremiumFromStatus = premiumStatus?.isPremium === true;
  const isPremiumFromAuthMe = (user as any)?.isPremium === true;
  const isPremiumFromRoles = hasPremiumAccess(appRoles);

  const isPremium: boolean = isPremiumFromStatus || isPremiumFromAuthMe || isPremiumFromRoles;

  // loading is true while auth OR premium status is still resolving.
  // For unauthenticated users, premiumLoading is always false (query disabled).
  const loading = authLoading || (isAuthenticated && premiumLoading);

  const isDiyUser = hasDiyAccess(appRoles);
  const isLabAdmin = hasLabAdminAccess(appRoles);
  const isAdmin =
    hasPlatformAdminAccess(appRoles) || (user as any)?.role === "admin";

  return {
    isPremium,
    isDiyUser,
    isLabAdmin,
    isAdmin,
    appRoles,
    isAuthenticated,
    loading,
    user,
  };
}
