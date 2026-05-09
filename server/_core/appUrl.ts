const DEFAULT_PUBLIC_APP_URL = "https://app.iheartecho.com";

const PUBLIC_APP_URL_ENV_KEYS = [
  "PUBLIC_APP_URL",
  "APP_URL",
  "VITE_APP_URL",
  "RAILWAY_PUBLIC_DOMAIN",
] as const;

function normalizePublicAppUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getPublicAppUrl(env: NodeJS.ProcessEnv = process.env) {
  for (const key of PUBLIC_APP_URL_ENV_KEYS) {
    const normalized = normalizePublicAppUrl(env[key] ?? "");
    if (normalized) return normalized;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function buildPublicAppUrl(path: string, env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = getPublicAppUrl(env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
