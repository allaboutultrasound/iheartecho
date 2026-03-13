export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Thinkific Free Membership enrollment — all new user registrations go here
export const THINKIFIC_FREE_MEMBERSHIP_URL = "https://member.allaboutultrasound.com/enroll/3707211?price_id=4656299";
export const THINKIFIC_FREE_MEMBERSHIP_PAGE = "https://member.allaboutultrasound.com/enroll/3707211?price_id=4656299";

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

// Return the local magic-link login page.
// Magic link is the only supported sign-in method for iHeartEcho.
export const getLoginUrl = () => "/login";
