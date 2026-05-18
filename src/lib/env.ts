import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PHASE: optionalString,
  NEXT_PUBLIC_APP_NAME: optionalString,
  NEXT_PUBLIC_APP_URL: optionalString,
  NEXTAUTH_URL: optionalString,
  AUTH_URL: optionalString,
  AUTH_SECRET: optionalString,
  NEXTAUTH_SECRET: optionalString,
  DATABASE_URL: optionalString,
  DIRECT_URL: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  NEXT_PUBLIC_SOCKET_URL: optionalString,
  SOCKET_ALLOWED_ORIGINS: optionalString,
  SOCKET_PORT: optionalString,
  REDIS_URL: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,
  EMAIL_FROM: optionalString,
  SUPPORT_EMAIL: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_STUDENT_MONTHLY_PRICE_ID: optionalString,
  STRIPE_STUDENT_YEARLY_PRICE_ID: optionalString,
  STRIPE_INSTRUCTOR_MONTHLY_PRICE_ID: optionalString,
  STRIPE_INSTRUCTOR_YEARLY_PRICE_ID: optionalString,
  STRIPE_ORG_MONTHLY_PRICE_ID: optionalString,
  STRIPE_ORG_YEARLY_PRICE_ID: optionalString,
  STRIPE_PREMIUM_PRICE_ID: optionalString,
  STRIPE_PRO_PRICE_ID: optionalString,
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: optionalString,
  STRIPE_PREMIUM_YEARLY_PRICE_ID: optionalString,
  STRIPE_PRO_MONTHLY_PRICE_ID: optionalString,
  STRIPE_PRO_YEARLY_PRICE_ID: optionalString,
  GROQ_API_KEY: optionalString,
  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  UPLOAD_PROVIDER: optionalString,
  VERCEL_PROJECT_PRODUCTION_URL: optionalString,
  VERCEL_URL: optionalString,
  PRISMA_USE_PG_ADAPTER: optionalString,
});

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function toUrlFromVercelHost(value: string | undefined) {
  if (!value) return undefined;
  const normalizedHost = value.replace(/^https?:\/\//, "");
  return `https://${normalizeUrl(normalizedHost)}`;
}

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePort(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : fallback;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`[env] Invalid environment configuration: ${parsed.error.message}`);
}

const raw = parsed.data;
const appUrl =
  raw.NEXT_PUBLIC_APP_URL ??
  raw.AUTH_URL ??
  raw.NEXTAUTH_URL ??
  toUrlFromVercelHost(raw.VERCEL_PROJECT_PRODUCTION_URL ?? raw.VERCEL_URL) ??
  "http://localhost:3000";
const nextAuthUrl = raw.NEXTAUTH_URL ?? raw.AUTH_URL ?? appUrl;
const authSecret =
  raw.AUTH_SECRET ??
  raw.NEXTAUTH_SECRET ??
  (raw.NODE_ENV === "development" ? "elearn-dev-auth-secret-not-for-production" : undefined);
const socketPort = parsePort(raw.SOCKET_PORT, 3001);
const socketAllowedOrigins = parseCsv(raw.SOCKET_ALLOWED_ORIGINS);
const missingProductionVars = [
  raw.DATABASE_URL ? null : "DATABASE_URL",
  raw.DIRECT_URL ? null : "DIRECT_URL",
  raw.AUTH_SECRET || raw.NEXTAUTH_SECRET ? null : "AUTH_SECRET or NEXTAUTH_SECRET",
  raw.NEXTAUTH_URL ? null : "NEXTAUTH_URL",
  raw.NEXT_PUBLIC_APP_URL ? null : "NEXT_PUBLIC_APP_URL",
].filter((value): value is string => Boolean(value));

const isProduction = raw.NODE_ENV === "production";
const isNextBuildPhase = raw.NEXT_PHASE === "phase-production-build";

