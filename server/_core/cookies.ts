import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // Use "lax" on HTTPS (production behind Cloudflare) — Cloudflare strips
    // SameSite=None cookies. "lax" is correct for same-site requests and is
    // fully compatible with the login flow (POST from same origin).
    // On plain HTTP (local dev) use "lax" as well — browsers reject
    // SameSite=None without Secure anyway.
    sameSite: "lax",
    secure,
  };
}
