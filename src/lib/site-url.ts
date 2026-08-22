const FALLBACK_SITE_URL = "https://storify-six.vercel.app";

export function getSiteUrl() {
  const configured = process.env.APP_URL ?? process.env.AUTH_URL;
  if (!configured) return FALLBACK_SITE_URL;

  try {
    return new URL(configured).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