if (missingProductionVars.length > 0) {
  const message = `[env] Missing required production environment variables: ${missingProductionVars.join(", ")}`;
  if (isProduction && !isNextBuildPhase) {
    throw new Error(message);
  }

  if (!isProduction) {
    console.warn(`${message}. Development will continue with safe fallbacks where possible.`);
  } else {
    console.warn(`${message}. Build is continuing, but production runtime will fail fast.`);
  }
}

if (!raw.AUTH_SECRET && !raw.NEXTAUTH_SECRET && raw.NODE_ENV === "development") {
  console.warn(
    "[env] AUTH_SECRET is not set. Using a local-only development fallback. " +
      "Sessions will reset when this value changes. Set AUTH_SECRET in .env for stable local auth " +
      "(generate: openssl rand -base64 32). Production requires AUTH_SECRET and will fail to start without it.",
  );
}

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction,
  isNextBuildPhase,
  appName: raw.NEXT_PUBLIC_APP_NAME ?? "EduNity",
  appUrl: normalizeUrl(appUrl),
  nextAuthUrl: normalizeUrl(nextAuthUrl),
  databaseUrl: raw.DATABASE_URL,
  directUrl: raw.DIRECT_URL,
  authSecret,
  authSecretConfigured: Boolean(raw.AUTH_SECRET ?? raw.NEXTAUTH_SECRET),
  googleClientId: raw.GOOGLE_CLIENT_ID,
  googleClientSecret: raw.GOOGLE_CLIENT_SECRET,
  socketUrl: raw.NEXT_PUBLIC_SOCKET_URL ?? `http://localhost:${socketPort}`,
  socketPort,
  socketAllowedOrigins,
  redisUrl: raw.REDIS_URL,
  smtpHost: raw.SMTP_HOST,
  smtpPort: parsePort(raw.SMTP_PORT, 587),
  smtpUser: raw.SMTP_USER,
  smtpPass: raw.SMTP_PASS ?? raw.SMTP_PASSWORD,
  smtpFrom: raw.SMTP_FROM ?? raw.EMAIL_FROM,
  supportEmail: raw.SUPPORT_EMAIL ?? "nnae0343@gmail.com",
  stripeSecretKey: raw.STRIPE_SECRET_KEY,
  stripePublishableKey: raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: raw.STRIPE_WEBHOOK_SECRET,
  stripeStudentMonthlyPriceId: raw.STRIPE_STUDENT_MONTHLY_PRICE_ID ?? "",
  stripeStudentYearlyPriceId: raw.STRIPE_STUDENT_YEARLY_PRICE_ID ?? "",
  stripeInstructorMonthlyPriceId: raw.STRIPE_INSTRUCTOR_MONTHLY_PRICE_ID ?? "",
  stripeInstructorYearlyPriceId: raw.STRIPE_INSTRUCTOR_YEARLY_PRICE_ID ?? "",
  stripeOrgMonthlyPriceId: raw.STRIPE_ORG_MONTHLY_PRICE_ID ?? "",
  stripeOrgYearlyPriceId: raw.STRIPE_ORG_YEARLY_PRICE_ID ?? "",
  stripePremiumPriceId:
    raw.STRIPE_PREMIUM_PRICE_ID ?? raw.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? "",
  stripeProPriceId: raw.STRIPE_PRO_PRICE_ID ?? raw.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  stripePremiumMonthlyPriceId: raw.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? "",
  stripePremiumYearlyPriceId: raw.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "",
  stripeProMonthlyPriceId: raw.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  stripeProYearlyPriceId: raw.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  groqApiKey: raw.GROQ_API_KEY,
  sentryDsn: raw.SENTRY_DSN,
  publicSentryDsn: raw.NEXT_PUBLIC_SENTRY_DSN,
  uploadProvider: raw.UPLOAD_PROVIDER ?? "local",
  prismaUsePgAdapter: raw.PRISMA_USE_PG_ADAPTER,
} as const;

export type Env = typeof env;
