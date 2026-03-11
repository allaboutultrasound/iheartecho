export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Thinkific Free Membership enrollment — all new user registrations go here
export const THINKIFIC_FREE_MEMBERSHIP_URL = "https://member.allaboutultrasound.com/enroll/3241567?price_id=4133943";
export const THINKIFIC_FREE_MEMBERSHIP_PAGE = "https://member.allaboutultrasound.com/bundles/free-membership";

/**
 * Free membership enrollment URL with origin-tracking redirect.
 * Users who start from iHeartEcho are sent back to /enrolled after completing
 * the Thinkific free enrollment, via Thinkific's redirect_url parameter.
 * Thinkific appends this after successful enrollment completion.
 */
export const getThinkificFreeEnrollUrl = () => {
  const returnUrl = `${window.location.origin}/enrolled`;
  return `${THINKIFIC_FREE_MEMBERSHIP_URL}&redirect_url=${encodeURIComponent(returnUrl)}`;
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
