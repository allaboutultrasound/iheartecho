/**
 * usePremium — shared hook for consistent premium access checks across iHeartEcho™.
 *
 * Uses premium.getStatus as the authoritative source (live DB check) with
 * auth.me as a fast initial value. This ensures that users whose roles were
 * assigned after their last login see the correct premium state immediately
 * without needing to log out and back in.
 *
 * IMPORTANT: `loading` is true until BOTH auth AND premium.getStatus have resolved.
 * This prevents the premium gate from flashing for premium users while the live
 * status is still in flight.
 *
 * Returns:
 *   isPremium  — true if the user has any premium-tier role or the isPremium DB flag
 *   isDiyUser  — true if the user has DIY Accreditation access
 *   isLabAdmin — true if the user has Lab Admin access
 *   isAdmin    — true if the user is a platform admin
 *   appRoles   — raw array of role strings
 *   loading    — true while auth or premium status is still resolving
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
  // Only enabled when the user is authenticated and auth has finished loading.
  const {
    data: premiumStatus,
    isLoading: premiumLoading,
    isFetched: premiumFetched,
  } = trpc.premium.getStatus.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
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

  // loading is true while:
  //   1. Auth is still loading, OR
  //   2. User is authenticated but premium.getStatus hasn't resolved yet
  //      (covers both the isLoading state AND the pre-fetch frame where
  //       isFetched=false and isLoading=false simultaneously)
  //
  // This prevents the premium gate from flashing for premium users while
  // the live status is still in flight.
  const premiumStillPending = isAuthenticated && !authLoading && !premiumFetched;
  const loading = authLoading || premiumLoading || premiumStillPending;

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
