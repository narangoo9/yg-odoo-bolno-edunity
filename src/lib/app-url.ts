function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAppUrl() {
  const explicitUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL;

  if (explicitUrl) {
    return normalizeUrl(explicitUrl);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    const normalizedHost = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${normalizeUrl(normalizedHost)}`;
  }

  return "http://localhost:3000";
}
